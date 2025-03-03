import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { RendicontazioneInsert, ClienteServicePaghe, Mese } from '../types/database.types';
import { Save, Loader2, Search, Calendar, AlertCircle, Check, Info, Clock } from 'lucide-react';

interface DipendenteRendicontazioneFormProps {
  onRendicontazioneSubmitted: () => void;
  nomeDipendente: string;
}

const DipendenteRendicontazioneForm: React.FC<DipendenteRendicontazioneFormProps> = ({ 
  onRendicontazioneSubmitted,
  nomeDipendente
}) => {
  const mesi = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
  ];
  
  // Get current month name in Italian
  const getCurrentMonth = () => {
    return new Date().toLocaleString('it-IT', { month: 'long' });
  };
  
  const initialFormState: RendicontazioneInsert = {
    partner: '',
    nome_tecnico: nomeDipendente,
    mese: getCurrentMonth(),
    id_mese: new Date().getMonth() + 1, // Current month (1-12)
    anno: new Date().getFullYear(),
    codice_cliente: '',
    nome_cliente: '',
    numero_commessa: '',
    numero_cedolini: 0,
    numero_cedolini_extra: 0,
    totale_cedolini: 0,
    fascia: '',
    importo: 0,
    stato: 'Da validare', // Stato iniziale per le rendicontazioni dei dipendenti
  };

  const [rendicontazione, setRendicontazione] = useState<RendicontazioneInsert>(initialFormState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [clienti, setClienti] = useState<ClienteServicePaghe[]>([]);
  const [clientiSuggestions, setClientiSuggestions] = useState<ClienteServicePaghe[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<ClienteServicePaghe | null>(null);
  const [mesiList, setMesiList] = useState<Mese[]>([]);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  useEffect(() => {
    fetchClienti();
    fetchMesi();
  }, []);

  // Update totale_cedolini when numero_cedolini or numero_cedolini_extra changes
  useEffect(() => {
    const totale = rendicontazione.numero_cedolini + rendicontazione.numero_cedolini_extra;
    
    setRendicontazione(prev => ({
      ...prev,
      totale_cedolini: totale
    }));
  }, [rendicontazione.numero_cedolini, rendicontazione.numero_cedolini_extra]);

  // Filter client suggestions when codice_cliente or nome_cliente changes
  useEffect(() => {
    if (rendicontazione.codice_cliente || rendicontazione.nome_cliente) {
      const codiceQuery = rendicontazione.codice_cliente.toLowerCase();
      const nomeQuery = rendicontazione.nome_cliente.toLowerCase();
      
      const filtered = clienti.filter(cliente => 
        (codiceQuery && cliente.codice_cliente.toLowerCase().includes(codiceQuery)) ||
        (nomeQuery && cliente.nome_cliente.toLowerCase().includes(nomeQuery))
      );
      
      setClientiSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setClientiSuggestions([]);
      setShowSuggestions(false);
    }
  }, [rendicontazione.codice_cliente, rendicontazione.nome_cliente, clienti]);

  // Update mese when id_mese changes
  useEffect(() => {
    if (rendicontazione.id_mese && mesiList.length > 0) {
      const meseObj = mesiList.find(m => m.id === rendicontazione.id_mese);
      if (meseObj) {
        setRendicontazione(prev => ({
          ...prev,
          mese: meseObj.descrizione
        }));
      }
    }
  }, [rendicontazione.id_mese, mesiList]);

  // Check for duplicate entries when cliente, mese, and anno change
  useEffect(() => {
    if (rendicontazione.codice_cliente && rendicontazione.mese && rendicontazione.anno) {
      checkForDuplicates();
    } else {
      setDuplicateWarning(null);
    }
  }, [rendicontazione.codice_cliente, rendicontazione.mese, rendicontazione.anno]);

  const checkForDuplicates = async () => {
    try {
      const { data, error } = await supabase
        .from('rendicontazione')
        .select('id, nome_cliente')
        .eq('codice_cliente', rendicontazione.codice_cliente)
        .eq('mese', rendicontazione.mese)
        .eq('anno', rendicontazione.anno);
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        setDuplicateWarning(`Attenzione: Esiste già una rendicontazione per ${data[0].nome_cliente} nel mese di ${rendicontazione.mese} ${rendicontazione.anno}`);
      } else {
        setDuplicateWarning(null);
      }
    } catch (err) {
      console.error('Error checking for duplicates:', err);
    }
  };

  const fetchMesi = async () => {
    try {
      const { data, error } = await supabase
        .from('mese')
        .select('*')
        .order('id', { ascending: true });
        
      if (error) throw error;
      
      setMesiList(data || []);
    } catch (err) {
      console.error('Error fetching mesi:', err);
    }
  };

  const fetchClienti = async () => {
    try {
      const { data, error } = await supabase
        .from('clienti_service_paghe')
        .select('*')
        .order('nome_cliente', { ascending: true });
        
      if (error) throw error;
      
      setClienti(data || []);
    } catch (err) {
      console.error('Error fetching clienti:', err);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    
    // Handle numeric values
    if (['anno', 'numero_cedolini', 'numero_cedolini_extra', 'totale_cedolini', 'id_mese'].includes(name)) {
      setRendicontazione(prev => ({ 
        ...prev, 
        [name]: parseInt(value) || 0 
      }));
    } else {
      setRendicontazione(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSelectCliente = (cliente: ClienteServicePaghe) => {
    setRendicontazione(prev => ({
      ...prev,
      codice_cliente: cliente.codice_cliente,
      nome_cliente: cliente.nome_cliente,
      numero_commessa: cliente.numero_commessa || '',
      fascia: cliente.fascia || prev.fascia,
      partner: cliente.partner || prev.partner
    }));
    setShowSuggestions(false);
    setSelectedCliente(cliente);
  };

  const resetForm = () => {
    // Save the current month selection
    const currentMese = rendicontazione.mese;
    const currentIdMese = rendicontazione.id_mese;
    
    // Create a new form state with default values but preserve the current month
    const newFormState = {
      ...initialFormState,
      mese: currentMese, // Keep the current month selection
      id_mese: currentIdMese, // Keep the current month id
      nome_tecnico: nomeDipendente // Keep the dipendente name
    };
    
    setRendicontazione(newFormState);
    setSelectedCliente(null);
    setDuplicateWarning(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Check for duplicates one more time before inserting
      const { data: existingData, error: checkError } = await supabase
        .from('rendicontazione')
        .select('id')
        .eq('codice_cliente', rendicontazione.codice_cliente)
        .eq('mese', rendicontazione.mese)
        .eq('anno', rendicontazione.anno);
        
      if (checkError) throw checkError;
      
      if (existingData && existingData.length > 0) {
        throw new Error(`Esiste già una rendicontazione per questo cliente nel mese di ${rendicontazione.mese} ${rendicontazione.anno}`);
      }
      
      // Insert new record
      const { error } = await supabase.from('rendicontazione').insert([rendicontazione]);
      
      if (error) throw error;
      
      // Reset form
      resetForm();
      
      setSuccess('Rendicontazione inviata con successo! In attesa di validazione.');
      
      // Notify parent component
      onRendicontazioneSubmitted();
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Si è verificato un errore');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">
        Inserimento Rendicontazione Mensile
      </h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 flex items-center">
          <Check className="w-5 h-5 mr-2" />
          {success}
        </div>
      )}
      
      {duplicateWarning && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded mb-4 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {duplicateWarning}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="mb-4">
            <label htmlFor="nome_tecnico" className="block text-sm font-medium text-gray-700 mb-1">
              Nome Dipendente
            </label>
            <input
              type="text"
              id="nome_tecnico"
              name="nome_tecnico"
              value={rendicontazione.nome_tecnico}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
            />
            <p className="text-xs text-gray-500 mt-1">Nome del dipendente che effettua la rendicontazione</p>
          </div>
          
          <div className="mb-4">
            <label htmlFor="id_mese" className="block text-sm font-medium text-gray-700 mb-1">
              Mese
            </label>
            {mesiList.length > 0 ? (
              <select
                id="id_mese"
                name="id_mese"
                value={rendicontazione.id_mese}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {mesiList.map(mese => (
                  <option key={mese.id} value={mese.id}>{mese.descrizione}</option>
                ))}
              </select>
            ) : (
              <select
                id="mese"
                name="mese"
                value={rendicontazione.mese}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {mesi.map(mese => (
                  <option key={mese} value={mese}>{mese}</option>
                ))}
              </select>
            )}
          </div>
          
          <div className="mb-4">
            <label htmlFor="anno" className="block text-sm font-medium text-gray-700 mb-1">
              Anno
            </label>
            <input
              type="number"
              id="anno"
              name="anno"
              value={rendicontazione.anno}
              onChange={handleChange}
              required
              min="2000"
              max="2100"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="mb-4 relative">
            <label htmlFor="codice_cliente" className="block text-sm font-medium text-gray-700 mb-1">
              Codice Cliente
            </label>
            <div className="relative">
              <input
                type="text"
                id="codice_cliente"
                name="codice_cliente"
                value={rendicontazione.codice_cliente}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
            {showSuggestions && rendicontazione.codice_cliente && (
              <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-300 max-h-60 overflow-auto">
                {clientiSuggestions.map(cliente => (
                  <div 
                    key={cliente.id}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => handleSelectCliente(cliente)}
                  >
                    <div className="font-medium">{cliente.codice_cliente}</div>
                    <div className="text-sm text-gray-600">{cliente.nome_cliente}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="mb-4 relative">
            <label htmlFor="nome_cliente" className="block text-sm font-medium text-gray-700 mb-1">
              Nome Cliente
            </label>
            <div className="relative">
              <input
                type="text"
                id="nome_cliente"
                name="nome_cliente"
                value={rendicontazione.nome_cliente}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
            {showSuggestions && rendicontazione.nome_cliente && (
              <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-300 max-h-60 overflow-auto">
                {clientiSuggestions.map(cliente => (
                  <div 
                    key={cliente.id}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => handleSelectCliente(cliente)}
                  >
                    <div className="font-medium">{cliente.nome_cliente}</div>
                    <div className="text-sm text-gray-600">Cod: {cliente.codice_cliente}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="mb-4">
            <label htmlFor="numero_commessa" className="block text-sm font-medium text-gray-700 mb-1">
              Numero Commessa/Ordine
            </label>
            <input
              type="text"
              id="numero_commessa"
              name="numero_commessa"
              value={rendicontazione.numero_commessa || ''}
              onChange={handleChange}
              readOnly={!!selectedCliente}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${selectedCliente ? 'bg-gray-50' : ''}`}
            />
            <p className="text-xs text-gray-500 mt-1">
              Compilato automaticamente quando selezioni un cliente
            </p>
          </div>
          
          <div className="mb-4">
            <label htmlFor="numero_cedolini" className="block text-sm font-medium text-gray-700 mb-1">
              Numero Cedolini
            </label>
            <input
              type="number"
              id="numero_cedolini"
              name="numero_cedolini"
              value={rendicontazione.numero_cedolini}
              onChange={handleChange}
              required
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="numero_cedolini_extra" className="block text-sm font-medium text-gray-700 mb-1">
              Numero Cedolini Extra
            </label>
            <input
              type="number"
              id="numero_cedolini_extra"
              name="numero_cedolini_extra"
              value={rendicontazione.numero_cedolini_extra}
              onChange={handleChange}
              required
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="totale_cedolini" className="block text-sm font-medium text-gray-700 mb-1">
              Totale Cedolini
            </label>
            <input
              type="number"
              id="totale_cedolini"
              name="totale_cedolini"
              value={rendicontazione.totale_cedolini}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 focus:outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">Calcolato automaticamente</p>
          </div>
          
          <div className="mb-4">
            <label htmlFor="fascia" className="block text-sm font-medium text-gray-700 mb-1">
              Fascia
            </label>
            <input
              type="text"
              id="fascia"
              name="fascia"
              value={rendicontazione.fascia}
              onChange={handleChange}
              readOnly={!!selectedCliente && !!selectedCliente.fascia}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${selectedCliente && selectedCliente.fascia ? 'bg-gray-50' : ''}`}
            />
            <p className="text-xs text-gray-500 mt-1">
              Compilato automaticamente quando selezioni un cliente
            </p>
          </div>
        </div>
        
        {/* Cliente info */}
        {selectedCliente && (
          <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-md">
            <h3 className="text-md font-medium text-gray-700 mb-3 flex items-center">
              <Info className="w-5 h-5 mr-2 text-blue-600" />
              Informazioni Cliente
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">Data Attivazione:</p>
                <p className="font-medium">{selectedCliente.data_attivazione ? new Date(selectedCliente.data_attivazione).toLocaleDateString('it-IT') : 'N/D'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Fascia Cliente:</p>
                <p className="font-medium">{selectedCliente.fascia || 'N/D'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Cedolini Previsti:</p>
                <p className="font-medium">{selectedCliente.cedolini_previsti || 'N/D'}</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex justify-between mt-6">
          <button
            type="button"
            onClick={resetForm}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cancella
          </button>
          
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-300"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Invio in corso...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Invia Rendicontazione
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DipendenteRendicontazioneForm;