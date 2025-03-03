import React from 'react';
import ExcelExport from '../ExcelExport';
import { supabase } from '../../lib/supabase';
import { useState, useEffect } from 'react';
import { Loader2, FileSpreadsheet } from 'lucide-react';

interface FatturaEmessaExportData {
  Cliente: string;
  Determina: string;
  Anno: number;
  'Numero Fattura': string;
  'Data Emissione': string;
  'Data Pagamento': string;
  Importo: number;
  Percentuale: number;
  Stato: string;
  'Giorni Attesa Pagamento': number;
  Note: string;
}

const FattureEmesseExport: React.FC = () => {
  const [fatture, setFatture] = useState<FatturaEmessaExportData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [years, setYears] = useState<number[]>([]);

  useEffect(() => {
    fetchFatture();
  }, []);

  const fetchFatture = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('fatturazione')
        .select(`
          *,
          affidamento:affidamento_id (
            id,
            determina,
            anno,
            cliente_id,
            clienti (
              denominazione
            )
          )
        `)
        .in('stato', ['Emessa', 'Pagata'])
        .order('data_emissione', { ascending: false });
        
      if (error) throw error;
      
      // Extract unique years for filtering
      const uniqueYears = [...new Set((data || []).map(f => {
        if (f.data_emissione) {
          return new Date(f.data_emissione).getFullYear();
        }
        return new Date().getFullYear();
      }))];
      setYears(uniqueYears.sort((a, b) => b - a));
      
      // Transform data for export
      const fattureForExport = (data || []).map(fatt => {
        // Calculate days waiting for payment
        let giorniAttesa = 0;
        if (fatt.stato === 'Emessa' && fatt.data_emissione) {
          const dataEmissione = new Date(fatt.data_emissione);
          const oggi = new Date();
          const diffTime = Math.abs(oggi.getTime() - dataEmissione.getTime());
          giorniAttesa = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }
        
        return {
          Cliente: fatt.affidamento?.clienti?.denominazione || '',
          Determina: fatt.affidamento?.determina || '',
          Anno: fatt.affidamento?.anno || new Date().getFullYear(),
          'Numero Fattura': fatt.numero_fattura || '',
          'Data Emissione': fatt.data_emissione ? new Date(fatt.data_emissione).toLocaleDateString('it-IT') : '',
          'Data Pagamento': fatt.data_pagamento ? new Date(fatt.data_pagamento).toLocaleDateString('it-IT') : '',
          Importo: fatt.importo,
          Percentuale: fatt.percentuale,
          Stato: fatt.stato,
          'Giorni Attesa Pagamento': giorniAttesa,
          Note: fatt.note || ''
        };
      });
      
      setFatture(fattureForExport);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Si è verificato un errore nel caricamento delle fatture');
      setFatture([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4 bg-white rounded-lg shadow">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
        <span>Caricamento fatture emesse...</span>
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
        <h2 className="text-lg font-medium">Esportazione Fatture Emesse</h2>
      </div>
      <p className="text-sm text-gray-600 mb-4">
        Esporta l'elenco delle fatture emesse e pagate con dettagli su tempi di pagamento per analisi finanziaria.
      </p>
      <ExcelExport 
        data={fatture}
        filename="Fatture_Emesse"
        sheetName="Fatture"
        buttonText="Esporta Fatture Emesse"
        filterOptions={{
          years: years,
          months: []
        }}
      />
    </div>
  );
};

export default FattureEmesseExport;