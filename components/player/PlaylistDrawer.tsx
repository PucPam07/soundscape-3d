"use client";

import React from "react";
import { PlaylistItem } from "@/types/player";
import { ListMusic, Trash2, Music } from "lucide-react";

const YouTubeIcon: React.FC<{ className?: string }> = ({ className = "w-3.5 h-3.5" }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

interface PlaylistDrawerProps {
  playlist: PlaylistItem[];
  currentIndex: number;
  isOpen: boolean;
  isPlaying?: boolean;
  onToggle: () => void;
  onSelectTrack: (index: number) => void;
  onRemoveTrack: (index: number) => void;
  onClearPlaylist?: () => void;
}

export const PlaylistDrawer: React.FC<PlaylistDrawerProps> = ({
  playlist,
  currentIndex,
  isOpen,
  isPlaying = false,
  onToggle,
  onSelectTrack,
  onRemoveTrack,
  onClearPlaylist,
}) => {
  const getTrackInfo = (item: PlaylistItem) => {
    const isYT = "type" in item && item.type === "youtube";
    let title = "Unknown track";
    if ("name" in item) {
      title = item.name.replace(/\.[^/.]+$/, "");
    }
    return { title, isYT };
  };

  return (
    <div className="relative">
      {playlist.length > 0 && (
        <button
          className={`w-10 h-10 flex items-center justify-center rounded-full transition-all duration-200 ${
            isOpen
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/40 border border-indigo-400"
              : "bg-black/60 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-900/60 hover:text-white"
          }`}
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          title={isOpen ? "Ẩn danh sách phát" : "Hiện danh sách phát"}
        >
          <ListMusic className="w-5 h-5" />
        </button>
      )}

      {isOpen && playlist.length > 0 && (
        <div
          className="absolute right-0 top-12 w-[310px] sm:w-[360px] max-h-[460px] bg-[#0c0e1a]/90 rounded-2xl shadow-2xl shadow-black/80 px-4 py-3.5 backdrop-blur-2xl border border-indigo-500/30 mt-2 z-50 animate-fade-in flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                Danh sách phát
              </span>
              <span className="px-2 py-0.5 rounded-full bg-indigo-950/80 border border-indigo-700/50 text-[11px] font-semibold text-indigo-300">
                {playlist.length}
              </span>
            </div>

            {onClearPlaylist && playlist.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClearPlaylist();
                }}
                className="text-[11px] text-slate-400 hover:text-red-400 transition flex items-center gap-1 hover:bg-red-500/10 px-2 py-1 rounded-lg"
                title="Xoá tất cả bài hát trong danh sách"
              >
                <Trash2 className="w-3 h-3" />
                <span>Xoá hết</span>
              </button>
            )}
          </div>

          {/* Track List */}
          <ul className="flex-1 overflow-y-auto max-h-[360px] space-y-1 pr-1 custom-scrollbar">
            {playlist.map((track, idx) => {
              const { title, isYT } = getTrackInfo(track);
              const isActive = idx === currentIndex;

              return (
                <li
                  key={idx}
                  onClick={() => onSelectTrack(idx)}
                  className={`group relative py-2 px-2.5 rounded-xl cursor-pointer flex items-center justify-between gap-2.5 transition-all duration-150 ${
                    isActive
                      ? "bg-indigo-600/30 border border-indigo-500/50 text-white shadow-sm font-medium"
                      : "hover:bg-white/[0.06] text-slate-300 border border-transparent"
                  }`}
                >
                  {/* Left: Icon & Title */}
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {/* Active Equalizer or Type Icon */}
                    <div className="flex-shrink-0 w-6 h-6 rounded-lg bg-black/40 flex items-center justify-center border border-white/5">
                      {isActive && isPlaying ? (
                        <div className="flex items-end gap-0.5 h-3">
                          <span className="w-0.5 bg-indigo-400 animate-pulse rounded-full h-3" />
                          <span className="w-0.5 bg-sky-300 animate-pulse delay-75 rounded-full h-2" />
                          <span className="w-0.5 bg-indigo-300 animate-pulse delay-150 rounded-full h-3" />
                        </div>
                      ) : isYT ? (
                        <YouTubeIcon className="w-3.5 h-3.5 text-red-400" />
                      ) : (
                        <Music className="w-3.5 h-3.5 text-sky-400" />
                      )}
                    </div>

                    {/* Track Title */}
                    <div className="min-w-0 flex-1">
                      <p
                        className={`truncate text-xs ${
                          isActive
                            ? "text-white font-semibold"
                            : "text-slate-200 group-hover:text-white"
                        }`}
                      >
                        {title}
                      </p>
                      <span className="text-[10px] text-slate-400 tracking-tight">
                        {isYT ? "YouTube" : "Audio Track"}
                      </span>
                    </div>
                  </div>

                  {/* Right: Active indicator & Delete Button */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping mr-1" />
                    )}

                    {/* Delete button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveTrack(idx);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/20 transition-all opacity-70 group-hover:opacity-100"
                      title="Xoá bài này khỏi danh sách"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

