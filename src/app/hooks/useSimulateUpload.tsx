import { useState, useEffect, useRef } from "react";

interface UseSimulateUploadReturn {
    uploading: boolean;
    uploadProgress: number;
    uploadError: string | null;
    startUpload: () => void;
    resetUpload: () => void;
}

export const useSimulateUpload = (): UseSimulateUploadReturn => {
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const failureThresholdRef = useRef<number>(0);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const startUpload = () => {
        // Generate random failure threshold between 30 and 90
        failureThresholdRef.current = Math.floor(Math.random() * 60) + 30;
        setUploading(true);
        setUploadProgress(0);
        setUploadError(null);
    };

    const resetUpload = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        setUploading(false);
        setUploadProgress(0);
        setUploadError(null);
    };

    useEffect(() => {
        if (uploading) {
            intervalRef.current = setInterval(() => {
                setUploadProgress((prevProgress) => {
                    const increment = Math.floor(Math.random() * 10) + 3;
                    const newProgress = Math.min(prevProgress + increment, 100);

                    if (prevProgress < failureThresholdRef.current && newProgress >= failureThresholdRef.current) {
                        if (intervalRef.current) {
                            clearInterval(intervalRef.current);
                            intervalRef.current = null;
                        }
                        setUploading(false);
                        setUploadError("Upload failed. Please try again.");
                        return prevProgress;
                    }
                    if (newProgress >= 100) {
                        if (intervalRef.current) {
                            clearInterval(intervalRef.current);
                            intervalRef.current = null;
                        }
                        setUploading(false);
                        return 100;
                    }

                    return newProgress;
                });
            }, 500); // Update every 500ms

            return () => {
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                }
            };
        }
    }, [uploading]);

    return {
        uploading,
        uploadProgress,
        uploadError,
        startUpload,
        resetUpload,
    };
};
