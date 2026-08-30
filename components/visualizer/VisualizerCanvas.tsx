"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { VisualizerType } from "@/types/player";
import { ParticleCloudVisualizer } from "./ParticleCloudVisualizer";
import { TunnelWaveVisualizer } from "./TunnelWaveVisualizer";
import { AuroraVisualizer } from "./AuroraVisualizer";
import { CosmicGalaxyVisualizer } from "./CosmicGalaxyVisualizer";
import { CyberGridVisualizer } from "./CyberGridVisualizer";
import { LiquidSphereVisualizer } from "./LiquidSphereVisualizer";
import { CircularSpectrumVisualizer } from "./CircularSpectrumVisualizer";

interface VisualizerCanvasProps {
  visualizerType: VisualizerType;
  frequencyData: Uint8Array | null;
}

export const VisualizerCanvas: React.FC<VisualizerCanvasProps> = ({
  visualizerType,
  frequencyData,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeTypeRef = useRef<VisualizerType>(visualizerType);
  const frequencyDataRef = useRef<Uint8Array | null>(frequencyData);
  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  // Keep refs in sync for the animation loop
  activeTypeRef.current = visualizerType;
  frequencyDataRef.current = frequencyData;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    const aspect = width / height;

    // 1. Scene & Responsive Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
    
    // Scale initial camera distance on mobile portrait screens
    const initZ = aspect < 1.0 ? Math.min(13.0, 8.0 / Math.max(0.55, aspect)) : 8;
    const initY = aspect < 1.0 ? 1.6 * (initZ / 8.0) : 2;
    camera.position.set(0, initY, initZ);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // 2. Ambient & Directional Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    container.appendChild(renderer.domElement);

    // 4. Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 32;
    controls.minDistance = 1.5;
    controlsRef.current = controls;

    // 5. Postprocessing Bloom (Soft, elegant cinematic glow without overexposure)
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      0.35, // strength: elegant, soft glow
      0.25, // radius: smooth falloff
      0.85  // threshold: only high-intensity peaks glow softly
    );
    composer.addPass(bloomPass);

    // 6. Instantiate All 7 Visualizers
    const pixelRatio = renderer.getPixelRatio();
    const cloud = new ParticleCloudVisualizer(pixelRatio);
    const tunnel = new TunnelWaveVisualizer();
    const aurora = new AuroraVisualizer(pixelRatio);
    const galaxy = new CosmicGalaxyVisualizer();
    const cyberGrid = new CyberGridVisualizer();
    const liquidSphere = new LiquidSphereVisualizer();
    const spectrumBars = new CircularSpectrumVisualizer();

    scene.add(cloud.group);
    scene.add(tunnel.group);
    scene.add(aurora.group);
    scene.add(galaxy.group);
    scene.add(cyberGrid.group);
    scene.add(liquidSphere.group);
    scene.add(spectrumBars.group);

    // 7. Animation Loop
    let animationFrameId: number;
    const startTime = performance.now();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = (performance.now() - startTime) * 0.001;
      const currentFreq = frequencyDataRef.current;
      const currentType = activeTypeRef.current;

      // Toggle group visibility according to active type
      cloud.group.visible = currentType === "cloud";
      tunnel.group.visible = currentType === "tunnel";
      aurora.group.visible = currentType === "aurora";
      galaxy.group.visible = currentType === "galaxy";
      cyberGrid.group.visible = currentType === "cyber_grid";
      liquidSphere.group.visible = currentType === "liquid_sphere";
      spectrumBars.group.visible = currentType === "spectrum_bars";

      if (currentType === "cloud") {
        cloud.update(elapsedTime, currentFreq, pixelRatio);
      } else if (currentType === "tunnel") {
        tunnel.update(elapsedTime, currentFreq);
      } else if (currentType === "aurora") {
        aurora.update(elapsedTime, currentFreq, pixelRatio);
      } else if (currentType === "galaxy") {
        galaxy.update(elapsedTime, currentFreq);
      } else if (currentType === "cyber_grid") {
        cyberGrid.update(elapsedTime, currentFreq);
      } else if (currentType === "liquid_sphere") {
        liquidSphere.update(elapsedTime, currentFreq);
      } else if (currentType === "spectrum_bars") {
        spectrumBars.update(elapsedTime, currentFreq);
      }

      controls.update();
      composer.render();
    };

    animate();

    // 8. Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      composer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      controls.dispose();
      cloud.dispose();
      tunnel.dispose();
      aurora.dispose();
      galaxy.dispose();
      cyberGrid.dispose();
      liquidSphere.dispose();
      spectrumBars.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // When visualizerType changes, reset camera to standard perspective
  useEffect(() => {
    if (cameraRef.current && controlsRef.current && containerRef.current) {
      const w = containerRef.current.clientWidth || window.innerWidth;
      const h = containerRef.current.clientHeight || window.innerHeight;
      const aspect = w / h;
      const z = aspect < 1.0 ? Math.min(13.0, 8.0 / Math.max(0.55, aspect)) : 8;
      const y = aspect < 1.0 ? 1.6 * (z / 8.0) : 2;

      cameraRef.current.position.set(0, y, z);
      cameraRef.current.lookAt(0, 0, 0);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  }, [visualizerType]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
      style={{ touchAction: "none" }}
    />
  );
};

