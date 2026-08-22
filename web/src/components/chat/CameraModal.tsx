import { useEffect, useRef, useState, useCallback, type MouseEvent as ReactMouseEvent, type TouchEvent as ReactTouchEvent } from 'react';
import { X, RefreshCw, Check, Sun, Contrast, Droplets, RotateCw, FlipHorizontal2, Sparkles, Crop, Move } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface CameraModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCapture: (file: File) => void;
}

interface EditState {
    brightness: number;
    contrast: number;
    saturate: number;
    blur: number;
    rotate: number;
    flipH: boolean;
}

interface CropRegion {
    x: number;   // 0-1 normalized
    y: number;
    w: number;
    h: number;
}

const DEFAULT_EDITS: EditState = {
    brightness: 100,
    contrast: 100,
    saturate: 100,
    blur: 0,
    rotate: 0,
    flipH: false,
};

const DEFAULT_CROP: CropRegion = { x: 0.1, y: 0.1, w: 0.8, h: 0.8 };

type EditTool = 'brightness' | 'contrast' | 'saturate' | 'blur' | null;
type EditMode = 'adjust' | 'crop' | null;

const ADJUST_TOOLS: { key: EditTool; icon: React.ElementType; label: string; min: number; max: number; unit: string }[] = [
    { key: 'brightness', icon: Sun, label: 'Brightness', min: 50, max: 150, unit: '%' },
    { key: 'contrast', icon: Contrast, label: 'Contrast', min: 50, max: 200, unit: '%' },
    { key: 'saturate', icon: Droplets, label: 'Saturation', min: 0, max: 200, unit: '%' },
    { key: 'blur', icon: Sparkles, label: 'Blur', min: 0, max: 10, unit: 'px' },
];

export function CameraModal({ isOpen, onClose, onCapture }: CameraModalProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const editCanvasRef = useRef<HTMLCanvasElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);
    const cropOverlayRef = useRef<HTMLDivElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
    const [error, setError] = useState<string | null>(null);

    // Edit state
    const [edits, setEdits] = useState<EditState>({ ...DEFAULT_EDITS });
    const [activeTool, setActiveTool] = useState<EditTool>(null);
    const [editMode, setEditMode] = useState<EditMode>(null);

    // Crop state
    const [crop, setCrop] = useState<CropRegion>({ ...DEFAULT_CROP });
    const [isDragging, setIsDragging] = useState(false);
    const [dragType, setDragType] = useState<'move' | 'nw' | 'ne' | 'sw' | 'se' | null>(null);
    const dragStart = useRef<{ mx: number; my: number; crop: CropRegion }>({ mx: 0, my: 0, crop: { ...DEFAULT_CROP } });

    // Start camera
    useEffect(() => {
        if (!isOpen) return;
        let isMounted = true;
        let activeStream: MediaStream | null = null;

        const startCamera = async () => {
            try {
                setError(null);
                const constraints = {
                    video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } },
                    audio: false,
                };
                let newStream: MediaStream;
                try {
                    newStream = await navigator.mediaDevices.getUserMedia(constraints);
                } catch {
                    newStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
                }
                if (!isMounted) { newStream.getTracks().forEach(t => t.stop()); return; }
                activeStream = newStream;
                setStream(newStream);
                if (videoRef.current) videoRef.current.srcObject = newStream;
            } catch (err: any) {
                if (!isMounted) return;
                if (err.name === "NotReadableError") setError("Camera is already in use by another app or browser tab.");
                else if (err.name === "NotAllowedError") setError("Camera access was denied. Please check site permissions.");
                else setError("Could not access camera. Please verify device connection.");
            }
        };
        startCamera();
        return () => { isMounted = false; activeStream?.getTracks().forEach(t => t.stop()); };
    }, [isOpen, facingMode]);

    const resetEdits = useCallback(() => {
        setEdits({ ...DEFAULT_EDITS });
        setActiveTool(null);
        setEditMode(null);
        setCrop({ ...DEFAULT_CROP });
    }, []);


    const handleCapture = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                if (facingMode === "user") { ctx.translate(canvas.width, 0); ctx.scale(-1, 1); }
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                ctx.setTransform(1, 0, 0, 1, 0, 0);
                setCapturedImage(canvas.toDataURL('image/jpeg', 0.92));
                resetEdits();
            }
        }
    };

    const getFilterString = () =>
        `brightness(${edits.brightness}%) contrast(${edits.contrast}%) saturate(${edits.saturate}%) blur(${edits.blur}px)`;

    const getTransformString = () => {
        let t = `rotate(${edits.rotate}deg)`;
        if (edits.flipH) t += ' scaleX(-1)';
        return t;
    };

    const handleSend = () => {
        if (!capturedImage) return;
        const img = new Image();
        img.onload = () => {
            const canvas = editCanvasRef.current || document.createElement('canvas');

            // If crop was applied, compute source rect
            const sx = crop.x * img.width;
            const sy = crop.y * img.height;
            const sw = crop.w * img.width;
            const sh = crop.h * img.height;

            const isRotated = edits.rotate % 180 !== 0;
            const outW = isRotated ? sh : sw;
            const outH = isRotated ? sw : sh;
            canvas.width = outW;
            canvas.height = outH;

            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            ctx.filter = getFilterString();
            ctx.translate(outW / 2, outH / 2);
            ctx.rotate((edits.rotate * Math.PI) / 180);
            if (edits.flipH) ctx.scale(-1, 1);
            ctx.drawImage(img, sx, sy, sw, sh, -sw / 2, -sh / 2, sw, sh);

            canvas.toBlob((blob) => {
                if (blob) {
                    onCapture(new File([blob], `photo_${Date.now()}.jpg`, { type: "image/jpeg" }));
                    handleClose();
                }
            }, 'image/jpeg', 0.92);
        };
        img.src = capturedImage;
    };

    const handleClose = () => {
        stream?.getTracks().forEach(t => t.stop());
        setStream(null);
        setCapturedImage(null);
        resetEdits();
        setError(null);
        onClose();
    };

    const handleRetake = () => { setCapturedImage(null); resetEdits(); };
    const toggleCamera = () => setFacingMode(p => p === "user" ? "environment" : "user");
    const updateEdit = (key: keyof EditState, value: number | boolean) => setEdits(prev => ({ ...prev, [key]: value }));

    // ─── Crop drag logic ───
    const getPointerPos = (e: ReactMouseEvent | ReactTouchEvent | globalThis.MouseEvent | globalThis.TouchEvent) => {
        if ('touches' in e) {
            const touch = (e as any).touches[0] || (e as any).changedTouches[0];
            return { x: touch.clientX, y: touch.clientY };
        }
        return { x: (e as any).clientX, y: (e as any).clientY };
    };

    const startDrag = (type: 'move' | 'nw' | 'ne' | 'sw' | 'se', e: ReactMouseEvent | ReactTouchEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const pos = getPointerPos(e);
        dragStart.current = { mx: pos.x, my: pos.y, crop: { ...crop } };
        setDragType(type);
        setIsDragging(true);
    };

    useEffect(() => {
        if (!isDragging || !dragType) return;

        const onMove = (e: globalThis.MouseEvent | globalThis.TouchEvent) => {
            const overlay = cropOverlayRef.current;
            if (!overlay) return;
            const rect = overlay.getBoundingClientRect();
            const pos = getPointerPos(e);
            const dx = (pos.x - dragStart.current.mx) / rect.width;
            const dy = (pos.y - dragStart.current.my) / rect.height;
            const prev = dragStart.current.crop;

            setCrop(() => {
                let { x, y, w, h } = { ...prev };
                if (dragType === 'move') {
                    x = Math.max(0, Math.min(1 - w, prev.x + dx));
                    y = Math.max(0, Math.min(1 - h, prev.y + dy));
                } else {
                    if (dragType === 'nw' || dragType === 'sw') {
                        const newX = Math.max(0, Math.min(prev.x + prev.w - 0.05, prev.x + dx));
                        w = prev.w - (newX - prev.x);
                        x = newX;
                    }
                    if (dragType === 'ne' || dragType === 'se') {
                        w = Math.max(0.05, Math.min(1 - prev.x, prev.w + dx));
                    }
                    if (dragType === 'nw' || dragType === 'ne') {
                        const newY = Math.max(0, Math.min(prev.y + prev.h - 0.05, prev.y + dy));
                        h = prev.h - (newY - prev.y);
                        y = newY;
                    }
                    if (dragType === 'sw' || dragType === 'se') {
                        h = Math.max(0.05, Math.min(1 - prev.y, prev.h + dy));
                    }
                }
                return { x, y, w, h };
            });
        };

        const onEnd = () => {
            setIsDragging(false);
            setDragType(null);
        };

        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onEnd);
        window.addEventListener('touchmove', onMove, { passive: false });
        window.addEventListener('touchend', onEnd);
        return () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onEnd);
            window.removeEventListener('touchmove', onMove);
            window.removeEventListener('touchend', onEnd);
        };
    }, [isDragging, dragType]);

    if (!isOpen) return null;

    const activeToolConfig = ADJUST_TOOLS.find(t => t.key === activeTool);
    const isCropping = editMode === 'crop';

    const handleCornerStyle = "absolute w-6 h-6 z-50";
    const cornerLine = "absolute bg-white";

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black animate-in fade-in duration-200">
            <div className="relative w-full h-full bg-black text-white overflow-hidden">

                {/* Viewport */}
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-black" ref={cropOverlayRef}>
                    {!capturedImage ? (
                        <>
                            <video ref={videoRef} autoPlay playsInline muted
                                className={`w-full h-full object-contain ${facingMode === "user" ? "scale-x-[-1]" : ""}`} />
                            <canvas ref={canvasRef} className="hidden" />
                        </>
                    ) : (
                        <div className="relative flex items-center justify-center w-full h-full">
                            <img
                                ref={imgRef}
                                src={capturedImage}
                                alt="Captured preview"
                                className="max-w-full max-h-full object-contain transition-[filter] duration-200 select-none"
                                style={{ filter: getFilterString(), transform: getTransformString() }}
                                draggable={false}
                            />

                            {/* Crop overlay */}
                            {isCropping && imgRef.current && (
                                <div className="absolute inset-0 z-20" style={{ pointerEvents: 'none' }}>
                                    {/* Dark mask around crop */}
                                    <div className="absolute inset-0 bg-black/60" style={{
                                        clipPath: `polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, ${crop.x * 100}% ${crop.y * 100}%, ${crop.x * 100}% ${(crop.y + crop.h) * 100}%, ${(crop.x + crop.w) * 100}% ${(crop.y + crop.h) * 100}%, ${(crop.x + crop.w) * 100}% ${crop.y * 100}%, ${crop.x * 100}% ${crop.y * 100}%)`
                                    }} />

                                    {/* Crop frame */}
                                    <div
                                        className="absolute border-2 border-white/90 cursor-move"
                                        style={{
                                            left: `${crop.x * 100}%`, top: `${crop.y * 100}%`,
                                            width: `${crop.w * 100}%`, height: `${crop.h * 100}%`,
                                            pointerEvents: 'auto',
                                        }}
                                        onMouseDown={(e) => startDrag('move', e)}
                                        onTouchStart={(e) => startDrag('move', e)}
                                    >
                                        {/* Grid lines */}
                                        <div className="absolute inset-0">
                                            <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/30" />
                                            <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/30" />
                                            <div className="absolute top-1/3 left-0 right-0 h-px bg-white/30" />
                                            <div className="absolute top-2/3 left-0 right-0 h-px bg-white/30" />
                                        </div>

                                        {/* Corner handles */}
                                        {/* NW */}
                                        <div className={`${handleCornerStyle} -top-1 -left-1 cursor-nw-resize`}
                                            onMouseDown={(e) => startDrag('nw', e)} onTouchStart={(e) => startDrag('nw', e)}
                                            style={{ pointerEvents: 'auto' }}>
                                            <div className={`${cornerLine} top-0 left-0 w-5 h-0.75 rounded-full`} />
                                            <div className={`${cornerLine} top-0 left-0 w-0.75 h-5 rounded-full`} />
                                        </div>
                                        {/* NE */}
                                        <div className={`${handleCornerStyle} -top-1 -right-1 cursor-ne-resize`}
                                            onMouseDown={(e) => startDrag('ne', e)} onTouchStart={(e) => startDrag('ne', e)}
                                            style={{ pointerEvents: 'auto' }}>
                                            <div className={`${cornerLine} top-0 right-0 w-5 h-0.75 rounded-full`} />
                                            <div className={`${cornerLine} top-0 right-0 w-0.75 h-5 rounded-full`} />
                                        </div>
                                        {/* SW */}
                                        <div className={`${handleCornerStyle} -bottom-1 -left-1 cursor-sw-resize`}
                                            onMouseDown={(e) => startDrag('sw', e)} onTouchStart={(e) => startDrag('sw', e)}
                                            style={{ pointerEvents: 'auto' }}>
                                            <div className={`${cornerLine} bottom-0 left-0 w-5 h-0.75 rounded-full`} />
                                            <div className={`${cornerLine} bottom-0 left-0 w-0.75 h-5 rounded-full`} />
                                        </div>
                                        {/* SE */}
                                        <div className={`${handleCornerStyle} -bottom-1 -right-1 cursor-se-resize`}
                                            onMouseDown={(e) => startDrag('se', e)} onTouchStart={(e) => startDrag('se', e)}
                                            style={{ pointerEvents: 'auto' }}>
                                            <div className={`${cornerLine} bottom-0 right-0 w-5 h-0.75 rounded-full`} />
                                            <div className={`${cornerLine} bottom-0 right-0 w-0.75 h-5 rounded-full`} />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    <canvas ref={editCanvasRef} className="hidden" />
                </div>

                {/* Top Bar */}
                <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-5 pt-5 pb-3">
                    <button onClick={handleClose}
                        className="h-10 w-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-md transition-colors active:scale-95">
                        <X className="h-5 w-5" />
                    </button>
                    <div className="bg-black/50 text-white/90 backdrop-blur-md text-[11px] uppercase tracking-widest font-semibold px-4 py-1.5 rounded-full">
                        {capturedImage ? (isCropping ? 'Crop' : 'Edit') : 'Photo'}
                    </div>
                    <div className="w-10" />
                </div>

                {/* Bottom Controls */}
                <div className="absolute bottom-0 left-0 right-0 z-30">
                    {!capturedImage ? (
                        /* ── Camera Controls ── */
                        <div className="flex items-center justify-between px-8 pb-8 pt-4">
                            <button onClick={toggleCamera} disabled={!!error}
                                className="h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur-md transition-colors active:scale-95 disabled:opacity-50">
                                <RefreshCw className="h-5 w-5" />
                            </button>
                            <button onClick={handleCapture} disabled={!!error}
                                className="h-20 w-20 rounded-full border-[5px] border-white flex items-center justify-center bg-transparent active:scale-90 transition-transform disabled:opacity-50 shadow-lg">
                                <div className="h-14 w-14 rounded-full bg-white active:bg-neutral-200 transition-colors" />
                            </button>
                            <div className="w-12" />
                        </div>
                    ) : (
                        /* ── Edit Panel (Pill-style) ── */
                        <div className="flex flex-col items-center pb-6 px-4 gap-4">

                            {/* Slider (when a tool is active) */}
                            {activeTool && activeToolConfig && !isCropping && (
                                <div className="w-full max-w-sm px-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-medium text-white/70 uppercase tracking-wider">{activeToolConfig.label}</span>
                                        <span className="text-xs font-mono text-white/60">
                                            {edits[activeTool as keyof EditState] as number}{activeToolConfig.unit}
                                        </span>
                                    </div>
                                    <input type="range" min={activeToolConfig.min} max={activeToolConfig.max}
                                        step={activeTool === 'blur' ? 0.5 : 1}
                                        value={edits[activeTool as keyof EditState] as number}
                                        onChange={(e) => updateEdit(activeTool as keyof EditState, parseFloat(e.target.value))}
                                        className="w-full h-1 rounded-full appearance-none cursor-pointer bg-white/20 accent-white
                                            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer
                                            [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:shadow-lg [&::-moz-range-thumb]:cursor-pointer"
                                    />
                                </div>
                            )}

                            {/* ── Floating Pill Toolbar ── */}
                            <div className="inline-flex items-center gap-1 bg-neutral-800/80 backdrop-blur-xl rounded-full px-2 py-1.5 shadow-2xl border border-white/10">
                                {/* Adjust tools */}
                                {ADJUST_TOOLS.map((tool) => {
                                    const Icon = tool.icon;
                                    const isActive = activeTool === tool.key && !isCropping;
                                    return (
                                        <button key={tool.key}
                                            onClick={() => { setEditMode('adjust'); setActiveTool(isActive ? null : tool.key); }}
                                            className={`h-9 w-9 rounded-full flex items-center justify-center transition-all duration-150 active:scale-90
                                                ${isActive ? 'bg-white text-black' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
                                            title={tool.label}>
                                            <Icon className="h-4 w-4" />
                                        </button>
                                    );
                                })}

                                {/* Divider */}
                                <div className="w-px h-5 bg-white/15 mx-0.5" />

                                {/* Crop */}
                                <button onClick={() => { setActiveTool(null); setEditMode(isCropping ? null : 'crop'); }}
                                    className={`h-9 w-9 rounded-full flex items-center justify-center transition-all duration-150 active:scale-90
                                        ${isCropping ? 'bg-white text-black' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
                                    title="Crop">
                                    <Crop className="h-4 w-4" />
                                </button>

                                {/* Rotate */}
                                <button onClick={() => updateEdit('rotate', (edits.rotate + 90) % 360)}
                                    className="h-9 w-9 rounded-full text-white/70 hover:text-white hover:bg-white/10 flex items-center justify-center transition-all active:scale-90"
                                    title="Rotate">
                                    <RotateCw className="h-4 w-4" />
                                </button>

                                {/* Flip */}
                                <button onClick={() => updateEdit('flipH', !edits.flipH)}
                                    className={`h-9 w-9 rounded-full flex items-center justify-center transition-all duration-150 active:scale-90
                                        ${edits.flipH ? 'bg-white text-black' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
                                    title="Flip">
                                    <FlipHorizontal2 className="h-4 w-4" />
                                </button>

                                {/* Divider */}
                                <div className="w-px h-5 bg-white/15 mx-0.5" />

                                {/* Retake (X) */}
                                <button onClick={handleRetake}
                                    className="h-9 w-9 rounded-full text-white/70 hover:text-red-400 hover:bg-white/10 flex items-center justify-center transition-all active:scale-90"
                                    title="Retake">
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            {/* Send button */}
                            <Button className="gap-2 rounded-full h-11 px-10 bg-white hover:bg-white/90 text-black active:scale-95 shadow-lg font-semibold"
                                onClick={handleSend}>
                                <Check className="h-4 w-4" /> Send
                            </Button>
                        </div>
                    )}
                </div>

                {/* Error Overlay */}
                {error && (
                    <div className="absolute inset-0 z-40 bg-black/90 flex items-center justify-center p-6">
                        <div className="text-destructive text-center p-6 text-sm font-medium bg-zinc-950/80 rounded-2xl mx-4 shadow-lg border border-red-500/20 max-w-xs animate-in zoom-in duration-150">
                            {error}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
