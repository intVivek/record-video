"use client";
import { VideoProvider } from "./hooks/useVideoContext";
import Recorder from "./components/Recorder";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans !bg-[#171717]">
      <VideoProvider>
        <Recorder />
      </VideoProvider>
    </div>
  );
}
