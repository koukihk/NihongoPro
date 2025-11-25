import { useState, useEffect, useRef } from 'react';
import { X, RotateCcw, Volume2, Palette, Download, Share2 } from 'lucide-react';
import { speak } from '../../utils/helpers';

/**
 * KanaCanvasModal - 假名书写画布弹窗
 * Canvas modal for practicing kana writing with brush customization
 */
const KanaCanvasModal = ({ char, onClose, t, addLog, notify }) => {
  const canvasRef = useRef(null);
  const [brushColor, setBrushColor] = useState('#3B82F6');
  const [brushSize, setBrushSize] = useState(8);
  const [isSharing, setIsSharing] = useState(false);
  const hasDrawn = useRef(false);

  const BRUSH_COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#374151'];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
      const ctx = canvas.getContext('2d');
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.shadowBlur = 4;
      ctx.lineWidth = brushSize;
      ctx.strokeStyle = brushColor;
      ctx.shadowColor = brushColor;
    }
    resize();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.lineWidth = brushSize;
    ctx.strokeStyle = brushColor;
    ctx.shadowColor = brushColor;
  }, [brushColor, brushSize]);


  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: cx - rect.left, y: cy - rect.top };
  };

  const start = (e) => {
    e.preventDefault();
    hasDrawn.current = true;
    const ctx = canvasRef.current.getContext('2d');
    const { x, y } = getPos(e);
    ctx.beginPath(); ctx.moveTo(x, y);
    canvasRef.current.isDrawing = true;
  };
  const move = (e) => {
    e.preventDefault();
    if (!canvasRef.current.isDrawing) return;
    const { x, y } = getPos(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineTo(x, y); ctx.stroke();
  };
  const end = () => canvasRef.current.isDrawing = false;
  const handleClose = () => {
    if (hasDrawn.current) {
      addLog('writing', `${char.label}: ${char.char}`);
    }
    onClose();
  }
  const clear = () => canvasRef.current.getContext('2d').clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

  const saveImage = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.href = canvasRef.current.toDataURL('image/png');
    link.download = `${char.char || 'kana'}-${Date.now()}.png`;
    link.click();
    notify?.(t.toastSaved || 'Saved');
  };

  const getCanvasBlob = () => new Promise((resolve, reject) => {
    if (!canvasRef.current) return reject(new Error('no-canvas'));
    canvasRef.current.toBlob(blob => {
      if (blob) resolve(blob);
      else reject(new Error('blob-null'));
    }, 'image/png');
  });

  const shareImage = async () => {
    if (!canvasRef.current) return;
    setIsSharing(true);
    try {
      const blob = await getCanvasBlob();
      const file = new File([blob], `${char.char || 'kana'}-practice.png`, { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: t.drawTitle,
          text: `${char.label}: ${char.char}`
        });
        notify?.(t.toastShareSuccess || 'Shared');
      } else if (navigator.clipboard?.writeText) {
        const dataUrl = canvasRef.current.toDataURL('image/png');
        await navigator.clipboard.writeText(dataUrl);
        notify?.(t.toastShareCopied || 'Copied');
      } else {
        saveImage();
        notify?.(t.toastShareFail || 'Saved instead');
      }
    } catch (error) {
      console.error(error);
      notify?.(t.toastShareFail || 'Sharing unavailable');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={handleClose}>
      <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-up" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-black text-gray-800 dark:text-white">{t.drawTitle}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t.drawDesc}</p>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"><X size={20} className="text-gray-500" /></button>
        </div>

        <div className="relative aspect-square bg-white dark:bg-gray-950 m-4 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800 overflow-hidden touch-none">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
            <span className="text-[200px] font-serif text-gray-900 dark:text-white select-none">{char.char}</span>
          </div>
          <canvas
            ref={canvasRef}
            className="absolute inset-0 z-10 cursor-crosshair"
            onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
            onTouchStart={start} onTouchMove={move} onTouchEnd={end}
          />
        </div>

        <div className="flex flex-col space-y-3 mb-4 p-3 bg-gray-50 dark:bg-black/20 rounded-2xl">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-gray-400 dark:text-gray-500 mr-2 flex items-center"><Palette size={14} className="mr-1" /> {t.brushColor}</span>
            <div className="flex space-x-2">
              {BRUSH_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setBrushColor(c)}
                  className={`w-6 h-6 rounded-full border-2 transition-transform ${brushColor === c ? 'scale-125 border-white shadow-md' : 'border-transparent hover:scale-110'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 w-12 whitespace-nowrap">{t.brushSize}</span>
            <input type="range" min="2" max="20" value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-blue-500" />
          </div>
        </div>

        <div className="flex gap-4 px-4 pb-2">
          <button onClick={saveImage} className="flex-1 py-3 rounded-[1.5rem] bg-white/85 dark:bg-gray-900/40 backdrop-blur-xl font-bold text-gray-700 dark:text-gray-100 border border-white/70 dark:border-white/15 shadow-[0_10px_25px_rgba(15,23,42,0.08)] hover:bg-white dark:hover:bg-gray-800 transition-all flex items-center justify-center">
            <Download size={18} className="mr-2" /> {t.saveImage}
          </button>
          <button onClick={shareImage} disabled={isSharing} className={`flex-1 py-3 rounded-[1.5rem] font-bold text-white border border-white/40 dark:border-white/10 shadow-[0_18px_40px_rgba(59,130,246,0.35)] transition-all flex items-center justify-center active:scale-95 ${isSharing ? 'opacity-60 cursor-not-allowed' : 'hover:from-blue-600 hover:to-purple-500'}`} style={{ backgroundImage: 'linear-gradient(90deg, rgba(14,165,233,0.9), rgba(139,92,246,0.9))' }}>
            <Share2 size={18} className="mr-2" /> {isSharing ? (t.shareWorking || '...') : t.shareImage}
          </button>
        </div>

        <div className="flex gap-4 px-4 pb-4 pt-1">
          <button onClick={clear} className="flex-1 py-4 rounded-[1.75rem] bg-white/70 dark:bg-gray-900/40 backdrop-blur-xl font-bold text-gray-700 dark:text-gray-100 border border-white/60 dark:border-white/15 shadow-[0_12px_30px_rgba(15,23,42,0.08)] hover:bg-white/90 dark:hover:bg-gray-800/60 transition-all flex items-center justify-center">
            <RotateCcw size={20} className="mr-2" /> {t.clear}
          </button>
          <button onClick={() => speak(char.char)} className="flex-1 py-4 rounded-[1.75rem] bg-gradient-to-r from-blue-500/90 to-indigo-500/90 font-bold text-white border border-white/40 dark:border-white/10 shadow-[0_18px_40px_rgba(59,130,246,0.35)] hover:from-blue-500 hover:to-indigo-500 transition-all flex items-center justify-center active:scale-95">
            <Volume2 size={20} className="mr-2" /> Play
          </button>
        </div>
      </div>
    </div>
  );
};

export default KanaCanvasModal;
