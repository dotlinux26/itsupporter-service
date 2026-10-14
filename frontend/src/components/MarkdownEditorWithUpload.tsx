import React, { useState, useRef } from 'react';
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Link,
  Image as ImageIcon,
  Columns,
  Eye,
  Edit3,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import { adminApi } from '../api/client';
import { MarkdownRenderer } from './MarkdownRenderer';

interface MarkdownEditorWithUploadProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  title?: string;
  onRestoreDefault?: () => void;
}

export const MarkdownEditorWithUpload: React.FC<MarkdownEditorWithUploadProps> = ({
  value,
  onChange,
  placeholder = 'Nhập nội dung định dạng Markdown tại đây... Hỗ trợ dán ảnh trực tiếp (Ctrl + V) hoặc kéo thả ảnh.',
  minHeight = '350px',
  title,
  onRestoreDefault,
}) => {
  const [viewMode, setViewMode] = useState<'split' | 'edit' | 'preview'>('split');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to insert markdown at current cursor position
  const insertTextAtCursor = (before: string, after = '', defaultPlaceholder = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentVal = textarea.value;

    const selectedText = currentVal.substring(start, end) || defaultPlaceholder;
    const replacement = `${before}${selectedText}${after}`;

    const newVal = currentVal.substring(0, start) + replacement + currentVal.substring(end);
    onChange(newVal);

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + selectedText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 10);
  };

  // Upload an image file and insert its markdown link
  const handleUploadFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chỉ tải lên file hình ảnh (PNG, JPG, WEBP, GIF).');
      return;
    }

    const placeholderTag = `\n![Đang tải ảnh lên (${file.name})...]()\n`;
    insertTextAtCursor(placeholderTag, '', '');

    setIsUploading(true);
    setUploadStatus(`Đang tải lên ${file.name}...`);

    try {
      const res = await adminApi.uploadMarkdownImage(file);
      const url = res.data?.url || res.data?.data?.url;
      if (!url) throw new Error('Không nhận được URL ảnh từ máy chủ.');

      const cleanAlt = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      const imageMarkdown = `\n![${cleanAlt || 'Hình ảnh minh họa'}](${url})\n`;

      // Replace placeholder with final markdown
      const updatedValue = (textareaRef.current?.value || value).replace(placeholderTag, imageMarkdown);
      onChange(updatedValue);
      setUploadStatus(null);
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Lỗi khi tải ảnh lên.');
      // Remove placeholder on error
      const cleaned = (textareaRef.current?.value || value).replace(placeholderTag, '');
      onChange(cleaned);
      setUploadStatus(null);
    } finally {
      setIsUploading(false);
    }
  };

  // Handle Ctrl+V paste event
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          handleUploadFile(file);
          return;
        }
      }
    }
  };

  // Handle Drag & Drop
  const handleDrop = (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        handleUploadFile(file);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
  };

  return (
    <div className="border border-slate-700/80 rounded-2xl bg-slate-900/90 overflow-hidden shadow-lg flex flex-col">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between px-3 py-2 bg-slate-800/60 border-b border-slate-700/80 gap-2">
        <div className="flex items-center gap-1 flex-wrap">
          {title && <span className="text-xs font-bold text-slate-300 pr-2 border-r border-slate-700">{title}</span>}

          {/* Formatting buttons */}
          <button
            type="button"
            onClick={() => insertTextAtCursor('**', '**', 'văn bản đậm')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            title="In đậm (Bold)"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertTextAtCursor('*', '*', 'văn bản nghiêng')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            title="In nghiêng (Italic)"
          >
            <Italic className="w-4 h-4" />
          </button>

          <span className="w-px h-4 bg-slate-700 mx-0.5" />

          <button
            type="button"
            onClick={() => insertTextAtCursor('# ', '', 'Tiêu đề 1')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            title="Tiêu đề 1"
          >
            <Heading1 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertTextAtCursor('## ', '', 'Tiêu đề 2')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            title="Tiêu đề 2"
          >
            <Heading2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertTextAtCursor('### ', '', 'Tiêu đề 3')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            title="Tiêu đề 3"
          >
            <Heading3 className="w-4 h-4" />
          </button>

          <span className="w-px h-4 bg-slate-700 mx-0.5" />

          <button
            type="button"
            onClick={() => insertTextAtCursor('- ', '', 'Mục danh sách')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            title="Danh sách dấu chấm"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertTextAtCursor('1. ', '', 'Mục số thứ tự')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            title="Danh sách đánh số"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertTextAtCursor('> ', '', 'Trích dẫn')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            title="Trích dẫn"
          >
            <Quote className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertTextAtCursor('```\n', '\n```', 'khối code')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            title="Khối mã code"
          >
            <Code className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertTextAtCursor('[', '](https://itsupporter.io.vn)', 'tiêu đề liên kết')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            title="Chèn liên kết"
          >
            <Link className="w-4 h-4" />
          </button>

          <span className="w-px h-4 bg-slate-700 mx-0.5" />

          {/* Upload image button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-semibold transition-colors"
            title="Tải ảnh hoặc dán ảnh (Ctrl + V)"
          >
            {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImageIcon className="w-3.5 h-3.5" />}
            Chèn ảnh (Ctrl+V)
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleUploadFile(e.target.files[0]);
                e.target.value = '';
              }
            }}
          />
        </div>

        {/* View Mode controls & Restore default */}
        <div className="flex items-center gap-2">
          {onRestoreDefault && (
            <button
              type="button"
              onClick={onRestoreDefault}
              className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-amber-400 px-2 py-1 rounded hover:bg-slate-800 transition-colors mr-2"
              title="Khôi phục lại nội dung chuẩn mặc định"
            >
              <RotateCcw className="w-3 h-3" /> Mặc định
            </button>
          )}

          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-700">
            <button
              type="button"
              onClick={() => setViewMode('edit')}
              className={`p-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'edit' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Chỉ soạn thảo"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('split')}
              className={`hidden sm:block p-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'split' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Chia đôi màn hình (Soạn thảo + Xem trước)"
            >
              <Columns className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('preview')}
              className={`p-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'preview' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Xem trước kết quả"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Uploading status banner */}
      {isUploading && (
        <div className="px-4 py-1.5 bg-orange-500/10 border-b border-orange-500/20 text-orange-400 text-xs flex items-center gap-2 animate-pulse">
          <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
          <span>{uploadStatus || 'Đang tải hình ảnh lên máy chủ...'}</span>
        </div>
      )}

      {/* Editor Content Area */}
      <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-800 flex-1">
        {/* Left: Textarea Editor */}
        <div className={`${viewMode === 'preview' ? 'hidden' : viewMode === 'split' ? 'block' : 'col-span-2'}`}>
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onPaste={handlePaste}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            placeholder={placeholder}
            style={{ minHeight }}
            className="w-full h-full p-4 bg-transparent text-slate-100 font-mono text-xs sm:text-sm leading-relaxed focus:outline-none resize-y border-none"
          />
        </div>

        {/* Right: Live Preview */}
        <div
          className={`${
            viewMode === 'edit' ? 'hidden' : viewMode === 'split' ? 'block' : 'col-span-2'
          } p-4 bg-slate-950/50 overflow-y-auto max-h-[600px]`}
          style={{ minHeight }}
        >
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
            <Eye className="w-3 h-3 text-orange-400" /> Xem trước kết quả (Live Preview)
          </div>
          {value ? (
            <MarkdownRenderer content={value} className="text-slate-200" />
          ) : (
            <p className="text-xs text-slate-600 italic">Chưa có nội dung xem trước.</p>
          )}
        </div>
      </div>

      {/* Bottom Hint */}
      <div className="px-4 py-1.5 bg-slate-950 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center justify-between">
        <span>Mẹo: Bạn có thể chụp ảnh màn hình (Win + Shift + S) rồi bấm <b>Ctrl + V</b> trực tiếp vào đây để dán ảnh.</span>
        <span>{value.length} ký tự</span>
      </div>
    </div>
  );
};
