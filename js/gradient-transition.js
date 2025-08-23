document.addEventListener('DOMContentLoaded', function() {
  // Get URL parameters to determine which section was selected
  const urlParams = new URLSearchParams(window.location.search);
  const targetSection = urlParams.get('section') || 'home';
  const targetPage = urlParams.get('page') || 'welcome.html';
  const fromSection = urlParams.get('from') || 'home';
  
  const container = document.querySelector('.gradient-container');
  
  // Section mapping with positions (0=home, 1=chiefs, 2=commanders, 3=commandants)
  const sectionMap = {
    'home': {
      position: 0,
      name: 'Home'
    },
    'chiefs': {
      position: 1,
      name: 'Chiefs of Accounts & Budget'
    },
    'commanders': {
      position: 2,
      name: 'Commanders 081 PAG'
    },
    'commandants': {
      position: 3,
      name: 'Commandants NAFSFA'
    }
  };
  
  const fromSectionData = sectionMap[fromSection];
  const targetSectionData = sectionMap[targetSection];
  
  // Animation state
  let animationId = null;
  let startTime = null;
  let isAnimating = false;
  
  // Position values (0 = home, 1 = chiefs, 2 = commanders, 3 = commandants)
  const startPosition = fromSectionData.position;
  const endPosition = targetSectionData.position;
  const totalDistance = endPosition - startPosition;
  
  // Calculate animation duration: 7 seconds per section traversed
  // For example: home to commandants = 3 sections = 21 seconds
  // commanders to commandants = 1 section = 7 seconds
  const sectionsToTraverse = Math.abs(totalDistance);
  const animationDuration = sectionsToTraverse * 7000; // 7 seconds per section
  
  // Disable CSS transitions for manual control
  container.style.transition = 'none';
  
  // Initialize the starting position
  setContainerPosition(startPosition);
  updateSectionContent(startPosition);
  
  // Start the sliding animation if we need to move
  if (totalDistance !== 0) {
    setTimeout(() => {
      startSmoothTransition();
    }, 1000);
  } else {
    // If we're already at the target, just show completion
    setTimeout(() => {
      completeTransition();
    }, 2000);
  }
  
  function easeInOutQuad(t) {
    // Smooth acceleration and deceleration
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }
  
  function lerp(start, end, t) {
    // Linear interpolation
    return start + (end - start) * t;
  }
  
  function setContainerPosition(position) {
    // Each section is 25% wide, so we translate by position * -25%
    const translateX = position * -25;
    container.style.transform = `translateX(${translateX}%)`;
  }
  
  function startSmoothTransition() {
    isAnimating = true;
    startTime = null;
    
    function animateFrame(currentTime) {
      if (!startTime) {
        startTime = currentTime;
      }
      
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / animationDuration, 1);
      
      // Apply easing function for smooth acceleration/deceleration
      const easedProgress = easeInOutQuad(progress);
      
      // Calculate current position using interpolation
      const currentPosition = lerp(startPosition, endPosition, easedProgress);
      
      // Apply the position to the container
      setContainerPosition(currentPosition);
      
      // Update active section based on current position
      const activeIndex = Math.round(currentPosition);
      updateSectionContent(activeIndex);
      
      // Continue animation if not complete
      if (progress < 1) {
        animationId = requestAnimationFrame(animateFrame);
      } else {
        // Animation complete
        isAnimating = false;
        setContainerPosition(endPosition);
        updateSectionContent(endPosition);
        completeTransition();
      }
    }
    
    // Start the animation
    animationId = requestAnimationFrame(animateFrame);
  }
  
  function updateSectionContent(position) {
    // Remove active class from all sections
    document.querySelectorAll('.gradient-section').forEach(section => {
      section.classList.remove('active');
    });
    
    // Add active class to current section
    const sectionKeys = Object.keys(sectionMap);
    const activeIndex = Math.max(0, Math.min(Math.floor(position + 0.5), sectionKeys.length - 1));
    
    if (activeIndex >= 0 && activeIndex < sectionKeys.length) {
      const sectionKey = sectionKeys[activeIndex];
      const activeSection = document.querySelector(`[data-section="${sectionKey}"]`);
      if (activeSection) {
        activeSection.classList.add('active');
      }
    }
  }
  
  function completeTransition() {
    // Add fade out effect
    setTimeout(() => {
      document.body.classList.add('fade-out');
      
      // Navigate to target page
      setTimeout(() => {
        window.location.href = targetPage;
      }, 1000);
    }, 1500);
  }
  
  // Clean up animation on page unload
  window.addEventListener('beforeunload', function() {
    if (animationId) {
      cancelAnimationFrame(animationId);
    }
  });
});