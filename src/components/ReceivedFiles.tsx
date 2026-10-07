import React, { useState } from 'react';
import JSZip from 'jszip';
import { ReceivedFile } from '../types';
import { formatBytes, getFileCategory } from '../utils/format';
import {
  Download,
  FolderArchive,
  Eye,
  X,
  FileText,
  Film,
  Music,
  Image as ImageIcon,
  Archive,
  Code,
  File as FileIcon,
  CheckCircle,
} from 'lucide-react';

interface ReceivedFilesProps {
  files: ReceivedFile[];
  onClearAll: () => void;
}

export const ReceivedFiles: React.FC<ReceivedFilesProps> = ({ files, onClearAll }) => {
  const [isZipping, setIsZipping] = useState(false);
  const [previewFile, setPreviewFile] = useState<ReceivedFile | null>(null);

  if (files.length === 0) return null;

  const handleDownloadAllZip = async () => {
    try {
      setIsZipping(true);
      const zip = new JSZip();

      for (const item of files) {
        zip.file(item.name, item.blob);
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `BeamDrop_Batch_${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to create ZIP:', err);
    } finally {
      setIsZipping(false);
    }
  };

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
    <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <span>Received Files</span>
            <span className="px-2 py-0.5 text-[11px] rounded-full bg-emerald-500/10 text-emerald-300 font-mono">
              {files.length} ready
            </span>
          </h2>
          <p className="text-xs text-slate-400">
            Transferred directly into browser memory via WebRTC
          </p>
        </div>

        <div className="flex items-center gap-2">
          {files.length > 1 && (
            <button
              onClick={handleDownloadAllZip}
              disabled={isZipping}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-colors disabled:opacity-50"
            >
              <FolderArchive className="w-3.5 h-3.5" />
              <span>{isZipping ? 'Archiving ZIP...' : `Download All as ZIP (${files.length})`}</span>
            </button>
          )}

          <button
            onClick={onClearAll}
            className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-300 transition-colors"
          >
            Clear History
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {files.map((file) => {
          const category = getFileCategory(file.type, file.name);
          const isImage = category === 'image';

          return (
            <div
              key={file.id}
              className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex flex-col justify-between group hover:border-slate-700 transition-all"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 overflow-hidden">
                  {isImage ? (
                    <img
                      src={file.downloadUrl}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    getCategoryIcon(category)
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-white truncate" title={file.name}>
                    {file.name}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                    {formatBytes(file.size)}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span className="truncate">From {file.senderName}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                <a
                  href={file.downloadUrl}
                  download={file.name}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>

                {['image', 'video', 'audio'].includes(category) && (
                  <button
                    onClick={() => setPreviewFile(file)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                    title="Quick Preview"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Preview Lightbox Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-4 relative shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="min-w-0 pr-3">
                <div className="text-sm font-bold text-white truncate">{previewFile.name}</div>
                <div className="text-xs text-slate-400 font-mono">{formatBytes(previewFile.size)}</div>
              </div>
              <button
                onClick={() => setPreviewFile(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-4 flex-1 flex items-center justify-center overflow-auto max-h-[60vh] bg-black/40 rounded-xl p-2">
              {getFileCategory(previewFile.type, previewFile.name) === 'image' && (
                <img
                  src={previewFile.downloadUrl}
                  alt={previewFile.name}
                  className="max-h-full max-w-full object-contain rounded-lg"
                />
              )}
              {getFileCategory(previewFile.type, previewFile.name) === 'video' && (
                <video
                  src={previewFile.downloadUrl}
                  controls
                  autoPlay
                  className="max-h-full max-w-full rounded-lg"
                />
              )}
              {getFileCategory(previewFile.type, previewFile.name) === 'audio' && (
                <div className="p-6 w-full flex flex-col items-center">
                  <Music className="w-12 h-12 text-cyan-400 mb-4 animate-bounce" />
                  <audio src={previewFile.downloadUrl} controls className="w-full" />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <a
                href={previewFile.downloadUrl}
                download={previewFile.name}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Save to Device</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
