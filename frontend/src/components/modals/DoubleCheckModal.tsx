import { useState, useEffect, useRef } from 'react';
import { AlertTriangle, CheckCircle2, X, ShieldAlert } from 'lucide-react';

interface DoubleCheckModalProps {
  isOpen: boolean;
  title: string;
  description?: string | React.ReactNode;
  details?: Array<{ label: string; value: React.ReactNode }>;
  requiredPhrase?: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  isDanger?: boolean;
  loading?: boolean;
  onConfirm: (confirmText: string) => void | Promise<void>;
  onCancel: () => void;
}

export function DoubleCheckModal({
  isOpen,
  title,
  description,
  details,
  requiredPhrase = 'tôi xác nhận',
  confirmButtonText = 'Xác nhận thực hiện',
  cancelButtonText = 'Hủy bỏ',
  isDanger = false,
  loading = false,
  onConfirm,
  onCancel,
}: DoubleCheckModalProps) {
  const [inputText, setInputText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Normalize string to NFC, trim, replace multiple spaces with single space, lowercase
  const normalizeText = (str: string) =>
    str
      .normalize('NFC')
      .trim()
      .replace(/\s+/g, ' ')
      .toLowerCase();

  const isMatched = normalizeText(inputText) === normalizeText(requiredPhrase);

  useEffect(() => {
    if (isOpen) {
      setInputText('');
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMatched || loading) return;
    onConfirm(inputText.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${
          isDanger ? 'bg-rose-50/80 border-rose-100' : 'bg-amber-50/80 border-amber-100'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${
              isDanger ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-700'
            }`}>
              {isDanger ? <ShieldAlert className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-base leading-tight">
                {title}
              </h3>
              <span className="text-[11px] text-gray-500 font-medium">
                Yêu cầu xác thực thao tác quản trị
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg transition disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {description && (
            <div className="text-sm text-gray-600 leading-relaxed">
              {description}
            </div>
          )}

          {details && details.length > 0 && (
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/70 space-y-1.5 text-xs">
              {details.map((d, idx) => (
                <div key={idx} className="flex items-center justify-between gap-2">
                  <span className="text-gray-500 font-medium">{d.label}:</span>
                  <span className="text-gray-900 font-semibold">{d.value}</span>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-2 pt-1">
            <label className="block text-xs font-semibold text-gray-700">
              Nhập chính xác cụm từ <span className="font-bold text-orange-600 px-1 py-0.5 bg-orange-50 border border-orange-200 rounded">"{requiredPhrase}"</span> để xác nhận:
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                autoComplete="off"
                disabled={loading}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`Nhập "${requiredPhrase}"`}
                className={`w-full text-sm px-3.5 py-2.5 rounded-xl border transition outline-none ${
                  isMatched
                    ? 'border-emerald-500 bg-emerald-50/30 text-emerald-950 focus:ring-2 focus:ring-emerald-400'
                    : inputText
                    ? 'border-rose-300 bg-rose-50/20 text-rose-950 focus:ring-2 focus:ring-rose-300'
                    : 'border-gray-200 focus:border-primary focus:ring-2 focus:ring-orange-100'
                }`}
              />
              {isMatched && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600 flex items-center gap-1 text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              )}
            </div>
            {inputText && !isMatched && (
              <p className="text-[11px] text-rose-600 font-medium">
                Cụm từ chưa khớp. Vui lòng gõ đúng "{requiredPhrase}".
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-xl transition disabled:opacity-50"
            >
              {cancelButtonText}
            </button>
            <button
              type="submit"
              disabled={!isMatched || loading}
              className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white rounded-xl shadow-sm transition disabled:opacity-40 disabled:cursor-not-allowed ${
                isDanger
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-primary hover:bg-primary-hover'
              }`}
            >
              {loading && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              <span>{confirmButtonText}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
