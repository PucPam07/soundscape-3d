import * as THREE from "three";
import {
  PARTICLE_COUNT,
  DATA_SIZE,
  particleCloudVertexShader,
  particleCloudFragmentShader,
} from "./shaders/particleCloudShader";

export class ParticleCloudVisualizer {
  public group: THREE.Group;
  private points: THREE.Points;
  private material: THREE.ShaderMaterial;

  constructor() {
    this.group = new THREE.Group();

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const indices = new Float32Array(PARTICLE_COUNT);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;
      indices[i] = i;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("idx", new THREE.BufferAttribute(indices, 1));

    this.material = new THREE.ShaderMaterial({
      vertexShader: particleCloudVertexShader,
      fragmentShader: particleCloudFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uData: { value: new Array(DATA_SIZE).fill(0) },
        uParticleCount: { value: PARTICLE_COUNT },
        uIntensity: { value: 1 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.points = new THREE.Points(geometry, this.material);
    this.group.add(this.points);
  }

  public update(elapsedTime: number, frequencyData: Uint8Array | null) {
    this.material.uniforms.uTime.value = elapsedTime;
    if (frequencyData) {
      for (let i = 0; i < DATA_SIZE; i++) {
        this.material.uniforms.uData.value[i] =
          frequencyData[i % frequencyData.length] ?? 0;
      }
    }
  }

  public dispose() {
    this.points.geometry.dispose();
    this.material.dispose();
  }
}
