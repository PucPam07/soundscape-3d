import * as THREE from "three";

export class CosmicGalaxyVisualizer {
  public group: THREE.Group;

  // 1. Galaxy Spiral Particles
  private particles: THREE.Points;
  private particleMaterial: THREE.ShaderMaterial;
  private readonly particleCount = 12000;

  // 2. Swirling Starlight Accretion Disk
  private accretionParticles: THREE.Points;
  private accretionMaterial: THREE.ShaderMaterial;
  private readonly accretionCount = 2800;

  // 3. Black Hole Event Horizon & Photon Sphere Ring
  private eventHorizonMesh: THREE.Mesh;
  private photonRing: THREE.Line;

  constructor() {
    this.group = new THREE.Group();

    // =========================================================================
    // 1. MAIN SPIRAL GALAXY (12,000 Stellar Particles)
    // =========================================================================
    const galaxyGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(this.particleCount * 3);
    const colors = new Float32Array(this.particleCount * 3);
    const scales = new Float32Array(this.particleCount);
    const randomness = new Float32Array(this.particleCount * 3);

    const branches = 3;
    const galaxyRadius = 6.8;

    // Minimalist Starlight & Ice Palette
    const coreColor = new THREE.Color("#ffffff");   // Pure Diamond White
    const innerColor = new THREE.Color("#e2e8f0");  // Starlight Silver
    const midColor = new THREE.Color("#7dd3fc");    // Soft Ice Cyan
    const armColor = new THREE.Color("#38bdf8");    // Electric Ice Blue
    const outerColor = new THREE.Color("#0f172a");  // Deep Space Slate

    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;
      const r = Math.pow(Math.random(), 1.5) * galaxyRadius;
      const spinAngle = r * 1.4;
      const branchAngle = ((i % branches) / branches) * Math.PI * 2;

      const randomX = (Math.random() - 0.5) * 0.38 * (r + 0.3);
      const randomY = (Math.random() - 0.5) * 0.20 * (r + 0.2);
      const randomZ = (Math.random() - 0.5) * 0.38 * (r + 0.3);

      positions[i3] = Math.cos(branchAngle + spinAngle) * r;
      positions[i3 + 1] = randomY;
      positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * r;

      randomness[i3] = randomX;
      randomness[i3 + 1] = randomY;
      randomness[i3 + 2] = randomZ;

      const mixedColor = coreColor.clone();
      const normR = r / galaxyRadius;
      if (normR < 0.2) {
        mixedColor.lerp(innerColor, normR / 0.2);
      } else if (normR < 0.55) {
        mixedColor.copy(innerColor).lerp(midColor, (normR - 0.2) / 0.35);
      } else if (normR < 0.8) {
        mixedColor.copy(midColor).lerp(armColor, (normR - 0.55) / 0.25);
      } else {
        mixedColor.copy(armColor).lerp(outerColor, (normR - 0.8) / 0.2);
      }

      colors[i3] = mixedColor.r;
      colors[i3 + 1] = mixedColor.g;
      colors[i3 + 2] = mixedColor.b;

      scales[i] = Math.random() * 1.5 + 0.5;
    }

    galaxyGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    galaxyGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    galaxyGeo.setAttribute("aScale", new THREE.BufferAttribute(scales, 1));
    galaxyGeo.setAttribute("aRandomness", new THREE.BufferAttribute(randomness, 3));

    this.particleMaterial = new THREE.ShaderMaterial({
      vertexShader: `
        precision highp float;

        uniform float uTime;
        uniform float uAudioLevel;
        uniform float uBass;
        attribute float aScale;
        attribute vec3 aRandomness;
        varying vec3 vColor;
        varying float vDistance;

        void main() {
          vColor = color;
          vec3 pos = position;

          // Differential galactic rotation
          float dist = length(pos.xz);
          vDistance = dist;
          float angle = atan(pos.x, pos.z);
          float speed = (0.32 / (dist + 0.45)) + 0.08;
          float newAngle = angle + uTime * speed;

          pos.x = cos(newAngle) * dist;
          pos.z = sin(newAngle) * dist;

          // Gravitational wave ripple
          float wave = sin(uTime * 3.0 - dist * 3.0);
          pos.y += wave * 0.12 * (1.0 + uBass * 1.2);
          pos += aRandomness * (1.0 + uAudioLevel * 0.5);

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPosition;

          float pSize = aScale * (20.0 + uAudioLevel * 20.0 + uBass * 12.0);
          gl_PointSize = clamp(pSize / -mvPosition.z, 2.0, 32.0);
        }
      `,
      fragmentShader: `
        precision highp float;

        uniform float uBass;
        varying vec3 vColor;
        varying float vDistance;

        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;

          float strength = 1.0 - (dist * 2.0);
          strength = pow(strength, 1.8);

          vec3 col = mix(vColor, vec3(1.0, 1.0, 1.0), uBass * 0.4);
          gl_FragColor = vec4(col, strength * 0.9);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
      uniforms: {
        uTime: { value: 0 },
        uAudioLevel: { value: 0 },
        uBass: { value: 0 },
      },
    });

    this.particles = new THREE.Points(galaxyGeo, this.particleMaterial);
    this.group.add(this.particles);

    // =========================================================================
    // 2. STARLIGHT ACCRETION DISK
    // =========================================================================
    const accGeo = new THREE.BufferGeometry();
    const accPositions = new Float32Array(this.accretionCount * 3);
    const accRadii = new Float32Array(this.accretionCount);
    const accAngles = new Float32Array(this.accretionCount);
    const accSpeeds = new Float32Array(this.accretionCount);

    const rMin = 0.8;
    const rMax = 2.0;

    for (let i = 0; i < this.accretionCount; i++) {
      const r = rMin + Math.pow(Math.random(), 1.4) * (rMax - rMin);
      const angle = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * 0.08 * (1.0 - (r - rMin) / (rMax - rMin));

      accPositions[i * 3] = Math.cos(angle) * r;
      accPositions[i * 3 + 1] = y;
      accPositions[i * 3 + 2] = Math.sin(angle) * r;

      accRadii[i] = r;
      accAngles[i] = angle;
      accSpeeds[i] = 2.2 / Math.sqrt(r);
    }

    accGeo.setAttribute("position", new THREE.BufferAttribute(accPositions, 3));
    accGeo.setAttribute("aRadius", new THREE.BufferAttribute(accRadii, 1));
    accGeo.setAttribute("aAngle", new THREE.BufferAttribute(accAngles, 1));
    accGeo.setAttribute("aSpeed", new THREE.BufferAttribute(accSpeeds, 1));

    this.accretionMaterial = new THREE.ShaderMaterial({
      vertexShader: `
        precision highp float;

        uniform float uTime;
        uniform float uBass;
        attribute float aRadius;
        attribute float aAngle;
        attribute float aSpeed;
        varying float vRadius;

        void main() {
          float currentAngle = aAngle + uTime * aSpeed;
          float r = aRadius * (1.0 + uBass * 0.12 * sin(uTime * 4.0 + aAngle * 3.0));

          vec3 pos = vec3(
            cos(currentAngle) * r,
            position.y * (1.0 + uBass * 1.2),
            sin(currentAngle) * r
          );

          vRadius = (r - 0.8) / (2.0 - 0.8);

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPosition;

          float pSize = 28.0 + 16.0 * uBass + 10.0 * (1.0 - vRadius);
          gl_PointSize = clamp(pSize / -mvPosition.z, 2.0, 36.0);
        }
      `,
      fragmentShader: `
        precision highp float;

        uniform float uBass;
        varying float vRadius;

        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;

          float disc = smoothstep(0.48, 0.1, dist);

          // Monochromatic Diamond to Ice Blue
          vec3 innerColor = vec3(1.0, 1.0, 1.0);
          vec3 outerColor = vec3(0.35, 0.75, 1.0);

          vec3 col = mix(innerColor, outerColor, smoothstep(0.0, 1.0, vRadius));
          col *= (1.0 + uBass * 0.5);

          gl_FragColor = vec4(col, disc * 0.85);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uBass: { value: 0 },
      },
    });

    this.accretionParticles = new THREE.Points(accGeo, this.accretionMaterial);
    this.group.add(this.accretionParticles);

    // =========================================================================
    // 3. BLACK HOLE EVENT HORIZON & PHOTON SPHERE RING
    // =========================================================================
    const horizonGeo = new THREE.SphereGeometry(0.72, 32, 32);
    const horizonMat = new THREE.MeshBasicMaterial({
      color: 0x05070c,
    });
    this.eventHorizonMesh = new THREE.Mesh(horizonGeo, horizonMat);
    this.group.add(this.eventHorizonMesh);

    // Delicate Photon Sphere Ring
    const photonPts: THREE.Vector3[] = [];
    for (let i = 0; i <= 64; i++) {
      const theta = (i / 64) * Math.PI * 2;
      photonPts.push(new THREE.Vector3(Math.cos(theta) * 0.78, 0, Math.sin(theta) * 0.78));
    }
    const photonGeo = new THREE.BufferGeometry().setFromPoints(photonPts);
    const photonMat = new THREE.LineBasicMaterial({
      color: 0xe2e8f0,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
    });
    this.photonRing = new THREE.Line(photonGeo, photonMat);
    this.group.add(this.photonRing);

    // 3D Perspective Tilt
    this.group.rotation.x = 0.55;
  }

  public update(elapsedTime: number, frequencyData: Uint8Array | null) {
    let bass = 0;
    let audioLevel = 0;

    if (frequencyData && frequencyData.length > 0) {
      const len = frequencyData.length;
      for (let i = 0; i < 16; i++) {
        bass += frequencyData[i];
      }
      bass = bass / (16 * 255);

      for (let i = 0; i < len; i++) {
        audioLevel += frequencyData[i];
      }
      audioLevel = audioLevel / (len * 255);
    }

    this.particleMaterial.uniforms.uTime.value = elapsedTime;
    this.particleMaterial.uniforms.uAudioLevel.value = audioLevel;
    this.particleMaterial.uniforms.uBass.value = bass;

    this.accretionMaterial.uniforms.uTime.value = elapsedTime;
    this.accretionMaterial.uniforms.uBass.value = bass;

    // Rotate galaxy and photon ring
    this.photonRing.rotation.y = elapsedTime * 0.3;
    const ringScale = 1.0 + bass * 0.1;
    this.photonRing.scale.set(ringScale, ringScale, ringScale);
  }

  public dispose() {
    this.particles.geometry.dispose();
    this.particleMaterial.dispose();
    this.accretionParticles.geometry.dispose();
    this.accretionMaterial.dispose();
    this.eventHorizonMesh.geometry.dispose();
    (this.eventHorizonMesh.material as THREE.Material).dispose();
    this.photonRing.geometry.dispose();
    (this.photonRing.material as THREE.Material).dispose();
  }
}
