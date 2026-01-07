// Lungs Particle Animation for Pneumonia Detection AI
class LungsParticleAnimation {
  constructor(canvasId) {
    console.log('Initializing lungs animation...');
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      console.error('Canvas not found:', canvasId);
      return;
    }
    
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.mouseX = 0;
    this.mouseY = 0;
    this.time = 0;
    
    console.log('Canvas found, setting up animation...');
    this.resize();
    this.createParticles();
    this.animate();
    
    window.addEventListener('resize', () => this.resize());
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouseX = e.clientX - rect.left;
      this.mouseY = e.clientY - rect.top;
    });
  }
  
  resize() {
    this.canvas.width = this.canvas.offsetWidth;
    this.canvas.height = this.canvas.offsetHeight;
    console.log('Canvas resized:', this.canvas.width, 'x', this.canvas.height);
  }
  
  createParticles() {
    const particleCount = 150;
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    
    console.log('Creating', particleCount, 'particles');
    
    // Create two lung shapes with particles
    for (let i = 0; i < particleCount; i++) {
      const side = Math.random() > 0.5 ? 'left' : 'right';
      let x, y;
      
      if (side === 'left') {
        // Left lung - elliptical shape
        const angle = Math.random() * Math.PI * 2;
        const radiusX = 60 + Math.random() * 20;
        const radiusY = 80 + Math.random() * 30;
        
        x = centerX - 60 + Math.cos(angle) * radiusX;
        y = centerY + Math.sin(angle) * radiusY;
      } else {
        // Right lung - elliptical shape
        const angle = Math.random() * Math.PI * 2;
        const radiusX = 60 + Math.random() * 20;
        const radiusY = 80 + Math.random() * 30;
        
        x = centerX + 60 + Math.cos(angle) * radiusX;
        y = centerY + Math.sin(angle) * radiusY;
      }
      
      this.particles.push({
        x: x,
        y: y,
        targetX: x,
        targetY: y,
        size: Math.random() * 3 + 1,
        color: this.getRandomColor(),
        alpha: Math.random() * 0.8 + 0.2,
        speed: Math.random() * 0.02 + 0.01,
        side: side,
        pulsePhase: Math.random() * Math.PI * 2,
        floatPhase: Math.random() * Math.PI * 2
      });
    }
    
    console.log('Particles created successfully');
  }
  
  getRandomColor() {
    const colors = [
      '255, 0, 110',   // Pink
      '131, 56, 236',  // Purple  
      '58, 134, 255',  // Blue
      '255, 255, 255'  // White
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }
  
  updateParticles() {
    this.particles.forEach(particle => {
      // Breathing motion
      const breatheScale = 1 + Math.sin(this.time * 0.001 + particle.floatPhase) * 0.02;
      particle.x = particle.targetX + Math.sin(this.time * 0.001 + particle.floatPhase) * 2;
      particle.y = particle.targetY + Math.cos(this.time * 0.001 + particle.floatPhase) * 2;
      
      // Pulse effect
      particle.pulsePhase += 0.02;
      particle.currentSize = particle.size * (1 + Math.sin(particle.pulsePhase) * 0.3);
      
      // Mouse interaction
      const mouseDistance = Math.sqrt(
        Math.pow(this.mouseX - particle.x, 2) + 
        Math.pow(this.mouseY - particle.y, 2)
      );
      
      if (mouseDistance < 50) {
        const force = (50 - mouseDistance) / 50;
        particle.x -= (this.mouseX - particle.x) * force * 0.1;
        particle.y -= (this.mouseY - particle.y) * force * 0.1;
      }
    });
  }
  
  drawParticles() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw connections between nearby particles
    this.particles.forEach((particle, i) => {
      this.particles.slice(i + 1).forEach(otherParticle => {
        const distance = Math.sqrt(
          Math.pow(particle.x - otherParticle.x, 2) + 
          Math.pow(particle.y - otherParticle.y, 2)
        );
        
        if (distance < 80 && particle.side === otherParticle.side) {
          const opacity = (1 - distance / 80) * 0.2;
          this.ctx.strokeStyle = `rgba(${particle.color}, ${opacity})`;
          this.ctx.lineWidth = 1;
          this.ctx.beginPath();
          this.ctx.moveTo(particle.x, particle.y);
          this.ctx.lineTo(otherParticle.x, otherParticle.y);
          this.ctx.stroke();
        }
      });
    });
    
    // Draw particles
    this.particles.forEach(particle => {
      this.ctx.fillStyle = `rgba(${particle.color}, ${particle.alpha})`;
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.currentSize, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Add glow for some particles
      if (Math.random() > 0.95) {
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = `rgba(${particle.color}, ${particle.alpha})`;
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
      }
    });
    
    // Draw lung outlines
    this.drawLungsOutline();
  }
  
  drawLungsOutline() {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    this.ctx.lineWidth = 2;
    
    // Left lung outline
    this.ctx.beginPath();
    this.ctx.ellipse(centerX - 60, centerY, 70, 90, 0, 0, Math.PI * 2);
    this.ctx.stroke();
    
    // Right lung outline
    this.ctx.beginPath();
    this.ctx.ellipse(centerX + 60, centerY, 70, 90, 0, 0, Math.PI * 2);
    this.ctx.stroke();
  }
  
  animate() {
    this.time++;
    this.updateParticles();
    this.drawParticles();
    requestAnimationFrame(() => this.animate());
  }
}

// Initialize animation when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing lungs animation...');
  new LungsParticleAnimation('faceCanvas');
  
  // Reveal animations
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
      }
    });
  }, observerOptions);
  
  document.querySelectorAll('.reveal').forEach(el => {
    observer.observe(el);
  });
});
