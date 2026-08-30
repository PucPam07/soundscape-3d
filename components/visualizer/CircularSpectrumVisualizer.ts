import * as THREE from "three";

export class CircularSpectrumVisualizer {
  public group: THREE.Group;

  // 1. Primary Equalizer Pillars & Floating Laser Peak Caps
  private barCount = 120;
  private radius = 3.6;
  private barInstancedMesh: THREE.InstancedMesh;
  private mirrorInstancedMesh: THREE.InstancedMesh; // Floor glass reflection
  private peakInstancedMesh: THREE.InstancedMesh;
  private dummy: THREE.Object3D;

  private barData: {
    angle: number;
    freqBin: number;
    currentHeight: number;
    targetHeight: number;
    peakHeight: number;
    peakVelocity: number;
  }[] = [];

  // 2. Quantum Gyroscope Core
  private coreGroup: THREE.Group;
  private innerCrystalMesh: THREE.Mesh;
  private innerCrystalWire: THREE.LineSegments;
  private gyroRing1: THREE.Line;
  private gyroRing2: THREE.Line;
  private gyroRing3: THREE.Line;
  private gyroNodes: THREE.Points;

  // 3. Holographic Dark-Glass Radial Pedestal Floor
  private floorGroup: THREE.Group;
  private floorDisc: THREE.Mesh;
  private floorRings: THREE.Line[];
  private floorSpokes: THREE.LineSegments;
  private compassTicks: THREE.LineSegments;

  // 4. Acoustic Expanding Bass Shockwaves
  private shockwaveA: THREE.Line;
  private shockwaveB: THREE.Line;

  // 5. Silky Stardust Vortex Particles
  private stardust: THREE.Points;
  private stardustMat: THREE.ShaderMaterial;
  private readonly stardustCount = 450;

  constructor() {
    this.group = new THREE.Group();
    this.dummy = new THREE.Object3D();

    // ====================================================
    // 1. EQUALIZER PILLARS (Top + Mirrored Floor Reflection)
    // ====================================================
    const barWidth = 0.08;
    const barGeo = new THREE.CylinderGeometry(barWidth, barWidth, 1.0, 8);
    barGeo.translate(0, 0.5, 0); // anchor base at y = 0

    const barMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      toneMapped: false,
    });

    this.barInstancedMesh = new THREE.InstancedMesh(barGeo, barMat, this.barCount);
    this.barInstancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    // Mirrored Floor Reflection (hanging downwards from y = 0)
    const mirrorGeo = new THREE.CylinderGeometry(barWidth, barWidth, 1.0, 8);
    mirrorGeo.translate(0, -0.5, 0);
    const mirrorMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.22,
      toneMapped: false,
      blending: THREE.AdditiveBlending,
    });
    this.mirrorInstancedMesh = new THREE.InstancedMesh(mirrorGeo, mirrorMat, this.barCount);
    this.mirrorInstancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    // Floating Peak Laser Caps
    const peakGeo = new THREE.CylinderGeometry(barWidth * 1.3, barWidth * 1.3, 0.04, 8);
    const peakMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      toneMapped: false,
    });
    this.peakInstancedMesh = new THREE.InstancedMesh(peakGeo, peakMat, this.barCount);
    this.peakInstancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    const color = new THREE.Color();
    for (let i = 0; i < this.barCount; i++) {
      const angle = (i / this.barCount) * Math.PI * 2;
      const freqBin = Math.floor(Math.pow(i / this.barCount, 1.35) * 190);

      this.barData.push({
        angle,
        freqBin,
        currentHeight: 0.2,
        targetHeight: 0.2,
        peakHeight: 0.25,
        peakVelocity: 0,
      });

      color.setHex(0x38bdf8);
      this.barInstancedMesh.setColorAt(i, color);
      this.mirrorInstancedMesh.setColorAt(i, new THREE.Color(0x0284c7));
      this.peakInstancedMesh.setColorAt(i, new THREE.Color(0xffffff));
    }

    if (this.barInstancedMesh.instanceColor) this.barInstancedMesh.instanceColor.needsUpdate = true;
    if (this.mirrorInstancedMesh.instanceColor) this.mirrorInstancedMesh.instanceColor.needsUpdate = true;
    if (this.peakInstancedMesh.instanceColor) this.peakInstancedMesh.instanceColor.needsUpdate = true;

    this.group.add(this.barInstancedMesh);
    this.group.add(this.mirrorInstancedMesh);
    this.group.add(this.peakInstancedMesh);

    // ====================================================
    // 2. QUANTUM GYROSCOPE CORE
    // ====================================================
    this.coreGroup = new THREE.Group();

    // Central Faceted Crystal Gem
    const gemGeo = new THREE.OctahedronGeometry(0.7, 1);
    const gemMat = new THREE.MeshBasicMaterial({
      color: 0x0f172a,
      transparent: true,
      opacity: 0.65,
    });
    this.innerCrystalMesh = new THREE.Mesh(gemGeo, gemMat);
    this.coreGroup.add(this.innerCrystalMesh);

    const gemEdges = new THREE.EdgesGeometry(gemGeo);
    const gemWireMat = new THREE.LineBasicMaterial({
      color: 0x7dd3fc,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });
    this.innerCrystalWire = new THREE.LineSegments(gemEdges, gemWireMat);
    this.coreGroup.add(this.innerCrystalWire);

    // 3 Concentric Gimbal Rings
    const createGyroRing = (r: number, colorHex: number, opacity: number) => {
      const segs = 80;
      const pts: THREE.Vector3[] = [];
      for (let j = 0; j <= segs; j++) {
        const theta = (j / segs) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(theta) * r, Math.sin(theta) * r, 0));
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

    this.gyroRing1 = createGyroRing(1.6, 0xe2e8f0, 0.55); // Diamond Silver
    this.gyroRing2 = createGyroRing(1.3, 0x38bdf8, 0.50); // Ice Cyan
    this.gyroRing3 = createGyroRing(1.0, 0x94a3b8, 0.40); // Platinum

    this.coreGroup.add(this.gyroRing1);
    this.coreGroup.add(this.gyroRing2);
    this.coreGroup.add(this.gyroRing3);

    // Gimbal Cardinal Nodes
    const nodePts = [
      new THREE.Vector3(1.6, 0, 0), new THREE.Vector3(-1.6, 0, 0),
      new THREE.Vector3(0, 1.6, 0), new THREE.Vector3(0, -1.6, 0),
      new THREE.Vector3(1.3, 0, 0), new THREE.Vector3(-1.3, 0, 0),
    ];
    const nodeGeo = new THREE.BufferGeometry().setFromPoints(nodePts);
    const nodeMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.12,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });
    this.gyroNodes = new THREE.Points(nodeGeo, nodeMat);
    this.coreGroup.add(this.gyroNodes);

    this.group.add(this.coreGroup);

    // ====================================================
    // 3. HOLOGRAPHIC DARK-GLASS RADAR PEDESTAL
    // ====================================================
    this.floorGroup = new THREE.Group();

    // Dark-glass circular base disk
    const discGeo = new THREE.CircleGeometry(4.8, 64);
    discGeo.rotateX(-Math.PI / 2);
    const discMat = new THREE.MeshBasicMaterial({
      color: 0x060913,
      transparent: true,
      opacity: 0.5,
    });
    this.floorDisc = new THREE.Mesh(discGeo, discMat);
    this.floorDisc.position.y = -0.01;
    this.floorGroup.add(this.floorDisc);

    // Concentric base dials
    this.floorRings = [1.6, 2.6, 3.6, 4.6].map((r, idx) => {
      const segs = 96;
      const pts: THREE.Vector3[] = [];
      for (let j = 0; j <= segs; j++) {
        const theta = (j / segs) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(theta) * r, 0, Math.sin(theta) * r));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const mat = new THREE.LineBasicMaterial({
        color: idx === 2 ? 0x38bdf8 : 0x1e293b,
        transparent: true,
        opacity: idx === 2 ? 0.6 : 0.35,
        blending: THREE.AdditiveBlending,
      });
      const ring = new THREE.Line(geo, mat);
      this.floorGroup.add(ring);
      return ring;
    });

    // Radial compass spokes
    const spokeCount = 32;
    const spokePoints: number[] = [];
    for (let s = 0; s < spokeCount; s++) {
      const a = (s / spokeCount) * Math.PI * 2;
      spokePoints.push(
        Math.cos(a) * 0.6, 0, Math.sin(a) * 0.6,
        Math.cos(a) * 4.7, 0, Math.sin(a) * 4.7
      );
    }
    const spokeGeo = new THREE.BufferGeometry();
    spokeGeo.setAttribute("position", new THREE.Float32BufferAttribute(spokePoints, 3));
    const spokeMat = new THREE.LineBasicMaterial({
      color: 0x1e293b,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending,
    });
    this.floorSpokes = new THREE.LineSegments(spokeGeo, spokeMat);
    this.floorGroup.add(this.floorSpokes);

    // Outer compass tick marks
    const tickCount = 64;
    const tickPoints: number[] = [];
    for (let k = 0; k < tickCount; k++) {
      const a = (k / tickCount) * Math.PI * 2;
      const isMajor = k % 4 === 0;
      const innerR = isMajor ? 4.4 : 4.52;
      const outerR = 4.65;
      tickPoints.push(
        Math.cos(a) * innerR, 0, Math.sin(a) * innerR,
        Math.cos(a) * outerR, 0, Math.sin(a) * outerR
      );
    }
    const tickGeo = new THREE.BufferGeometry();
    tickGeo.setAttribute("position", new THREE.Float32BufferAttribute(tickPoints, 3));
    const tickMat = new THREE.LineBasicMaterial({
      color: 0x7dd3fc,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
    });
    this.compassTicks = new THREE.LineSegments(tickGeo, tickMat);
    this.floorGroup.add(this.compassTicks);

    this.group.add(this.floorGroup);

    // ====================================================
    // 4. ACOUSTIC EXPANDING BASS SHOCKWAVES
    // ====================================================
    const createShockwave = () => {
      const segs = 72;
      const pts: THREE.Vector3[] = [];
      for (let j = 0; j <= segs; j++) {
        const theta = (j / segs) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(theta), 0.02, Math.sin(theta)));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const mat = new THREE.LineBasicMaterial({
        color: 0x7dd3fc,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
      });
      return new THREE.Line(geo, mat);
    };

    this.shockwaveA = createShockwave();
    this.shockwaveB = createShockwave();
    this.group.add(this.shockwaveA);
    this.group.add(this.shockwaveB);

    // ====================================================
    // 5. SILKY STARDUST VORTEX PARTICLES
    // ====================================================
    const sPositions = new Float32Array(this.stardustCount * 3);
    const sRand = new Float32Array(this.stardustCount);
    const sRadius = new Float32Array(this.stardustCount);

    for (let i = 0; i < this.stardustCount; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 0.8 + Math.pow(Math.random(), 1.2) * 3.8;
      const y = Math.random() * 3.8;

      sPositions[i * 3] = Math.cos(a) * r;
      sPositions[i * 3 + 1] = y;
      sPositions[i * 3 + 2] = Math.sin(a) * r;

      sRand[i] = Math.random();
      sRadius[i] = r;
    }

    const sGeo = new THREE.BufferGeometry();
    sGeo.setAttribute("position", new THREE.BufferAttribute(sPositions, 3));
    sGeo.setAttribute("aRand", new THREE.BufferAttribute(sRand, 1));
    sGeo.setAttribute("aRadius", new THREE.BufferAttribute(sRadius, 1));

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

          float speed = 0.15 + aRand * 0.25;
          float baseAngle = atan(position.z, position.x);
          float angle = baseAngle + uTime * speed;
          float r = aRadius * (1.0 + uBass * 0.08);

          // Gentle vertical spiral rise
          float yPos = mod(position.y + uTime * (0.3 + aRand * 0.4) + uBass * 1.5, 4.2);

          vec3 pos = vec3(
            cos(angle) * r,
            yPos,
            sin(angle) * r
          );

          vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPos;

          float baseSize = 12.0 + aRand * 12.0 + uBass * 10.0;
          gl_PointSize = clamp(baseSize / -mvPos.z, 1.5, 7.0);
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
          float twinkle = 0.7 + 0.3 * sin(uTime * 3.0 + vRand * 25.0);

          vec3 starColor = mix(vec3(0.65, 0.88, 1.0), vec3(1.0, 1.0, 1.0), vRand);
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

    this.stardust = new THREE.Points(sGeo, this.stardustMat);
    this.group.add(this.stardust);

    // Initial subtle 3D tilt
    this.group.rotation.x = 0.52;
  }

  public update(elapsedTime: number, frequencyData: Uint8Array | null) {
    const data = frequencyData || new Uint8Array(256);
    const dataLen = data.length || 1;

    let bass = 0;
    let hasAudio = false;
    for (let i = 0; i < 16; i++) {
      bass += data[i];
      if (data[i] > 5) hasAudio = true;
    }
    bass = bass / (16 * 255);

    const baseColor = new THREE.Color(0x0284c7); // Deep Arctic Cyan
    const midColor  = new THREE.Color(0x38bdf8); // Brilliant Ice Cyan
    const tipColor  = new THREE.Color(0xffffff); // Diamond White
    const barColor = new THREE.Color();

    // 1. Update Equalizer Pillars & Mirrored Floor Reflection
    for (let i = 0; i < this.barCount; i++) {
      const b = this.barData[i];
      const rawVal = (data[b.freqBin % dataLen] || 0) / 255;

      // Graceful living idle wave when music is quiet/paused
      const idleWave = Math.sin(b.angle * 4.0 + elapsedTime * 2.2) * 0.15
                     + Math.cos(b.angle * 6.0 - elapsedTime * 1.5) * 0.10
                     + 0.22;

      const audioHeight = Math.pow(rawVal, 1.3) * 4.2;
      b.targetHeight = hasAudio ? Math.max(0.15, audioHeight) : idleWave;
      b.currentHeight += (b.targetHeight - b.currentHeight) * 0.35;

      // Physics-driven Floating Peak Caps
      if (b.currentHeight >= b.peakHeight) {
        b.peakHeight = b.currentHeight + 0.06;
        b.peakVelocity = 0;
      } else {
        b.peakVelocity += 0.007; // gentle gravity fall
        b.peakHeight = Math.max(0.12, b.peakHeight - b.peakVelocity);
      }

      const x = Math.cos(b.angle) * this.radius;
      const z = Math.sin(b.angle) * this.radius;

      // Upright Pillar
      this.dummy.position.set(x, 0, z);
      this.dummy.rotation.set(0, -b.angle, 0);
      this.dummy.scale.set(1, b.currentHeight, 1);
      this.dummy.updateMatrix();
      this.barInstancedMesh.setMatrixAt(i, this.dummy.matrix);

      // Mirrored Floor Reflection Pillar
      this.dummy.scale.set(1, b.currentHeight * 0.7, 1);
      this.dummy.updateMatrix();
      this.mirrorInstancedMesh.setMatrixAt(i, this.dummy.matrix);

      // Floating Peak Cap
      this.dummy.position.set(x, b.peakHeight, z);
      this.dummy.scale.set(1, 1, 1);
      this.dummy.updateMatrix();
      this.peakInstancedMesh.setMatrixAt(i, this.dummy.matrix);

      // Color Gradient from Base to Tip
      const intensity = Math.min(1.0, b.currentHeight / 3.2);
      if (intensity < 0.5) {
        barColor.copy(baseColor).lerp(midColor, intensity / 0.5);
      } else {
        barColor.copy(midColor).lerp(tipColor, (intensity - 0.5) / 0.5);
      }
      this.barInstancedMesh.setColorAt(i, barColor);
    }

    if (this.barInstancedMesh.instanceMatrix) this.barInstancedMesh.instanceMatrix.needsUpdate = true;
    if (this.barInstancedMesh.instanceColor) this.barInstancedMesh.instanceColor.needsUpdate = true;
    if (this.mirrorInstancedMesh.instanceMatrix) this.mirrorInstancedMesh.instanceMatrix.needsUpdate = true;
    if (this.peakInstancedMesh.instanceMatrix) this.peakInstancedMesh.instanceMatrix.needsUpdate = true;

    // 2. Rotate Quantum Gyroscope Core
    this.gyroRing1.rotation.x = elapsedTime * 0.4;
    this.gyroRing1.rotation.y = elapsedTime * 0.2;

    this.gyroRing2.rotation.y = -elapsedTime * 0.5;
    this.gyroRing2.rotation.z = elapsedTime * 0.3;

    this.gyroRing3.rotation.x = -elapsedTime * 0.3;
    this.gyroRing3.rotation.z = -elapsedTime * 0.6;

    const coreScale = 1.0 + bass * 0.25;
    this.innerCrystalMesh.scale.set(coreScale, coreScale, coreScale);
    this.innerCrystalWire.scale.set(coreScale, coreScale, coreScale);
    this.innerCrystalMesh.rotation.y = elapsedTime * 0.3;
    this.innerCrystalWire.rotation.y = elapsedTime * 0.3;

    // Core levitation bobbing
    this.coreGroup.position.y = Math.sin(elapsedTime * 1.6) * 0.12 + 0.15;

    // 3. Rotate Floor Compass
    this.compassTicks.rotation.y = elapsedTime * 0.05;
    this.floorSpokes.rotation.y = -elapsedTime * 0.02;

    // 4. Acoustic Bass Expanding Shockwaves
    const waveProgressA = (elapsedTime * 1.5) % 1.0;
    const scaleA = 0.5 + waveProgressA * 4.8;
    this.shockwaveA.scale.set(scaleA, scaleA, scaleA);
    (this.shockwaveA.material as THREE.LineBasicMaterial).opacity =
      (1.0 - waveProgressA) * (0.35 + bass * 0.5);

    const waveProgressB = ((elapsedTime * 1.5) + 0.5) % 1.0;
    const scaleB = 0.5 + waveProgressB * 4.8;
    this.shockwaveB.scale.set(scaleB, scaleB, scaleB);
    (this.shockwaveB.material as THREE.LineBasicMaterial).opacity =
      (1.0 - waveProgressB) * (0.35 + bass * 0.5);

    // 5. Update Stardust
    this.stardustMat.uniforms.uTime.value = elapsedTime;
    this.stardustMat.uniforms.uBass.value = bass;

    // 6. Visualizer slow orbit rotation
    this.group.rotation.y = elapsedTime * 0.06;
  }

  public dispose() {
    this.barInstancedMesh.geometry.dispose();
    (this.barInstancedMesh.material as THREE.Material).dispose();

    this.mirrorInstancedMesh.geometry.dispose();
    (this.mirrorInstancedMesh.material as THREE.Material).dispose();

    this.peakInstancedMesh.geometry.dispose();
    (this.peakInstancedMesh.material as THREE.Material).dispose();

    this.innerCrystalMesh.geometry.dispose();
    (this.innerCrystalMesh.material as THREE.Material).dispose();
    this.innerCrystalWire.geometry.dispose();
    (this.innerCrystalWire.material as THREE.Material).dispose();

    this.gyroRing1.geometry.dispose();
    (this.gyroRing1.material as THREE.Material).dispose();
    this.gyroRing2.geometry.dispose();
    (this.gyroRing2.material as THREE.Material).dispose();
    this.gyroRing3.geometry.dispose();
    (this.gyroRing3.material as THREE.Material).dispose();
    this.gyroNodes.geometry.dispose();
    (this.gyroNodes.material as THREE.Material).dispose();

    this.floorDisc.geometry.dispose();
    (this.floorDisc.material as THREE.Material).dispose();
    this.floorRings.forEach((r) => {
      r.geometry.dispose();
      (r.material as THREE.Material).dispose();
    });
    this.floorSpokes.geometry.dispose();
    (this.floorSpokes.material as THREE.Material).dispose();
    this.compassTicks.geometry.dispose();
    (this.compassTicks.material as THREE.Material).dispose();

    this.shockwaveA.geometry.dispose();
    (this.shockwaveA.material as THREE.Material).dispose();
    this.shockwaveB.geometry.dispose();
    (this.shockwaveB.material as THREE.Material).dispose();

    this.stardust.geometry.dispose();
    this.stardustMat.dispose();
  }
}
