import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ClienteDocumento } from '../types/database.types';
import { Loader2, RefreshCw, FileText, FileSpreadsheet, File, Download, Trash2, AlertCircle, ExternalLink, Search } from 'lucide-react';
import SearchBar from './SearchBar';

interface DocumentListProps {
  clienteId?: number;
  affidamentoId?: number;
  refreshTrigger: number;
}

interface DocumentItem {
  id: number;
  nome_file: string;
  tipo_file: string;
  dimensione: number;
  url: string;
  data_caricamento: string;
  descrizione?: string;
  created_at: string;
}

const DocumentList: React.FC<DocumentListProps> = ({ clienteId, affidamentoId, refreshTrigger }) => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<number | null>(null);

  const fetchDocuments = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (clienteId) {
        // Fetch cliente documents
        const { data, error } = await supabase
          .from('clienti_documenti')
          .select('*')
          .eq('cliente_id', clienteId)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        setDocuments(data || []);
        applyFilters(data || [], searchQuery);
      } else if (affidamentoId) {
        // Fetch affidamento documents
        const { data, error } = await supabase
          .from('affidamento_documenti')
          .select('*')
          .eq('affidamento_id', affidamentoId)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        setDocuments(data || []);
        applyFilters(data || [], searchQuery);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Si è verificato un errore nel caricamento dei documenti');
      setDocuments([]);
      setFilteredDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clienteId || affidamentoId) {
      fetchDocuments();
    }
  }, [clienteId, affidamentoId, refreshTrigger]);

  useEffect(() => {
    applyFilters(documents, searchQuery);
  }, [searchQuery, documents]);

  const applyFilters = (data: DocumentItem[], search: string) => {
    if (!search.trim()) {
      setFilteredDocuments(data);
      return;
    }
    
    const query = search.toLowerCase();
    const filtered = data.filter(doc => 
      doc.nome_file.toLowerCase().includes(query) ||
      (doc.descrizione && doc.descrizione.toLowerCase().includes(query))
    );
    
    setFilteredDocuments(filtered);
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

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateString;
    }
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    setError(null);
    
    try {
      // First get the document to get the file path
      let docData;
      
      if (clienteId) {
        const { data, error: docError } = await supabase
          .from('clienti_documenti')
          .select('url')
          .eq('id', id)
          .single();
          
        if (docError) throw docError;
        docData = data;
      } else if (affidamentoId) {
        const { data, error: docError } = await supabase
          .from('affidamento_documenti')
          .select('url')
          .eq('id', id)
          .single();
          
        if (docError) throw docError;
        docData = data;
      }
      
      if (!docData || !docData.url) {
        throw new Error('Documento non trovato');
      }
      
      // Extract the file path from the URL
      const url = new URL(docData.url);
      const pathParts = url.pathname.split('/');
      const filePath = pathParts[pathParts.length - 1];
      
      // Delete the file from storage
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([`${clienteId ? 'cliente' : 'affidamento'}_documenti/${filePath}`]);
      
      // Even if storage deletion fails, try to delete the database record
      if (storageError) {
        console.error('Error deleting file from storage:', storageError);
      }
      
      // Delete the database record
      if (clienteId) {
        const { error: dbError } = await supabase
          .from('clienti_documenti')
          .delete()
          .eq('id', id);
          
        if (dbError) throw dbError;
      } else if (affidamentoId) {
        const { error: dbError } = await supabase
          .from('affidamento_documenti')
          .delete()
          .eq('id', id);
          
        if (dbError) throw dbError;
      }
      
      // Refresh the list
      fetchDocuments();
      setDeleteConfirmation(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Si è verificato un errore durante l\'eliminazione');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading && documents.length === 0) {
    return (
      <div className="flex justify-center items-center p-4">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Caricamento documenti...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="flex justify-between items-center p-4 border-b">
        <h3 className="text-lg font-medium text-gray-900">Documenti</h3>
        <button 
          onClick={fetchDocuments} 
          className="flex items-center text-blue-600 hover:text-blue-800"
        >
          <RefreshCw className="w-4 h-4 mr-1" /> Aggiorna
        </button>
      </div>
      
      {documents.length > 0 && (
        <div className="p-4 border-b">
          <SearchBar 
            placeholder="Cerca per nome file o descrizione..." 
            value={searchQuery}
            onChange={setSearchQuery}
          />
        </div>
      )}
      
      {error && (
        <div className="m-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}
      
      {documents.length === 0 ? (
        <div className="p-6 text-center">
          <File className="w-12 h-12 mx-auto text-gray-400 mb-2" />
          <p className="text-gray-600">Nessun documento caricato.</p>
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="p-6 text-center">
          <p className="text-gray-500">Nessun documento corrisponde alla ricerca.</p>
          <button
            onClick={() => setSearchQuery('')}
            className="mt-2 text-blue-600 hover:text-blue-800"
          >
            Mostra tutti i documenti
          </button>
        </div>
      ) : (
        <ul className="divide-y divide-gray-200">
          {filteredDocuments.map(doc => (
            <li key={doc.id} className="p-4 hover:bg-gray-50">
              <div className="flex justify-between">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    {getFileIcon(doc.tipo_file)}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{doc.nome_file}</p>
                    <div className="flex items-center mt-1">
                      <span className="text-xs text-gray-500 mr-3">{formatFileSize(doc.dimensione)}</span>
                      <span className="text-xs text-gray-500">{formatDate(doc.data_caricamento)}</span>
                    </div>
                    {doc.descrizione && (
                      <p className="mt-1 text-sm text-gray-600">{doc.descrizione}</p>
                    )}
                  </div>
                </div>
                 <div className="flex space-x-2">
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                    title="Visualizza documento"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </a>
                  <a
                    href={doc.url}
                    download
                    className="text-green-600 hover:text-green-800"
                    title="Scarica documento"
                  >
                    <Download className="w-5 h-5" />
                  </a>
                  {deleteConfirmation === doc.id ? (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleDelete(doc.id)}
                        disabled={deletingId === doc.id}
                        className="text-red-600 hover:text-red-800 text-xs font-bold"
                      >
                        {deletingId === doc.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          'Conferma'
                        )}
                      </button>
                      <button
                        onClick={() => setDeleteConfirmation(null)}
                        className="text-gray-600 hover:text-gray-800 text-xs"
                      >
                        Annulla
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirmation(doc.id)}
                      className="text-red-600 hover:text-red-800"
                      title="Elimina documento"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default DocumentList;