"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { YouTubeSong } from "@/types/player";
import {
  Minimize2,
  Maximize2,
  ChevronDown,
  ChevronUp,
  X,
  GripHorizontal,
} from "lucide-react";

const YouTubeIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

interface FloatingYouTubePlayerProps {
  currentTrack: YouTubeSong;
  onClose?: () => void;
}

export const FloatingYouTubePlayer: React.FC<FloatingYouTubePlayerProps> = ({
  currentTrack,
  onClose,
}) => {
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{
    startX: number;
    startY: number;
    initX: number;
    initY: number;
    hasMoved: boolean;
  }>({
    startX: 0,
    startY: 0,
    initX: 0,
    initY: 0,
    hasMoved: false,
  });

  // Clamp position within viewport on window resize
  const clampPosition = useCallback((x: number, y: number) => {
    if (!containerRef.current) return { x, y };
    const rect = containerRef.current.getBoundingClientRect();
    const width = rect.width || 320;
    const height = rect.height || 220;

    const minX = 8;
    const maxX = Math.max(8, window.innerWidth - width - 8);
    const minY = 8;
    const maxY = Math.max(8, window.innerHeight - height - 8);

    return {
      x: Math.max(minX, Math.min(maxX, x)),
      y: Math.max(minY, Math.min(maxY, y)),
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (position) {
        setPosition((prev) => (prev ? clampPosition(prev.x, prev.y) : null));
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [position, clampPosition]);

  // Adjust position when toggling minimize/expanded so it stays within viewport
  useEffect(() => {
    if (position) {
      const timer = setTimeout(() => {
        setPosition((prev) => (prev ? clampPosition(prev.x, prev.y) : null));
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isMinimized, isExpanded, clampPosition, position]);

  // Pointer Down (Start Dragging)
  const handlePointerDown = (e: React.PointerEvent) => {
    // Don't drag if clicking buttons inside header
    if ((e.target as HTMLElement).closest("button")) return;

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();

    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: rect.left,
      initY: rect.top,
      hasMoved: false,
    };

    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  // Pointer Move (Dragging in progress)
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;

    const deltaX = e.clientX - dragStartRef.current.startX;
    const deltaY = e.clientY - dragStartRef.current.startY;

    if (Math.hypot(deltaX, deltaY) > 4) {
      dragStartRef.current.hasMoved = true;
    }

    const nextX = dragStartRef.current.initX + deltaX;
    const nextY = dragStartRef.current.initY + deltaY;

    setPosition(clampPosition(nextX, nextY));
  };

  // Pointer Up (End Dragging)
  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
  };

  // Click handler for Minimized Pill (only expand if not dragged)
  const handlePillClick = () => {
    if (!dragStartRef.current.hasMoved) {
      setIsMinimized(false);
    }
  };

  return (
    <div
      ref={containerRef}
      style={
        position
          ? {
              left: `${position.x}px`,
              top: `${position.y}px`,
              right: "auto",
              bottom: "auto",
            }
          : undefined
      }
      className={`fixed z-40 select-none ${
        position
          ? ""
          : isMinimized
          ? "bottom-28 right-4 sm:bottom-6 sm:right-6"
          : "bottom-32 right-3 sm:bottom-6 sm:right-6"
      } ${isDragging ? "cursor-grabbing" : ""}`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Persistent Floating Card Container (Morphed smoothly without unmounting DOM iframe) */}
      <div
        className={`bg-[#0e101d]/95 backdrop-blur-2xl border shadow-2xl shadow-indigo-950/80 overflow-hidden transition-all duration-200 ${
          isMinimized
            ? "w-auto max-w-[280px] sm:max-w-[340px] rounded-full border-indigo-500/50 bg-[#121324]/95 hover:bg-[#1c1e36]"
            : isExpanded
            ? "w-[92vw] sm:w-[480px] rounded-2xl border-indigo-500/40"
            : "w-[295px] sm:w-[350px] rounded-2xl border-indigo-500/40"
        } ${isDragging ? "shadow-indigo-500/20 border-indigo-400" : ""}`}
      >
        {/* Header / Pill Bar */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onClick={isMinimized ? handlePillClick : undefined}
          className={`flex items-center justify-between gap-2 px-3.5 py-2 cursor-grab active:cursor-grabbing ${
            isMinimized
              ? "hover:scale-[1.02] active:scale-[0.98] transition-transform"
              : "bg-white/[0.05] border-b border-white/[0.08]"
          }`}
          style={{ touchAction: "none" }}
          title={
            isMinimized
              ? "Kéo để di chuyển, nhấp để mở rộng YouTube"
              : "Kéo thanh tiêu đề để di chuyển khung video"
          }
        >
          {/* Left Info: Icon & Song Title */}
          <div className="flex items-center gap-2 min-w-0 pr-1 pointer-events-none">
            <GripHorizontal
              className={`w-3.5 h-3.5 flex-shrink-0 ${
                isMinimized ? "text-indigo-400/60" : "text-indigo-300/70"
              }`}
            />
            <div className="w-5 h-5 rounded-md bg-red-600 flex items-center justify-center flex-shrink-0 shadow">
              <YouTubeIcon className="w-3 h-3 text-white" />
            </div>
            <span className="text-xs font-semibold text-white truncate tracking-tight">
              {currentTrack.name}
            </span>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {isMinimized ? (
              /* Expand Button when Minimized */
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMinimized(false);
                }}
                className="p-1 rounded-md text-indigo-300 hover:text-white transition-colors"
                title="Mở rộng YouTube"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
            ) : (
              /* Card Controls when Expanded */
              <>
                {/* Expand/Contract Toggle (desktop only) */}
                <button
                  onClick={() => setIsExpanded((prev) => !prev)}
                  className="hidden sm:flex p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition"
                  title={isExpanded ? "Kích thước thường" : "Kích thước lớn"}
                >
                  {isExpanded ? (
                    <Minimize2 className="w-3.5 h-3.5" />
                  ) : (
                    <Maximize2 className="w-3.5 h-3.5" />
                  )}
                </button>

                {/* Minimize to Pill */}
                <button
                  onClick={() => setIsMinimized(true)}
                  className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition"
                  title="Thu nhỏ thành thanh phát"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>

                {/* Close Button (if provided) */}
                {onClose && (
                  <button
                    onClick={onClose}
                    className="p-1 rounded-md text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition"
                    title="Đóng video"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Video Frame - Kept ALWAYS mounted in the DOM to avoid stopping/restarting audio */}
        <div
          className={`relative w-full bg-black transition-all duration-200 overflow-hidden ${
            isMinimized
              ? "h-0 opacity-0 pointer-events-none"
              : "aspect-video opacity-100"
          }`}
        >
          {/* Overlay during dragging to prevent iframe pointer swallowing */}
          {isDragging && <div className="absolute inset-0 z-10 bg-transparent" />}

          <iframe
            key={currentTrack.youtubeId}
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${currentTrack.youtubeId}?autoplay=1&controls=1`}
            frameBorder="0"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            title={currentTrack.name}
            className="w-full h-full block"
          />
        </div>
      </div>
    </div>
  );
};


