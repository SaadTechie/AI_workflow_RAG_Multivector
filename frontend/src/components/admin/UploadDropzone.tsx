import React, { useCallback, useState } from 'react';

interface UploadDropzoneProps {
  onFileSelected: (file: File) => void;
  disabled?: boolean;
}

const ALLOWED_EXTENSIONS = ['.pdf', '.pptx'];

export const UploadDropzone: React.FC<UploadDropzoneProps> = ({ onFileSelected, disabled }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateAndSelect = useCallback(
    (file: File) => {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        setError(`Format non supporté. Seuls ${ALLOWED_EXTENSIONS.join(', ')} sont acceptés.`);
        return;
      }
      setError(null);
      onFileSelected(file);
    },
    [onFileSelected]
  );

  const handleDrop = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    const file = e.dataTransfer.files?.[0];
    if (file) validateAndSelect(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) validateAndSelect(file);
  };

  return (
    <div>
      <label
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center w-full h-52 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-200 ${
          disabled
            ? 'opacity-50 cursor-not-allowed border-slate-200 bg-slate-50/50'
            : isDragging
            ? 'border-slate-900 bg-slate-100/80 scale-[0.99]'
            : 'border-slate-200 hover:border-slate-400 hover:bg-slate-50/60'
        }`}
      >
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3 text-slate-500">
          <svg className="w-6 h-6 stroke-[1.75]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V3.75m0 0L7.5 8.25M12 3.75l4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-sm font-medium text-slate-700">
          <span className="text-slate-900 font-semibold underline underline-offset-2">Cliquez pour parcourir</span> ou glissez-déposez
        </p>
        <p className="text-xs text-slate-400 mt-1">Formats acceptés : PDF ou PPTX</p>
        <input
          type="file"
          accept=".pdf,.pptx"
          className="hidden"
          disabled={disabled}
          onChange={handleFileInput}
        />
      </label>
      {error && (
        <p className="text-xs text-red-500 font-medium mt-2.5 flex items-center gap-1.5">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
};