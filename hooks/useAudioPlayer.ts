"use client";

import { useEffect, useRef, useState } from "react";

export function useAudioPlayer(src: string) {
  const [frequencyData, setFrequencyData] = useState<Uint8Array | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [gainNode, setGainNode] = useState<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  useEffect(() => {
    if (!src) {
      setAudioElement(null);
      setIsPlaying(false);
      setGainNode(null);
      setFrequencyData(null);
      return;
    }

    const audio = new window.Audio(src);
    audio.crossOrigin = "anonymous";
    audio.preload = "auto";
    setAudioElement(audio);

    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const audioContext = new AudioContextClass();
    const sourceNode = audioContext.createMediaElementSource(audio);
    const analyser = audioContext.createAnalyser();
    const gain = audioContext.createGain();

    sourceNode.connect(gain);
    gain.connect(analyser);
    analyser.connect(audioContext.destination);
    analyser.fftSize = 256;
    analyserRef.current = analyser;
    setGainNode(gain);

    let animationFrameId: number;
    const updateFrequency = () => {
      const data = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(data);
      setFrequencyData(data);
      animationFrameId = requestAnimationFrame(updateFrequency);
    };
    updateFrequency();

    const handlePlay = () => {
      if (audioContext.state === "suspended") {
        audioContext.resume();
      }
      setIsPlaying(true);
    };
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);

    return () => {
      cancelAnimationFrame(animationFrameId);
      audio.pause();
      audio.src = "";
      sourceNode.disconnect();
      gain.disconnect();
      analyser.disconnect();
      audioContext.close();
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      setAudioElement(null);
      setIsPlaying(false);
      setGainNode(null);
      setFrequencyData(null);
    };
  }, [src]);

  return { frequencyData, isPlaying, audioElement, gainNode };
}

export function useFakeFrequencyData(size: number = 128) {
  const [data, setData] = useState<Uint8Array>(() => new Uint8Array(size));

  useEffect(() => {
    let animId: number;
    function generate() {
      const arr = new Uint8Array(size);
      const time = Date.now() * 0.002;
      for (let i = 0; i < size; i++) {
        arr[i] = Math.floor(
          80 +
            70 * Math.sin(time + i * 0.3) +
            40 * Math.cos(time * 0.7 + i * 0.6) +
            Math.random() * 30
        );
      }
      setData(arr);
      animId = requestAnimationFrame(generate);
    }
    generate();
    return () => cancelAnimationFrame(animId);
  }, [size]);

  return data;
}
