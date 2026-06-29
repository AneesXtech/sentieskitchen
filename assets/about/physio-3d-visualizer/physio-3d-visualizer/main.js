// CN Physiotherapy - Interactive Body Map Interaction

const REGION_DATA = {
    'head-and-neck': {
        title: 'Head and Neck',
        desc: 'Relief for chronic headaches, TMJ dysfunction, and severe neck pain using advanced manual techniques.',
        url: 'detail.html?region=head-and-neck'
    },
    'shoulder': {
        title: 'Shoulder Health',
        desc: 'Specialized recovery for rotator cuff tears, frozen shoulder, and impingement syndromes.',
        url: 'detail.html?region=shoulder'
    },
    'elbow-wrist': {
        title: 'Upper Extremity (Elbow & Wrist)',
        desc: 'Comprehensive treatments for the elbow, wrist, and hand, including Carpal Tunnel and Tennis Elbow.',
        url: 'detail.html?region=upper-extremity'
    },
    'back': {
        title: 'Back & Spine',
        desc: 'Comprehensive treatments for sciatica, disc herniation, and persistent lower back relief.',
        url: 'detail.html?region=back'
    },
    'elbow': {
        title: 'Elbow & Arm',
        desc: 'Recovery programs for tennis elbow, golfer\'s elbow, and repetitive strain injuries.',
        url: 'detail.html?region=elbow'
    },
    'wrist': {
        title: 'Wrist & Hand',
        desc: 'Precise therapy for carpal tunnel syndrome and wrist fractures.',
        url: 'detail.html?region=wrist'
    },
    'hip': {
        title: 'Hip Mobility',
        desc: 'Expert care for hip arthritis, bursitis, and labral tears.',
        url: 'detail.html?region=hip'
    },
    'knee': {
        title: 'Knee Recovery',
        desc: 'ACL rehabilitation, meniscus repair, and knee osteoarthritis management.',
        url: 'detail.html?region=knee'
    },
    'foot-ankle': {
        title: 'Foot & Ankle',
        desc: 'Treatment for severe sprains, plantar fasciitis, and gait correction.',
        url: 'detail.html?region=foot-ankle'
    }
};

function init() {
    const dots = document.querySelectorAll('.dot');
    const infoCard = document.getElementById('region-info');
    const title = document.getElementById('region-title');
    const desc = document.getElementById('region-desc');
    const btn = document.getElementById('view-details-btn');

    // Entrance animation
    gsap.from('.content-side > *', { x: -50, opacity: 0, duration: 1, stagger: 0.2 });
    gsap.from('.human-container', { scale: 0.9, opacity: 0, duration: 1.2, ease: "power2.out" });

    dots.forEach(dot => {
        dot.addEventListener('mouseenter', () => {
            const regionKey = dot.getAttribute('data-region');
            
            // Highlight ALL dots in this region (Linked Hover)
            dots.forEach(d => {
                if (d.getAttribute('data-region') === regionKey) {
                    d.classList.add('active');
                } else {
                    d.classList.remove('active');
                }
            });

            const data = REGION_DATA[regionKey];
            
            if (data) {
                // Smooth content swap
                gsap.to([title, desc], { opacity: 0, y: 5, duration: 0.15, onComplete: () => {
                    title.innerText = data.title;
                    desc.innerText = data.desc;
                    btn.href = data.url;
                    btn.classList.remove('hidden');
                    gsap.to([title, desc, btn], { opacity: 1, y: 0, duration: 0.3 });
                }});
            }
        });

        dot.addEventListener('click', () => {
            const regionKey = dot.getAttribute('data-region');
            const data = REGION_DATA[regionKey];
            if (data) window.location.href = data.url;
        });
    });

    // Set first dot as active by default
    setTimeout(() => {
        const firstDot = dots[0];
        if (firstDot) {
            firstDot.dispatchEvent(new Event('mouseenter'));
        }
    }, 1500);
}

// Start
window.onload = init;
