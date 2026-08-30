import * as THREE from "three";

export class CyberGridVisualizer {
  public group: THREE.Group;
  private terrainMesh: THREE.Mesh;
  private terrainMaterial: THREE.ShaderMaterial;
  private celestialMesh: THREE.Mesh;
  private celestialMaterial: THREE.ShaderMaterial;
  private starfield: THREE.Points;
  private highwayDashes: THREE.LineSegments;

  constructor() {
    this.group = new THREE.Group();

    // 1. Minimalist Obsidian & Ice Grid Plane
    const width = 36;
    const height = 48;
    const segmentsX = 72;
    const segmentsY = 96;

    const terrainGeo = new THREE.PlaneGeometry(width, height, segmentsX, segmentsY);
    terrainGeo.rotateX(-Math.PI / 2);

    this.terrainMaterial = new THREE.ShaderMaterial({
      vertexShader: `
        precision highp float;

        uniform float uTime;
        uniform float uBass;
        uniform float uMid;
        varying vec2 vUv;
        varying float vElevation;
        varying float vSide;

        void main() {
          vUv = uv;
          vec3 pos = position;

          // Infinite smooth forward motion along Z
          float movingZ = mod(pos.z - uTime * 6.0, 48.0) - 24.0;
          pos.z = movingZ;

          // Valley in the center, gentle rolling ridges on flanks
          float distFromCenter = abs(pos.x);
          float valleyMask = smoothstep(1.8, 9.0, distFromCenter);
          vSide = valleyMask;

          // Elegant audio-reactive topography waves
          float wave1 = sin(pos.x * 0.55 + uTime * 2.2) * cos(pos.z * 0.4 + uTime * 1.4);
          float wave2 = sin(pos.x * 1.1 - uTime * 2.5) * 0.35;
          float elevation = (wave1 * 0.9 + wave2 + uBass * 1.8 + uMid * 1.1) * valleyMask;
          pos.y += elevation;
          vElevation = elevation;

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        precision highp float;

        uniform float uTime;
        uniform float uBass;
        varying vec2 vUv;
        varying float vElevation;
        varying float vSide;

        void main() {
          // Crisp, thin wireframe grid lines
          vec2 gridCoord = fract(vUv * vec2(36.0, 48.0));
          float lineWidth = 0.055;
          float isLineX = step(1.0 - lineWidth, gridCoord.x) + step(gridCoord.x, lineWidth);
          float isLineY = step(1.0 - lineWidth, gridCoord.y) + step(gridCoord.y, lineWidth);
          float isLine = clamp(isLineX + isLineY, 0.0, 1.0);

          // Minimalist Ice & Diamond Palette (Deep slate -> Ice Cyan -> Diamond tip)
          vec3 valleyColor = vec3(0.18, 0.65, 0.95); // Crisp Ice Cyan
          vec3 ridgeColor  = vec3(0.85, 0.95, 1.00); // Diamond Silver

          vec3 baseGrid = mix(valleyColor, ridgeColor, clamp(vElevation * 0.35 + vSide * 0.4, 0.0, 1.0));

          // Center path subtle glow
          float roadStripe = (1.0 - smoothstep(0.0, 0.12, abs(vUv.x - 0.5))) * 0.25;

          // Horizon depth fade
          float depthFade = smoothstep(0.0, 0.38, vUv.y);

          vec3 finalColor = baseGrid * (isLine * 1.6 + 0.08) + vec3(0.4, 0.8, 1.0) * roadStripe;
          finalColor += vec3(0.05, 0.12, 0.2) * uBass;

          float alpha = (isLine * 0.85 + 0.12) * depthFade;

          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
      wireframe: false,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uBass: { value: 0 },
        uMid: { value: 0 },
      },
    });

    this.terrainMesh = new THREE.Mesh(terrainGeo, this.terrainMaterial);
    this.terrainMesh.position.set(0, -1.6, -4);
    this.group.add(this.terrainMesh);

    // 2. Minimalist Horizon Celestial Orb (Soft Halo Orb)
    const celestialGeo = new THREE.CircleGeometry(4.8, 64);
    this.celestialMaterial = new THREE.ShaderMaterial({
      vertexShader: `
        precision highp float;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;

        uniform float uTime;
        uniform float uBass;
        varying vec2 vUv;

        void main() {
          vec2 uv = vUv;
          float dist = length(uv - vec2(0.5));
          if (dist > 0.5) discard;

          // Minimalist monochromatic glow (Pure White core to Ice Cyan rim)
          float coreGlow = smoothstep(0.48, 0.05, dist);
          float rimGlow  = smoothstep(0.5, 0.35, dist);

          vec3 coreColor = vec3(1.0, 1.0, 1.0);
          vec3 rimColor  = vec3(0.35, 0.75, 1.0);

          vec3 color = mix(rimColor, coreColor, coreGlow);
          color += rimColor * (uBass * 0.3);

          float alpha = coreGlow * 0.85 + rimGlow * 0.35;
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uBass: { value: 0 },
      },
    });

    this.celestialMesh = new THREE.Mesh(celestialGeo, this.celestialMaterial);
    this.celestialMesh.position.set(0, 2.5, -24);
    this.group.add(this.celestialMesh);

    // 3. Diamond Starfield
    const starCount = 650;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      starPositions[i * 3] = (Math.random() - 0.5) * 50;
      starPositions[i * 3 + 1] = Math.random() * 16 + 0.5;
      starPositions[i * 3 + 2] = -Math.random() * 28 - 4;
    }
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xe2e8f0,
      size: 0.12,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });
    this.starfield = new THREE.Points(starGeo, starMat);
    this.group.add(this.starfield);

    // 4. Subtle Highway Center Dashes
    const dashCount = 20;
    const dashVerts = new Float32Array(dashCount * 6);
    const dashGeo = new THREE.BufferGeometry();
    for (let i = 0; i < dashCount; i++) {
      const z1 = -i * 2.2;
      const z2 = -i * 2.2 - 0.8;
      const idx = i * 6;
      dashVerts[idx] = 0; dashVerts[idx + 1] = -1.55; dashVerts[idx + 2] = z1;
      dashVerts[idx + 3] = 0; dashVerts[idx + 4] = -1.55; dashVerts[idx + 5] = z2;
    }
    dashGeo.setAttribute("position", new THREE.BufferAttribute(dashVerts, 3));
    const dashMat = new THREE.LineBasicMaterial({
      color: 0x7dd3fc,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      linewidth: 1.5,
    });
    this.highwayDashes = new THREE.LineSegments(dashGeo, dashMat);
    this.group.add(this.highwayDashes);
  }

  public update(elapsedTime: number, frequencyData: Uint8Array | null) {
    let bass = 0;
    let mid = 0;

    if (frequencyData && frequencyData.length > 0) {
      for (let i = 0; i < 16; i++) {
        bass += frequencyData[i];
      }
      bass = bass / (16 * 255);

      const midEnd = Math.min(128, frequencyData.length);
      for (let i = 16; i < midEnd; i++) {
        mid += frequencyData[i];
      }
      mid = mid / ((midEnd - 16) * 255);
    }

    this.terrainMaterial.uniforms.uTime.value = elapsedTime;
    this.terrainMaterial.uniforms.uBass.value = bass;
    this.terrainMaterial.uniforms.uMid.value = mid;

    this.celestialMaterial.uniforms.uTime.value = elapsedTime;
    this.celestialMaterial.uniforms.uBass.value = bass;
    const scale = 1.0 + bass * 0.12;
    this.celestialMesh.scale.set(scale, scale, 1);

    // Animate highway dashes along Z
    this.highwayDashes.position.z = (elapsedTime * 6.0) % 2.2;
  }

  public dispose() {
    this.terrainMesh.geometry.dispose();
    this.terrainMaterial.dispose();
    this.celestialMesh.geometry.dispose();
    this.celestialMaterial.dispose();
    this.starfield.geometry.dispose();
    (this.starfield.material as THREE.Material).dispose();
    this.highwayDashes.geometry.dispose();
    (this.highwayDashes.material as THREE.Material).dispose();
  }
}
