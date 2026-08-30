"use client";

import React, { useEffect, useState } from "react";
import { PlaylistItem, VisualizerType, YouTubeSong } from "@/types/player";
import { useAudioPlayer, useFakeFrequencyData } from "@/hooks/useAudioPlayer";
import { VisualizerCanvas } from "@/components/visualizer/VisualizerCanvas";
import { VisualizerMenu } from "@/components/player/VisualizerMenu";
import { PlaylistDrawer } from "@/components/player/PlaylistDrawer";
import { YouTubeSearchModal } from "@/components/player/YouTubeSearchModal";
import { PlayerBar } from "@/components/player/PlayerBar";
import { Music } from "lucide-react";

export default function Home() {
  const [playlist, setPlaylist] = useState<PlaylistItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPlaylistOpen, setIsPlaylistOpen] = useState<boolean>(true);
  const [showYouTubeModal, setShowYouTubeModal] = useState<boolean>(false);
  const [isLoadingDemo, setIsLoadingDemo] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(0.7);
  const [visualizerType, setVisualizerType] = useState<VisualizerType>("cloud");
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isRepeat, setIsRepeat] = useState<boolean>(false);
  const [isShuffle, setIsShuffle] = useState<boolean>(false);

  const currentTrack: PlaylistItem | null = playlist[currentIndex] || null;

  const isYouTube = Boolean(
    currentTrack &&
      typeof currentTrack === "object" &&
      "type" in currentTrack &&
      currentTrack.type === "youtube"
  );

  // Manage ObjectURL for local files
  const [objectUrl, setObjectUrl] = useState<string>("");
  useEffect(() => {
    if (!currentTrack) {
      setObjectUrl("");
      return;
    }
    if (currentTrack instanceof File) {
      const url = URL.createObjectURL(currentTrack);
      setObjectUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    }
    if ("url" in currentTrack && !isYouTube) {
      setObjectUrl(currentTrack.url);
      return;
    }
    setObjectUrl("");
  }, [currentTrack, isYouTube]);

  // Audio Player Hook
  const { frequencyData, isPlaying, audioElement, gainNode } = useAudioPlayer(
    isYouTube ? "" : objectUrl
  );

  // Fake frequency fallback for YouTube streams
  const fakeFrequencyData = useFakeFrequencyData(128);
  const activeFrequencyData = isYouTube ? fakeFrequencyData : frequencyData;

  // Sync Volume
  useEffect(() => {
    if (gainNode) {
      gainNode.gain.value = volume;
    }
  }, [gainNode, volume]);

  // Listen to time and duration updates
  useEffect(() => {
    if (!audioElement || isYouTube) return;

    const handleTime = () => {
      setCurrentTime(audioElement.currentTime);
      setDuration(audioElement.duration || 0);
    };

    audioElement.addEventListener("timeupdate", handleTime);
    audioElement.addEventListener("loadedmetadata", handleTime);

    return () => {
      audioElement.removeEventListener("timeupdate", handleTime);
      audioElement.removeEventListener("loadedmetadata", handleTime);
    };
  }, [audioElement, isYouTube]);

  // Autoplay on track change (if playlist not empty and not youtube)
  useEffect(() => {
    if (audioElement && playlist.length > 0 && !isYouTube) {
      audioElement.currentTime = 0;
      audioElement.play().catch(() => {});
    }
  }, [audioElement, currentTrack, playlist.length, isYouTube]);

  // Handle Track Ended
  useEffect(() => {
    if (!audioElement || isYouTube) return;

    const handleEnded = () => {
      if (isShuffle && playlist.length > 1) {
        let nextIdx: number;
        do {
          nextIdx = Math.floor(Math.random() * playlist.length);
        } while (nextIdx === currentIndex && playlist.length > 1);
        setCurrentIndex(nextIdx);
      } else if (currentIndex < playlist.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else if (isRepeat && playlist.length > 0) {
        setCurrentIndex(0);
      }
    };

    audioElement.addEventListener("ended", handleEnded);
    return () => audioElement.removeEventListener("ended", handleEnded);
  }, [audioElement, playlist.length, currentIndex, isRepeat, isShuffle, isYouTube]);

  // Close modals on outside click
  useEffect(() => {
    const handleOutsideClick = () => {
      setShowYouTubeModal(false);
    };
    if (showYouTubeModal) {
      window.addEventListener("click", handleOutsideClick);
      return () => window.removeEventListener("click", handleOutsideClick);
    }
  }, [showYouTubeModal]);

  // Controls Handlers
  const handleTogglePlay = () => {
    if (!currentTrack || !audioElement || isYouTube) return;
    if (isPlaying) {
      audioElement.pause();
    } else {
      audioElement.play().catch(() => {});
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    } else if (audioElement && !isYouTube) {
      audioElement.currentTime = 0;
    }
  };

  const handleNext = () => {
    if (isShuffle && playlist.length > 1) {
      let nextIdx: number;
      do {
        nextIdx = Math.floor(Math.random() * playlist.length);
      } while (nextIdx === currentIndex && playlist.length > 1);
      setCurrentIndex(nextIdx);
    } else if (currentIndex < playlist.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else if (isRepeat && playlist.length > 0) {
      setCurrentIndex(0);
    }
  };

  const handleSeek = (time: number) => {
    if (audioElement && !isYouTube) {
      audioElement.currentTime = time;
    }
    setCurrentTime(time);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setPlaylist((prev) => [...prev, ...newFiles]);
      if (playlist.length === 0) {
        setCurrentIndex(0);
      }
      setTimeout(() => {
        const audio = document.querySelector("audio");
        audio?.play().catch(() => {});
      }, 220);
    }
  };

  const handleLoadDemoPlaylist = async () => {
    setIsLoadingDemo(true);
    try {
      const res = await fetch("/demo-songs/demo-playlist.json");
      if (!res.ok) {
        throw new Error(`Playlist fetch status: ${res.status}`);
      }
      const data: PlaylistItem[] = await res.json();
      setPlaylist(data);
      setCurrentIndex(0);
      setTimeout(() => {
        const audio = document.querySelector("audio");
        audio?.play().catch(() => {});
      }, 220);
    } catch (err) {
      console.error("Fetch demo-playlist.json error:", err);
      alert("Could not load demo playlist: " + err);
    } finally {
      setIsLoadingDemo(false);
    }
  };

  const handleAddYouTubeSong = (song: YouTubeSong) => {
    setPlaylist((prev) => [...prev, song]);
    if (playlist.length === 0) {
      setCurrentIndex(0);
    }
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-gradient-to-br from-[#11101d] via-[#23243a] to-[#120a16] overflow-hidden select-none">
      {/* 3D WebGL Audio Visualizer Canvas */}
      <VisualizerCanvas
        visualizerType={visualizerType}
        frequencyData={activeFrequencyData}
      />

      {/* Top-Right Floating Controls (Visualizer Switcher, Playlist, YouTube Search) */}
      <div className="fixed top-6 right-10 z-50 flex flex-col items-end gap-3">
        {/* Visualizer Mode Dropdown */}
        <VisualizerMenu
          currentType={visualizerType}
          onSelectType={setVisualizerType}
        />

        {/* Playlist Toggle */}
        <PlaylistDrawer
          playlist={playlist}
          currentIndex={currentIndex}
          isOpen={isPlaylistOpen}
          onToggle={() => setIsPlaylistOpen((prev) => !prev)}
          onSelectTrack={setCurrentIndex}
        />

        {/* YouTube Music Search Modal Toggle */}
        <button
          className="w-10 h-10 flex items-center justify-center rounded-full bg-black/50 border border-indigo-400 hover:bg-indigo-800 transition"
          onClick={(e) => {
            e.stopPropagation();
            setShowYouTubeModal((prev) => !prev);
          }}
          title="Add online music"
        >
          <Music className="w-6 h-6 text-indigo-200" />
        </button>

        {/* YouTube Search Modal */}
        {showYouTubeModal && (
          <YouTubeSearchModal
            onAddToPlaylist={handleAddYouTubeSong}
            onClose={() => setShowYouTubeModal(false)}
          />
        )}
      </div>

      {/* Embedded Floating YouTube Player (Bottom-Right) */}
      {isYouTube && currentTrack && "youtubeId" in currentTrack && (
        <div className="fixed bottom-6 right-8 z-50 shadow-2xl rounded-xl overflow-hidden border-2 border-indigo-800 bg-black/90 animate-fade-in">
          <iframe
            width={320}
            height={180}
            src={`https://www.youtube.com/embed/${currentTrack.youtubeId}?autoplay=1&controls=1`}
            frameBorder={0}
            allow="autoplay; encrypted-media"
            allowFullScreen
            title={currentTrack.name}
            className="block"
          />
        </div>
      )}

      {/* Bottom Audio Player Bar */}
      <PlayerBar
        activeTrack={currentTrack}
        isPlaying={isPlaying}
        isYouTube={isYouTube}
        currentTime={currentTime}
        duration={duration}
        volume={volume}
        isShuffle={isShuffle}
        isRepeat={isRepeat}
        isLoadingDemo={isLoadingDemo}
        onTogglePlay={handleTogglePlay}
        onPrev={handlePrev}
        onNext={handleNext}
        onToggleShuffle={() => setIsShuffle((prev) => !prev)}
        onToggleRepeat={() => setIsRepeat((prev) => !prev)}
        onSeek={handleSeek}
        onChangeVolume={setVolume}
        onFileUpload={handleFileUpload}
        onLoadDemoPlaylist={handleLoadDemoPlaylist}
      />

      {/* Author Watermark (Bottom-Right) */}
      <div className="fixed bottom-2.5 right-4 z-10 text-[11px] text-white/30 hover:text-white/60 transition-colors select-none pointer-events-none tracking-wider font-light backdrop-blur-[1px] px-2 py-0.5 rounded">
        Made by Phạm Triệu Tấn Phúc
      </div>
    </div>
  );
}
