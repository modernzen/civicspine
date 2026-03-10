import { useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  FileText,
  Image,
  File,
  Trash2,
  Download,
  Loader2,
  AlertCircle,
  X,
} from 'lucide-react';
import type { StateRegistrationDocument } from '../../types';

interface DocumentsPanelProps {
  documents: StateRegistrationDocument[];
  loading: boolean;
  uploading: boolean;
  uploadError: string | null;
  onUpload: (file: File) => Promise<StateRegistrationDocument | null>;
  onDelete: (docId: string, filePath: string) => Promise<void>;
  onDownload: (filePath: string) => Promise<string | null>;
}

const ACCEPTED_TYPES = '.pdf,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg,.jpeg,.gif,.webp,.txt';

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(contentType: string) {
  if (contentType.startsWith('image/')) return Image;
  if (contentType.includes('pdf') || contentType.includes('word') || contentType.includes('document'))
    return FileText;
  return File;
}

export default function DocumentsPanel({
  documents,
  loading,
  uploading,
  uploadError,
  onUpload,
  onDelete,
  onDownload,
}: DocumentsPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files) return;
    for (let i = 0; i < files.length; i++) {
      await onUpload(files[i]);
    }
  }, [onUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleDelete = useCallback(async (doc: StateRegistrationDocument) => {
    setDeletingId(doc.id);
    await onDelete(doc.id, doc.file_path);
    setDeletingId(null);
  }, [onDelete]);

  const handleDownload = useCallback(async (doc: StateRegistrationDocument) => {
    setDownloadingId(doc.id);
    const url = await onDownload(doc.file_path);
    if (url) {
      window.open(url, '_blank');
    }
    setDownloadingId(null);
  }, [onDownload]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-slate-300">Documents</h4>
        <span className="text-xs text-slate-500">Max 10 MB per file</span>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative flex flex-col items-center gap-2 px-4 py-5 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
          dragOver
            ? 'border-sky-400/50 bg-sky-500/5'
            : 'border-navy-700/40 hover:border-navy-600/60 hover:bg-navy-800/20'
        }`}
      >
        {uploading ? (
          <Loader2 className="w-5 h-5 text-sky-400 animate-spin" />
        ) : (
          <Upload className="w-5 h-5 text-slate-500" />
        )}
        <p className="text-xs text-slate-500 text-center">
          {uploading ? 'Uploading...' : 'Drop files here or click to browse'}
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES}
          multiple
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      <AnimatePresence>
        {uploadError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20"
          >
            <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
            <span className="text-xs text-red-400 flex-1">{uploadError}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-4 h-4 text-slate-500 animate-spin" />
        </div>
      ) : documents.length === 0 ? (
        <p className="text-xs text-slate-600 text-center py-3">No documents attached</p>
      ) : (
        <div className="space-y-1.5">
          {documents.map((doc) => {
            const Icon = getFileIcon(doc.content_type);
            return (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-navy-800/30 border border-navy-700/20 group"
              >
                <Icon className="w-4 h-4 text-slate-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-300 truncate">{doc.file_name}</p>
                  <p className="text-xs text-slate-600">{formatFileSize(doc.file_size)}</p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => handleDownload(doc)}
                    disabled={downloadingId === doc.id}
                    className="p-1.5 rounded-md hover:bg-navy-700/50 text-slate-400 hover:text-sky-400 transition-colors"
                  >
                    {downloadingId === doc.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(doc)}
                    disabled={deletingId === doc.id}
                    className="p-1.5 rounded-md hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors"
                  >
                    {deletingId === doc.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <X className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
