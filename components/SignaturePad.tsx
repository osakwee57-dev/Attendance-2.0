
import React, { useRef, useState, useEffect, useCallback } from 'react';

interface SignaturePadProps {
  onCapture: (dataUrl: string) => void;
  className?: string;
}

const SignaturePad: React.FC<SignaturePadProps> = ({ onCapture, className }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Initialize canvas style
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
  }, []);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    } else {
      return {
        x: (e as React.MouseEvent).clientX - rect.left,
        y: (e as React.MouseEvent).clientY - rect.top
      };
    }
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const coords = getCoordinates(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (coords && ctx) {
      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const coords = getCoordinates(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (coords && ctx) {
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    if (canvasRef.current) {
      onCapture(canvasRef.current.toDataURL());
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      onCapture('');
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-between items-center mb-1">
        <label className="text-sm font-medium text-slate-700">Digital Signature</label>
        <button 
          type="button" 
          onClick={clear}
          className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
        >
          Clear
        </button>
      </div>
      <div className="border-2 border-dashed border-slate-300 rounded-lg bg-white overflow-hidden touch-none">
        <canvas
          ref={canvasRef}
          width={400}
          height={150}
          className="w-full cursor-crosshair"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>
      <p className="text-[10px] text-slate-500 italic text-center">Sign above using your mouse or touch screen</p>
    </div>
  );
};

export default SignaturePad;
