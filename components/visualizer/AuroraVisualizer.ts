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
      const trailSteps = new Float32Array(totalPoints);

      let idx = 0;
      for (let h = 0; h < TRAIL_STEPS; h++) {
        for (let p = 0; p < config.particleCount; p++) {
          positions[idx * 3] = 0;
          positions[idx * 3 + 1] = 0;
          positions[idx * 3 + 2] = 0;
          trailSteps[idx] = h;
          idx++;
        }
      }

      geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geom.setAttribute("trailStep", new THREE.BufferAttribute(trailSteps, 1));

      const mat = new THREE.ShaderMaterial({
        vertexShader: auroraVertexShader,
        fragmentShader: auroraFragmentShader,
        uniforms: {
          uTime: { value: 0 },
          uPixelRatio: { value: pixelRatio },
          uData: { value: new Array(2048).fill(0) },
          uParticleCount: { value: config.particleCount },
          uMorphT: { value: config.morphOffset },
          uTrailSteps: { value: TRAIL_STEPS },
          uColorA: { value: new THREE.Color(config.colorA) },
          uColorB: { value: new THREE.Color(config.colorB) },
          uGlowColor: { value: new THREE.Color(config.glowColor) },
          uAlphaBase: { value: config.alphaBase },
          uAlphaGlow: { value: config.alphaGlow },
          uAudioLevel: { value: 0 },
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

  public update(elapsedTime: number, frequencyData: Uint8Array | null, pixelRatio: number = 1) {
    let audioLevel = 0;
    if (frequencyData && frequencyData.length > 0) {
      let maxVal = 0;
      for (let i = 0; i < frequencyData.length; i++) {
        if (frequencyData[i] > maxVal) maxVal = frequencyData[i];
      }
      audioLevel = maxVal / 255;
    }
    audioLevel = Math.pow(audioLevel, 1.1) * 0.85 + 0.01;

    for (const layer of this.layers) {
      layer.morphT += layer.config.morphSpeed;
      if (layer.morphT > 3) layer.morphT -= 3;

      layer.material.uniforms.uTime.value = elapsedTime;
      layer.material.uniforms.uPixelRatio.value = pixelRatio;
      layer.material.uniforms.uMorphT.value = layer.morphT;
      layer.material.uniforms.uAudioLevel.value = audioLevel;

      if (frequencyData) {
        const uData = layer.material.uniforms.uData.value;
        const flen = frequencyData.length;
        for (let x = 0; x < layer.config.particleCount; x++) {
          uData[x] = frequencyData[x % flen] ?? 0;
        }
      }
    }
  }

  public dispose() {
    for (const layer of this.layers) {
      layer.points.geometry.dispose();
      layer.material.dispose();
    }
  }
}
