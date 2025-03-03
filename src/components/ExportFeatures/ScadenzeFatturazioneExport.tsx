import React from 'react';
import ExcelExport from '../ExcelExport';
import { supabase } from '../../lib/supabase';
import { useState, useEffect } from 'react';
import { Loader2, FileSpreadsheet } from 'lucide-react';

interface ScadenzaExportData {
  Cliente: string;
  Determina: string;
  Anno: number;
  'Data Scadenza': string;
  Percentuale: number;
  Importo: number;
  Stato: string;
  'Giorni Ritardo': number;
  'Numero Fattura': string;
  'Data Emissione': string;
  'Data Pagamento': string;
  Note: string;
}

const ScadenzeFatturazioneExport: React.FC = () => {
  const [scadenze, setScadenze] = useState<ScadenzaExportData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchScadenze();
  }, []);

  const fetchScadenze = async () => {
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
        .eq('stato', 'Da emettere')
        .order('data_scadenza', { ascending: true });
        
      if (error) throw error;
      
      // Transform data for export
      const scadenzeForExport = (data || []).map(scad => {
        // Calculate days of delay
        let giorniRitardo = 0;
        if (scad.data_scadenza) {
          const dataScadenza = new Date(scad.data_scadenza);
          const oggi = new Date();
          if (dataScadenza < oggi) {
            const diffTime = Math.abs(oggi.getTime() - dataScadenza.getTime());
            giorniRitardo = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          }
        }
        
        return {
          Cliente: scad.affidamento?.clienti?.denominazione || '',
          Determina: scad.affidamento?.determina || '',
          Anno: scad.affidamento?.anno || new Date().getFullYear(),
          'Data Scadenza': scad.data_scadenza ? new Date(scad.data_scadenza).toLocaleDateString('it-IT') : '',
          Percentuale: scad.percentuale,
          Importo: scad.importo,
          Stato: scad.stato,
          'Giorni Ritardo': giorniRitardo,
          'Numero Fattura': scad.numero_fattura || '',
          'Data Emissione': scad.data_emissione ? new Date(scad.data_emissione).toLocaleDateString('it-IT') : '',
          'Data Pagamento': scad.data_pagamento ? new Date(scad.data_pagamento).toLocaleDateString('it-IT') : '',
          Note: scad.note || ''
        };
      });
      
      setScadenze(scadenzeForExport);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Si è verificato un errore nel caricamento delle scadenze');
      setScadenze([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4 bg-white rounded-lg shadow">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
        <span>Caricamento scadenze fatturazione...</span>
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
        <h2 className="text-lg font-medium">Esportazione Scadenze da Fatturare</h2>
      </div>
      <p className="text-sm text-gray-600 mb-4">
        Esporta l'elenco delle scadenze da fatturare con dettagli su ritardi e importi per pianificazione finanziaria.
      </p>
      <ExcelExport 
        data={scadenze}
        filename="Scadenze_Da_Fatturare"
        sheetName="Scadenze"
        buttonText="Esporta Scadenze da Fatturare"
      />
    </div>
  );
};

export default ScadenzeFatturazioneExport;