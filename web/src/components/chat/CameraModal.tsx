import { useEffect, useRef, useState } from 'react';
import { X, RefreshCw, Check, Undo } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface CameraModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCapture: (file: File) => void;
}

export function CameraModal({ isOpen, onClose, onCapture }: CameraModalProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
    const [error, setError] = useState<string | null>(null);

    // Start camera stream when modal opens
    useEffect(() => {
        if (!isOpen) return;

        let isMounted = true;
        let activeStream: MediaStream | null = null;

        const startCamera = async () => {
            try {
                setError(null);
                // Get constraints
                const constraints = {
                    video: {
                        facingMode: facingMode,
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    },
                    audio: false
                };

                let newStream: MediaStream;
                try {
                    newStream = await navigator.mediaDevices.getUserMedia(constraints);
                } catch (err) {
                    console.warn("Camera custom constraints failed, falling back to simple video: true", err);
                    newStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
                }

                if (!isMounted) {
                    newStream.getTracks().forEach(track => track.stop());
                    return;
                }

                activeStream = newStream;
                setStream(newStream);
                if (videoRef.current) {
                    videoRef.current.srcObject = newStream;
                }
            } catch (err: any) {
                console.error("Camera access error:", err);
                if (isMounted) {
                    if (err.name === "NotReadableError") {
                        setError("Camera is already in use by another app or browser tab.");
                    } else if (err.name === "NotAllowedError") {
                        setError("Camera access was denied. Please check site permissions.");
                    } else {
                        setError("Could not access camera. Please verify device connection.");
                    }
                }
            }
        };

        startCamera();

        return () => {
            isMounted = false;
            if (activeStream) {
                activeStream.getTracks().forEach(track => track.stop());
            }
        };
    }, [isOpen, facingMode]);

    if (!isOpen) return null;

    const handleCapture = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            if (context) {
                // If user camera, horizontal flip for mirroring preview
                if (facingMode === "user") {
                    context.translate(canvas.width, 0);
                    context.scale(-1, 1);
                }
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                // Reset transform
                context.setTransform(1, 0, 0, 1, 0, 0);
                const dataUrl = canvas.toDataURL('image/jpeg');
                setCapturedImage(dataUrl);
            }
        }
    };

    const handleSend = () => {
        if (capturedImage) {
            fetch(capturedImage)
                .then(res => res.blob())
                .then(blob => {
                    const file = new File([blob], `photo_${Date.now()}.jpg`, { type: "image/jpeg" });
                    onCapture(file);
                    handleClose();
                });
        }
    };

    const handleClose = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        setCapturedImage(null);
        setError(null);
        onClose();
    };

    const toggleCamera = () => {
        setFacingMode(prev => prev === "user" ? "environment" : "user");
    };

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-200 p-0 sm:p-4">
            <div className="relative w-full h-full sm:h-[85vh] sm:max-h-[750px] sm:max-w-md bg-black text-white sm:rounded-[36px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Viewport (Full Screen Background) */}
                <div className="absolute inset-0 z-10">
                    {!capturedImage ? (
                        <>
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className={`w-full h-full object-cover ${facingMode === "user" ? "scale-x-[-1]" : ""}`}
                            />
                            <canvas ref={canvasRef} className="hidden" />
                        </>
                    ) : (
                        <img
                            src={capturedImage}
                            alt="Captured preview"
                            className="w-full h-full object-cover"
                        />
                    )}
                </div>

                {/* Floating Top Controls */}
                <div className="absolute top-6 left-6 right-6 z-30 flex items-center justify-center pointer-events-none">

                    <div className="bg-black/40 text-white/90 backdrop-blur-md text-[11px] uppercase tracking-widest font-semibold px-3 py-1 rounded-full shadow-sm">
                        Photo Mode
                    </div>
                </div>

                {/* Floating Bottom Controls */}
                <div className="absolute bottom-6 left-6 right-6 z-30 flex items-center justify-between pointer-events-none">
                    {!capturedImage ? (
                        <div className="flex w-full items-center justify-between px-2">
                            {/* Cancel / Close */}
                            <button
                                onClick={handleClose}
                                className="pointer-events-auto h-12 w-12 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-md transition-colors shadow-sm active:scale-95"
                            >
                                <X className="h-5 w-5" />
                            </button>

                            {/* Concentric Shutter Button */}
                            <button
                                onClick={handleCapture}
                                disabled={!!error}
                                className="pointer-events-auto h-20 w-20 rounded-full border-[5px] border-white flex items-center justify-center bg-transparent active:scale-90 transition-transform disabled:opacity-50 shadow-md"
                            >
                                <div className="h-14 w-14 rounded-full bg-white active:bg-neutral-200 transition-colors" />
                            </button>

                            {/* Toggle Camera Button */}
                            <button
                                onClick={toggleCamera}
                                disabled={!!error}
                                className="pointer-events-auto h-12 w-12 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-md transition-colors shadow-sm active:scale-95 disabled:opacity-50"
                            >
                                <RefreshCw className="h-5 w-5" />
                            </button>
                        </div>
                    ) : (
                        <div className="flex w-full gap-3 px-2">
                            {/* Retake */}
                            <Button
                                variant="outline"
                                className="pointer-events-auto flex-1 gap-2 rounded-full h-12 bg-black/40 border-white/20 text-white hover:bg-black/60 active:scale-95 backdrop-blur-md shadow-sm"
                                onClick={() => setCapturedImage(null)}
                            >
                                <Undo className="h-4 w-4" /> Retake
                            </Button>

                            {/* Send */}
                            <Button
                                className="pointer-events-auto flex-1 gap-2 rounded-full h-12 bg-white hover:bg-white/90 text-black active:scale-95 shadow-sm"
                                onClick={handleSend}
                            >
                                <Check className="h-4 w-4" /> Send
                            </Button>
                        </div>
                    )}
                </div>

                {/* Error Overlay */}
                {error && (
                    <div className="absolute inset-0 z-40 bg-zinc-950/90 flex items-center justify-center p-6">
                        <div className="text-destructive text-center p-6 text-sm font-medium bg-zinc-950/80 rounded-2xl mx-4 shadow-lg border border-red-500/20 max-w-xs animate-in zoom-in duration-150">
                            {error}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
