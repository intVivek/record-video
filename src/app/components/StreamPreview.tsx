import { twMerge } from "tailwind-merge";
import { useVideoContext } from "../hooks/useVideoContext";
import { useEffect, useState } from "react";

export default function StreamPreview() {
    const { isRecording, videoRef, stream } = useVideoContext();
    const [showStream, setShowStream] = useState(false);

    useEffect(() => {
        if (stream) {
            const timer = setTimeout(() => setShowStream(true), 50);
            return () => clearTimeout(timer);
        } else {
            setShowStream(false);
        }
    }, [stream]);

    return (
        <div className="w-max h-max rounded-lg overflow-hidden flex items-center justify-center mb-4 relative transition-all">
            <video ref={videoRef} autoPlay muted playsInline className={twMerge("w-[0px] h-[0px] max-w-[400px] max-h-[400px] object-cover transition-all opacity-0", showStream && "w-full h-full opacity-100")} />
            {isRecording && (
                <div className="absolute top-4 right-4 animate-pulse">
                    <div className="w-4 h-4 bg-red-600 rounded-full"></div>
                </div>
            )}
        </div>
    );
}