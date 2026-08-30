"use client";

import React from "react";
import { PlaylistItem } from "@/types/player";

interface PlaylistDrawerProps {
  playlist: PlaylistItem[];
  currentIndex: number;
  isOpen: boolean;
  onToggle: () => void;
  onSelectTrack: (index: number) => void;
}

export const PlaylistDrawer: React.FC<PlaylistDrawerProps> = ({
  playlist,
  currentIndex,
  isOpen,
  onToggle,
  onSelectTrack,
}) => {
  const getTrackName = (item: PlaylistItem) => {
    if ("type" in item && item.type === "youtube") {
      return `${item.name} (YouTube)`;
    }
    if ("name" in item) {
      return item.name.replace(/\.[^/.]+$/, "");
    }
    return "Unknown track";
  };

  return (
    <>
      {playlist.length > 0 && (
        <button
          className="w-10 h-10 flex items-center justify-center rounded-full bg-black/50 border border-indigo-600 hover:bg-indigo-900 transition"
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          title={isOpen ? "Hide Playlist" : "Show Playlist"}
        >
          <span className="text-indigo-300 text-xs font-bold">PL</span>
        </button>
      )}

      {isOpen && playlist.length > 0 && (
        <div
          className="w-80 max-h-96 bg-black/50 rounded-xl shadow px-4 py-3 backdrop-blur-lg border border-indigo-700/50 mt-2"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-indigo-300 text-xs mb-2 font-bold tracking-wider">
            Playlist
          </div>
          <ul className="max-h-80 overflow-y-auto custom-scrollbar">
            {playlist.map((track, idx) => (
              <li
                key={idx}
                onClick={() => onSelectTrack(idx)}
                className={`py-1 px-2 rounded cursor-pointer mb-1 flex items-center gap-2 transition-colors ${
                  idx === currentIndex
                    ? "bg-indigo-700/60 text-white font-bold"
                    : "hover:bg-indigo-900/30 text-slate-300"
                }`}
              >
                <span className="truncate flex-1 text-sm">
                  {getTrackName(track)}
                </span>
                {idx === currentIndex && (
                  <span className="text-indigo-200 text-xs">●</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
};
