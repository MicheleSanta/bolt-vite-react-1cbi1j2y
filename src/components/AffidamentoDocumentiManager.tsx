import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Affidamento } from '../types/database.types';
import { ArrowLeft, FileBox } from 'lucide-react';
import DocumentUploader from './DocumentUploader';
import DocumentList from './DocumentList';

interface AffidamentoDocumentiManagerProps {
  affidamentoId: number;
  onBack: () => void;
}

const AffidamentoDocumentiManager: React.FC<AffidamentoDocumentiManagerProps> = ({ affidamentoId, onBack }) => {
  const [affidamento, setAffidamento] = useState<Affidamento | null>(null);
  const [clienteName, setClienteName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    fetchAffidamento();
  }, [affidamentoId]);

  const fetchAffidamento = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('affidamento')
        .select(`
          *,
          clienti (
            denominazione
          )
        `)
        .eq('id', affidamentoId)
        .single();
        
      if (error) throw error;
      
      setAffidamento(data);
      if (data.clienti) {
        setClienteName(data.clienti.denominazione);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Si è verificato un errore nel caricamento dell\'affidamento');
      setAffidamento(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentUploaded = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
          <div className="h-32 bg-gray-200 rounded mb-6"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !affidamento) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="text-red-600 mb-4">{error || 'Affidamento non trovato'}</div>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Torna all'elenco affidamenti
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <button
              onClick={onBack}
              className="mr-4 text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-xl font-semibold flex items-center">
                <FileBox className="w-5 h-5 mr-2 text-blue-600" />
                Documenti Affidamento
              </h2>
              <p className="text-gray-600">
                {affidamento.determina} - {clienteName}
              </p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <DocumentUploader 
              affidamentoId={affidamentoId} 
              onDocumentUploaded={handleDocumentUploaded} 
            />
          </div>
          
          <div className="lg:col-span-2">
            <DocumentList 
              affidamentoId={affidamentoId} 
              refreshTrigger={refreshTrigger} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AffidamentoDocumentiManager;