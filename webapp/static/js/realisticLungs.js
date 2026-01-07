// Realistic 3D Lungs Animation with Anatomical Accuracy
class RealisticPneumoniaLungs {
  constructor(containerId) {
    console.log('Initializing realistic 3D lungs...');
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
    this.bronchialTree = [];
    this.animationId = null;
    this.time = 0;
    
    this.init();
    this.createAnatomicalLungs();
    this.createBronchialTree();
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
    this.camera.position.set(0, 0.5, 8);
    this.camera.lookAt(0, 0, 0);
    
    // Create renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    this.container.appendChild(this.renderer.domElement);
    
    console.log('3D scene initialized for realistic lungs');
  }
  
  createAnatomicalLungs() {
    // Create anatomically correct left lung
    const leftLungGeometry = this.createLungGeometry('left');
    const lungMaterial = new THREE.MeshPhongMaterial({
      color: 0xff9999,
      emissive: 0x441122,
      emissiveIntensity: 0.05,
      shininess: 20,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide
    });
    
    this.leftLung = new THREE.Mesh(leftLungGeometry, lungMaterial);
    this.leftLung.position.set(-1.8, 0, 0);
    this.leftLung.castShadow = true;
    this.leftLung.receiveShadow = true;
    this.scene.add(this.leftLung);
    
    // Create anatomically correct right lung
    const rightLungGeometry = this.createLungGeometry('right');
    this.rightLung = new THREE.Mesh(rightLungGeometry, lungMaterial.clone());
    this.rightLung.position.set(1.8, 0, 0);
    this.rightLung.castShadow = true;
    this.rightLung.receiveShadow = true;
    this.scene.add(this.rightLung);
    
    console.log('Anatomical lungs created');
  }
  
  createLungGeometry(side) {
    // Create custom lung geometry with anatomical accuracy
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const indices = [];
    
    const segments = 32;
    const rings = 16;
    
    // Create lung shape with proper anatomy
    for (let ring = 0; ring <= rings; ring++) {
      const v = ring / rings;
      const y = (v - 0.5) * 3; // Height
      
      for (let segment = 0; segment <= segments; segment++) {
        const u = segment / segments;
        const angle = u * Math.PI * 2;
        
        // Lung shape varies by height and side
        let radiusX, radiusZ;
        
        if (side === 'left') {
          // Left lung is slightly smaller and has cardiac notch
          radiusX = 1.2 + Math.cos(v * Math.PI) * 0.3;
          radiusZ = 0.8 + Math.cos(v * Math.PI) * 0.2;
          
          // Cardiac notch indentation
          if (u > 0.6 && u < 0.8 && v > 0.3 && v < 0.7) {
            radiusX *= 0.6;
          }
        } else {
          // Right lung is larger
          radiusX = 1.4 + Math.cos(v * Math.PI) * 0.4;
          radiusZ = 0.9 + Math.cos(v * Math.PI) * 0.3;
        }
        
        // Add some organic variation
        const noise = Math.sin(angle * 3) * Math.cos(v * 4) * 0.05;
        radiusX += noise;
        radiusZ += noise;
        
        const x = Math.cos(angle) * radiusX;
        const z = Math.sin(angle) * radiusZ;
        
        vertices.push(x, y, z);
      }
    }
    
    // Create indices for triangles
    for (let ring = 0; ring < rings; ring++) {
      for (let segment = 0; segment < segments; segment++) {
        const a = ring * (segments + 1) + segment;
        const b = a + segments + 1;
        const c = a + 1;
        const d = b + 1;
        
        indices.push(a, b, c);
        indices.push(c, b, d);
      }
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    
    return geometry;
  }
  
  createBronchialTree() {
    // Create simplified bronchial tree structure
    const bronchialMaterial = new THREE.MeshPhongMaterial({
      color: 0xff6666,
      emissive: 0x331111,
      emissiveIntensity: 0.1,
      transparent: true,
      opacity: 0.7
    });
    
    // Main bronchi
    const leftBronchus = this.createBronchus(-1.8, 0, 0, 'left');
    const rightBronchus = this.createBronchus(1.8, 0, 0, 'right');
    
    this.leftLung.add(leftBronchus);
    this.rightLung.add(rightBronchus);
    
    console.log('Bronchial tree created');
  }
  
  createBronchus(x, y, z, side) {
    const group = new THREE.Group();
    
    // Create branching bronchi
    for (let i = 0; i < 8; i++) {
      const length = 0.3 + Math.random() * 0.4;
      const radius = 0.05 + Math.random() * 0.03;
      
      const geometry = new THREE.CylinderGeometry(radius, radius * 0.7, length, 8);
      const material = new THREE.MeshPhongMaterial({
        color: 0xff6666,
        transparent: true,
        opacity: 0.6
      });
      
      const bronchus = new THREE.Mesh(geometry, material);
      
      // Random branching angles
      bronchus.position.set(
        (Math.random() - 0.5) * 0.8,
        (Math.random() - 0.5) * 1.5,
        (Math.random() - 0.5) * 0.8
      );
      
      bronchus.rotation.set(
        Math.random() * 0.5,
        Math.random() * 0.5,
        Math.random() * 0.5
      );
      
      group.add(bronchus);
    }
    
    return group;
  }
  
  createPneumoniaEffects() {
    // Create realistic pneumonia-affected areas
    const pneumoniaMaterial = new THREE.MeshPhongMaterial({
      color: 0x8b0000,
      emissive: 0x4b0000,
      emissiveIntensity: 0.2,
      shininess: 5,
      transparent: true,
      opacity: 0.8,
      roughness: 0.8
    });
    
    // Add consolidated pneumonia patches to left lung
    for (let i = 0; i < 6; i++) {
      const patchGeometry = new THREE.SphereGeometry(0.15 + Math.random() * 0.25, 12, 8);
      const patch = new THREE.Mesh(patchGeometry, pneumoniaMaterial.clone());
      
      // Position patches on lung surface with medical accuracy
      const theta = Math.random() * Math.PI;
      const phi = Math.random() * Math.PI * 2;
      const radius = 1.3;
      
      patch.position.set(
        Math.sin(theta) * Math.cos(phi) * radius,
        Math.sin(theta) * Math.sin(phi) * radius * 1.5,
        Math.cos(theta) * radius * 0.8
      );
      
      // Flatten patches to sit on lung surface
      patch.scale.set(1, 0.3, 1);
      
      patch.userData = {
        originalScale: patch.scale.x,
        pulsePhase: Math.random() * Math.PI * 2,
        inflammationLevel: 0.5 + Math.random() * 0.5
      };
      
      this.pneumoniaAreas.push(patch);
      this.leftLung.add(patch);
    }
    
    // Add pneumonia patches to right lung
    for (let i = 0; i < 4; i++) {
      const patchGeometry = new THREE.SphereGeometry(0.15 + Math.random() * 0.25, 12, 8);
      const patch = new THREE.Mesh(patchGeometry, pneumoniaMaterial.clone());
      
      const theta = Math.random() * Math.PI;
      const phi = Math.random() * Math.PI * 2;
      const radius = 1.3;
      
      patch.position.set(
        Math.sin(theta) * Math.cos(phi) * radius,
        Math.sin(theta) * Math.sin(phi) * radius * 1.5,
        Math.cos(theta) * radius * 0.8
      );
      
      patch.scale.set(1, 0.3, 1);
      
      patch.userData = {
        originalScale: patch.scale.x,
        pulsePhase: Math.random() * Math.PI * 2,
        inflammationLevel: 0.5 + Math.random() * 0.5
      };
      
      this.pneumoniaAreas.push(patch);
      this.rightLung.add(patch);
    }
    
    console.log('Pneumonia effects created');
  }
  
  setupLighting() {
    // Ambient light for overall illumination
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    this.scene.add(ambientLight);
    
    // Main directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    this.scene.add(directionalLight);
    
    // Medical lighting effects
    const medicalLight = new THREE.PointLight(0x87ceeb, 0.3, 10);
    medicalLight.position.set(0, 3, 3);
    this.scene.add(medicalLight);
    
    // Inflammation glow
    const inflammationLight = new THREE.PointLight(0xff6b6b, 0.2, 8);
    inflammationLight.position.set(-2, -1, 2);
    this.scene.add(inflammationLight);
    
    console.log('Medical lighting setup complete');
  }
  
  animate() {
    this.animationId = requestAnimationFrame(() => this.animate());
    
    this.time += 0.016; // ~60fps
    
    // Realistic breathing animation
    const breathePhase = Math.sin(this.time * 2) * 0.03;
    const breatheScale = 1 + breathePhase;
    
    if (this.leftLung && this.rightLung) {
      this.leftLung.scale.setScalar(breatheScale);
      this.rightLung.scale.setScalar(breatheScale);
      
      // Slight asymmetry in breathing
      this.leftLung.rotation.y = Math.sin(this.time * 0.5) * 0.02;
      this.rightLung.rotation.y = Math.sin(this.time * 0.5 + Math.PI * 0.1) * 0.02;
    }
    
    // Animate pneumonia areas with realistic inflammation
    this.pneumoniaAreas.forEach((patch, index) => {
      if (patch.userData) {
        // Inflammation pulsing
        const inflammationPulse = 1 + Math.sin(this.time * 3 + patch.userData.pulsePhase) * 0.1 * patch.userData.inflammationLevel;
        patch.scale.setScalar(patch.userData.originalScale * inflammationPulse);
        
        // Dynamic opacity for inflammation visualization
        patch.material.opacity = 0.6 + Math.sin(this.time * 2 + index) * 0.2 * patch.userData.inflammationLevel;
        
        // Color variation for inflammation severity
        const severity = patch.userData.inflammationLevel;
        patch.material.color.setHSL(0, 0.8 + severity * 0.2, 0.3 + severity * 0.1);
      }
    });
    
    // Gentle camera movement for medical examination effect
    this.camera.position.x = Math.sin(this.time * 0.1) * 0.3;
    this.camera.position.y = 0.5 + Math.cos(this.time * 0.15) * 0.2;
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
  console.log('DOM loaded, initializing realistic 3D lungs...');
  
  // Wait for container to be ready
  setTimeout(() => {
    const realisticLungs = new RealisticPneumoniaLungs('hero-right');
    
    // Store reference for cleanup
    window.realisticLungs = realisticLungs;
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
