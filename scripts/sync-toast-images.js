const fs = require("fs");
const path = require("path");
const vm = require("vm");

const rootDir = path.resolve(__dirname, "..");
const markdownPath = path.join(rootDir, "toast-menu-markdown.txt");
const productsDataPath = path.join(rootDir, "products-data.js");
const productsJsonPath = path.join(rootDir, "menu_products.json");
const outputDir = path.join(rootDir, "assets", "images", "products", "toast");
const concurrency = 8;

function loadJavaScriptData(filePath) {
    const source = fs.readFileSync(filePath, "utf8");
    const sandbox = {};

    vm.runInNewContext(
        `${source}
globalThis.__categoriesData = categoriesData;
globalThis.__productsData = productsData;`,
        sandbox
    );

    return {
        categoriesData: sandbox.__categoriesData,
        productsData: sandbox.__productsData
    };
}

function extractToastImages(markdown) {
    const imagesByGuid = new Map();

    for (const line of markdown.split(/\r?\n/)) {
        if (!line.includes("d1w7312wesee68.cloudfront.net") || !line.includes("/item-")) {
            continue;
        }

        const imageMatch = line.match(/!\[[^\]]*\]\((https:\/\/d1w7312wesee68\.cloudfront\.net\/[^)]+)\)/);
        const guidMatch = line.match(/\/item-[^)\s]+_([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\)/i);

        if (imageMatch && guidMatch) {
            imagesByGuid.set(guidMatch[1].toLowerCase(), imageMatch[1]);
        }
    }

    return imagesByGuid;
}

function getExtension(imageUrl) {
    const match = imageUrl.match(/MenuItem\/[^/?]+\.(jpe?g|png|webp)(?:[?#]|$)/i);
    const extension = match ? match[1].toLowerCase() : "jpg";
    return extension === "jpeg" ? "jpg" : extension;
}

async function downloadImage(imageUrl, destination) {
    const response = await fetch(imageUrl, {
        headers: {
            "User-Agent": "Mozilla/5.0",
            Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8"
        }
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status} for ${imageUrl}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(destination, buffer);
}

async function runWithConcurrency(tasks, limit) {
    let nextIndex = 0;

    async function worker() {
        while (nextIndex < tasks.length) {
            const task = tasks[nextIndex];
            nextIndex += 1;
            await task();
        }
    }

    await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, worker));
}

function updateProduct(product, imagesByGuid) {
    const guid = String(product["ID / Toast GUID"] || "").toLowerCase();
    const slug = product.Slug;
    const exactImage = imagesByGuid.get(guid);

    if (!exactImage) {
        product["Local Image"] = null;
        product["Exact Image URL"] = null;
        product["Image Status"] = "No product image published on Toast";
        return null;
    }

    const extension = getExtension(exactImage);
    const relativePath = `assets/images/products/toast/${slug}.${extension}`;

    product["Local Image"] = relativePath;
    product["Exact Image URL"] = exactImage;
    product["Image Status"] = "Exact Toast product image";

    return {
        name: product["Product Name"],
        slug,
        imageUrl: exactImage,
        destination: path.join(outputDir, `${slug}.${extension}`)
    };
}

function writeDataFiles(categoriesData, productsData) {
    const jsSource = [
        `const categoriesData = ${JSON.stringify(categoriesData, null, 4)};`,
        "",
        `const productsData = ${JSON.stringify(productsData, null, 4)};`,
        ""
    ].join("\n");

    fs.writeFileSync(productsDataPath, jsSource, "utf8");
    fs.writeFileSync(productsJsonPath, `${JSON.stringify(productsData, null, 4)}\n`, "utf8");
}

async function main() {
    if (!fs.existsSync(markdownPath)) {
        throw new Error(`Missing ${markdownPath}. Fetch the Toast menu markdown before syncing.`);
    }

    const markdown = fs.readFileSync(markdownPath, "utf8");
    const imagesByGuid = extractToastImages(markdown);
    const { categoriesData, productsData } = loadJavaScriptData(productsDataPath);
    const downloads = productsData
        .map(product => updateProduct(product, imagesByGuid))
        .filter(Boolean);

    fs.mkdirSync(outputDir, { recursive: true });

    const failures = [];
    await runWithConcurrency(
        downloads.map(item => async () => {
            try {
                await downloadImage(item.imageUrl, item.destination);
            } catch (error) {
                failures.push(`${item.name}: ${error.message}`);
            }
        }),
        concurrency
    );

    if (failures.length) {
        throw new Error(`Image downloads failed:\n${failures.join("\n")}`);
    }

    writeDataFiles(categoriesData, productsData);

    console.log(`Toast products found: ${productsData.length}`);
    console.log(`Exact Toast images mapped and downloaded: ${downloads.length}`);
    console.log(`Products without a Toast photo: ${productsData.length - downloads.length}`);
}

main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
