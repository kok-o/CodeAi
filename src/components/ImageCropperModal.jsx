import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../utils/cropImage';
import { motion } from 'framer-motion';
import { X, Check } from 'lucide-react';

const ImageCropperModal = ({ imageSrc, aspect = 1, onSave, onCancel, title = "Обрезать фото" }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    if (!croppedAreaPixels) return;
    setIsProcessing(true);
    try {
      const croppedBase64 = await getCroppedImg(imageSrc, croppedAreaPixels);
      onSave(croppedBase64);
    } catch (e) {
      console.error(e);
      alert('Ошибка при обработке изображения');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)', borderBottom: '1px solid var(--border-subtle)' }}>
        <h3 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '1.2rem' }}>{title}</h3>
        <button onClick={onCancel} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}>
          <X size={24} />
        </button>
      </div>
      
      <div style={{ flex: 1, position: 'relative' }}>
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          onCropChange={setCrop}
          onCropComplete={onCropComplete}
          onZoomChange={setZoom}
          style={{
            containerStyle: { background: '#000' }
          }}
        />
      </div>

      <div style={{ padding: '24px', background: 'var(--bg-card)', borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>Масштаб</span>
          <input
            type="range"
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            aria-labelledby="Zoom"
            onChange={(e) => setZoom(e.target.value)}
            style={{ flex: 1 }}
          />
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button onClick={onCancel} className="btn btn-outline" disabled={isProcessing}>
            Отмена
          </button>
          <button onClick={handleSave} className="btn btn-primary" disabled={isProcessing} style={{ gap: '8px' }}>
            <Check size={16} /> {isProcessing ? 'Обработка...' : 'Применить'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropperModal;
