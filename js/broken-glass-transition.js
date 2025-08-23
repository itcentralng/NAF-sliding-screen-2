// Broken Glass Transition Effect
class BrokenGlassTransition {
  constructor() {
    this.isTransitioning = false;
  }

  // Create glass shards overlay
  createGlassOverlay(targetUrl) {
    if (this.isTransitioning) return;
    this.isTransitioning = true;

    // Create main overlay container
    const overlay = document.createElement('div');
    overlay.className = 'broken-glass-overlay';
    overlay.id = 'glass-transition-overlay';
    
    // Create glass shards
    const numShards = 12;
    for (let i = 0; i < numShards; i++) {
      const shard = document.createElement('div');
      shard.className = 'glass-shard';
      shard.style.cssText = `
        top: ${Math.random() * 100}%;
        left: ${Math.random() * 100}%;
        width: ${80 + Math.random() * 40}px;
        height: ${80 + Math.random() * 40}px;
        --random-x: ${(Math.random() - 0.5) * 600}px;
        --random-y: ${(Math.random() - 0.5) * 600}px;
        --random-rotation: ${(Math.random() - 0.5) * 720}deg;
      `;
      overlay.appendChild(shard);
    }

    document.body.appendChild(overlay);
    return overlay;
  }

  // Create impact effect at click position
  createImpactEffect(x, y, container) {
    // Main impact point
    const impact = document.createElement('div');
    impact.className = 'impact-point';
    impact.style.left = x + 'px';
    impact.style.top = y + 'px';
    container.appendChild(impact);

    // Sound wave effects
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        const wave = document.createElement('div');
        wave.className = 'sound-wave';
        wave.style.left = x + 'px';
        wave.style.top = y + 'px';
        wave.style.animationDelay = (i * 0.1) + 's';
        container.appendChild(wave);
        
        setTimeout(() => wave.remove(), 700);
      }, i * 150);
    }

    // Glass particles
    for (let i = 0; i < 15; i++) {
      setTimeout(() => {
        const particle = document.createElement('div');
        particle.className = 'glass-particle';
        particle.style.cssText = `
          left: ${x + (Math.random() - 0.5) * 60}px;
          top: ${y + (Math.random() - 0.5) * 60}px;
          animation-delay: ${Math.random() * 0.3}s;
          animation-duration: ${0.8 + Math.random() * 0.4}s;
        `;
        container.appendChild(particle);
        
        setTimeout(() => particle.remove(), 1500);
      }, i * 20);
    }
  }

  // Create crack effect
  createCrackEffect(container) {
    const crack = document.createElement('div');
    crack.className = 'crack-overlay';
    container.appendChild(crack);
    
    setTimeout(() => crack.remove(), 400);
  }

  // Execute the glass breaking transition
  async execute(targetUrl, clickEvent) {
    return new Promise((resolve) => {
      // Get click position
      const rect = document.body.getBoundingClientRect();
      const x = clickEvent ? clickEvent.clientX : window.innerWidth / 2;
      const y = clickEvent ? clickEvent.clientY : window.innerHeight / 2;

      // Create glass overlay
      const overlay = this.createGlassOverlay(targetUrl);
      
      // Phase 1: Show cracks (300ms)
      setTimeout(() => {
        this.createCrackEffect(overlay);
      }, 50);

      // Phase 2: Impact effect (400ms)
      setTimeout(() => {
        this.createImpactEffect(x, y, overlay);
      }, 200);

      // Phase 3: Shatter the glass (800ms)
      setTimeout(() => {
        const shards = overlay.querySelectorAll('.glass-shard');
        shards.forEach((shard, index) => {
          setTimeout(() => {
            shard.classList.add('shatter');
          }, index * 50);
        });
      }, 400);

      // Phase 4: Show loading screen (500ms overlap)
      setTimeout(() => {
        this.showLoadingScreen();
      }, 800);

      // Phase 5: Navigate to target page
      setTimeout(() => {
        window.location.href = targetUrl;
        resolve();
      }, 1600);
    });
  }

  // Show loading screen
  showLoadingScreen() {
    const loading = document.createElement('div');
    loading.className = 'loading-fade';
    loading.innerHTML = `
      <div class="loading-content">
        <div class="spinner"><i class="fas fa-plane"></i></div>
        <h3>Loading Distinguished Personalities</h3>
        <p>Preparing your experience...</p>
      </div>
    `;
    document.body.appendChild(loading);
  }

  // Clean up method
  cleanup() {
    const overlay = document.getElementById('glass-transition-overlay');
    const loading = document.querySelector('.loading-fade');
    
    if (overlay) overlay.remove();
    if (loading) loading.remove();
    
    this.isTransitioning = false;
  }
}

// Initialize broken glass transition
const glassTransition = new BrokenGlassTransition();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BrokenGlassTransition;
} else {
  window.BrokenGlassTransition = BrokenGlassTransition;
  window.glassTransition = glassTransition;
}
