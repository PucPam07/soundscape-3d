export type VisualizerType =
  | "cloud"
  | "tunnel"
  | "aurora"
  | "galaxy"
  | "cyber_grid"
  | "liquid_sphere"
  | "spectrum_bars";

export interface DemoSong {
  name: string;
  url: string;
}

export interface YouTubeSong {
  name: string;
  youtubeId: string;
  type: "youtube";
  thumbnail?: string;
}

export type PlaylistItem = File | DemoSong | YouTubeSong;

export interface VisualizerOption {
  value: VisualizerType;
  label: string;
}

export const VISUALIZER_OPTIONS: VisualizerOption[] = [
  { value: "cloud", label: "Particle Cloud" },
  { value: "tunnel", label: "Tunnel Wave" },
  { value: "aurora", label: "Aurora" },
  { value: "galaxy", label: "Cosmic Galaxy" },
  { value: "cyber_grid", label: "Cyber Synthwave Grid" },
  { value: "liquid_sphere", label: "Liquid Plasma Core" },
  { value: "spectrum_bars", label: "3D Circular Spectrum" },
];
