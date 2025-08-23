const swiper = new Swiper('.swiper', {
  loop: true,
  speed: 1300,
  autoplay: { delay: 5000 },
  effect: 'slide'
});

// Page transition effects
document.addEventListener('DOMContentLoaded', function() {
  // Fade in animation for the page
  document.body.style.opacity = '0';
  document.body.style.transition = 'opacity 0.5s ease-in';
  
  setTimeout(() => {
    document.body.style.opacity = '1';
  }, 100);
  
  // Handle explore button click with broken glass transition
  const exploreButton = document.querySelector('.welcome-btn a');
  if (exploreButton) {
    exploreButton.addEventListener('click', function(e) {
      e.preventDefault();
      
      // Prevent multiple clicks during transition
      if (window.glassTransition && window.glassTransition.isTransitioning) {
        return;
      }
      
      // Add button press effect
      const button = this.closest('.welcome-btn');
      button.style.transform = 'translateY(-1px) scale(1.02)';
      button.style.transition = 'all 0.1s ease';
      
      // Create ripple effect at click position
      const rect = button.getBoundingClientRect();
      const ripple = document.createElement('div');
      ripple.style.cssText = `
        position: absolute;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.6);
        transform: translate(-50%, -50%);
        left: ${e.clientX - rect.left}px;
        top: ${e.clientY - rect.top}px;
        animation: ripple 0.6s linear;
        pointer-events: none;
        z-index: 10;
      `;
      button.appendChild(ripple);
      
      // Execute broken glass transition
      setTimeout(() => {
        if (window.glassTransition) {
          window.glassTransition.execute(this.href, e);
        } else {
          // Fallback if broken glass transition is not available
          window.location.href = this.href;
        }
      }, 150);
      
      // Clean up ripple effect
      setTimeout(() => {
        if (ripple.parentNode) {
          ripple.remove();
        }
      }, 600);
    });
  }
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes fly {
    0%, 100% { transform: translateX(0) rotate(0deg); }
    25% { transform: translateX(10px) rotate(5deg); }
    75% { transform: translateX(-10px) rotate(-5deg); }
  }
  
  @keyframes ripple {
    to {
      transform: translate(-50%, -50%) scale(20);
      opacity: 0;
    }
  }
  
  .fade-in {
    animation: fadeIn 0.8s ease-in;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;
document.head.appendChild(style);