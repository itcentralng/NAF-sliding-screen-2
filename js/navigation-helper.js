/**
 * Navigation Helper for NAFSFA Sliding Screen Application
 * Handles section transitions with calculated timing based on distance
 */

// Section positions mapping
const SECTION_POSITIONS = {
  'welcome.html': { section: 'home', position: 0 },
  'distinguished-personalities.html': { section: 'home', position: 0 },
  'chiefs-accounts-budget.html': { section: 'chiefs', position: 1 },
  'commanders-081-pag.html': { section: 'commanders', position: 2 },
  'commandants-nafsfa.html': { section: 'commandants', position: 3 }
};

// Navigation state management
class NavigationState {
  constructor() {
    this.storageKey = 'nafsfa_last_section';
  }

  // Store the current section when visiting a page
  storeCurrentSection(section) {
    if (section && section !== 'home') {
      localStorage.setItem(this.storageKey, section);
    }
  }

  // Get the last visited section
  getLastSection() {
    return localStorage.getItem(this.storageKey) || 'home';
  }

  // Clear the stored section (when going home)
  clearLastSection() {
    localStorage.removeItem(this.storageKey);
  }

  // Update the last section when navigating back to distinguished personalities
  setLastSectionFromCurrentPage() {
    const currentPage = window.location.pathname.split('/').pop();
    const currentSectionData = SECTION_POSITIONS[currentPage];
    if (currentSectionData && currentSectionData.section !== 'home') {
      this.storeCurrentSection(currentSectionData.section);
    }
  }
}

// Global navigation state instance
const navState = new NavigationState();

/**
 * Get current section based on current page
 */
function getCurrentSection() {
  const currentPage = window.location.pathname.split('/').pop();
  return SECTION_POSITIONS[currentPage] || { section: 'home', position: 0 };
}

/**
 * Navigate to a section with appropriate transition (broken glass or gradient slide)
 * @param {string} targetPage - Target page filename
 * @param {string} targetSection - Target section identifier
 */
function navigateWithTransition(targetPage, targetSection) {
  const currentPage = window.location.pathname.split('/').pop();
  
  // Check if we should use broken glass transition (welcome → distinguished personalities)
  if (currentPage === 'welcome.html' && targetPage === 'distinguished-personalities.html') {
    // Use broken glass transition
    navigateWithBrokenGlass(targetPage);
    return;
  }
  
  // Otherwise use gradient transition
  navigateWithSlide(targetPage, targetSection);
}

/**
 * Navigate with broken glass effect
 * @param {string} targetPage - Target page filename
 */
function navigateWithBrokenGlass(targetPage) {
  // Create broken glass overlay
  const overlay = document.createElement('div');
  overlay.className = 'glass-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.9);
    z-index: 9999;
    opacity: 0;
    transition: opacity 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
  `;
  
  document.body.appendChild(overlay);
  
  // Create multiple glass shards
  for (let i = 0; i < 15; i++) {
    createGlassShard(overlay, i);
  }
  
  // Fade in overlay
  setTimeout(() => {
    overlay.style.opacity = '1';
  }, 50);
  
  // Start glass breaking animation
  setTimeout(() => {
    const shards = overlay.querySelectorAll('.glass-shard');
    shards.forEach((shard, index) => {
      setTimeout(() => {
        shard.classList.add('shatter');
        // Apply random transform using stored values
        const shatterX = shard.dataset.shatterX;
        const shatterY = shard.dataset.shatterY;
        const shatterRotation = shard.dataset.shatterRotation;
        shard.style.transform = `translateX(${shatterX}px) translateY(${shatterY}px) rotate(${shatterRotation}deg) scale(0.1)`;
      }, index * 100);
    });
  }, 500);
  
  // Navigate to target page
  setTimeout(() => {
    window.location.href = targetPage;
  }, 2500);
}

/**
 * Create a single glass shard element
 */
function createGlassShard(container, index) {
  const shard = document.createElement('div');
  shard.className = 'glass-shard';
  
  // Random positioning and sizing
  const size = Math.random() * 100 + 50;
  const x = Math.random() * window.innerWidth;
  const y = Math.random() * window.innerHeight;
  const rotation = Math.random() * 360;
  
  shard.style.cssText = `
    position: absolute;
    width: ${size}px;
    height: ${size}px;
    left: ${x}px;
    top: ${y}px;
    background: linear-gradient(135deg, 
      rgba(255,255,255,0.3) 0%, 
      rgba(255,255,255,0.1) 50%, 
      rgba(255,255,255,0.05) 100%);
    border: 1px solid rgba(255,255,255,0.2);
    transform: rotate(${rotation}deg);
    transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    border-radius: ${Math.random() * 20}px;
    backdrop-filter: blur(2px);
    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
  `;
  
  // Store shatter animation values as data attributes
  shard.dataset.shatterX = Math.random() * 400 - 200;
  shard.dataset.shatterY = Math.random() * 400 - 200;
  shard.dataset.shatterRotation = Math.random() * 360;
  
  container.appendChild(shard);
}

/**
 * Navigate to a section with sliding transition
 * @param {string} targetPage - Target page filename
 * @param {string} targetSection - Target section identifier
 */
function navigateWithSlide(targetPage, targetSection) {
  const currentSectionData = getCurrentSection();
  
  // Determine the "from" section based on context
  let fromSection = currentSectionData.section;
  
  // If we're on distinguished personalities page, use the stored last section
  if (window.location.pathname.includes('distinguished-personalities.html')) {
    const lastSection = navState.getLastSection();
    if (lastSection && lastSection !== 'home') {
      fromSection = lastSection;
    }
  }
  
  // Store current section for future reference (except for home transitions)
  if (currentSectionData.section !== 'home') {
    navState.storeCurrentSection(currentSectionData.section);
  }
  
  // Special handling for home navigation - clear stored section
  if (targetSection === 'home' || targetPage === 'welcome.html') {
    navState.clearLastSection();
  }
  
  // Construct the gradient transition URL with from and to parameters
  const transitionUrl = `gradient-transition.html?section=${targetSection}&page=${targetPage}&from=${fromSection}`;
  
  // Add transition effect to current page before navigation
  document.body.style.transition = 'opacity 0.5s ease-out';
  document.body.style.opacity = '0.7';
  
  setTimeout(() => {
    window.location.href = transitionUrl;
  }, 300);
}

/**
 * Add sliding navigation to all navigation links
 */
function initializeSlidingNavigation() {
  document.addEventListener('DOMContentLoaded', function() {
    // Find all navigation links that should use sliding transition
    const navLinks = document.querySelectorAll('a[href*=".html"]');
    
    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      
      // Skip if it's already a gradient transition link or external link
      if (href.includes('gradient-transition.html') || href.startsWith('http')) {
        return;
      }
      
      // Determine target section based on href
      let targetSection = 'home';
      if (href.includes('chiefs-accounts-budget.html')) {
        targetSection = 'chiefs';
      } else if (href.includes('commanders-081-pag.html')) {
        targetSection = 'commanders';
      } else if (href.includes('commandants-nafsfa.html')) {
        targetSection = 'commandants';
      }
      
      // Add click event listener for sliding transition
      link.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Add visual feedback
        this.style.transform = 'scale(0.95)';
        this.style.transition = 'transform 0.2s ease';
        
        setTimeout(() => {
          this.style.transform = 'scale(1)';
        }, 200);
        
        // Navigate with appropriate transition
        navigateWithTransition(href, targetSection);
      });
    });
  });
}

/**
 * Add enhanced back button functionality
 */
function enhanceBackButtons() {
  document.addEventListener('DOMContentLoaded', function() {
    const backButtons = document.querySelectorAll('.back-btn');
    
    backButtons.forEach(button => {
      button.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Enhanced back button animation
        this.style.transform = 'translateX(-5px) scale(0.95)';
        this.style.transition = 'transform 0.3s ease';
        
        // Create sliding effect overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, rgba(0,0,0,0.8), rgba(0,0,0,0.6));
          z-index: 9999;
          opacity: 0;
          transition: opacity 0.5s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-family: 'Cinzel', serif;
        `;
        
        overlay.innerHTML = `
          <div style="text-align: center;">
            <i class="fas fa-arrow-left" style="font-size: 30px; margin-bottom: 20px; animation: slideLeft 1s infinite;"></i>
            <br>Sliding back to sections...
          </div>
        `;
        
        document.body.appendChild(overlay);
        
        setTimeout(() => {
          overlay.style.opacity = '1';
        }, 50);
        
        setTimeout(() => {
          navigateWithTransition('distinguished-personalities.html', 'home');
        }, 800);
      });
    });
  });
}

// Initialize the sliding navigation system
initializeSlidingNavigation();
enhanceBackButtons();

// Add slideLeft animation CSS and glass shatter effects
const style = document.createElement('style');
style.textContent = `
  @keyframes slideLeft {
    0%, 100% { transform: translateX(0); }
    50% { transform: translateX(-10px); }
  }
  
  .glass-shard {
    will-change: transform, opacity;
  }
  
  .glass-shard.shatter {
    opacity: 0;
    transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }
`;
document.head.appendChild(style);

// Make navigation state globally available
window.navState = navState;
