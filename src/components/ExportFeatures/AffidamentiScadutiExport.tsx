import React from 'react';
import ExcelExport from '../ExcelExport';
import { supabase } from '../../lib/supabase';
import { useState, useEffect } from 'react';
import { Loader2, FileSpreadsheet } from 'lucide-react';

interface AffidamentoScadutoExportData {
  Anno: number;
  Determina: string;
  'Numero Determina': string;
  CIG: string;
  Cliente: string;
  Descrizione: string;
  'Data Inizio': string;
  'Data Termine': string;
  'Giorni Scaduto': number;
  Stato: string;
  Totale: number;
  'Fatturato Totale': number;
  'Da Fatturare': number;
  'Percentuale Fatturato': number;
}

const AffidamentiScadutiExport: React.FC = () => {
  const [affidamenti, setAffidamenti] = useState<AffidamentoScadutoExportData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [years, setYears] = useState<number[]>([]);

  useEffect(() => {
    fetchAffidamentiScaduti();
  }, []);

  const fetchAffidamentiScaduti = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get all affidamenti with data_termine in the past
      const today = new Date();
      const { data, error } = await supabase
        .from('affidamento')
        .select(`
          *,
          clienti (
            denominazione
          )
        `)
        .lt('data_termine', today.toISOString().split('T')[0])
        .order('data_termine', { ascending: false });
        
      if (error) throw error;
      
      // Extract unique years for filtering
      const uniqueYears = [...new Set((data || []).map(a => a.anno))];
      setYears(uniqueYears.sort((a, b) => b - a));
      
      // For each affidamento, get the fatturazione data
      const affidamentiWithFatturazione = await Promise.all((data || []).map(async (aff) => {
        // Get fatturazione for this affidamento
        const { data: fatturazioneData, error: fatturazioneError } = await supabase
          .from('fatturazione')
          .select('*')
          .eq('affidamento_id', aff.id);
          
        if (fatturazioneError) throw fatturazioneError;
        
        // Calculate fatturato totale and da fatturare
        const fatturato = fatturazioneData
          ? fatturazioneData
              .filter(f => f.stato === 'Emessa' || f.stato === 'Pagata')
              .reduce((sum, f) => sum + f.importo, 0)
          : 0;
        
        const daFatturare = aff.totale - fatturato;
        const percentualeFatturato = aff.totale > 0 ? (fatturato / aff.totale) * 100 : 0;
        
        // Calculate days since expiration
        const dataTermine = new Date(aff.data_termine);
        const diffTime = Math.abs(today.getTime() - dataTermine.getTime());
        const giorniScaduto = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return {
          Anno: aff.anno,
          Determina: aff.determina,
          'Numero Determina': aff.numero_determina || '',
          CIG: aff.cig || '',
          Cliente: aff.clienti?.denominazione || '',
          Descrizione: aff.descrizione,
          'Data Inizio': aff.data ? new Date(aff.data).toLocaleDateString('it-IT') : '',
          'Data Termine': aff.data_termine ? new Date(aff.data_termine).toLocaleDateString('it-IT') : '',
          'Giorni Scaduto': giorniScaduto,
          Stato: aff.stato,
          Totale: aff.totale,
          'Fatturato Totale': fatturato,
          'Da Fatturare': daFatturare,
          'Percentuale Fatturato': parseFloat(percentualeFatturato.toFixed(2))
        };
      }));
      
      setAffidamenti(affidamentiWithFatturazione);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Si è verificato un errore nel caricamento degli affidamenti scaduti');
      setAffidamenti([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4 bg-white rounded-lg shadow">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
        <span>Caricamento affidamenti scaduti...</span>
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
        <h2 className="text-lg font-medium">Esportazione Affidamenti Scaduti</h2>
      </div>
      <p className="text-sm text-gray-600 mb-4">
        Esporta l'elenco degli affidamenti scaduti con dettagli su fatturazione e giorni di scadenza per follow-up.
      </p>
      <ExcelExport 
        data={affidamenti}
        filename="Affidamenti_Scaduti"
        sheetName="Scaduti"
        buttonText="Esporta Affidamenti Scaduti"
        filterOptions={{
          years: years,
          months: []
        }}
      />
    </div>
  );
};

export default AffidamentiScadutiExport;