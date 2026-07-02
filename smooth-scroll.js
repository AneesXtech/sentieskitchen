// smooth-scroll.js
// Initialize Lenis smooth scroll
const lenis = new Lenis({
  duration: 1.2, // Scroll duration
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Easing function for smooth transitions
  direction: 'vertical', // Scroll direction: vertical or horizontal
  gestureDirection: 'vertical', // Gesture direction: vertical, horizontal, or both
  smooth: true, // Enable smooth scrolling
  mouseMultiplier: 1, // Mouse scroll speed multiplier
  smoothTouch: false, // Disable smooth scrolling for touch devices
  touchMultiplier: 2, // Touch scroll speed multiplier
  infinite: false, // Disable infinite scroll
});

// Optional: Listen to scroll events
lenis.on('scroll', ({ scroll, limit, velocity, direction, progress }) => {
  console.log({ scroll, limit, velocity, direction, progress });
});

// Animation frame loop function
function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);