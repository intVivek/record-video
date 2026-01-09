import { useVideoContext } from "../hooks/useVideoContext";
import ShowPreview from "./ShowPreview";
import StreamPreview from "./StreamPreview";

export default function Preview() {
    const { isVideoAvailable, isRecording } = useVideoContext();
    return (
        <div className="w-max h-max rounded-lg overflow-hidden flex items-center justify-center mb-4 relative transition-all">
            {isVideoAvailable && !isRecording && <ShowPreview />}
            {isRecording && <StreamPreview />}
        </div>
    );
}