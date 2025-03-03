import React from 'react';
import ExcelExport from '../ExcelExport';
import { supabase } from '../../lib/supabase';
import { useState, useEffect } from 'react';
import { Loader2, FileSpreadsheet } from 'lucide-react';

interface FatturazioneExportData {
  'ID Affidamento': number;
  Cliente: string;
  Determina: string;
  Anno: number;
  Percentuale: number;
  Importo: number;
  'Data Scadenza': string;
  Stato: string;
  'Numero Fattura': string;
  'Data Emissione': string;
  'Data Pagamento': string;
  Note: string;
  'Giorni Ritardo': number;
}

const FatturazioneExport: React.FC = () => {
  const [fatturazioni, setFatturazioni] = useState<FatturazioneExportData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [years, setYears] = useState<number[]>([]);

  useEffect(() => {
    fetchFatturazioni();
  }, []);

  const fetchFatturazioni = async () => {
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
        .order('data_scadenza', { ascending: false });
        
      if (error) throw error;
      
      // Extract unique years for filtering
      const uniqueYears = [...new Set((data || []).map(f => {
        if (f.affidamento && f.affidamento.anno) {
          return f.affidamento.anno;
        }
        return new Date().getFullYear();
      }))];
      setYears(uniqueYears.sort((a, b) => b - a));
      
      // Transform data for export
      const fatturazioniForExport = (data || []).map(fatt => {
        // Calculate days of delay for payments
        let giorniRitardo = 0;
        if (fatt.stato === 'Da emettere' && fatt.data_scadenza) {
          const dataScadenza = new Date(fatt.data_scadenza);
          const oggi = new Date();
          if (dataScadenza < oggi) {
            const diffTime = Math.abs(oggi.getTime() - dataScadenza.getTime());
            giorniRitardo = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          }
        }
        
        return {
          'ID Affidamento': fatt.affidamento_id,
          Cliente: fatt.affidamento?.clienti?.denominazione || '',
          Determina: fatt.affidamento?.determina || '',
          Anno: fatt.affidamento?.anno || new Date().getFullYear(),
          Percentuale: fatt.percentuale,
          Importo: fatt.importo,
          'Data Scadenza': fatt.data_scadenza ? new Date(fatt.data_scadenza).toLocaleDateString('it-IT') : '',
          Stato: fatt.stato,
          'Numero Fattura': fatt.numero_fattura || '',
          'Data Emissione': fatt.data_emissione ? new Date(fatt.data_emissione).toLocaleDateString('it-IT') : '',
          'Data Pagamento': fatt.data_pagamento ? new Date(fatt.data_pagamento).toLocaleDateString('it-IT') : '',
          Note: fatt.note || '',
          'Giorni Ritardo': giorniRitardo
        };
      });
      
      setFatturazioni(fatturazioniForExport);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Si è verificato un errore nel caricamento delle fatturazioni');
      setFatturazioni([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4 bg-white rounded-lg shadow">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
        <span>Caricamento dati fatturazione...</span>
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
        <h2 className="text-lg font-medium">Esportazione Scadenziario Fatturazione</h2>
      </div>
      <p className="text-sm text-gray-600 mb-4">
        Esporta lo scadenziario completo con dettagli su fatture emesse, da emettere e ritardi nei pagamenti.
      </p>
      <ExcelExport 
        data={fatturazioni}
        filename="Scadenziario_Fatturazione"
        sheetName="Scadenziario"
        buttonText="Esporta Scadenziario"
        filterOptions={{
          years: years,
          months: []
        }}
      />
    </div>
  );
};

export default FatturazioneExport;