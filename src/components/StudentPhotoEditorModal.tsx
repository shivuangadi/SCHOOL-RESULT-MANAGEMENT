import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  Camera,
  Crop,
  Check,
  RefreshCw,
  Sliders,
  Palette,
  Square,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import {
  processStudentPhoto,
  ProcessedPhotoResult,
  mmToPixelsAt300Dpi,
} from '../utils/studentPhotoHelper';

interface StudentPhotoEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageFile: File | null;
  initialPhotoUrl?: string | null;
  onPhotoProcessed: (result: ProcessedPhotoResult) => void;
}

export const StudentPhotoEditorModal: React.FC<StudentPhotoEditorModalProps> = ({
  isOpen,
  onClose,
  imageFile,
  initialPhotoUrl,
  onPhotoProcessed,
}) => {
  // Source image state
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [naturalDimensions, setNaturalDimensions] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  // Settings
  const [hasFrame, setHasFrame] = useState<boolean>(true);
  const [frameColor, setFrameColor] = useState<string>('#000000');
  const [frameThicknessMm, setFrameThicknessMm] = useState<number>(0.5);
  const [maxSizeKb, setMaxSizeKb] = useState<number>(500);

  // Crop Box normalized to percentages (0 to 100) or pixel coordinates on the displayed image
  const [cropBox, setCropBox] = useState<{ x: number; y: number; width: number; height: number }>({
    x: 10,
    y: 10,
    width: 80,
    height: 80,
  });

  // Dragging & Resizing state
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragAction, setDragAction] = useState<'move' | 'nw' | 'ne' | 'sw' | 'se' | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number; box: typeof cropBox }>({
    x: 0,
    y: 0,
    box: { x: 0, y: 0, width: 0, height: 0 },
  });

  // Processing state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [previewResult, setPreviewResult] = useState<ProcessedPhotoResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load image file or initial URL into source URL
  useEffect(() => {
    if (!isOpen) return;

    let objectUrlToRevoke: string | null = null;

    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      objectUrlToRevoke = url;
      setImageSrc(url);
      setPreviewResult(null);
      setErrorMessage(null);
    } else if (initialPhotoUrl) {
      // Fetch as blob to prevent canvas cross-origin taint if coming from Firebase Storage
      fetch(initialPhotoUrl)
        .then((res) => res.blob())
        .then((blob) => {
          const url = URL.createObjectURL(blob);
          objectUrlToRevoke = url;
          setImageSrc(url);
          setPreviewResult(null);
          setErrorMessage(null);
        })
        .catch(() => {
          setImageSrc(initialPhotoUrl);
          setPreviewResult(null);
          setErrorMessage(null);
        });
    }

    return () => {
      if (objectUrlToRevoke) {
        URL.revokeObjectURL(objectUrlToRevoke);
      }
    };
  }, [imageFile, initialPhotoUrl, isOpen]);

  // When image loads, initialize crop box centered with a 3:4 portrait aspect ratio
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setNaturalDimensions({ width: img.naturalWidth, height: img.naturalHeight });

    // Calculate initial 3:4 portrait crop box centered
    const imgRatio = img.naturalWidth / img.naturalHeight;
    const targetRatio = 3 / 4; // width / height

    let boxWidth = 70;
    let boxHeight = 70;

    if (imgRatio > targetRatio) {
      // Image is wider than 3:4 portrait
      boxHeight = 85;
      boxWidth = (boxHeight * targetRatio) / imgRatio;
    } else {
      // Image is taller or equal
      boxWidth = 85;
      boxHeight = (boxWidth * imgRatio) / targetRatio;
    }

    // Clamp and center
    boxWidth = Math.min(95, Math.max(20, boxWidth));
    boxHeight = Math.min(95, Math.max(20, boxHeight));
    const boxX = (100 - boxWidth) / 2;
    const boxY = (100 - boxHeight) / 2;

    setCropBox({
      x: Math.round(boxX),
      y: Math.round(boxY),
      width: Math.round(boxWidth),
      height: Math.round(boxHeight),
    });
  };

  // Convert percentage crop box to natural image pixel coordinates
  const getNaturalCropArea = useCallback(() => {
    if (!naturalDimensions.width || !naturalDimensions.height) {
      return { x: 0, y: 0, width: 300, height: 400 };
    }
    const x = Math.round((cropBox.x / 100) * naturalDimensions.width);
    const y = Math.round((cropBox.y / 100) * naturalDimensions.height);
    const width = Math.round((cropBox.width / 100) * naturalDimensions.width);
    const height = Math.round((cropBox.height / 100) * naturalDimensions.height);

    return {
      x: Math.max(0, x),
      y: Math.max(0, y),
      width: Math.min(naturalDimensions.width - x, Math.max(10, width)),
      height: Math.min(naturalDimensions.height - y, Math.max(10, height)),
    };
  }, [cropBox, naturalDimensions]);

  // Generate / update live preview
  const handleGeneratePreview = useCallback(async () => {
    if (!imageRef.current) return;
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const area = getNaturalCropArea();
      const result = await processStudentPhoto(imageRef.current, {
        cropArea: area,
        hasFrame,
        frameColor,
        frameThicknessMm,
        maxSizeKb,
      });
      setPreviewResult(result);
    } catch (err: any) {
      setErrorMessage(`Photo processing error: ${err?.message || 'Failed to process photo'}`);
    } finally {
      setIsProcessing(false);
    }
  }, [getNaturalCropArea, hasFrame, frameColor, frameThicknessMm, maxSizeKb]);

  // Automatically trigger preview when image loads or options change
  useEffect(() => {
    if (naturalDimensions.width > 0) {
      const timer = setTimeout(() => {
        handleGeneratePreview();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [naturalDimensions, handleGeneratePreview]);

  // Mouse & Touch interactions for Crop Box
  const handlePointerDown = (
    e: React.PointerEvent,
    action: 'move' | 'nw' | 'ne' | 'sw' | 'se'
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setDragAction(action);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      box: { ...cropBox },
    });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !containerRef.current || !dragAction) return;

    const rect = containerRef.current.getBoundingClientRect();
    const deltaX = ((e.clientX - dragStart.x) / rect.width) * 100;
    const deltaY = ((e.clientY - dragStart.y) / rect.height) * 100;

    let { x, y, width, height } = dragStart.box;

    if (dragAction === 'move') {
      x = Math.max(0, Math.min(100 - width, x + deltaX));
      y = Math.max(0, Math.min(100 - height, y + deltaY));
    } else {
      // Corner resize keeping standard portrait proportions
      if (dragAction === 'se') {
        width = Math.max(15, Math.min(100 - x, width + deltaX));
        height = Math.max(20, Math.min(100 - y, height + deltaY));
      } else if (dragAction === 'sw') {
        const newWidth = Math.max(15, Math.min(dragStart.box.x + dragStart.box.width, width - deltaX));
        x = dragStart.box.x + (width - newWidth);
        width = newWidth;
        height = Math.max(20, Math.min(100 - y, height + deltaY));
      } else if (dragAction === 'ne') {
        width = Math.max(15, Math.min(100 - x, width + deltaX));
        const newHeight = Math.max(20, Math.min(dragStart.box.y + dragStart.box.height, height - deltaY));
        y = dragStart.box.y + (height - newHeight);
        height = newHeight;
      } else if (dragAction === 'nw') {
        const newWidth = Math.max(15, Math.min(dragStart.box.x + dragStart.box.width, width - deltaX));
        x = dragStart.box.x + (width - newWidth);
        width = newWidth;
        const newHeight = Math.max(20, Math.min(dragStart.box.y + dragStart.box.height, height - deltaY));
        y = dragStart.box.y + (height - newHeight);
        height = newHeight;
      }
    }

    setCropBox({
      x: Math.round(x),
      y: Math.round(y),
      width: Math.round(width),
      height: Math.round(height),
    });
  };

  const handlePointerUp = () => {
    if (isDragging) {
      setIsDragging(false);
      setDragAction(null);
      // Recompute preview on drag release
      handleGeneratePreview();
    }
  };

  const handleApplyFinalPhoto = () => {
    if (!previewResult) {
      handleGeneratePreview().then(() => {
        if (previewResult) {
          onPhotoProcessed(previewResult);
          onClose();
        }
      });
      return;
    }
    onPhotoProcessed(previewResult);
    onClose();
  };

  if (!isOpen || !imageSrc) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border-2 border-blue-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[95vh] animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-950 via-indigo-900 to-blue-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-md shrink-0">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                <span>Student Photo Editor (ವಿದ್ಯಾರ್ಥಿಯ ಭಾವಚಿತ್ರ ಸಂಪಾದನೆ)</span>
              </h3>
              <p className="text-xs text-blue-200 font-medium">
                Crop, apply frame, adjust size, and compress before saving
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/70 hover:text-white p-1.5 rounded-xl hover:bg-white/10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-300 rounded-xl text-xs text-red-900 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT: Interactive Crop Canvas (lg:col-span-7) */}
            <div className="lg:col-span-7 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <Crop className="w-4 h-4 text-blue-900" />
                  <span>Manual Crop Area (ಹೊಂದಿಸಿ ಮತ್ತು ಎಳೆಯಿರಿ)</span>
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  Portrait Ratio (3:4)
                </span>
              </div>

              {/* Crop Container */}
              <div
                ref={containerRef}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                className="relative bg-slate-900 rounded-2xl overflow-hidden select-none border-2 border-slate-300 flex items-center justify-center min-h-[260px] sm:min-h-[340px] max-h-[460px] touch-none cursor-crosshair"
              >
                <img
                  ref={imageRef}
                  src={imageSrc}
                  alt="Student source"
                  crossOrigin="anonymous"
                  onLoad={handleImageLoad}
                  className="max-h-[440px] w-auto max-w-full object-contain pointer-events-none"
                />

                {/* Shading overlay outside crop box */}
                <div className="absolute inset-0 pointer-events-none">
                  {/* Top */}
                  <div
                    style={{ height: `${cropBox.y}%` }}
                    className="absolute top-0 left-0 right-0 bg-slate-950/60"
                  />
                  {/* Bottom */}
                  <div
                    style={{ top: `${cropBox.y + cropBox.height}%`, bottom: 0 }}
                    className="absolute left-0 right-0 bg-slate-950/60"
                  />
                  {/* Left */}
                  <div
                    style={{
                      top: `${cropBox.y}%`,
                      height: `${cropBox.height}%`,
                      width: `${cropBox.x}%`,
                    }}
                    className="absolute left-0 bg-slate-950/60"
                  />
                  {/* Right */}
                  <div
                    style={{
                      top: `${cropBox.y}%`,
                      height: `${cropBox.height}%`,
                      left: `${cropBox.x + cropBox.width}%`,
                      right: 0,
                    }}
                    className="absolute bg-slate-950/60"
                  />
                </div>

                {/* Movable & Resizable Crop Box */}
                <div
                  onPointerDown={(e) => handlePointerDown(e, 'move')}
                  style={{
                    left: `${cropBox.x}%`,
                    top: `${cropBox.y}%`,
                    width: `${cropBox.width}%`,
                    height: `${cropBox.height}%`,
                  }}
                  className="absolute border-2 border-amber-400 bg-transparent cursor-move shadow-2xl touch-none"
                >
                  {/* Grid Guidelines */}
                  <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-40">
                    <div className="border-r border-b border-white" />
                    <div className="border-r border-b border-white" />
                    <div className="border-b border-white" />
                    <div className="border-r border-b border-white" />
                    <div className="border-r border-b border-white" />
                    <div className="border-b border-white" />
                    <div className="border-r border-white" />
                    <div className="border-r border-white" />
                    <div />
                  </div>

                  {/* Corner Handles */}
                  <div
                    onPointerDown={(e) => handlePointerDown(e, 'nw')}
                    className="absolute -top-2 -left-2 w-4 h-4 bg-amber-400 rounded-full border-2 border-slate-900 cursor-nwse-resize shadow-md"
                  />
                  <div
                    onPointerDown={(e) => handlePointerDown(e, 'ne')}
                    className="absolute -top-2 -right-2 w-4 h-4 bg-amber-400 rounded-full border-2 border-slate-900 cursor-nesw-resize shadow-md"
                  />
                  <div
                    onPointerDown={(e) => handlePointerDown(e, 'sw')}
                    className="absolute -bottom-2 -left-2 w-4 h-4 bg-amber-400 rounded-full border-2 border-slate-900 cursor-nesw-resize shadow-md"
                  />
                  <div
                    onPointerDown={(e) => handlePointerDown(e, 'se')}
                    className="absolute -bottom-2 -right-2 w-4 h-4 bg-amber-400 rounded-full border-2 border-slate-900 cursor-nwse-resize shadow-md"
                  />
                </div>
              </div>

              <p className="text-[11px] text-slate-500 italic">
                * Drag inside the yellow box to reposition. Drag the corner circles to resize.
              </p>
            </div>

            {/* RIGHT: Controls & Final Preview (lg:col-span-5) */}
            <div className="lg:col-span-5 space-y-5">
              {/* Final Preview Card */}
              <div className="p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl flex flex-col items-center justify-center space-y-3">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-blue-900" />
                  <span>Final Photo Preview (ಅಂತಿಮ ನೋಟ)</span>
                </span>

                <div className="relative w-36 h-48 bg-slate-200 rounded-xl overflow-hidden shadow-md flex items-center justify-center border border-slate-300">
                  {previewResult ? (
                    <img
                      src={previewResult.dataUrl}
                      alt="Final preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs text-slate-400 font-bold">Rendering...</span>
                  )}
                  {isProcessing && (
                    <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center text-white">
                      <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
                    </div>
                  )}
                </div>

                {previewResult && (
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-950 border border-emerald-300 rounded-full font-mono font-black text-xs">
                      Final Size: {previewResult.sizeKb} KB ✓
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      (Target: ≤ {maxSizeKb} KB)
                    </span>
                  </div>
                )}
              </div>

              {/* Control 1: Frame Toggle */}
              <div className="p-3.5 bg-white border border-slate-200 rounded-2xl space-y-2">
                <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <Square className="w-4 h-4 text-blue-900" />
                  <span>Frame:</span>
                </label>
                <div className="flex items-center gap-4 text-xs font-bold">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="frameOption"
                      checked={!hasFrame}
                      onChange={() => setHasFrame(false)}
                      className="w-4 h-4 text-blue-900 focus:ring-blue-900 cursor-pointer"
                    />
                    <span>No Frame</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="frameOption"
                      checked={hasFrame}
                      onChange={() => setHasFrame(true)}
                      className="w-4 h-4 text-blue-900 focus:ring-blue-900 cursor-pointer"
                    />
                    <span>Add Frame</span>
                  </label>
                </div>
              </div>

              {/* Control 2 & 3: Frame Color & Frame Thickness (mm) */}
              {hasFrame && (
                <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-blue-950 flex items-center gap-1.5">
                      <Palette className="w-4 h-4 text-blue-900" />
                      <span>Frame Color: [Color Picker]</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={frameColor}
                        onChange={(e) => setFrameColor(e.target.value)}
                        className="w-8 h-8 rounded-lg border border-slate-300 cursor-pointer p-0 shadow-xs"
                        title="Frame Color: [Color Picker]"
                      />
                      <span className="font-mono text-xs font-bold text-slate-800 uppercase bg-white px-2 py-0.5 rounded border border-slate-200">
                        {frameColor}
                      </span>
                    </div>
                  </div>

                  {/* Preset quick colors */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-slate-600">Quick Colors:</span>
                    {['#000000', '#ffffff', '#1e3a8a', '#b91c1c', '#047857', '#d97706'].map(
                      (c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setFrameColor(c)}
                          style={{ backgroundColor: c }}
                          className={`w-6 h-6 rounded-md border-2 transition cursor-pointer ${
                            frameColor.toLowerCase() === c.toLowerCase()
                              ? 'border-amber-400 scale-110 shadow-sm'
                              : 'border-slate-300'
                          }`}
                          title={`Select ${c}`}
                        />
                      )
                    )}
                  </div>

                  {/* Frame Thickness (mm) with both typing input and slider */}
                  <div className="space-y-1.5 pt-1 border-t border-blue-100">
                    <div className="flex items-center justify-between text-xs">
                      <label className="font-black text-blue-950">
                        Frame Thickness (mm)
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="0.1"
                          max="5.0"
                          step="0.1"
                          value={frameThicknessMm}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val)) {
                              setFrameThicknessMm(Math.min(5.0, Math.max(0.1, val)));
                            }
                          }}
                          className="w-16 px-1.5 py-0.5 text-xs font-mono font-bold text-blue-900 bg-white border border-blue-300 rounded text-right focus:outline-none focus:ring-1 focus:ring-blue-900"
                        />
                        <span className="font-mono font-bold text-[11px] text-slate-600">mm</span>
                        <span className="text-[10px] text-blue-800 font-mono bg-blue-100 px-1 py-0.5 rounded">
                          (~{mmToPixelsAt300Dpi(frameThicknessMm)} px @ 300 DPI)
                        </span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="5.0"
                      step="0.1"
                      value={frameThicknessMm}
                      onChange={(e) => setFrameThicknessMm(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-900"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                      <span>Min: 0.1 mm</span>
                      <span>Default: 0.5 mm</span>
                      <span>Max: 5.0 mm</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Control 4: Maximum Photo Size (KB) with Select / Type / Slider */}
              <div className="p-3.5 bg-white border border-slate-200 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-black text-slate-800 flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-blue-900" />
                    <span>Maximum Photo Size (KB)</span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="50"
                      max="900"
                      step="10"
                      value={maxSizeKb}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val)) {
                          setMaxSizeKb(Math.min(900, Math.max(50, val)));
                        }
                      }}
                      className="w-20 px-2 py-0.5 text-xs font-mono font-black text-slate-900 bg-slate-50 border border-slate-300 rounded text-right focus:outline-none focus:ring-1 focus:ring-blue-900"
                      placeholder="500"
                    />
                    <span className="font-mono font-bold text-xs text-slate-600">KB</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-slate-500 mr-1">Select:</span>
                  {[100, 200, 300, 500, 750, 900].map((kb) => (
                    <button
                      key={kb}
                      type="button"
                      onClick={() => setMaxSizeKb(kb)}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                        maxSizeKb === kb
                          ? 'bg-blue-950 text-white shadow-xs ring-1 ring-blue-900'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {kb} KB
                    </button>
                  ))}
                </div>

                <input
                  type="range"
                  min="50"
                  max="900"
                  step="10"
                  value={maxSizeKb}
                  onChange={(e) => setMaxSizeKb(parseInt(e.target.value, 10))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-900 mt-1"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>Min: 50 KB</span>
                  <span>Default: 500 KB</span>
                  <span>Max: 900 KB</span>
                </div>
              </div>

              {/* Re-render button */}
              <button
                type="button"
                onClick={handleGeneratePreview}
                disabled={isProcessing}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer border border-slate-300"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
                <span>Create Final Photo (ಅಂತಿಮ ಫೋಟೋ ಸಿದ್ಧಪಡಿಸಿ)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-600 font-medium">
            {previewResult ? (
              <span className="text-emerald-700 font-bold">
                ✓ Photo successfully optimized ({previewResult.sizeKb} KB). Ready to save.
              </span>
            ) : (
              <span>Adjust crop and settings, then apply.</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs cursor-pointer transition"
            >
              Cancel (ರದ್ದುಮಾಡಿ)
            </button>
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleApplyFinalPhoto}
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-lg transition cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Apply & Save Photo (ಫೋಟೋ ಅನ್ವಯಿಸಿ)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
