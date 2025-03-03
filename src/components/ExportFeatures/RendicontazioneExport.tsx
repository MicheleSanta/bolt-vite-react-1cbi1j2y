import React from 'react';
import ExcelExport from '../ExcelExport';
import { supabase } from '../../lib/supabase';
import { useState, useEffect } from 'react';
import { Loader2, FileSpreadsheet } from 'lucide-react';

interface RendicontazioneExportData {
  Partner: string;
  Tecnico: string;
  Mese: string;
  Anno: number;
  'Codice Cliente': string;
  'Nome Cliente': string;
  'Numero Commessa': string;
  'Numero Cedolini': number;
  'Cedolini Extra': number;
  'Totale Cedolini': number;
  Fascia: string;
  Importo: number;
  Stato: string;
  'Numero Fattura': string;
  'Anno Fattura': number;
  'Data Fattura': string;
}

const RendicontazioneExport: React.FC = () => {
  const [rendicontazioni, setRendicontazioni] = useState<RendicontazioneExportData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [years, setYears] = useState<number[]>([]);
  const [months, setMonths] = useState<string[]>([]);

  useEffect(() => {
    fetchRendicontazioni();
  }, []);

  const fetchRendicontazioni = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('rendicontazione')
        .select('*')
        .order('anno', { ascending: false })
        .order('id_mese', { ascending: true });
        
      if (error) throw error;
      
      // Extract unique years and months for filtering
      const uniqueYears = [...new Set((data || []).map(r => r.anno))];
      setYears(uniqueYears.sort((a, b) => b - a));
      
      const uniqueMonths = [...new Set((data || []).map(r => r.mese))];
      // Sort months in chronological order
      const monthOrder: Record<string, number> = {
        'Gennaio': 1, 'Febbraio': 2, 'Marzo': 3, 'Aprile': 4, 
        'Maggio': 5, 'Giugno': 6, 'Luglio': 7, 'Agosto': 8, 
        'Settembre': 9, 'Ottobre': 10, 'Novembre': 11, 'Dicembre': 12
      };
      setMonths(uniqueMonths.sort((a, b) => monthOrder[a] - monthOrder[b]));
      
      // Transform data for export
      const rendicontazioniForExport = (data || []).map(rend => ({
        Partner: rend.partner,
        Tecnico: rend.nome_tecnico,
        Mese: rend.mese,
        Anno: rend.anno,
        'Codice Cliente': rend.codice_cliente,
        'Nome Cliente': rend.nome_cliente,
        'Numero Commessa': rend.numero_commessa || '',
        'Numero Cedolini': rend.numero_cedolini,
        'Cedolini Extra': rend.numero_cedolini_extra,
        'Totale Cedolini': rend.totale_cedolini,
        Fascia: rend.fascia,
        Importo: rend.importo,
        Stato: rend.stato || 'Da fatturare',
        'Numero Fattura': rend.numero_fattura || '',
        'Anno Fattura': rend.anno_fattura || '',
        'Data Fattura': rend.data_fattura ? new Date(rend.data_fattura).toLocaleDateString('it-IT') : ''
      }));
      
      setRendicontazioni(rendicontazioniForExport);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Si è verificato un errore nel caricamento delle rendicontazioni');
      setRendicontazioni([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4 bg-white rounded-lg shadow">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
        <span>Caricamento dati rendicontazione...</span>
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
        <h2 className="text-lg font-medium">Esportazione Rendicontazione Service Paghe</h2>
      </div>
      <p className="text-sm text-gray-600 mb-4">
        Esporta i dati di rendicontazione Service Paghe per analisi di produttività e fatturazione.
      </p>
      <ExcelExport 
        data={rendicontazioni}
        filename="Rendicontazione_Service_Paghe"
        sheetName="Rendicontazione"
        buttonText="Esporta Rendicontazione"
        filterOptions={{
          years: years,
          months: months
        }}
      />
    </div>
  );
};

export default RendicontazioneExport;