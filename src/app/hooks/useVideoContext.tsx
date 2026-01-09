import React, { createContext, useContext, useReducer, ReactNode, useEffect, useRef } from "react";
import { getAllVideos, saveVideo, deleteVideo, VideoRecord } from "../utils/db";

interface VideoState {
    video: VideoRecord | null;
    isRecording: boolean;
    stream: MediaStream | null;
    error: string | null;
    loading: boolean;
    permissionGranted: boolean;
}

type VideoAction =
    | { type: 'SET_VIDEO'; payload: VideoRecord | null }
    | { type: 'SET_RECORDING'; payload: boolean }
    | { type: 'SET_STREAM'; payload: MediaStream | null }
    | { type: 'SET_ERROR'; payload: string | null }
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_PERMISSION'; payload: boolean };

interface VideoContextType extends VideoState {
    startRecording: () => void;
    stopRecording: () => void;
    deleteVideoRecord: () => void;
    requestPermission: () => void;
    videoRef: React.RefObject<HTMLVideoElement | null>;
    isVideoAvailable: boolean;
}

const initialState: VideoState = {
    video: null,
    isRecording: false,
    stream: null,
    error: null,
    loading: true,
    permissionGranted: false,
};

const videoReducer = (state: VideoState, action: VideoAction): VideoState => {
    switch (action.type) {
        case 'SET_VIDEO': return { ...state, video: action.payload };
        case 'SET_RECORDING': return { ...state, isRecording: action.payload };
        case 'SET_STREAM': return { ...state, stream: action.payload };
        case 'SET_ERROR': return { ...state, error: action.payload };
        case 'SET_LOADING': return { ...state, loading: action.payload };
        case 'SET_PERMISSION': return { ...state, permissionGranted: action.payload };
        default: return state;
    }
};

export const VideoContext = createContext<VideoContextType | undefined>(undefined);

export const useVideoContext = (): VideoContextType => {
    const context = useContext(VideoContext);
    if (context === undefined) {
        throw new Error("useVideoContext must be used within a VideoProvider");
    }
    return context;
};

export const VideoProvider = ({ children }: { children: ReactNode }) => {
    const [state, dispatch] = useReducer(videoReducer, initialState);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const videoRef = useRef<HTMLVideoElement>(null);

    const isVideoAvailable = !!state.video;

    useEffect(() => {
        getAllVideos()
            .then(videos => {
                if (videos.length > 0) {
                    dispatch({ type: 'SET_VIDEO', payload: videos[0] });
                }
            })
            .catch(err => console.error("Failed to load video:", err))
            .finally(() => dispatch({ type: 'SET_LOADING', payload: false }));
    }, []);

    useEffect(() => {
        if (videoRef.current && state.stream) {
            videoRef.current.srcObject = state.stream;
        }
    }, [state.stream]);

    const startRecording = async () => {
        try {
            // Clear any previous errors
            dispatch({ type: 'SET_ERROR', payload: null });

            // Check if getUserMedia is supported
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('getUserMedia is not supported in this browser');
            }

            // Request camera and microphone access - this will trigger browser permission prompt
            // Using simpler constraints for better iOS Chrome compatibility
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });

            dispatch({ type: 'SET_STREAM', payload: stream });

            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const blob = new Blob(chunksRef.current, { type: 'video/webm' });
                try {
                    if (state.video) {
                        await deleteVideo(state.video.id);
                    }
                    const savedVideo = await saveVideo(blob);
                    dispatch({ type: 'SET_VIDEO', payload: savedVideo });
                } catch (error) {
                    console.error("Failed to save video:", error);
                    dispatch({ type: 'SET_ERROR', payload: "Failed to save video locally." });
                }

                stream.getTracks().forEach(track => track.stop());
                dispatch({ type: 'SET_STREAM', payload: null });
            };

            mediaRecorder.start();
            dispatch({ type: 'SET_RECORDING', payload: true });
        } catch (err: any) {
            console.error("Error starting recording:", err);

            // Provide more specific error messages with actionable guidance
            let errorMessage = "Could not access camera/microphone.";

            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                errorMessage = "Please allow camera and microphone access when your browser asks. Click 'Allow' in the permission popup, or check your browser's address bar for a camera/microphone icon to grant permissions.";
            } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                errorMessage = "No camera or microphone found on your device.";
            } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
                errorMessage = "Camera/microphone is already in use by another application. Please close other apps using your camera/microphone and try again.";
            } else if (err.name === 'OverconstrainedError') {
                errorMessage = "Camera/microphone constraints could not be satisfied.";
            } else if (err.name === 'NotSupportedError') {
                errorMessage = "Your browser does not support video recording. Please use Chrome, Safari, Firefox, or Edge.";
            } else if (err.name === 'SecurityError') {
                errorMessage = "Camera/microphone access blocked. Make sure you're accessing this site via HTTPS and try again.";
            }

            dispatch({ type: 'SET_ERROR', payload: errorMessage });
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && state.isRecording) {
            mediaRecorderRef.current.stop();
            dispatch({ type: 'SET_RECORDING', payload: false });
        }
    };

    const deleteVideoRecord = async () => {
        if (!state.video) return;
        try {
            await deleteVideo(state.video.id);
            dispatch({ type: 'SET_VIDEO', payload: null });
        } catch (error) {
            console.error("Failed to delete video:", error);
        }
    };

    const requestPermission = async () => {
        try {
            // Clear any previous errors
            dispatch({ type: 'SET_ERROR', payload: null });

            // Check if getUserMedia is supported
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('getUserMedia is not supported in this browser');
            }

            // Request camera and microphone access - this will trigger browser permission prompt
            // Using simpler constraints for better iOS Chrome compatibility
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });

            // Permission granted! Mark it and stop the stream (we don't need it yet)
            dispatch({ type: 'SET_PERMISSION', payload: true });

            // Stop all tracks immediately - we just wanted to check permission
            stream.getTracks().forEach(track => track.stop());

        } catch (err: any) {
            console.error("Error requesting permission:", err);

            // Provide more specific error messages with actionable guidance
            let errorMessage = "Could not access camera/microphone.";

            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                errorMessage = "Please allow camera and microphone access when your browser asks. Click 'Allow' in the permission popup, or check your browser's address bar for a camera/microphone icon to grant permissions.";
            } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                errorMessage = "No camera or microphone found on your device.";
            } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
                errorMessage = "Camera/microphone is already in use by another application. Please close other apps using your camera/microphone and try again.";
            } else if (err.name === 'OverconstrainedError') {
                errorMessage = "Camera/microphone constraints could not be satisfied.";
            } else if (err.name === 'NotSupportedError') {
                errorMessage = "Your browser does not support video recording. Please use Chrome, Safari, Firefox, or Edge.";
            } else if (err.name === 'SecurityError') {
                errorMessage = "Camera/microphone access blocked. Make sure you're accessing this site via HTTPS and try again.";
            }

            dispatch({ type: 'SET_ERROR', payload: errorMessage });
            dispatch({ type: 'SET_PERMISSION', payload: false });
        }
    };

    return (
        <VideoContext.Provider
            value={{ ...state, startRecording, stopRecording, deleteVideoRecord, requestPermission, videoRef, isVideoAvailable }}
        >
            {children}
        </VideoContext.Provider>
    );
};
