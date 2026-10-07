import React, { useRef, useState } from 'react';
import { FileItem } from '../types';
import { formatBytes, getFileCategory } from '../utils/format';
import {
  UploadCloud,
  File as FileIcon,
  FileText,
  Film,
  Music,
  Image as ImageIcon,
  Archive,
  Code,
  X,
  Send,
  FolderUp,
  AlertTriangle,
} from 'lucide-react';

interface FileDropzoneProps {
  files: FileItem[];
  onAddFiles: (newFiles: File[]) => void;
  onRemoveFile: (fileId: string) => void;
  onClearFiles: () => void;
  onSendFiles: () => void;
  isSending: boolean;
  selectedPeersCount: number;
  totalPeersCount: number;
  onOpenQR: () => void;
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({
  files,
  onAddFiles,
  onRemoveFile,
  onClearFiles,
  onSendFiles,
  isSending,
  selectedPeersCount,
  totalPeersCount,
  onOpenQR,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onAddFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onAddFiles(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  const totalBytes = files.reduce((acc, f) => acc + f.size, 0);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'image':
        return <ImageIcon className="w-5 h-5 text-cyan-400" />;
      case 'video':
        return <Film className="w-5 h-5 text-purple-400" />;
      case 'audio':
        return <Music className="w-5 h-5 text-emerald-400" />;
      case 'document':
        return <FileText className="w-5 h-5 text-blue-400" />;
      case 'archive':
        return <Archive className="w-5 h-5 text-amber-400" />;
      case 'code':
        return <Code className="w-5 h-5 text-rose-400" />;
      default:
        return <FileIcon className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 shadow-xl flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <span>Send Files</span>
            {files.length > 0 && (
              <span className="px-2 py-0.5 text-[11px] rounded-full bg-cyan-500/10 text-cyan-300 font-mono">
                {files.length} {files.length === 1 ? 'file' : 'files'} • {formatBytes(totalBytes)}
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-400">
            Select or drag & drop up to 20+ files to beam simultaneously
          </p>
        </div>

        {files.length > 0 && (
          <button
            onClick={onClearFiles}
            disabled={isSending}
            className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-300 transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Hidden file inputs */}
      <input
        type="file"
        multiple
        ref={fileInputRef}
        onChange={handleFileInputChange}
        className="hidden"
      />
      <input
        type="file"
        multiple
        // @ts-ignore
        webkitdirectory="true"
        ref={folderInputRef}
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Drop Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center ${
          isDragOver
            ? 'border-cyan-400 bg-cyan-500/10 scale-[0.99]'
            : 'border-slate-800 hover:border-slate-700 bg-slate-950/40 hover:bg-slate-950/70'
        }`}
      >
        <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
          <UploadCloud className="w-6 h-6 animate-bounce" />
        </div>
        <p className="text-sm font-semibold text-slate-200">
          Click to browse or drop files here
        </p>
        <p className="text-xs text-slate-400 mt-1 max-w-xs">
          Select multiple photos, 4K videos, documents, or an entire folder
        </p>

        <div className="flex items-center gap-2 mt-4" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors"
          >
            Browse Files (20+)
          </button>
          <button
            type="button"
            onClick={() => folderInputRef.current?.click()}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1.5 transition-colors"
          >
            <FolderUp className="w-3.5 h-3.5 text-cyan-400" />
            <span>Upload Folder</span>
          </button>
        </div>
      </div>

      {/* Selected Files List */}
      {files.length > 0 ? (
        <div className="mt-4 flex-1 flex flex-col min-h-0">
          <div className="text-xs font-semibold text-slate-400 mb-2 flex items-center justify-between">
            <span>Staged Files ({files.length})</span>
            <span className="font-mono text-cyan-400">{formatBytes(totalBytes)}</span>
          </div>

          <div className="overflow-y-auto max-h-56 pr-1 space-y-2 select-none divide-y divide-slate-800/40">
            {files.map((item) => {
              const category = getFileCategory(item.type, item.name);
              const isImage = category === 'image';

              return (
                <div
                  key={item.id}
                  className="pt-2 first:pt-0 flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-slate-950 flex items-center justify-center shrink-0 border border-slate-800">
                      {isImage && item.file ? (
                        <img
                          src={URL.createObjectURL(item.file)}
                          alt={item.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        getCategoryIcon(category)
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-slate-200 truncate">
                        {item.name}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {formatBytes(item.size)}
                      </div>
                    </div>
                  </div>

                  {!isSending && (
                    <button
                      onClick={() => onRemoveFile(item.id)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 opacity-60 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="mt-4 py-6 text-center text-xs text-slate-400 border border-dashed border-slate-800/60 rounded-xl">
          No files selected yet. Drag files or click above.
        </div>
      )}

      {/* Transfer Action Footer */}
      <div className="mt-5 pt-4 border-t border-slate-800/80">
        {totalPeersCount === 0 ? (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <div className="flex items-center gap-2 text-xs text-amber-300">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>No other devices connected yet. Scan QR to join!</span>
            </div>
            <button
              onClick={onOpenQR}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-400 text-slate-950 hover:bg-amber-300 transition-colors shrink-0"
            >
              Show QR Code
            </button>
          </div>
        ) : (
          <button
            onClick={onSendFiles}
            disabled={files.length === 0 || selectedPeersCount === 0 || isSending}
            className="w-full py-3 px-4 rounded-xl font-bold text-sm tracking-wide bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span>
              {isSending
                ? 'Streaming files over WebRTC...'
                : files.length === 0
                ? 'Select Files to Send'
                : selectedPeersCount === 0
                ? 'Select At Least 1 Target Device'
                : `Beam ${files.length} ${files.length === 1 ? 'File' : 'Files'} to ${selectedPeersCount} ${
                    selectedPeersCount === 1 ? 'Device' : 'Devices'
                  } (${formatBytes(totalBytes)})`}
            </span>
          </button>
        )}
      </div>
    </div>
  );
};
