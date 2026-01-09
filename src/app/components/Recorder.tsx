import { useVideoContext } from "../hooks/useVideoContext";
import Preview from "./Preview";
import ActionBar from "./ActionBar";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

export default function Recorder() {
    const { error, loading } = useVideoContext();

    if (loading) {
        return (
            <AiOutlineLoading3Quarters className="w-5 h-5 animate-spin" />
        );
    }

    if (error) {
        return (
            <div className="text-red-500 mb-4">{error}</div>
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