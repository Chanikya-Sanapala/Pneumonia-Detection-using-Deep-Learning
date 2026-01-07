// 3D Lungs Animation with Pneumonia Visualization
class PneumoniaLungs3D {
  constructor(containerId) {
    console.log('Initializing 3D lungs animation...');
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.error('Container not found:', containerId);
      return;
    }
    
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.leftLung = null;
    this.rightLung = null;
    this.pneumoniaAreas = [];
    this.animationId = null;
    
    this.init();
    this.createLungs();
    this.createPneumoniaEffects();
    this.setupLighting();
    this.animate();
    
    window.addEventListener('resize', () => this.onWindowResize());
  }
  
  init() {
    // Create scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a0a);
    
    // Create camera
    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
    this.camera.position.z = 5;
    this.camera.position.y = 1;
    
    // Create renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    this.container.appendChild(this.renderer.domElement);
    
    console.log('3D scene initialized');
  }
  
  createLungs() {
    // Create left lung
    const leftLungGeometry = new THREE.SphereGeometry(1.2, 32, 16);
    leftLungGeometry.scale(1, 1.5, 0.8); // Elongate for lung shape
    
    const lungMaterial = new THREE.MeshPhongMaterial({
      color: 0xff6b9d,
      emissive: 0x2a0845,
      emissiveIntensity: 0.1,
      shininess: 30,
      transparent: true,
      opacity: 0.8
    });
    
    this.leftLung = new THREE.Mesh(leftLungGeometry, lungMaterial);
    this.leftLung.position.set(-1.5, 0, 0);
    this.leftLung.castShadow = true;
    this.leftLung.receiveShadow = true;
    this.scene.add(this.leftLung);
    
    // Create right lung
    const rightLungGeometry = new THREE.SphereGeometry(1.2, 32, 16);
    rightLungGeometry.scale(1, 1.5, 0.8);
    
    this.rightLung = new THREE.Mesh(rightLungGeometry, lungMaterial.clone());
    this.rightLung.position.set(1.5, 0, 0);
    this.rightLung.castShadow = true;
    this.rightLung.receiveShadow = true;
    this.scene.add(this.rightLung);
    
    console.log('3D lungs created');
  }
  
  createPneumoniaEffects() {
    // Create pneumonia-affected areas
    const pneumoniaMaterial = new THREE.MeshPhongMaterial({
      color: 0x8b0000,
      emissive: 0x4b0000,
      emissiveIntensity: 0.3,
      shininess: 10,
      transparent: true,
      opacity: 0.7
    });
    
    // Add pneumonia patches to left lung
    for (let i = 0; i < 5; i++) {
      const patchGeometry = new THREE.SphereGeometry(0.2 + Math.random() * 0.3, 16, 8);
      const patch = new THREE.Mesh(patchGeometry, pneumoniaMaterial.clone());
      
      // Random position on lung surface
      const theta = Math.random() * Math.PI;
      const phi = Math.random() * Math.PI * 2;
      const radius = 1.2;
      
      patch.position.set(
        -1.5 + Math.sin(theta) * Math.cos(phi) * radius,
        Math.sin(theta) * Math.sin(phi) * radius * 1.5,
        Math.cos(theta) * radius * 0.8
      );
      
      patch.userData = {
        originalScale: patch.scale.x,
        pulsePhase: Math.random() * Math.PI * 2
      };
      
      this.pneumoniaAreas.push(patch);
      this.leftLung.add(patch);
    }
    
    // Add pneumonia patches to right lung
    for (let i = 0; i < 3; i++) {
      const patchGeometry = new THREE.SphereGeometry(0.2 + Math.random() * 0.3, 16, 8);
      const patch = new THREE.Mesh(patchGeometry, pneumoniaMaterial.clone());
      
      const theta = Math.random() * Math.PI;
      const phi = Math.random() * Math.PI * 2;
      const radius = 1.2;
      
      patch.position.set(
        1.5 + Math.sin(theta) * Math.cos(phi) * radius,
        Math.sin(theta) * Math.sin(phi) * radius * 1.5,
        Math.cos(theta) * radius * 0.8
      );
      
      patch.userData = {
        originalScale: patch.scale.x,
        pulsePhase: Math.random() * Math.PI * 2
      };
      
      this.pneumoniaAreas.push(patch);
      this.rightLung.add(patch);
    }
    
    console.log('Pneumonia effects created');
  }
  
  setupLighting() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    this.scene.add(ambientLight);
    
    // Main directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    this.scene.add(directionalLight);
    
    // Colored accent lights
    const pinkLight = new THREE.PointLight(0xff006e, 0.5, 10);
    pinkLight.position.set(-3, 2, 2);
    this.scene.add(pinkLight);
    
    const purpleLight = new THREE.PointLight(0x8338ec, 0.5, 10);
    purpleLight.position.set(3, 2, 2);
    this.scene.add(purpleLight);
    
    console.log('Lighting setup complete');
  }
  
  animate() {
    this.animationId = requestAnimationFrame(() => this.animate());
    
    const time = Date.now() * 0.001;
    
    // Rotate lungs slowly
    if (this.leftLung && this.rightLung) {
      this.leftLung.rotation.y = Math.sin(time * 0.3) * 0.1;
      this.leftLung.rotation.x = Math.cos(time * 0.2) * 0.05;
      
      this.rightLung.rotation.y = Math.sin(time * 0.3 + Math.PI) * 0.1;
      this.rightLung.rotation.x = Math.cos(time * 0.2 + Math.PI) * 0.05;
      
      // Breathing animation
      const breatheScale = 1 + Math.sin(time * 2) * 0.02;
      this.leftLung.scale.setScalar(breatheScale);
      this.rightLung.scale.setScalar(breatheScale);
    }
    
    // Animate pneumonia areas
    this.pneumoniaAreas.forEach((patch, index) => {
      if (patch.userData) {
        // Pulsing effect
        const pulseFactor = 1 + Math.sin(time * 3 + patch.userData.pulsePhase) * 0.2;
        patch.scale.setScalar(patch.userData.originalScale * pulseFactor);
        
        // Change opacity to show inflammation
        patch.material.opacity = 0.5 + Math.sin(time * 2 + index) * 0.2;
      }
    });
    
    // Camera movement
    this.camera.position.x = Math.sin(time * 0.1) * 0.5;
    this.camera.position.y = 1 + Math.cos(time * 0.15) * 0.3;
    this.camera.lookAt(0, 0, 0);
    
    this.renderer.render(this.scene, this.camera);
  }
  
  onWindowResize() {
    if (!this.container) return;
    
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    
    this.renderer.setSize(width, height);
  }
  
  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    
    if (this.renderer && this.container) {
      this.container.removeChild(this.renderer.domElement);
      this.renderer.dispose();
    }
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing 3D lungs...');
  
  // Wait a bit for the container to be properly sized
  setTimeout(() => {
    const lungs3D = new PneumoniaLungs3D('hero-right');
    
    // Store reference for cleanup
    window.pneumoniaLungs3D = lungs3D;
  }, 100);
  
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
