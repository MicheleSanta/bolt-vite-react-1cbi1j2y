import React from 'react';
import ExcelExport from '../ExcelExport';
import { supabase } from '../../lib/supabase';
import { useState, useEffect } from 'react';
import { Loader2, FileSpreadsheet } from 'lucide-react';

interface AnalisiFinanziariaData {
  Anno: number;
  Mese: string;
  'Totale Affidamenti': number;
  'Totale Fatturato': number;
  'Totale Da Fatturare': number;
  'Totale Provvigioni Attive': number;
  'Totale Provvigioni Passive': number;
  'Totale Service Paghe': number;
  'Numero Affidamenti': number;
  'Numero Fatture Emesse': number;
  'Numero Fatture Pagate': number;
}

const AnalisiFinanziariaExport: React.FC = () => {
  const [datiFinanziari, setDatiFinanziari] = useState<AnalisiFinanziariaData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [years, setYears] = useState<number[]>([]);

  useEffect(() => {
    fetchDatiFinanziari();
  }, []);

  const fetchDatiFinanziari = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get current year and previous years
      const currentYear = new Date().getFullYear();
      const yearsToAnalyze = [currentYear, currentYear - 1, currentYear - 2];
      setYears(yearsToAnalyze);
      
      const months = [
        'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
        'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
      ];
      
      // Create an array to hold all financial data by year and month
      const allFinancialData: AnalisiFinanziariaData[] = [];
      
      // For each year and month, calculate financial metrics
      for (const year of yearsToAnalyze) {
        for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
          const month = months[monthIndex];
          
          // Skip future months in current year
          if (year === currentYear && monthIndex > new Date().getMonth()) {
            continue;
          }
          
          // Calculate start and end dates for the month
          const startDate = new Date(year, monthIndex, 1);
          const endDate = new Date(year, monthIndex + 1, 0);
          
          // Get affidamenti created in this month
          const { data: affidamentiData, error: affidamentiError } = await supabase
            .from('affidamento')
            .select('*')
            .eq('anno', year);
            
          if (affidamentiError) throw affidamentiError;
          
          // Get fatturazioni with data_emissione in this month
          const { data: fatturazioniData, error: fatturazioniError } = await supabase
            .from('fatturazione')
            .select('*')
            .gte('data_emissione', startDate.toISOString().split('T')[0])
            .lte('data_emissione', endDate.toISOString().split('T')[0]);
            
          if (fatturazioniError) throw fatturazioniError;
          
          // Get fatturazioni with data_pagamento in this month
          const { data: pagamentiData, error: pagamentiError } = await supabase
            .from('fatturazione')
            .select('*')
            .gte('data_pagamento', startDate.toISOString().split('T')[0])
            .lte('data_pagamento', endDate.toISOString().split('T')[0]);
            
          if (pagamentiError) throw pagamentiError;
          
          // Get rendicontazioni for this month and year
          const { data: rendicontazioniData, error: rendicontazioniError } = await supabase
            .from('rendicontazione')
            .select('*')
            .eq('anno', year)
            .eq('mese', month);
            
          if (rendicontazioniError) throw rendicontazioniError;
          
          // Calculate totals
          const totaleAffidamenti = affidamentiData ? affidamentiData.reduce((sum, a) => sum + a.totale, 0) : 0;
          const totaleFatturato = fatturazioniData ? fatturazioniData.reduce((sum, f) => sum + f.importo, 0) : 0;
          const totaleDaFatturare = totaleAffidamenti - totaleFatturato;
          
          // Calculate provvigioni
          const provvigioniAttive = affidamentiData 
            ? affidamentiData
                .filter(a => a.has_provvigione && a.tipo_provvigione === 'attiva')
                .reduce((sum, a) => sum + (a.importo_provvigione || 0), 0)
            : 0;
            
          const provvigioniPassive = affidamentiData 
            ? affidamentiData
                .filter(a => a.has_provvigione && a.tipo_provvigione === 'passiva')
                .reduce((sum, a) => sum + (a.importo_provvigione || 0), 0)
            : 0;
            
          // Calculate service paghe total
          const totaleServicePaghe = rendicontazioniData 
            ? rendicontazioniData.reduce((sum, r) => sum + r.importo, 0)
            : 0;
          
          // Add data to array
          allFinancialData.push({
            Anno: year,
            Mese: month,
            'Totale Affidamenti': totaleAffidamenti,
            'Totale Fatturato': totaleFatturato,
            'Totale Da Fatturare': totaleDaFatturare,
            'Totale Provvigioni Attive': provvigioniAttive,
            'Totale Provvigioni Passive': provvigioniPassive,
            'Totale Service Paghe': totaleServicePaghe,
            'Numero Affidamenti': affidamentiData ? affidamentiData.length : 0,
            'Numero Fatture Emesse': fatturazioniData ? fatturazioniData.length : 0,
            'Numero Fatture Pagate': pagamentiData ? pagamentiData.length : 0
          });
        }
      }
      
      // Sort by year (descending) and month (chronological)
      allFinancialData.sort((a, b) => {
        if (a.Anno !== b.Anno) {
          return b.Anno - a.Anno; // Sort by year descending
        }
        
        // Sort by month chronologically
        const monthOrder: Record<string, number> = {
          'Gennaio': 1, 'Febbraio': 2, 'Marzo': 3, 'Aprile': 4, 
          'Maggio': 5, 'Giugno': 6, 'Luglio': 7, 'Agosto': 8, 
          'Settembre': 9, 'Ottobre': 10, 'Novembre': 11, 'Dicembre': 12
        };
        
        return monthOrder[a.Mese] - monthOrder[b.Mese];
      });
      
      setDatiFinanziari(allFinancialData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Si è verificato un errore nel caricamento dei dati finanziari');
      setDatiFinanziari([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4 bg-white rounded-lg shadow">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
        <span>Elaborazione dati finanziari...</span>
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
        <h2 className="text-lg font-medium">Esportazione Analisi Finanziaria</h2>
      </div>
      <p className="text-sm text-gray-600 mb-4">
        Esporta l'analisi finanziaria mensile con dati su affidamenti, fatturazione, provvigioni e service paghe per pianificazione strategica.
      </p>
      <ExcelExport 
        data={datiFinanziari}
        filename="Analisi_Finanziaria"
        sheetName="Analisi"
        buttonText="Esporta Analisi Finanziaria"
        filterOptions={{
          years: years,
          months: [
            'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
            'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
          ]
        }}
      />
    </div>
  );
};

export default AnalisiFinanziariaExport;