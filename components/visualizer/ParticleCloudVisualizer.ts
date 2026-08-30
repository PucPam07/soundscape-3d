import * as THREE from "three";
import {
  PARTICLE_COUNT,
  particleCloudVertexShader,
  particleCloudFragmentShader,
} from "./shaders/particleCloudShader";

export class ParticleCloudVisualizer {
  public group: THREE.Group;
  private points: THREE.Points;
  private material: THREE.ShaderMaterial;

  constructor(pixelRatio: number = 1) {
    this.group = new THREE.Group();

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const randomness = new Float32Array(PARTICLE_COUNT * 3);
    const scales = new Float32Array(PARTICLE_COUNT);
    const freqs = new Float32Array(PARTICLE_COUNT);
    const speeds = new Float32Array(PARTICLE_COUNT);

    const baseSphereRadius = 3.2;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;

      // Spherical distribution with dense core and expansive nebula halo
      const r = Math.pow(Math.random(), 0.75) * baseSphereRadius + 0.4;
      const phi = Math.acos(2.0 * Math.random() - 1.0); // uniform polar angle [0, PI]
      const theta = Math.random() * Math.PI * 2;        // azimuthal angle [0, 2PI]

      const sinPhi = Math.sin(phi);
      positions[i3]     = r * sinPhi * Math.cos(theta);
      positions[i3 + 1] = r * Math.cos(phi);
      positions[i3 + 2] = r * sinPhi * Math.sin(theta);

      randomness[i3]     = Math.random();
      randomness[i3 + 1] = Math.random();
      randomness[i3 + 2] = Math.random();

      scales[i] = Math.random() * 1.4 + 0.6;
      freqs[i]  = Math.random();
      speeds[i] = (Math.random() - 0.5) * 1.6 + 0.8;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("aRandom", new THREE.BufferAttribute(randomness, 3));
    geometry.setAttribute("aScale", new THREE.BufferAttribute(scales, 1));
    geometry.setAttribute("aFreq", new THREE.BufferAttribute(freqs, 1));
    geometry.setAttribute("aSpeed", new THREE.BufferAttribute(speeds, 1));

    this.material = new THREE.ShaderMaterial({
      vertexShader: particleCloudVertexShader,
      fragmentShader: particleCloudFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uBass: { value: 0 },
        uMid: { value: 0 },
        uTreble: { value: 0 },
        uAudioLevel: { value: 0 },
        uPixelRatio: { value: pixelRatio },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.points = new THREE.Points(geometry, this.material);
    this.group.add(this.points);

    // Initial elegant 3D tilt
    this.group.rotation.x = 0.35;
    this.group.rotation.z = 0.15;
  }

  public update(
    elapsedTime: number,
    frequencyData: Uint8Array | null,
    pixelRatio: number = 1
  ) {
    let bass = 0;
    let mid = 0;
    let treble = 0;
    let audioLevel = 0;

    if (frequencyData && frequencyData.length > 0) {
      const len = frequencyData.length;

      // Bass: first 16 bins
      const bassBins = Math.min(16, len);
      for (let i = 0; i < bassBins; i++) {
        bass += frequencyData[i];
      }
      bass = bass / (bassBins * 255);

      // Mid: 16 to 128
      const midBins = Math.min(128, len);
      for (let i = bassBins; i < midBins; i++) {
        mid += frequencyData[i];
      }
      mid = mid / (Math.max(1, midBins - bassBins) * 255);

      // Treble: 128 to end
      for (let i = midBins; i < len; i++) {
        treble += frequencyData[i];
      }
      treble = treble / (Math.max(1, len - midBins) * 255);

      // Overall average
      for (let i = 0; i < len; i++) {
        audioLevel += frequencyData[i];
      }
      audioLevel = audioLevel / (len * 255);
    }

    this.material.uniforms.uTime.value = elapsedTime;
    this.material.uniforms.uBass.value = Math.pow(bass, 1.2) * 1.2;
    this.material.uniforms.uMid.value = mid;
    this.material.uniforms.uTreble.value = treble;
    this.material.uniforms.uAudioLevel.value = audioLevel;
    this.material.uniforms.uPixelRatio.value = pixelRatio;

    // Slow celestial rotation
    this.group.rotation.y = elapsedTime * 0.08;
    this.group.rotation.x = 0.35 + Math.sin(elapsedTime * 0.2) * 0.08;
  }

  public dispose() {
    this.points.geometry.dispose();
    this.material.dispose();
  }
}

