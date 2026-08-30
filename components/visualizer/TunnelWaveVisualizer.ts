import * as THREE from "three";

interface WarpStreak {
  x: number;
  y: number;
  z: number;
  speed: number;
}

export class TunnelWaveVisualizer {
  public group: THREE.Group;
  private ringsCount = 32;
  private segments = 64;
  private baseRadius = 2.6;
  private tunnelLength = 24;
  private tunnelSpeed = 2.8;

  private ringData: { baseTheta: number; baseRadius: number; ringIndex: number }[][];
  private geometries: THREE.BufferGeometry[];
  private lines: THREE.Line[];

  // Longitudinal laser grid lines (Tunnel skeleton)
  private longitudinalGeos: THREE.BufferGeometry[];
  private longitudinalLines: THREE.Line[];
  private longLineCount = 16;

  // Starlight speed streak points
  private streaks: WarpStreak[] = [];
  private streakPoints: THREE.Points;
  private streakCount = 60;

  // Minimalist Vanishing Point Halo
  private horizonHalo: THREE.Line;
  private horizonCore: THREE.Mesh;

  constructor() {
    this.group = new THREE.Group();

    // 1. Concentric Tunnel Wave Rings
    this.ringData = Array.from({ length: this.ringsCount }, (_, f) =>
      Array.from({ length: this.segments }, (_, p) => ({
        baseTheta: (p / this.segments) * Math.PI * 2,
        baseRadius: this.baseRadius + f * 0.015,
        ringIndex: f,
      }))
    );

    this.geometries = Array.from({ length: this.ringsCount }, () => new THREE.BufferGeometry());

    this.lines = this.geometries.map((geom, f) => {
      const mat = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: Math.max(0.12, 0.95 - f * 0.027),
        blending: THREE.AdditiveBlending,
      });
      const line = new THREE.Line(geom, mat);
      this.group.add(line);
      return line;
    });

    // 2. Longitudinal Perspective Grid Lines
    this.longitudinalGeos = Array.from({ length: this.longLineCount }, () => new THREE.BufferGeometry());
    this.longitudinalLines = this.longitudinalGeos.map(() => {
      const mat = new THREE.LineBasicMaterial({
        color: 0x38bdf8, // Soft Ice Cyan
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending,
      });
      const line = new THREE.Line(this.longitudinalGeos[0], mat);
      this.group.add(line);
      return line;
    });

    // 3. Minimalist Horizon Halo at Vanishing Point
    const haloPts: THREE.Vector3[] = [];
    for (let i = 0; i <= 64; i++) {
      const theta = (i / 64) * Math.PI * 2;
      haloPts.push(new THREE.Vector3(Math.cos(theta) * 0.9, Math.sin(theta) * 0.9, 0));
    }
    const haloGeo = new THREE.BufferGeometry().setFromPoints(haloPts);
    const haloMat = new THREE.LineBasicMaterial({
      color: 0x7dd3fc,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
    });
    this.horizonHalo = new THREE.Line(haloGeo, haloMat);
    this.horizonHalo.position.z = -this.tunnelLength * 0.75;
    this.group.add(this.horizonHalo);

    const horizonCoreGeo = new THREE.SphereGeometry(0.2, 16, 16);
    const horizonCoreMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });
    this.horizonCore = new THREE.Mesh(horizonCoreGeo, horizonCoreMat);
    this.horizonCore.position.z = -this.tunnelLength * 0.75;
    this.group.add(this.horizonCore);

    // 4. Starlight Speed Streak Points (Fine diamond particles)
    const streakGeo = new THREE.BufferGeometry();
    const streakPositions = new Float32Array(this.streakCount * 3);

    for (let i = 0; i < this.streakCount; i++) {
      const x = (Math.random() - 0.5) * 4.0;
      const y = (Math.random() - 0.5) * 4.0;
      const z = -Math.random() * this.tunnelLength;

      streakPositions[i * 3] = x;
      streakPositions[i * 3 + 1] = y;
      streakPositions[i * 3 + 2] = z;

      this.streaks.push({
        x,
        y,
        z,
        speed: 0.25 + Math.random() * 0.2,
      });
    }

    streakGeo.setAttribute("position", new THREE.BufferAttribute(streakPositions, 3));
    const streakMat = new THREE.PointsMaterial({
      color: 0xe2e8f0, // Diamond Silver
      size: 0.08,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });
    this.streakPoints = new THREE.Points(streakGeo, streakMat);
    this.group.add(this.streakPoints);
  }

  public update(elapsedTime: number, frequencyData: Uint8Array | null) {
    const data = frequencyData || new Uint8Array(256);
    const dataLen = data.length || 1;

    let bass = 0;
    for (let i = 0; i < 16; i++) {
      bass += data[i];
    }
    bass = bass / (16 * 255);

    const ringPositionsCache: number[][][] = [];

    // Monochromatic Palette: Ice Cyan -> Diamond White
    const colorA = new THREE.Color(0x38bdf8); // Ice Cyan
    const colorB = new THREE.Color(0xffffff); // Diamond White
    const colorC = new THREE.Color(0x1e293b); // Deep Slate for distant rings

    for (let h = 0; h < this.ringsCount; h++) {
      const p =
        -((elapsedTime * this.tunnelSpeed + h * (this.tunnelLength / this.ringsCount)) %
          this.tunnelLength) +
        this.tunnelLength * 0.35;

      const g = Math.floor((1 - h / this.ringsCount) * (dataLen - 1));
      const positions: number[] = [];
      const colors: number[] = [];
      const currentRingVerts: number[][] = [];

      const depthFactor = 1.0 - h / this.ringsCount;
      const waveOffset = Math.sin(elapsedTime * 0.5 + h * 0.1) * 0.18 * depthFactor;

      for (let m = 0; m <= this.segments; m++) {
        const segIdx = m % this.segments;
        const { baseTheta: C, baseRadius: R } = this.ringData[h][segIdx];
        const E = Math.floor((segIdx / this.segments) * (dataLen - 1));
        const D = data[E] / 255;
        const U = (data[g] + data[E]) / 510;
        const N = D * 0.8 + U * 0.4;

        // Smooth wave undulation
        const P =
          Math.sin(C * 4.0 + elapsedTime * 2.2 + h * 0.3) * 0.16 +
          Math.cos(C * 6.0 - elapsedTime * 1.4 - h * 0.4) * 0.10 +
          Math.sin(C * 2.0 + elapsedTime * 0.7) * 0.08 * D;

        const B = waveOffset * Math.sin(C * 3.0 + elapsedTime * 0.6);
        const radius = R + P + N + B + bass * 0.65 * depthFactor;

        const posX = Math.cos(C) * radius;
        const posY = Math.sin(C) * radius;
        const posZ = p;
        positions.push(posX, posY, posZ);
        currentRingVerts.push([posX, posY, posZ]);

        // Clean Monochrome / Ice Cyan Gradient
        const vertColor = colorA.clone();
        vertColor.lerp(colorB, D * 0.8 + bass * 0.3);
        vertColor.lerp(colorC, (1.0 - depthFactor) * 0.5);

        colors.push(vertColor.r, vertColor.g, vertColor.b);
      }

      ringPositionsCache.push(currentRingVerts);

      this.geometries[h].setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
      this.geometries[h].setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
      this.geometries[h].computeBoundingSphere();
    }

    // Update Longitudinal Grid Lines connecting across rings
    for (let l = 0; l < this.longLineCount; l++) {
      const segIndex = Math.floor((l / this.longLineCount) * this.segments);
      const longPositions: number[] = [];
      for (let h = 0; h < this.ringsCount; h++) {
        const pt = ringPositionsCache[h]?.[segIndex];
        if (pt) {
          longPositions.push(pt[0], pt[1], pt[2]);
        }
      }
      this.longitudinalGeos[l]?.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(longPositions, 3)
      );
    }

    // Pulse Horizon Core & Halo
    const haloScale = 1.0 + bass * 0.35 + Math.sin(elapsedTime * 2.5) * 0.05;
    this.horizonHalo.scale.set(haloScale, haloScale, 1);
    this.horizonHalo.rotation.z = elapsedTime * 0.4;
    this.horizonCore.scale.set(1.0 + bass * 0.4, 1.0 + bass * 0.4, 1.0);

    // Update Warp Streak Points
    const streakPosAttr = this.streakPoints.geometry.getAttribute("position") as THREE.BufferAttribute;
    const streakPosArr = streakPosAttr.array as Float32Array;

    for (let i = 0; i < this.streakCount; i++) {
      const s = this.streaks[i];
      s.z += s.speed + bass * 0.25;
      if (s.z > 7) {
        s.z = -this.tunnelLength * 0.9;
        s.x = (Math.random() - 0.5) * 4.0;
        s.y = (Math.random() - 0.5) * 4.0;
      }
      streakPosArr[i * 3] = s.x;
      streakPosArr[i * 3 + 1] = s.y;
      streakPosArr[i * 3 + 2] = s.z;
    }
    streakPosAttr.needsUpdate = true;
  }

  public dispose() {
    this.geometries.forEach((g) => g.dispose());
    this.lines.forEach((l) => (l.material as THREE.Material).dispose());
    this.longitudinalGeos.forEach((g) => g.dispose());
    this.longitudinalLines.forEach((l) => (l.material as THREE.Material).dispose());
    this.horizonHalo.geometry.dispose();
    (this.horizonHalo.material as THREE.Material).dispose();
    this.horizonCore.geometry.dispose();
    (this.horizonCore.material as THREE.Material).dispose();
    this.streakPoints.geometry.dispose();
    (this.streakPoints.material as THREE.Material).dispose();
  }
}
