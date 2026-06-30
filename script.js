document.addEventListener('DOMContentLoaded', () => {
    // ==========================================================================
    // 1. Sticky Navigation Bar on Scroll
    // ==========================================================================
    const header = document.querySelector('header');
    if (header) {
        window.addEventListener('scroll', () => {
            header.classList.toggle('sticky', window.scrollY > 80);
        });
    }

    // ==========================================================================
    // 2. Mobile Hamburger Menu Toggle
    // ==========================================================================
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    
    if (mobileMenuBtn && navLinks) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileMenuBtn.classList.toggle('active');
            navLinks.classList.toggle('active');
            document.body.classList.toggle('menu-open');
        });

        // Close menu when clicking a link
        const links = navLinks.querySelectorAll('a');
        links.forEach(link => {
            link.addEventListener('click', () => {
                mobileMenuBtn.classList.remove('active');
                navLinks.classList.remove('active');
                document.body.classList.remove('menu-open');
            });
        });
    }

    // ==========================================================================
    // 3. Popular Dishes Carousel
    // ==========================================================================
    const popularCarousel = document.getElementById('popular-carousel');
    const popularPrevBtn = document.getElementById('popular-carousel-prev');
    const popularNextBtn = document.getElementById('popular-carousel-next');

    if (popularCarousel) {
        const scrollAmount = 300;
        
        if (popularPrevBtn) {
            popularPrevBtn.addEventListener('click', () => {
                popularCarousel.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
            });
        }
        
        if (popularNextBtn) {
            popularNextBtn.addEventListener('click', () => {
                popularCarousel.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            });
        }

        // Disable/enable navigation buttons based on scroll position
        const updatePopularButtons = () => {
            if (popularPrevBtn) {
                popularPrevBtn.disabled = popularCarousel.scrollLeft <= 5;
            }
            if (popularNextBtn) {
                const maxScroll = popularCarousel.scrollWidth - popularCarousel.clientWidth;
                popularNextBtn.disabled = popularCarousel.scrollLeft >= maxScroll - 5;
            }
        };

        popularCarousel.addEventListener('scroll', updatePopularButtons);
        window.addEventListener('resize', updatePopularButtons);
        // Delay update slightly to ensure scrollWidth/clientWidth are accurate after rendering
        setTimeout(updatePopularButtons, 400);
    }

    // ==========================================================================
    // 4. Testimonials / Reviews Slider
    // ==========================================================================
    const reviewsTrack = document.getElementById('reviews-track');
    const reviewsPrevBtn = document.getElementById('reviews-prev');
    const reviewsNextBtn = document.getElementById('reviews-next');
    const reviewDotsContainer = document.getElementById('review-dots');

    if (reviewsTrack) {
        const cards = Array.from(reviewsTrack.children);
        let currentIndex = 0;

        const updateSlider = (index) => {
            if (cards.length === 0) return;
            
            // Constrain index to valid range
            currentIndex = Math.max(0, Math.min(index, cards.length - 1));
            
            // Highlight active review card
            cards.forEach(card => card.classList.remove('active'));
            if (cards[currentIndex]) {
                cards[currentIndex].classList.add('active');
            }

            const viewport = reviewsTrack.parentElement;
            const activeCard = cards[currentIndex];
            if (activeCard && viewport) {
                // Get bounds without current transform to compute correct layout offsets
                const prevTransform = reviewsTrack.style.transform;
                reviewsTrack.style.transform = 'none';
                
                const trackLeft = reviewsTrack.getBoundingClientRect().left;
                const cardLeft = activeCard.getBoundingClientRect().left;
                let offset = cardLeft - trackLeft;
                
                // Constrain the offset to prevent empty space on the right side
                const maxOffset = reviewsTrack.scrollWidth - viewport.clientWidth;
                if (offset > maxOffset) {
                    offset = maxOffset;
                }
                if (offset < 0) {
                    offset = 0;
                }
                
                // Reapply constrained translation
                reviewsTrack.style.transform = `translateX(-${offset}px)`;

                // Update arrow button disabled states based on translation limits
                if (reviewsPrevBtn) {
                    reviewsPrevBtn.disabled = offset <= 5;
                }
                if (reviewsNextBtn) {
                    reviewsNextBtn.disabled = offset >= maxOffset - 5;
                }
            }

            // Update pagination dots
            const dots = reviewDotsContainer ? reviewDotsContainer.querySelectorAll('.dot') : [];
            dots.forEach((dot, idx) => {
                dot.classList.toggle('active', idx === currentIndex);
            });
        };

        // Dynamically create pagination dots
        if (reviewDotsContainer) {
            reviewDotsContainer.innerHTML = '';
            cards.forEach((_, idx) => {
                const dot = document.createElement('button');
                dot.className = `dot ${idx === 0 ? 'active' : ''}`;
                dot.setAttribute('aria-label', `Go to review ${idx + 1}`);
                dot.addEventListener('click', () => updateSlider(idx));
                reviewDotsContainer.appendChild(dot);
            });
        }

        if (reviewsPrevBtn) {
            reviewsPrevBtn.addEventListener('click', () => {
                if (currentIndex > 0) {
                    updateSlider(currentIndex - 1);
                }
            });
        }

        if (reviewsNextBtn) {
            reviewsNextBtn.addEventListener('click', () => {
                if (currentIndex < cards.length - 1) {
                    updateSlider(currentIndex + 1);
                }
            });
        }

        // Touch swipe support for reviews viewport
        let touchStartX = 0;
        let touchEndX = 0;
        const viewport = reviewsTrack.parentElement;
        if (viewport) {
            viewport.addEventListener('touchstart', (e) => {
                touchStartX = e.changedTouches[0].screenX;
            }, { passive: true });
            viewport.addEventListener('touchend', (e) => {
                touchEndX = e.changedTouches[0].screenX;
                const threshold = 50;
                if (touchStartX - touchEndX > threshold) {
                    // Swiped Left -> Next
                    if (currentIndex < cards.length - 1) {
                        updateSlider(currentIndex + 1);
                    }
                } else if (touchEndX - touchStartX > threshold) {
                    // Swiped Right -> Prev
                    if (currentIndex > 0) {
                        updateSlider(currentIndex - 1);
                    }
                }
            }, { passive: true });
        }

        window.addEventListener('resize', () => {
            // Recalculate dimensions on resize
            updateSlider(currentIndex);
        });

        // Initialize reviews slider
        setTimeout(() => {
            updateSlider(0);
        }, 150);
    }

    // ==========================================================================
    // 5. Back to Top Button Handler
    // ==========================================================================
    const backToTop = document.getElementById('back-to-top');
    if (backToTop) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 400) {
                backToTop.classList.add('show');
            } else {
                backToTop.classList.remove('show');
            }
        });

        backToTop.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // ==========================================================================
    // 6. Hero Vimeo Background Video Lazy Loader (5s delay)
    // ==========================================================================
    const heroVimeoContainer = document.getElementById('hero-vimeo-container');
    const heroBgImage = document.querySelector('.hero-bg-image');
    
    if (heroVimeoContainer) {
        setTimeout(() => {
            const iframe = document.createElement('iframe');
            // Using Vimeo background parameters: autoplay, loop, muted, background mode (hides controls), starting at 6s
            iframe.src = 'https://player.vimeo.com/video/1205905511?autoplay=1&muted=1&loop=1&background=1&autopause=0#t=6s';
            iframe.setAttribute('allow', 'autoplay; fullscreen');
            iframe.setAttribute('frameborder', '0');
            
            // Fade in the video and fade out the background image once Vimeo starts/loads
            iframe.addEventListener('load', () => {
                heroVimeoContainer.classList.add('loaded');
                if (heroBgImage) {
                    heroBgImage.style.opacity = '0';
                }
            });
            
            heroVimeoContainer.appendChild(iframe);
        }, 5000); // 5 seconds delay
    }
});
