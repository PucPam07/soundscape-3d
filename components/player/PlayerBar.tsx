"use client";

import React, { useRef, useState } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Plus,
  Volume2,
  Music,
} from "lucide-react";
import { PlaylistItem } from "@/types/player";

interface PlayerBarProps {
  activeTrack: PlaylistItem | null;
  isPlaying: boolean;
  isYouTube: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isShuffle: boolean;
  isRepeat: boolean;
  isLoadingDemo: boolean;
  onTogglePlay: () => void;
  onPrev: () => void;
  onNext: () => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
  onSeek: (time: number) => void;
  onChangeVolume: (vol: number) => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onLoadDemoPlaylist: () => void;
}

export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

export const PlayerBar: React.FC<PlayerBarProps> = ({
  activeTrack,
  isPlaying,
  isYouTube,
  currentTime,
  duration,
  volume,
  isShuffle,
  isRepeat,
  isLoadingDemo,
  onTogglePlay,
  onPrev,
  onNext,
  onToggleShuffle,
  onToggleRepeat,
  onSeek,
  onChangeVolume,
  onFileUpload,
  onLoadDemoPlaylist,
}) => {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getTrackName = () => {
    if (!activeTrack) return "";
    if ("name" in activeTrack) {
      return activeTrack.name.replace(/\.[^/.]+$/, "");
    }
    return "Unknown track";
  };

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center w-full px-4">
      {/* Song Info or Empty State */}
      <div className="mb-2 text-center min-h-[48px] flex flex-col items-center justify-center">
        {activeTrack ? (
          <>
            <div className="text-lg font-semibold text-white tracking-wide truncate max-w-[80vw]">
              {getTrackName()}
            </div>
            <div className="text-sm text-indigo-300">
              {isYouTube ? "YouTube Music" : "Unknown Artist"}
            </div>
          </>
        ) : (
          <div className="text-slate-400 text-base italic flex items-center justify-center gap-1 flex-wrap">
            No song selected —
            <span>
              Use
              <span className="inline-block px-2 py-1 bg-indigo-700/60 rounded-lg mx-1 text-white font-semibold align-middle text-xs">
                +
              </span>
              to upload music, or
              <span className="inline-block align-middle mx-1">
                <Music className="inline-block w-5 h-5 text-indigo-300 align-middle" />
              </span>
              to add from YouTube.
            </span>
          </div>
        )}
      </div>

      {/* Main Controls Dock */}
      <div className="flex items-center gap-4 bg-black/60 px-6 py-3 rounded-2xl shadow-lg backdrop-blur">
        {/* Prev */}
        <button
          onClick={onPrev}
          disabled={!activeTrack}
          className={`p-2 hover:bg-indigo-800/40 rounded-full transition ${
            activeTrack ? "" : "opacity-30 cursor-not-allowed"
          }`}
          title="Prev"
        >
          <SkipBack className="w-6 h-6 text-indigo-300" />
        </button>

        {/* Play/Pause */}
        <button
          disabled={!activeTrack || isYouTube}
          className={`p-3 rounded-full bg-indigo-600 shadow-lg hover:scale-110 transition ${
            !activeTrack || isYouTube ? "opacity-40 cursor-not-allowed" : ""
          }`}
          onClick={onTogglePlay}
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause className="w-7 h-7 text-white" />
          ) : (
            <Play className="w-7 h-7 text-white ml-0.5" />
          )}
        </button>

        {/* Next */}
        <button
          onClick={onNext}
          disabled={!activeTrack}
          className={`p-2 hover:bg-indigo-800/40 rounded-full transition ${
            activeTrack ? "" : "opacity-30 cursor-not-allowed"
          }`}
          title="Next"
        >
          <SkipForward className="w-6 h-6 text-indigo-300" />
        </button>

        {/* Shuffle */}
        <button
          className={`p-2 hover:bg-indigo-800/40 rounded-full transition ${
            isShuffle ? "bg-indigo-500/30" : ""
          } ${activeTrack ? "" : "opacity-30 cursor-not-allowed"}`}
          onClick={onToggleShuffle}
          title="Shuffle"
          disabled={!activeTrack}
        >
          <Shuffle className="w-5 h-5 text-indigo-300" />
        </button>

        {/* Repeat */}
        <button
          className={`p-2 hover:bg-indigo-800/40 rounded-full transition ${
            isRepeat ? "bg-indigo-500/30" : ""
          } ${activeTrack ? "" : "opacity-30 cursor-not-allowed"}`}
          onClick={onToggleRepeat}
          title="Repeat"
          disabled={!activeTrack}
        >
          <Repeat className="w-5 h-5 text-indigo-300" />
        </button>

        {/* Add Song Popover */}
        <div className="relative">
          <button
            className="p-2 hover:bg-indigo-800/40 rounded-full transition"
            title="Add Song"
            onClick={(e) => {
              e.stopPropagation();
              setShowAddMenu((prev) => !prev);
            }}
          >
            <Plus className="w-5 h-5 text-indigo-300" />
          </button>

          {showAddMenu && (
            <div
              className="absolute right-0 bottom-14 bg-[#23243a] rounded-xl shadow-xl border border-indigo-800 p-2 min-w-[190px] max-w-[250px] z-50 animate-fade-in"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="w-full text-left px-4 py-2 rounded-lg mb-1 hover:bg-indigo-700/50 text-indigo-100 text-sm transition"
                onClick={() => {
                  setShowAddMenu(false);
                  fileInputRef.current?.click();
                }}
              >
                Upload from your device
              </button>
              <button
                className="w-full text-left px-4 py-2 rounded-lg hover:bg-indigo-700/50 text-indigo-100 text-sm flex items-center gap-2 disabled:opacity-50 transition"
                onClick={() => {
                  setShowAddMenu(false);
                  onLoadDemoPlaylist();
                }}
                disabled={isLoadingDemo}
              >
                {isLoadingDemo && (
                  <span className="animate-spin w-4 h-4 border-b-2 border-white rounded-full inline-block" />
                )}
                🎵 Try my playlist
              </button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".mp3,audio/mp3,audio/mpeg,audio/*"
            multiple
            className="hidden"
            onChange={onFileUpload}
          />
        </div>
      </div>

      {/* Scrubber & Volume (Hidden when playing YouTube) */}
      {!isYouTube && (
        <>
          <div className="flex items-center w-[380px] max-w-full gap-3 mt-3">
            <span className="text-xs text-slate-300 w-9 text-right">
              {formatTime(currentTime)}
            </span>
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={activeTrack ? currentTime : 0}
              onChange={(e) => onSeek(Number(e.target.value))}
              disabled={!activeTrack}
              className={`flex-1 accent-indigo-500 h-2 rounded-full cursor-pointer ${
                activeTrack ? "" : "opacity-40 cursor-not-allowed"
              }`}
            />
            <span className="text-xs text-slate-300 w-9">
              {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <Volume2 className="w-5 h-5 text-indigo-300" />
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => onChangeVolume(parseFloat(e.target.value))}
              className="accent-indigo-400 cursor-pointer"
              style={{ width: 90 }}
              disabled={!activeTrack}
            />
          </div>
        </>
      )}
    </div>
  );
};
