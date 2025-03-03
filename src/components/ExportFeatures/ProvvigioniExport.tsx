import React from 'react';
import ExcelExport from '../ExcelExport';
import { supabase } from '../../lib/supabase';
import { useState, useEffect } from 'react';
import { Loader2, FileSpreadsheet } from 'lucide-react';

interface ProvvigioneExportData {
  Anno: number;
  Determina: string;
  Cliente: string;
  'Tipo Provvigione': string;
  Partner: string;
  Percentuale: number;
  'Importo Provvigione': number;
  'Importo Affidamento': number;
  'Stato Affidamento': string;
  'Data Inizio': string;
  'Data Termine': string;
}

const ProvvigioniExport: React.FC = () => {
  const [provvigioni, setProvvigioni] = useState<ProvvigioneExportData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [years, setYears] = useState<number[]>([]);
  const [partners, setPartners] = useState<string[]>([]);

  useEffect(() => {
    fetchProvvigioni();
  }, []);

  const fetchProvvigioni = async () => {
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
        .eq('has_provvigione', true)
        .order('anno', { ascending: false })
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      // Extract unique years and partners for filtering
      const uniqueYears = [...new Set((data || []).map(a => a.anno))];
      setYears(uniqueYears.sort((a, b) => b - a));
      
      const uniquePartners = [...new Set((data || [])
        .map(a => a.partner_provvigione)
        .filter(Boolean) as string[])];
      setPartners(uniquePartners.sort());
      
      // Transform data for export
      const provvigioniForExport = (data || []).map(aff => ({
        Anno: aff.anno,
        Determina: aff.determina,
        Cliente: aff.clienti?.denominazione || '',
        'Tipo Provvigione': aff.tipo_provvigione === 'passiva' ? 'Passiva (da pagare)' : 'Attiva (da ricevere)',
        Partner: aff.partner_provvigione || '',
        Percentuale: aff.percentuale_provvigione || 0,
        'Importo Provvigione': aff.importo_provvigione || 0,
        'Importo Affidamento': aff.totale,
        'Stato Affidamento': aff.stato,
        'Data Inizio': aff.data ? new Date(aff.data).toLocaleDateString('it-IT') : '',
        'Data Termine': aff.data_termine ? new Date(aff.data_termine).toLocaleDateString('it-IT') : ''
      }));
      
      setProvvigioni(provvigioniForExport);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Si è verificato un errore nel caricamento delle provvigioni');
      setProvvigioni([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4 bg-white rounded-lg shadow">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
        <span>Caricamento dati provvigioni...</span>
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
        <h2 className="text-lg font-medium">Esportazione Provvigioni</h2>
      </div>
      <p className="text-sm text-gray-600 mb-4">
        Esporta i dati relativi alle provvigioni attive e passive per analisi finanziaria e calcolo compensi.
      </p>
      <ExcelExport 
        data={provvigioni}
        filename="Analisi_Provvigioni"
        sheetName="Provvigioni"
        buttonText="Esporta Provvigioni"
        filterOptions={{
          years: years,
          months: partners // Riutilizziamo il campo months per i partner
        }}
      />
    </div>
  );
};

export default ProvvigioniExport;