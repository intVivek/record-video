import { twMerge } from "tailwind-merge";
import { useVideoContext } from "../hooks/useVideoContext";
import { useEffect, useState } from "react";

export default function StreamPreview() {
    const { video } = useVideoContext();
    const [videoURL, setVideoURL] = useState<string | null>(null);

    useEffect(() => {
        if (video?.blob) {
            const url = URL.createObjectURL(video.blob);
            setVideoURL(url);

            return () => {
                URL.revokeObjectURL(url);
            };
        } else {
            setVideoURL(null);
        }
    }, [video]);

    return (
        <div className="w-max h-max rounded-lg overflow-hidden flex items-center justify-center mb-4 relative transition-all">
            <video
                src={videoURL || undefined}
                controls
                playsInline
                preload="metadata"
                className={twMerge("w-[0px] h-[0px] max-w-[400px] max-h-[400px] object-cover transition-all opacity-0", videoURL && "w-full h-full opacity-100")}
            />
        </div>
    );
}