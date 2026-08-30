"use client";

import React, { useState } from "react";
import { Eye } from "lucide-react";
import { VISUALIZER_OPTIONS, VisualizerType } from "@/types/player";

interface VisualizerMenuProps {
  currentType: VisualizerType;
  onSelectType: (type: VisualizerType) => void;
}

export const VisualizerMenu: React.FC<VisualizerMenuProps> = ({
  currentType,
  onSelectType,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        className="w-10 h-10 flex items-center justify-center rounded-full bg-black/50 border border-indigo-400 hover:bg-indigo-800 transition relative"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        title="Select Visualizer"
      >
        <Eye className="w-6 h-6 text-indigo-300" />
      </button>

      {isOpen && (
        <div
          className="absolute top-12 right-0 bg-[#23243a] rounded-xl shadow-xl border border-indigo-800 p-2 min-w-[170px] z-50 animate-fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          {VISUALIZER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={`w-full text-left px-4 py-2 rounded-lg mb-1 transition-colors text-xs ${
                currentType === opt.value
                  ? "bg-indigo-600 text-white font-bold"
                  : "hover:bg-indigo-700/50 text-indigo-100"
              }`}
              onClick={() => {
                onSelectType(opt.value);
                setIsOpen(false);
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
