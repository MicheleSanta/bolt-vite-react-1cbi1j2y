import React, { useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Upload, AlertCircle, Check, Loader2, FileText, FileSpreadsheet, File } from 'lucide-react';

interface DocumentUploaderProps {
  clienteId?: number;
  affidamentoId?: number;
  onDocumentUploaded: () => void;
}

const DocumentUploader: React.FC<DocumentUploaderProps> = ({ clienteId, affidamentoId, onDocumentUploaded }) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Maximum file size: 5MB
  const MAX_FILE_SIZE = 5 * 1024 * 1024;
  // Allowed file types
  const ALLOWED_FILE_TYPES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/msword', // .doc
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setError(null);
    
    if (!selectedFile) {
      setFile(null);
      return;
    }
    
    // Check file size
    if (selectedFile.size > MAX_FILE_SIZE) {
      setError(`Il file è troppo grande. La dimensione massima è ${MAX_FILE_SIZE / (1024 * 1024)}MB.`);
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }
    
    // Check file type
    if (!ALLOWED_FILE_TYPES.includes(selectedFile.type)) {
      setError('Formato file non supportato. Sono accettati solo file PDF, Word e Excel.');
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }
    
    setFile(selectedFile);
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) {
      return <FileText className="w-5 h-5 text-red-500" />;
    } else if (fileType.includes('word')) {
      return <FileText className="w-5 h-5 text-blue-500" />;
    } else if (fileType.includes('excel') || fileType.includes('spreadsheet')) {
      return <FileSpreadsheet className="w-5 h-5 text-green-500" />;
    } else {
      return <File className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) {
      return bytes + ' bytes';
    } else if (bytes < 1024 * 1024) {
      return (bytes / 1024).toFixed(1) + ' KB';
    } else {
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }
  };

  const uploadFile = async () => {
    if (!file || (!clienteId && !affidamentoId)) return;
    
    setUploading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Create a unique file name to avoid collisions
      const fileExt = file.name.split('.').pop();
      const entityId = clienteId || affidamentoId;
      const entityType = clienteId ? 'cliente' : 'affidamento';
      const fileName = `${entityType}_${entityId}_${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `${entityType}_documenti/${fileName}`;
      
      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      // Get the public URL for the file
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);
      
      if (!urlData.publicUrl) throw new Error('Errore nel recupero dell\'URL pubblico');
      
      // Save file metadata to the database
      if (clienteId) {
        // For cliente documents
        const { error: dbError } = await supabase
          .from('clienti_documenti')
          .insert([{
            cliente_id: clienteId,
            nome_file: file.name,
            tipo_file: file.type,
            dimensione: file.size,
            url: urlData.publicUrl,
            data_caricamento: new Date().toISOString(),
            descrizione: description || undefined
          }]);
        
        if (dbError) throw dbError;
      } else if (affidamentoId) {
        // For affidamento documents
        const { error: dbError } = await supabase
          .from('affidamento_documenti')
          .insert([{
            affidamento_id: affidamentoId,
            nome_file: file.name,
            tipo_file: file.type,
            dimensione: file.size,
            url: urlData.publicUrl,
            data_caricamento: new Date().toISOString(),
            descrizione: description || undefined
          }]);
        
        if (dbError) throw dbError;
      }
      
      setSuccess('Documento caricato con successo!');
      setFile(null);
      setDescription('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Notify parent component
      onDocumentUploaded();
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error('Error uploading file:', err);
      setError(err instanceof Error ? err.message : 'Si è verificato un errore durante il caricamento');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200">
      <h3 className="text-lg font-medium text-gray-900 mb-3">Carica Documento</h3>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 flex items-center">
          <Check className="w-5 h-5 mr-2" />
          {success}
        </div>
      )}
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Seleziona un documento
        </label>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
          accept=".pdf,.doc,.docx,.xls,.xlsx"
        />
        <p className="mt-1 text-xs text-gray-500">
          Formati supportati: PDF, Word (.doc, .docx), Excel (.xls, .xlsx). Dimensione massima: 5MB.
        </p>
      </div>
      
      {file && (
        <div className="mb-4 p-3 bg-gray-50 rounded-md border border-gray-200">
          <div className="flex items-center">
            {getFileIcon(file.type)}
            <div className="ml-2">
              <p className="text-sm font-medium text-gray-900">{file.name}</p>
              <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="mb-4">
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Descrizione (opzionale)
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={2}
          placeholder="Aggiungi una breve descrizione del documento..."
        />
      </div>
      
      <button
        onClick={uploadFile}
        disabled={!file || uploading}
        className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-300"
      >
        {uploading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Caricamento...
          </>
        ) : (
          <>
            <Upload className="w-4 h-4 mr-2" />
            Carica Documento
          </>
        )}
      </button>
    </div>
  );
};

export default DocumentUploader;