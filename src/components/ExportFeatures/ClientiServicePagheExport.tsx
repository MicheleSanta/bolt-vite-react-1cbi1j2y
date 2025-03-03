import React from 'react';
import ExcelExport from '../ExcelExport';
import { supabase } from '../../lib/supabase';
import { useState, useEffect } from 'react';
import { Loader2, FileSpreadsheet } from 'lucide-react';

interface ClienteServicePagheExportData {
  'Codice Cliente': string;
  'Nome Cliente': string;
  'Numero Commessa': string;
  'Data Attivazione': string;
  'Data Cessazione': string;
  'Tipo Servizio': string;
  Software: string;
  Fascia: string;
  'Fascia Personalizzata': string;
  Adempimenti: string;
  Referente: string;
  Partner: string;
  'Cedolini Previsti': number;
  'URL Gestionale': string;
  'Login Gestionale': string;
  'Altre Informazioni': string;
  'Stato Cliente': string;
}

const ClientiServicePagheExport: React.FC = () => {
  const [clienti, setClienti] = useState<ClienteServicePagheExportData[]>([]);
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
        .from('clienti_service_paghe')
        .select('*')
        .order('nome_cliente', { ascending: true });
        
      if (error) throw error;
      
      // Transform data for export
      const clientiForExport = (data || []).map(cliente => {
        // Determine client status based on cessation date
        let statoCliente = 'Attivo';
        if (cliente.data_cessazione) {
          const dataCessazione = new Date(cliente.data_cessazione);
          const oggi = new Date();
          if (dataCessazione < oggi) {
            statoCliente = 'Cessato';
          }
        }
        
        return {
          'Codice Cliente': cliente.codice_cliente,
          'Nome Cliente': cliente.nome_cliente,
          'Numero Commessa': cliente.numero_commessa || '',
          'Data Attivazione': cliente.data_attivazione ? new Date(cliente.data_attivazione).toLocaleDateString('it-IT') : '',
          'Data Cessazione': cliente.data_cessazione ? new Date(cliente.data_cessazione).toLocaleDateString('it-IT') : '',
          'Tipo Servizio': cliente.tipo_servizio || '',
          Software: cliente.software || '',
          Fascia: cliente.fascia || '',
          'Fascia Personalizzata': cliente.fascia_personalizzata ? 'Sì' : 'No',
          Adempimenti: cliente.adempimenti || '',
          Referente: cliente.referente || '',
          Partner: cliente.partner || '',
          'Cedolini Previsti': cliente.cedolini_previsti || 0,
          'URL Gestionale': cliente.url_gestionale || '',
          'Login Gestionale': cliente.login_gestionale || '',
          'Altre Informazioni': cliente.altre_informazioni || '',
          'Stato Cliente': statoCliente
        };
      });
      
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
        <span>Caricamento dati clienti Service Paghe...</span>
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
        <h2 className="text-lg font-medium">Esportazione Clienti Service Paghe</h2>
      </div>
      <p className="text-sm text-gray-600 mb-4">
        Esporta l'elenco completo dei clienti Service Paghe con dettagli su servizi, fasce e credenziali.
      </p>
      <ExcelExport 
        data={clienti}
        filename="Clienti_Service_Paghe"
        sheetName="Clienti"
        buttonText="Esporta Clienti Service Paghe"
      />
    </div>
  );
};

export default ClientiServicePagheExport;