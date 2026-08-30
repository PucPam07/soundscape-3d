"use client";

import React, { useState } from "react";
import { YouTubeSong } from "@/types/player";

const YOUTUBE_API_KEY =
  process.env.NEXT_PUBLIC_YOUTUBE_API_KEY ||
  "AIzaSyAmNoBRiFlCR19i7SopE-doeqrZjkTUrO8";

interface YouTubeSearchModalProps {
  onAddToPlaylist: (song: YouTubeSong) => void;
  onClose: () => void;
}

interface SearchResult {
  id: string;
  title: string;
  thumbnail: string;
}

export const YouTubeSearchModal: React.FC<YouTubeSearchModalProps> = ({
  onAddToPlaylist,
  onClose,
}) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    // Check if the query is directly a YouTube URL or Video ID
    const urlMatch = query.match(
      /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/
    );
    if (urlMatch) {
      const videoId = urlMatch[1];
      onAddToPlaylist({
        name: `YouTube Track (${videoId})`,
        youtubeId: videoId,
        type: "youtube",
        thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      });
      onClose();
      return;
    }

    setLoading(true);
    setResults([]);
    setErrorMsg("");

    try {
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=6&q=${encodeURIComponent(
          query
        )}&key=${YOUTUBE_API_KEY}`
      );
      if (!res.ok) {
        throw new Error(`YouTube API error: ${res.statusText}`);
      }
      const data = await res.json();
      const items: SearchResult[] = (data.items || []).map((item: any) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails?.medium?.url || "",
      }));
      setResults(items);
    } catch (err: any) {
      setErrorMsg("YouTube search error. You can also paste a direct YouTube link!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed top-20 right-10 z-[100] bg-[#23243a] rounded-xl shadow-2xl border border-indigo-800 p-4 min-w-[350px] max-w-[420px] animate-fade-in"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex justify-between items-center mb-2">
        <span className="text-indigo-100 font-bold">YouTube Search</span>
        <button
          className="text-white hover:text-indigo-200 text-xl font-light leading-none p-1"
          onClick={onClose}
        >
          ✕
        </button>
      </div>

      <form className="flex gap-2 mb-2" onSubmit={handleSearch}>
        <input
          className="flex-1 bg-black/40 border border-indigo-500 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-400 placeholder:text-slate-400"
          placeholder="Search YouTube music or paste link…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded text-white text-sm font-semibold transition"
          type="submit"
        >
          Search
        </button>
      </form>

      {loading && <div className="text-indigo-200 mb-1 text-sm">Searching…</div>}

      {errorMsg && (
        <div className="text-rose-400 mb-2 text-xs">{errorMsg}</div>
      )}

      {results.length > 0 && (
        <ul className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
          {results.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-2 cursor-pointer hover:bg-indigo-900/30 p-1.5 rounded transition"
              onClick={() => {
                onAddToPlaylist({
                  name: item.title,
                  youtubeId: item.id,
                  type: "youtube",
                  thumbnail: item.thumbnail,
                });
                onClose();
              }}
            >
              {item.thumbnail && (
                <img
                  src={item.thumbnail}
                  alt=""
                  className="w-12 h-8 rounded object-cover flex-shrink-0"
                />
              )}
              <span className="flex-1 text-indigo-100 text-xs line-clamp-2">
                {item.title}
              </span>
              <button
                className="text-indigo-400 hover:text-indigo-200 px-2 py-1 rounded border border-indigo-400 text-xs flex-shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToPlaylist({
                    name: item.title,
                    youtubeId: item.id,
                    type: "youtube",
                    thumbnail: item.thumbnail,
                  });
                  onClose();
                }}
              >
                Add
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
