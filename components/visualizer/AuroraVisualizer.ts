import * as THREE from "three";
import {
  TRAIL_STEPS,
  auroraVertexShader,
  auroraFragmentShader,
} from "./shaders/auroraShader";

interface AuroraLayerConfig {
  particleCount: number;
  morphSpeed: number;
  morphOffset: number;
  colorA: string;
  colorB: string;
  glowColor: string;
  alphaBase: number;
  alphaGlow: number;
}

// Minimalist Arctic Ice & Moonlight Palette
const LAYERS_CONFIG: AuroraLayerConfig[] = [
  {
    particleCount: 1200,
    morphSpeed: 0.005,
    morphOffset: 0,
    colorA: "#38bdf8", // Arctic Ice Cyan
    colorB: "#ffffff", // Pure Diamond White
    glowColor: "#e0f2fe",
    alphaBase: 0.14,
    alphaGlow: 0.40,
  },
  {
    particleCount: 900,
    morphSpeed: 0.0038,
    morphOffset: 0.2,
    colorA: "#2dd4bf", // Soft Arctic Teal
    colorB: "#7dd3fc", // Pale Ice Blue
    glowColor: "#ccfbf1",
    alphaBase: 0.10,
    alphaGlow: 0.28,
  },
  {
    particleCount: 600,
    morphSpeed: 0.0032,
    morphOffset: 0.4,
    colorA: "#0284c7", // Deep Ice Blue
    colorB: "#f8fafc", // Moonlight White
    glowColor: "#e2e8f0",
    alphaBase: 0.08,
    alphaGlow: 0.22,
  },
];

interface AuroraLayer {
  points: THREE.Points;
  material: THREE.ShaderMaterial;
  config: AuroraLayerConfig;
  morphT: number;
}

export class AuroraVisualizer {
  public group: THREE.Group;
  private layers: AuroraLayer[] = [];

  constructor(pixelRatio: number = 1) {
    this.group = new THREE.Group();

    for (const config of LAYERS_CONFIG) {
      const geom = new THREE.BufferGeometry();
      const totalPoints = config.particleCount * TRAIL_STEPS;
      const positions = new Float32Array(totalPoints * 3);
      const posSphere = new Float32Array(totalPoints * 3);
      const posTorus = new Float32Array(totalPoints * 3);
      const posCube = new Float32Array(totalPoints * 3);
      const rands = new Float32Array(totalPoints * 3);
      const trailSteps = new Float32Array(totalPoints);

      // Precompute shape morph targets on CPU
      const baseRands: { r1: number; r2: number; r3: number }[] = [];
      for (let p = 0; p < config.particleCount; p++) {
        baseRands.push({
          r1: Math.random(),
          r2: Math.random(),
          r3: Math.random(),
        });
      }

      let idx = 0;
      for (let h = 0; h < TRAIL_STEPS; h++) {
        for (let p = 0; p < config.particleCount; p++) {
          const { r1, r2, r3 } = baseRands[p];
          const i3 = idx * 3;

          // 1. Sphere Shape
          const thetaS = r1 * Math.PI * 2;
          const phiS = Math.acos(2.0 * r2 - 1.0);
          const rS = 3.1 + 0.36 * Math.sin(r1 * Math.PI * 2);
          posSphere[i3]     = rS * Math.sin(phiS) * Math.cos(thetaS);
          posSphere[i3 + 1] = rS * Math.sin(phiS) * Math.sin(thetaS);
          posSphere[i3 + 2] = rS * Math.cos(phiS);

          // 2. Torus Shape
          const u = r1 * Math.PI * 2;
          const v = r2 * Math.PI * 2;
          const R = 2.15;
          const r = 1.0 + 0.28 * Math.sin(r2 * 5.23);
          posTorus[i3]     = (R + r * Math.cos(v)) * Math.cos(u);
          posTorus[i3 + 1] = (R + r * Math.cos(v)) * Math.sin(u);
          posTorus[i3 + 2] = r * Math.sin(v);

          // 3. Cube Shape
          const side = 3.0;
          posCube[i3]     = (r1 - 0.5) * side * 2.0;
          posCube[i3 + 1] = (r2 - 0.5) * side * 2.0;
          posCube[i3 + 2] = (r3 - 0.5) * side * 2.0;

          rands[i3]     = r1;
          rands[i3 + 1] = r2;
          rands[i3 + 2] = r3;

          trailSteps[idx] = h;
          idx++;
        }
      }

      geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geom.setAttribute("aPosSphere", new THREE.BufferAttribute(posSphere, 3));
      geom.setAttribute("aPosTorus", new THREE.BufferAttribute(posTorus, 3));
      geom.setAttribute("aPosCube", new THREE.BufferAttribute(posCube, 3));
      geom.setAttribute("aRand", new THREE.BufferAttribute(rands, 3));
      geom.setAttribute("trailStep", new THREE.BufferAttribute(trailSteps, 1));

      const mat = new THREE.ShaderMaterial({
        vertexShader: auroraVertexShader,
        fragmentShader: auroraFragmentShader,
        uniforms: {
          uTime: { value: 0 },
          uPixelRatio: { value: pixelRatio },
          uMorphT: { value: config.morphOffset },
          uBass: { value: 0 },
          uMid: { value: 0 },
          uAudioLevel: { value: 0 },
          uTrailSteps: { value: TRAIL_STEPS },
          uColorA: { value: new THREE.Color(config.colorA) },
          uColorB: { value: new THREE.Color(config.colorB) },
          uGlowColor: { value: new THREE.Color(config.glowColor) },
          uAlphaBase: { value: config.alphaBase },
          uAlphaGlow: { value: config.alphaGlow },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });

      const points = new THREE.Points(geom, mat);
      this.group.add(points);
      this.layers.push({
        points,
        material: mat,
        config,
        morphT: config.morphOffset,
      });
    }
  }

  public update(
    elapsedTime: number,
    frequencyData: Uint8Array | null,
    pixelRatio: number = 1
  ) {
    let bass = 0;
    let mid = 0;
    let audioLevel = 0;

    if (frequencyData && frequencyData.length > 0) {
      const len = frequencyData.length;
      const bassBins = Math.min(16, len);
      for (let i = 0; i < bassBins; i++) {
        bass += frequencyData[i];
      }
      bass = bass / (bassBins * 255);

      const midBins = Math.min(128, len);
      for (let i = bassBins; i < midBins; i++) {
        mid += frequencyData[i];
      }
      mid = mid / (Math.max(1, midBins - bassBins) * 255);

      for (let i = 0; i < len; i++) {
        audioLevel += frequencyData[i];
      }
      audioLevel = audioLevel / (len * 255);
    }

    for (const layer of this.layers) {
      layer.morphT += layer.config.morphSpeed;
      if (layer.morphT > 3) layer.morphT -= 3;

      layer.material.uniforms.uTime.value = elapsedTime;
      layer.material.uniforms.uPixelRatio.value = pixelRatio;
      layer.material.uniforms.uMorphT.value = layer.morphT;
      layer.material.uniforms.uBass.value = Math.pow(bass, 1.2) * 1.1;
      layer.material.uniforms.uMid.value = mid;
      layer.material.uniforms.uAudioLevel.value = audioLevel;
    }
  }

  public dispose() {
    for (const layer of this.layers) {
      layer.points.geometry.dispose();
      layer.material.dispose();
    }
  }
}

