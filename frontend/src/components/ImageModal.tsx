import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, ZoomIn, Download } from 'lucide-react';

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  title?: string;
  caption?: string;
}

export function ImageModal({ isOpen, onClose, imageUrl, title, caption }: ImageModalProps) {
  const { t } = useTranslation();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !imageUrl) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl max-h-[90vh] w-full flex flex-col items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header bar */}
        <div className="w-full flex items-center justify-between text-white mb-3 px-2">
          <div className="truncate pr-4">
            {title && <h3 className="text-base sm:text-lg font-bold truncate">{title}</h3>}
            {caption && <p className="text-xs sm:text-sm text-gray-300 truncate">{caption}</p>}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <a
              href={imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              title={t('common.downloadOriginal')}
            >
              <Download className="w-5 h-5" />
            </a>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/10 hover:bg-red-500/80 text-white transition-colors"
              title={t('common.closeEsc')}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Image Box */}
        <div className="relative bg-white rounded-2xl p-3 sm:p-4 shadow-2xl overflow-hidden max-h-[75vh] flex items-center justify-center border border-white/20">
          <img
            src={imageUrl}
            alt={title || t('common.zoomImage')}
            className="max-h-[70vh] max-w-full w-auto object-contain rounded-xl select-none"
          />
        </div>

        <p className="text-xs text-gray-400 mt-3 text-center">
          {t('common.pressEscToClose')}
        </p>
      </div>
    </div>
  );
}

interface ZoomableImageProps {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  title?: string;
  caption?: string;
}

export function ZoomableImage({
  src,
  alt,
  className = '',
  containerClassName = '',
  title,
  caption,
}: ZoomableImageProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <>
      <div
        className={`relative group cursor-zoom-in inline-block ${containerClassName}`}
        onClick={() => setOpen(true)}
      >
        <img src={src} alt={alt} className={className} />
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center text-white font-semibold text-xs gap-1 pointer-events-none">
          <ZoomIn className="w-4 h-4" />
          <span>{t('common.zoomIn')}</span>
        </div>
      </div>

      <ImageModal
        isOpen={open}
        onClose={() => setOpen(false)}
        imageUrl={src}
        title={title || alt}
        caption={caption}
      />
    </>
  );
}
