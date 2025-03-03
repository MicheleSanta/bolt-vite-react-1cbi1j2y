import React from 'react';
import ExcelExport from '../ExcelExport';
import { supabase } from '../../lib/supabase';
import { useState, useEffect } from 'react';
import { Loader2, FileSpreadsheet } from 'lucide-react';

interface FasciaExportData {
  Nome: string;
  Anno: number;
  'Tariffa Oraria': number;
  Ore: number;
  'Tariffa Totale': number;
  'Min Cedolini': number;
  'Max Cedolini': number;
  Descrizione: string;
}

const FasceTariffeExport: React.FC = () => {
  const [fasce, setFasce] = useState<FasciaExportData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [years, setYears] = useState<number[]>([]);

  useEffect(() => {
    fetchFasce();
  }, []);

  const fetchFasce = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('fascia')
        .select('*')
        .order('anno', { ascending: false })
        .order('nome', { ascending: true });
        
      if (error) throw error;
      
      // Extract unique years for filtering
      const uniqueYears = [...new Set((data || []).map(f => f.anno))];
      setYears(uniqueYears.sort((a, b) => b - a));
      
      // Transform data for export
      const fasceForExport = (data || []).map(fascia => ({
        Nome: fascia.nome,
        Anno: fascia.anno || new Date().getFullYear(),
        'Tariffa Oraria': fascia.tariffa,
        Ore: fascia.ore || 1,
        'Tariffa Totale': fascia.tariffa * (fascia.ore || 1),
        'Min Cedolini': fascia.min_cedolini || 1,
        'Max Cedolini': fascia.max_cedolini || 'Illimitato',
        Descrizione: fascia.descrizione || ''
      }));
      
      setFasce(fasceForExport);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Si è verificato un errore nel caricamento delle fasce');
      setFasce([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4 bg-white rounded-lg shadow">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
        <span>Caricamento dati fasce e tariffe...</span>
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
        <h2 className="text-lg font-medium">Esportazione Fasce e Tariffe</h2>
      </div>
      <p className="text-sm text-gray-600 mb-4">
        Esporta l'elenco delle fasce e tariffe per analisi di pricing e confronto storico.
      </p>
      <ExcelExport 
        data={fasce}
        filename="Fasce_Tariffe"
        sheetName="Fasce"
        buttonText="Esporta Fasce e Tariffe"
        filterOptions={{
          years: years,
          months: []
        }}
      />
    </div>
  );
};

export default FasceTariffeExport;