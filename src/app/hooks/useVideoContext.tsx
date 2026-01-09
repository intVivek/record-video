import React, { createContext, useContext, useReducer, ReactNode, useEffect, useRef } from "react";
import { getAllVideos, saveVideo, deleteVideo, VideoRecord } from "../utils/db";

interface VideoState {
    video: VideoRecord | null;
    isRecording: boolean;
    stream: MediaStream | null;
    error: string | null;
    loading: boolean;
}

type VideoAction =
    | { type: 'SET_VIDEO'; payload: VideoRecord | null }
    | { type: 'SET_RECORDING'; payload: boolean }
    | { type: 'SET_STREAM'; payload: MediaStream | null }
    | { type: 'SET_ERROR'; payload: string | null }
    | { type: 'SET_LOADING'; payload: boolean };

interface VideoContextType extends VideoState {
    startRecording: () => void;
    stopRecording: () => void;
    deleteVideoRecord: () => void;
    videoRef: React.RefObject<HTMLVideoElement | null>;
    isVideoAvailable: boolean;
}

const initialState: VideoState = {
    video: null,
    isRecording: false,
    stream: null,
    error: null,
    loading: true,
};

const videoReducer = (state: VideoState, action: VideoAction): VideoState => {
    switch (action.type) {
        case 'SET_VIDEO': return { ...state, video: action.payload };
        case 'SET_RECORDING': return { ...state, isRecording: action.payload };
        case 'SET_STREAM': return { ...state, stream: action.payload };
        case 'SET_ERROR': return { ...state, error: action.payload };
        case 'SET_LOADING': return { ...state, loading: action.payload };
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
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
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
            dispatch({ type: 'SET_ERROR', payload: null });
        } catch (err) {
            console.error("Error starting recording:", err);
            dispatch({ type: 'SET_ERROR', payload: "Could not access camera/microphone." });
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

    return (
        <VideoContext.Provider
            value={{ ...state, startRecording, stopRecording, deleteVideoRecord, videoRef, isVideoAvailable }}
        >
            {children}
        </VideoContext.Provider>
    );
};
