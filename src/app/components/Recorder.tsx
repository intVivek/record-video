import { useVideoContext } from "../hooks/useVideoContext";
import Preview from "./Preview";
import ActionBar from "./ActionBar";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import Button from "./UI/Button";
import { FaVideo } from "react-icons/fa";

export default function Recorder() {
    const { error, loading, permissionGranted, requestPermission } = useVideoContext();

    if (loading) {
        return (
            <AiOutlineLoading3Quarters className="w-5 h-5 animate-spin" />
        );
    }

    if (error) {
        return (
            <div className="text-red-500 mb-4 px-2 flex items-center flex-col gap-2">
                <div className="text-center">{error}</div>
                {!permissionGranted && (
                    <Button onClick={requestPermission}>
                        <FaVideo />
                        Allow Camera/Microphone
                    </Button>
                )}
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col items-center justify-center">
            <div className="w-full h-full flex flex-col items-center justify-center">
                <Preview />
                <ActionBar />
            </div>
        </div>
    );
}