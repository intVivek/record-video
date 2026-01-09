import Button from "./UI/Button";
import { useVideoContext } from "../hooks/useVideoContext";
import { FaStop, FaUpload, FaPlay, FaTrash } from "react-icons/fa";
import { useSimulateUpload } from "../hooks/useSimulateUpload";
import { twMerge } from "tailwind-merge";

export default function ActionBar() {
    const { isRecording, startRecording, stopRecording, isVideoAvailable, deleteVideoRecord } = useVideoContext();
    const { uploading, uploadProgress, uploadError, startUpload, resetUpload } = useSimulateUpload();

    const handleUpload = () => {
        if (uploadError) {
            resetUpload();
        }
        startUpload();
    };

    const handleStartRecording = () => {
        if (uploadError) {
            resetUpload();
        }
        startRecording();
    }

    const handleStopRecording = () => {
        if (uploadError) {
            resetUpload();
        }
        stopRecording();
    }

    const handleDeleteVideoRecord = () => {
        if (uploadError) {
            resetUpload();
        }
        deleteVideoRecord();
    }

    return (
        <div className={twMerge("flex flex-col items-center gap-2", uploading && "pointer-events-none opacity-95")}>
            <div className="flex gap-4">
                {!isVideoAvailable && isRecording && (
                    <Button onClick={handleStopRecording}>
                        <FaStop />
                        Stop Recording
                    </Button>
                )}
                {!isVideoAvailable && !isRecording && (
                    <Button onClick={handleStartRecording}>
                        <FaPlay />
                        Start Recording
                    </Button>
                )}
                {isVideoAvailable && !isRecording && (
                    <>
                        <Button secondary onClick={handleDeleteVideoRecord}>
                            <FaTrash />
                            Delete
                        </Button>
                        <Button onClick={handleUpload} disabled={uploading}>
                            {uploading ? (
                                <div className="w-[130px]">Uploading... {uploadProgress}%</div>
                            ) : (
                                <>
                                    <FaUpload />
                                    {`Upload ${uploadError ? "again" : ""}`}
                                </>
                            )}
                        </Button>
                    </>
                )}
            </div>
            {uploadError && (
                <div className="flex items-center gap-2 mt-2">
                    <span className="text-red-500 text-sm">{uploadError}</span>
                </div>
            )}
        </div>
    );
}