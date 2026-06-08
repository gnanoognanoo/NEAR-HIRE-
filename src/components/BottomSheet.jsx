import { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Bottom sheet component — slides up from bottom with overlay
 */
const BottomSheet = ({ isOpen, onClose, children, title }) => {
  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div className="bottom-sheet-overlay" onClick={onClose} />

      {/* Sheet */}
      <div className="bottom-sheet">
        {/* Handle */}
        <div className="bottom-sheet-handle" />

        {/* Header */}
        {title && (
          <div className="flex justify-between items-center px-5 pt-2 pb-3">
            <h2 className="text-lg font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
              {title}
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
              style={{ background: 'var(--color-bg-input)', color: 'var(--color-text-secondary)' }}
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="px-5 pb-8">
          {children}
        </div>
      </div>
    </>
  );
};

export default BottomSheet;
