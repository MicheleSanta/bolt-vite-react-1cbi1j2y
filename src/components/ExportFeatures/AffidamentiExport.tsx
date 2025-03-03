import React from 'react';
import ExcelExport from '../ExcelExport';
import { supabase } from '../../lib/supabase';
import { useState, useEffect } from 'react';
import { Loader2, FileSpreadsheet } from 'lucide-react';

interface AffidamentoExportData {
  Anno: number;
  Determina: string;
  'Numero Determina': string;
  CIG: string;
  'Data Inizio': string;
  'Data Termine': string;
  Cliente: string;
  Descrizione: string;
  Stato: string;
  Quantità: number;
  'Prezzo Unitario': number;
  Imponibile: number;
  IVA: number;
  Totale: number;
  'Ha Provvigione': string;
  'Tipo Provvigione': string;
  'Partner Provvigione': string;
  'Percentuale Provvigione': number;
  'Importo Provvigione': number;
}

const AffidamentiExport: React.FC = () => {
  const [affidamenti, setAffidamenti] = useState<AffidamentoExportData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [years, setYears] = useState<number[]>([]);

  useEffect(() => {
    fetchAffidamenti();
  }, []);

  const fetchAffidamenti = async () => {
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
        .order('anno', { ascending: false })
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      // Extract unique years for filtering
      const uniqueYears = [...new Set((data || []).map(a => a.anno))];
      setYears(uniqueYears.sort((a, b) => b - a));
      
      // Transform data for export
      const affidamentiForExport = (data || []).map(aff => ({
        Anno: aff.anno,
        Determina: aff.determina,
        'Numero Determina': aff.numero_determina || '',
        CIG: aff.cig || '',
        'Data Inizio': aff.data ? new Date(aff.data).toLocaleDateString('it-IT') : '',
        'Data Termine': aff.data_termine ? new Date(aff.data_termine).toLocaleDateString('it-IT') : '',
        Cliente: aff.clienti?.denominazione || '',
        Descrizione: aff.descrizione,
        Stato: aff.stato,
        Quantità: aff.quantita,
        'Prezzo Unitario': aff.prezzo_unitario,
        Imponibile: aff.imponibile,
        IVA: aff.iva,
        Totale: aff.totale,
        'Ha Provvigione': aff.has_provvigione ? 'Sì' : 'No',
        'Tipo Provvigione': aff.tipo_provvigione || '',
        'Partner Provvigione': aff.partner_provvigione || '',
        'Percentuale Provvigione': aff.percentuale_provvigione || 0,
        'Importo Provvigione': aff.importo_provvigione || 0
      }));
      
      setAffidamenti(affidamentiForExport);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Si è verificato un errore nel caricamento degli affidamenti');
      setAffidamenti([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4 bg-white rounded-lg shadow">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
        <span>Caricamento dati affidamenti...</span>
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
        <h2 className="text-lg font-medium">Esportazione Affidamenti</h2>
      </div>
      <p className="text-sm text-gray-600 mb-4">
        Esporta l'elenco completo degli affidamenti con dettagli economici, provvigioni e stato per analisi finanziaria.
      </p>
      <ExcelExport 
        data={affidamenti}
        filename="Affidamenti_Completi"
        sheetName="Affidamenti"
        buttonText="Esporta Affidamenti"
        filterOptions={{
          years: years,
          months: []
        }}
      />
    </div>
  );
};

export default AffidamentiExport;