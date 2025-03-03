import React from 'react';
import ExcelExport from '../ExcelExport';
import { supabase } from '../../lib/supabase';
import { useState, useEffect } from 'react';
import { Cliente } from '../../types/database.types';
import { FileSpreadsheet, Loader2 } from 'lucide-react';

const ClientiExport: React.FC = () => {
  const [clienti, setClienti] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchClienti();
  }, []);

  const fetchClienti = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('clienti')
        .select('*')
        .order('denominazione', { ascending: true });
        
      if (error) throw error;
      
      // Transform data for export
      const clientiForExport = (data || []).map(cliente => ({
        Denominazione: cliente.denominazione,
        Referente: cliente.referente,
        Cellulare: cliente.cellulare,
        Email: cliente.email,
        Ufficio: cliente.ufficio || '',
        Indirizzo: cliente.indirizzo || '',
        Città: cliente.citta || '',
        CAP: cliente.cap || '',
        Provincia: cliente.provincia || '',
        'Codice Fiscale': cliente.codice_fiscale || '',
        'Partita IVA': cliente.partita_iva || '',
        PEC: cliente.pec || '',
        'Codice Univoco': cliente.codice_univoco || '',
        'Sito Web': cliente.sito_web || '',
        Note: cliente.note || '',
        'Data Creazione': new Date(cliente.created_at).toLocaleDateString('it-IT')
      }));
      
      setClienti(clientiForExport);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Si è verificato un errore nel caricamento dei clienti');
      setClienti([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4 bg-white rounded-lg shadow">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
        <span>Caricamento dati clienti...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-lg">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <div className="flex items-center mb-4">
        <FileSpreadsheet className="w-6 h-6 text-green-600 mr-2" />
        <h2 className="text-lg font-medium">Esportazione Anagrafica Clienti</h2>
      </div>
      <p className="text-sm text-gray-600 mb-4">
        Esporta l'elenco completo dei clienti con tutti i dettagli anagrafici per analisi e reportistica.
      </p>
      <ExcelExport 
        data={clienti}
        filename="Anagrafica_Clienti"
        sheetName="Clienti"
        buttonText="Esporta Anagrafica Clienti"
      />
    </div>
  );
};

export default ClientiExport;