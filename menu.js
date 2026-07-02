document.addEventListener('DOMContentLoaded', () => {

    // Mobile hamburger toggle is now handled globally by script.js

    // ==========================================================================
    // 2. Data Fallbacks & Config
    // ==========================================================================
    const defaultToastMenuUrl = "https://order.toasttab.com/online/senties-kitchen";
    // Order buttons open Toast checkout URLs when available, otherwise the main menu.
    const orderRedirectUrl = defaultToastMenuUrl;
    const defaultFoodPlaceholder = "assets/images/placeholders/food-placeholder.webp";
    const missingProductImage = "assets/images/Logo catring.png";

    const productImageMap = {
        "jerk-chicken": "assets/images/products/jerk-chicken.webp",
        "fried-plantain": "assets/images/products/fried-plantain.webp"
    };

        const categoryImageMap = {
        "Add Ons": "assets/images/categories/add-ons.png",
        "Create Your Own Plate": "assets/images/categories/create-your-own-plate.png",
        "Desserts": "assets/images/categories/desserts.png",
        "Drinks": "assets/images/categories/drinks.png",
        "Fish Fry": "assets/images/categories/fish-fry.png",
        "Rice Bowls": "assets/images/categories/rice-bowls.png",
        "Salads": "assets/images/categories/salad.png",
        "Sauces": "assets/images/categories/sauces.png",
        "Sentie's Plates": "assets/images/categories/senties-plates.png",
        "Sides": "assets/images/categories/sides.png",
        "Soup": "assets/images/categories/soups.png",
        "Wings": "assets/images/categories/wings.png"
    };

    const categoryBanners = { ...categoryImageMap };

    const productImageUsageCounts = (Array.isArray(window.productsData) ? window.productsData : []).reduce((counts, product) => {
        const exactImage = normalizeText(product && (product["Exact Image URL"] || product.imageUrl));
        if (exactImage) {
            counts[exactImage] = (counts[exactImage] || 0) + 1;
        }
        return counts;
    }, {});

        const categoryTaglines = {
        "Add Ons": "Customize your plate with our tasty extras.",
        "Create Your Own Plate": "Design your perfect meal with authentic flavors.",
        "Desserts": "Sweet treats to finish your meal on a perfect note.",
        "Drinks": "Refreshing beverages to complement your food.",
        "Fish Fry": "Crispy, golden-fried seafood delicacies.",
        "Rice Bowls": "Hearty and delicious rice bowls loaded with toppings.",
        "Salads": "Fresh and crisp greens with homemade dressings.",
        "Sauces": "Spice up your dishes with our house-made sauces.",
        "Sentie's Plates": "Our chef's signature Afro-Caribbean specialties.",
        "Sides": "Perfect accompaniments for your main course.",
        "Soup": "Warm, comforting, and slow-simmered soups.",
        "Wings": "Juicy chicken wings tossed in flavorful sauces."
    };


    function normalizeText(value) {
        return value == null ? "" : String(value).trim();
    }

    function normalizeKey(value) {
        return normalizeText(value).toUpperCase();
    }

    function getProductField(product, keys) {
        for (const key of keys) {
            const value = product && product[key];
            if (typeof value === "string" && value.trim()) {
                return value.trim();
            }
        }
        return "";
    }

    function handleImageError(img) {
        if (!img) return;
        img.onerror = null;
        img.hidden = true;

        const placeholder = img.parentElement?.querySelector(".product-image-placeholder");
        if (placeholder) {
            placeholder.hidden = false;
        }
    }

    window.handleImageError = handleImageError;

    // Helper: Resolve Product Image URL
    function getProductImage(product) {
        const slug = normalizeText(product?.slug || product?.Slug).toLowerCase();
        const localImage = getProductField(product, ["localImage", "Local Image"]);
        const exactImage = getProductField(product, ["imageUrl", "Exact Image URL"]);
        const categoryFallbackImage = getProductField(product, ["fallbackImageUrl", "Category Fallback Image URL", "Fallback Image URL"]);
        const imageStatus = normalizeText(product?.imageStatus || product?.["Image Status"]);

        if (localImage) {
            return localImage;
        }

        if (slug && productImageMap[slug]) {
            return productImageMap[slug];
        }

        if (
            exactImage &&
            !/category fallback only/i.test(imageStatus) &&
            exactImage !== categoryFallbackImage &&
            (productImageUsageCounts[exactImage] || 0) <= 1
        ) {
            return exactImage;
        }

        return "";
    }

    function escapeHtml(value) {
        return normalizeText(value)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function getPlaceholderHue(product) {
        const key = normalizeText(product?.Slug || product?.["Product Name"] || product?.Category);
        let hash = 0;

        for (let index = 0; index < key.length; index += 1) {
            hash = ((hash << 5) - hash + key.charCodeAt(index)) | 0;
        }

        return Math.abs(hash) % 360;
    }

    function createProductPlaceholderHTML(product, isVisible) {
        const name = normalizeText(product?.["Product Name"] || product?.name) || "Menu Item";
        const category = normalizeText(product?.Category || product?.category) || "Sentie's Kitchen";

        return `
            <div class="product-image-placeholder placeholder-logo-black"
                 ${isVisible ? "" : "hidden"} aria-hidden="true">
                <img class="placeholder-logo-img" src="assets/images/Logo catring.png" alt="Sentie's Kitchen Logo">
                <span class="product-image-placeholder-name">${escapeHtml(name)}</span>
                <span class="product-image-placeholder-category">${escapeHtml(category)}</span>
            </div>
        `;
    }

    // Helper: Scroll Tab into View (Horizontally Center on Mobile)
    function scrollTabIntoView(activeTab) {
        const container = document.getElementById('category-tabs-scroll');
        if (!container) return;
        
        const containerWidth = container.offsetWidth;
        const tabLeft = activeTab.offsetLeft;
        const tabWidth = activeTab.offsetWidth;
        
        const scrollTarget = tabLeft - (containerWidth / 2) + (tabWidth / 2);
        
        container.scrollTo({
            left: scrollTarget,
            behavior: 'smooth'
        });
    }

    // Helper: Highlight Active Tab
    let isScrollingFromTabClick = false;
    let scrollTimeout = null;

    function highlightActiveTab(categoryId) {
        if (isScrollingFromTabClick) return; // Prevent scroll watcher fighting smooth scroll
        
        const tabs = document.querySelectorAll('.category-tab');
        tabs.forEach(tab => {
            if (tab.getAttribute('data-target') === categoryId) {
                tab.classList.add('active');
                scrollTabIntoView(tab);
            } else {
                tab.classList.remove('active');
            }
        });
    }

    // ==========================================================================
    // 3. Dynamic Rendering Logic
    // ==========================================================================
    const tabsContainer = document.getElementById('category-tabs-scroll');
    const menuSectionsContainer = document.getElementById('menu-sections-container');
    const noResultsMessage = document.getElementById('no-results-message');
    const categoryTabsNav = document.getElementById('category-tabs-container');
    const categoryScrollPrev = document.querySelector('.category-scroll-prev');
    const categoryScrollNext = document.querySelector('.category-scroll-next');

    let sectionObservers = [];

    function updateCategoryArrowState() {
        if (!tabsContainer) return;

        const maxScrollLeft = tabsContainer.scrollWidth - tabsContainer.clientWidth;
        if (categoryScrollPrev) {
            categoryScrollPrev.disabled = tabsContainer.scrollLeft <= 4;
        }
        if (categoryScrollNext) {
            categoryScrollNext.disabled = tabsContainer.scrollLeft >= maxScrollLeft - 4;
        }
    }

    function scrollCategories(direction) {
        if (!tabsContainer) return;

        tabsContainer.scrollBy({
            left: direction * Math.max(240, tabsContainer.clientWidth * 0.72),
            behavior: 'smooth'
        });
    }

    categoryScrollPrev?.addEventListener('click', () => scrollCategories(-1));
    categoryScrollNext?.addEventListener('click', () => scrollCategories(1));
    tabsContainer?.addEventListener('scroll', updateCategoryArrowState, { passive: true });
    window.addEventListener('resize', updateCategoryArrowState);

    // Render Category Tabs
    function renderTabs() {
        if (!tabsContainer) return;
        tabsContainer.innerHTML = '';

        categoriesData.forEach((cat, index) => {
            const tabBtn = document.createElement('button');
            tabBtn.className = `category-tab ${index === 0 ? 'active' : ''}`;
            tabBtn.setAttribute('data-target', cat.Slug);
            
            tabBtn.innerHTML = `<span class="category-tab-text">${cat.Category}</span>`;

            tabBtn.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Set flag to bypass Scroll Observer during manual navigation
                isScrollingFromTabClick = true;
                clearTimeout(scrollTimeout);

                // Update active tab locally
                document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
                tabBtn.classList.add('active');
                scrollTabIntoView(tabBtn);

                // Scroll to Section
                const targetSection = document.getElementById(cat.Slug);
                if (targetSection) {
                    const stickyBarHeight = categoryTabsNav ? categoryTabsNav.offsetHeight : 60;
                    const elementPosition = targetSection.getBoundingClientRect().top + window.scrollY;
                    const offsetPosition = elementPosition - stickyBarHeight - 10; // Extra padding

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                }

                // Reset scrolling flag after transition
                scrollTimeout = setTimeout(() => {
                    isScrollingFromTabClick = false;
                }, 800);
            });

            tabsContainer.appendChild(tabBtn);
        });

        requestAnimationFrame(updateCategoryArrowState);
    }

    function createProductCardHTML(product) {
        const isInStock = product["Stock Status"] === "In Stock";
        const imageUrl = getProductImage(product);
        const displayedImage = imageUrl || missingProductImage;
        const imageClass = imageUrl ? "" : "product-logo-fallback";
        const hasCustomizations = product["Has Customizations"] === "Yes";

        const checkoutUrl = getProductField(product, ["Checkout URL", "checkoutUrl"]);
        const orderUrl = checkoutUrl || orderRedirectUrl;
        const productName = normalizeText(product["Product Name"] || product.name) || "Menu Item";
        const productDescription = normalizeText(product["Description"]) || "Freshly prepared Afro-Caribbean flavors made with premium ingredients.";
        const priceValue = Number(product["Price"]);
        const priceText = normalizeText(product["Price Text"]) || (Number.isFinite(priceValue) ? `$${priceValue.toFixed(2)}` : "$0.00");

        // Card class names
        const cardClass = isInStock ? 'product-card' : 'product-card out-of-stock';

        // Stock Badge (top-right ribbon)
        const stockBadge = isInStock
            ? ''
            : '<span class="product-stock-badge">Out of Stock</span>';

        // Customization hint
        const customTag = hasCustomizations
            ? '<span class="product-custom-text"><i class="fa-solid fa-circle-info"></i> Customizable</span>'
            : '';

        // Full-width action keeps the card easy to use on desktop and mobile.
        const actionBtn = isInStock
            ? `<a href="${orderUrl}" target="_blank" class="btn-order" aria-label="Add ${escapeHtml(productName)} to cart">
                    <i class="fa-solid fa-bag-shopping"></i>
                    <span>Add to Cart</span>
               </a>`
            : `<button class="btn-order disabled" disabled aria-label="${escapeHtml(productName)} is unavailable">
                    <i class="fa-solid fa-ban"></i>
                    <span>Unavailable</span>
               </button>`;

        return `
            <div class="${cardClass}">
                <!-- Image section on top -->
                <div class="product-card-image">
                    <img class="${imageClass}" src="${escapeHtml(displayedImage)}" alt="${escapeHtml(productName)}" loading="lazy"
                         onerror="handleImageError(this)">
                    ${createProductPlaceholderHTML(product, false)}
                    ${stockBadge}
                </div>
                <!-- Text section below -->
                <div class="product-card-body">
                    <h3 class="product-card-title">${escapeHtml(productName)}</h3>
                    <p class="product-card-desc">${escapeHtml(productDescription)}</p>
                    ${customTag}
                    <div class="product-card-footer">
                        <span class="product-card-price">${priceText}</span>
                        ${actionBtn}
                    </div>
                </div>
            </div>
        `;
    }

    // Render All Category Sections and Products
    function renderMenuSections(items, options = {}) {
        if (!menuSectionsContainer) return;
        menuSectionsContainer.innerHTML = '';

        // Disconnect old observers
        sectionObservers.forEach(obs => obs.disconnect());
        sectionObservers = [];

        const isSearchMode = options.searchMode === true;
        const totalItems = Array.isArray(items) ? items : [];

        if (totalItems.length === 0) {
            noResultsMessage.style.display = 'flex';
            categoryTabsNav.style.display = 'none';
            return;
        }

        noResultsMessage.style.display = 'none';
        categoryTabsNav.style.display = isSearchMode ? 'none' : '';

        if (isSearchMode) {
            const searchSection = document.createElement('div');
            searchSection.className = 'category-section search-results-section';
            searchSection.innerHTML = `
                <div class="search-results-meta" role="status">
                    <strong>Search Results</strong>
                    <span>${totalItems.length} matching item${totalItems.length === 1 ? '' : 's'}</span>
                </div>
                <div class="products-grid search-results-grid">
                    ${totalItems.map(createProductCardHTML).join('')}
                </div>
            `;
            menuSectionsContainer.appendChild(searchSection);
            return;
        }

        categoriesData.forEach(cat => {
            const categoryProducts = totalItems.filter(p => normalizeKey(p.Category) === normalizeKey(cat.Category));

            // Skip categories with no products in the current view/search.
            if (categoryProducts.length === 0) return;

            const categorySection = document.createElement('div');
            categorySection.className = 'category-section';
            categorySection.id = cat.Slug;
            categorySection.setAttribute('data-category', cat.Category);

            // Banner image and product grid.
            const localBanner = categoryBanners[cat.Category] || defaultFoodPlaceholder;

            categorySection.innerHTML = `
                <div class="category-banner-card">
                    <img class="banner-img" src="${localBanner}" alt="${cat.Category}" loading="lazy"
                         onerror="handleImageError(this)">
                </div>
                <div class="products-grid">
                    ${categoryProducts.map(createProductCardHTML).join('')}
                </div>
            `;

            menuSectionsContainer.appendChild(categorySection);

            // Set up scroll observer for this category
            setupObserverForSection(categorySection);
        });
    }

    // Scroll Observer Setup
    function setupObserverForSection(section) {
        const observerOptions = {
            root: null,
            rootMargin: '-120px 0px -70% 0px', // Matches the sticky category bar overlap offset
            threshold: 0
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const slug = entry.target.getAttribute('id');
                    highlightActiveTab(slug);
                }
            });
        }, observerOptions);

        observer.observe(section);
        sectionObservers.push(observer);
    }

    // Render Search Results
    function renderSearchResults(filteredItems) {
        renderMenuSections(filteredItems, { searchMode: true });
    }

    // ==========================================================================
    // 4. Real-Time Search Logic
    // ==========================================================================
    const searchInput = document.getElementById('menu-search-input');
    const searchSubmitBtn = document.getElementById('menu-search-submit');

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            const query = searchInput.value.toLowerCase().trim();
            const submitIcon = searchSubmitBtn ? searchSubmitBtn.querySelector('i') : null;

            if (query.length === 0) {
                if (submitIcon) submitIcon.className = "fa-solid fa-arrow-right";
                noResultsMessage.style.display = 'none';
                categoryTabsNav.style.display = 'block';
                renderMenuSections(productsData);
                highlightActiveTab(categoriesData[0].Slug);
            } else {
                if (submitIcon) submitIcon.className = "fa-solid fa-xmark";
                
                const filtered = productsData.filter(p => {
                    const name = (p["Product Name"] || '').toLowerCase();
                    const category = (p["Category"] || '').toLowerCase();
                    const desc = (p["Description"] || '').toLowerCase();
                    
                    return name.includes(query) || category.includes(query) || desc.includes(query);
                });

                renderSearchResults(filtered);
            }
        });
    }

    if (searchSubmitBtn && searchInput) {
        searchSubmitBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const query = searchInput.value.trim();
            if (query.length > 0) {
                // Clear search input
                searchInput.value = '';
                // Trigger input event to restore default view
                searchInput.dispatchEvent(new Event('input'));
                searchInput.focus();
            }
        });
    }

    // ==========================================================================
    // 5. Typewriter Search Placeholder Animation
    // ==========================================================================
    const searchPlaceholders = [
        "Search for Jerk Chicken...",
        "Search for Oxtail Stew...",
        "Search for Curry Goat...",
        "Search for Rice & Peas...",
        "Search for Fried Plantains...",
        "Search for Chicken Patty...",
        "Search for Jollof Rice...",
        "Search for Samosas...",
        "Search for Passion Fruit Juice..."
    ];
    let placeholderIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let currentPlaceholder = "";
    const typingSpeed = 100;
    const erasingSpeed = 50;
    const delayBetweenWords = 2000;

    function typePlaceholder() {
        const searchInput = document.getElementById('menu-search-input');
        if (!searchInput) return;

        const fullText = searchPlaceholders[placeholderIndex];

        if (isDeleting) {
            currentPlaceholder = fullText.substring(0, charIndex - 1);
            charIndex--;
        } else {
            currentPlaceholder = fullText.substring(0, charIndex + 1);
            charIndex++;
        }

        searchInput.setAttribute('placeholder', currentPlaceholder);

        let typeDelay = isDeleting ? erasingSpeed : typingSpeed;

        if (!isDeleting && charIndex === fullText.length) {
            typeDelay = delayBetweenWords;
            isDeleting = true;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            placeholderIndex = (placeholderIndex + 1) % searchPlaceholders.length;
            typeDelay = 500;
        }

        setTimeout(typePlaceholder, typeDelay);
    }

    // ==========================================================================
    // 6. Initialization
    // ==========================================================================
    if (window.productsData && window.categoriesData) {
        const categoriesData = window.categoriesData;
        const productsData = window.productsData;
        renderTabs();
        renderMenuSections(productsData);
        typePlaceholder(); // Start placeholder typewriter effect
    } else {
        console.error("window.productsData or window.categoriesData is not defined. Make sure products-data.js is loaded first.");
    }
});




