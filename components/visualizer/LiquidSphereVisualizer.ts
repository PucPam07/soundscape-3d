import * as THREE from "three";

export class LiquidSphereVisualizer {
  public group: THREE.Group;

  // 1. Translucent Fluid Glass Orb
  private sphereMesh: THREE.Mesh;
  private sphereMaterial: THREE.ShaderMaterial;

  // 2. Inner Crystalline Wireframe Core
  private innerCoreMesh: THREE.Mesh;
  private innerCoreWireframe: THREE.LineSegments;

  // 3. Minimalist Orbital Rings
  private ringA: THREE.Line;
  private ringB: THREE.Line;
  private ringC: THREE.Line;

  // 4. Starlight Orbital Dust Particles
  private stardust: THREE.Points;
  private stardustMat: THREE.ShaderMaterial;

  constructor() {
    this.group = new THREE.Group();

    // ====================================================
    // 1. TRANSLUCENT FLUID GLASS ORB
    // ====================================================
    const sphereGeo = new THREE.IcosahedronGeometry(1.65, 32);

    this.sphereMaterial = new THREE.ShaderMaterial({
      vertexShader: `
        precision highp float;

        uniform float uTime;
        uniform float uBass;
        uniform float uTreble;

        varying vec3 vNormal;
        varying vec3 vWorldPos;
        varying float vDisplacement;

        void main() {
          vNormal = normalize(normalMatrix * normal);

          // Smooth harmonic fluid ripples
          float w1 = sin(position.x * 2.2 + uTime * 1.8);
          float w2 = cos(position.y * 2.5 - uTime * 2.0);
          float w3 = sin(position.z * 2.0 + uTime * 1.5);
          float ripple = (w1 + w2 + w3) * 0.33;

          // Fine audio response displacement
          float displacement = ripple * (0.12 + uBass * 0.35)
                             + sin(position.y * 5.0 + uTime * 3.0) * 0.08 * uTreble;
          vDisplacement = displacement;

          vec3 newPosition = position + normal * displacement;
          vWorldPos = (modelMatrix * vec4(newPosition, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;

        uniform float uTime;
        uniform float uBass;

        varying vec3 vNormal;
        varying vec3 vWorldPos;
        varying float vDisplacement;

        void main() {
          vec3 viewDir = normalize(cameraPosition - vWorldPos);
          float NdotV = max(dot(vNormal, viewDir), 0.0);
          float fresnel = pow(1.0 - NdotV, 2.4);

          // Minimalist Ice & Obsidian Glass Palette
          vec3 deepCoreColor = vec3(0.05, 0.09, 0.15);
          vec3 edgeIceColor  = vec3(0.45, 0.82, 1.00);
          vec3 starlightTip  = vec3(1.00, 1.00, 1.00);

          // Blend base glass tone
          vec3 color = mix(deepCoreColor, edgeIceColor, fresnel * 0.8);

          // Subtle specular glint
          vec3 lightDir = normalize(vec3(2.0, 3.5, 2.5));
          vec3 halfVec = normalize(lightDir + viewDir);
          float spec = pow(max(dot(vNormal, halfVec), 0.0), 40.0);
          color += starlightTip * spec * 0.5;

          // Gentle bass glow at the rim
          color += edgeIceColor * fresnel * (uBass * 0.35);

          // Translucent alpha with soft edge falloff
          float alpha = 0.2 + fresnel * 0.65;

          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
      side: THREE.FrontSide,
      uniforms: {
        uTime: { value: 0 },
        uBass: { value: 0 },
        uTreble: { value: 0 },
      },
    });

    this.sphereMesh = new THREE.Mesh(sphereGeo, this.sphereMaterial);
    this.group.add(this.sphereMesh);

    // ====================================================
    // 2. INNER CRYSTALLINE WIREFRAME CORE
    // ====================================================
    const innerGeo = new THREE.IcosahedronGeometry(0.85, 1);
    const innerEdges = new THREE.EdgesGeometry(innerGeo);
    const innerWireMat = new THREE.LineBasicMaterial({
      color: 0x7dd3fc, // Soft Ice Cyan
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
    });
    this.innerCoreWireframe = new THREE.LineSegments(innerEdges, innerWireMat);
    this.group.add(this.innerCoreWireframe);

    const innerCoreMat = new THREE.MeshBasicMaterial({
      color: 0x0f172a,
      transparent: true,
      opacity: 0.6,
    });
    this.innerCoreMesh = new THREE.Mesh(innerGeo, innerCoreMat);
    this.group.add(this.innerCoreMesh);

    // ====================================================
    // 3. MINIMALIST ORBITAL RINGS
    // ====================================================
    const createOrbitalRing = (radius: number, colorHex: number, opacity: number) => {
      const segs = 96;
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= segs; i++) {
        const theta = (i / segs) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(theta) * radius, 0, Math.sin(theta) * radius));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const mat = new THREE.LineBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity,
        blending: THREE.AdditiveBlending,
      });
      return new THREE.Line(geo, mat);
    };

    // Primary Equatorial Ring (Diamond Silver)
    this.ringA = createOrbitalRing(2.8, 0xe2e8f0, 0.6);
    this.group.add(this.ringA);

    // Secondary Tilted Ring (Ice Blue)
    this.ringB = createOrbitalRing(3.4, 0x38bdf8, 0.5);
    this.ringB.rotation.x = Math.PI / 4;
    this.ringB.rotation.z = Math.PI / 6;
    this.group.add(this.ringB);

    // Outer Polar Ring (Faint Platinum)
    this.ringC = createOrbitalRing(4.0, 0x94a3b8, 0.3);
    this.ringC.rotation.x = -Math.PI / 3;
    this.ringC.rotation.y = Math.PI / 8;
    this.group.add(this.ringC);

    // ====================================================
    // 4. STARLIGHT ORBITAL DUST PARTICLES (Crisp Tiny Diamonds)
    // ====================================================
    const dustCount = 280;
    const dustPositions = new Float32Array(dustCount * 3);
    const dustRand = new Float32Array(dustCount);
    const dustRadius = new Float32Array(dustCount);

    for (let i = 0; i < dustCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 2.4 + Math.random() * 2.0;
      const ySpread = (Math.random() - 0.5) * 0.4;

      dustPositions[i * 3] = Math.cos(angle) * r;
      dustPositions[i * 3 + 1] = ySpread;
      dustPositions[i * 3 + 2] = Math.sin(angle) * r;

      dustRand[i] = Math.random();
      dustRadius[i] = r;
    }

    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));
    dustGeo.setAttribute("aRand", new THREE.BufferAttribute(dustRand, 1));
    dustGeo.setAttribute("aRadius", new THREE.BufferAttribute(dustRadius, 1));

    this.stardustMat = new THREE.ShaderMaterial({
      vertexShader: `
        precision highp float;

        uniform float uTime;
        uniform float uBass;
        attribute float aRand;
        attribute float aRadius;

        varying float vRand;

        void main() {
          vRand = aRand;

          float speed = 0.2 + aRand * 0.3;
          float baseAngle = atan(position.z, position.x);
          float angle = baseAngle + uTime * speed;
          float r = aRadius * (1.0 + uBass * 0.06);

          float yOffset = sin(uTime * 1.5 + aRand * 6.28) * 0.08;

          vec3 pos = vec3(
            cos(angle) * r,
            position.y + yOffset,
            sin(angle) * r
          );

          vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPos;

          // Crisp, small point size (no large overlapping blobs)
          float baseSize = 14.0 + aRand * 10.0 + uBass * 8.0;
          gl_PointSize = clamp(baseSize / -mvPos.z, 2.0, 7.0);
        }
      `,
      fragmentShader: `
        precision highp float;

        uniform float uTime;
        uniform float uBass;
        varying float vRand;

        void main() {
          float d = length(gl_PointCoord - vec2(0.5));
          if (d > 0.5) discard;

          float glow = smoothstep(0.5, 0.08, d);
          float twinkle = 0.7 + 0.3 * sin(uTime * 3.5 + vRand * 25.0);

          vec3 starColor = mix(vec3(0.7, 0.9, 1.0), vec3(1.0, 1.0, 1.0), vRand);
          gl_FragColor = vec4(starColor, glow * twinkle * 0.75);
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

    this.stardust = new THREE.Points(dustGeo, this.stardustMat);
    this.group.add(this.stardust);
  }

  // ====================================================
  // UPDATE
  // ====================================================
  public update(elapsedTime: number, frequencyData: Uint8Array | null) {
    let bass = 0;
    let treble = 0;

    if (frequencyData && frequencyData.length > 0) {
      const len = frequencyData.length;
      for (let i = 0; i < 16; i++) {
        bass += frequencyData[i];
      }
      bass = bass / (16 * 255);

      const trebleStart = Math.floor(len * 0.7);
      for (let i = trebleStart; i < len; i++) {
        treble += frequencyData[i];
      }
      treble = treble / (Math.max(1, len - trebleStart) * 255);
    }

    // Update Sphere
    this.sphereMaterial.uniforms.uTime.value = elapsedTime;
    this.sphereMaterial.uniforms.uBass.value = bass;
    this.sphereMaterial.uniforms.uTreble.value = treble;
    this.sphereMesh.rotation.y = elapsedTime * 0.25;
    this.sphereMesh.rotation.x = Math.sin(elapsedTime * 0.15) * 0.15;

    // Update Inner Core
    const coreScale = 1.0 + bass * 0.25;
    this.innerCoreMesh.scale.set(coreScale, coreScale, coreScale);
    this.innerCoreWireframe.scale.set(coreScale, coreScale, coreScale);
    this.innerCoreMesh.rotation.y = -elapsedTime * 0.4;
    this.innerCoreWireframe.rotation.y = -elapsedTime * 0.4;
    this.innerCoreWireframe.rotation.z = elapsedTime * 0.25;

    // Update Orbital Rings
    this.ringA.rotation.y = elapsedTime * 0.1;
    this.ringB.rotation.y = -elapsedTime * 0.12;
    this.ringC.rotation.z = elapsedTime * 0.08;

    const ringScale = 1.0 + bass * 0.08;
    this.ringA.scale.set(ringScale, ringScale, ringScale);
    this.ringB.scale.set(ringScale, ringScale, ringScale);

    // Update Stardust
    this.stardustMat.uniforms.uTime.value = elapsedTime;
    this.stardustMat.uniforms.uBass.value = bass;
    this.stardust.rotation.y = elapsedTime * 0.05;
  }

  // ====================================================
  // DISPOSE
  // ====================================================
  public dispose() {
    this.sphereMesh.geometry.dispose();
    this.sphereMaterial.dispose();

    this.innerCoreMesh.geometry.dispose();
    (this.innerCoreMesh.material as THREE.Material).dispose();
    this.innerCoreWireframe.geometry.dispose();
    (this.innerCoreWireframe.material as THREE.Material).dispose();

    this.ringA.geometry.dispose();
    (this.ringA.material as THREE.Material).dispose();
    this.ringB.geometry.dispose();
    (this.ringB.material as THREE.Material).dispose();
    this.ringC.geometry.dispose();
    (this.ringC.material as THREE.Material).dispose();

    this.stardust.geometry.dispose();
    this.stardustMat.dispose();
  }
}
