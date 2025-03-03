import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { RendicontazioneInsert, Rendicontazione, Partner, Tecnico, Fascia, ClienteServicePaghe, Mese } from '../types/database.types';
import { Save, Loader2, Calculator, X, Check, FileSpreadsheet, Search, Receipt, Calendar, Clock, Info, AlertCircle } from 'lucide-react';
import FullscreenButton from './FullscreenButton';

interface RendicontazioneFormProps {
  onRendicontazioneAdded: () => void;
  rendicontazioneToEdit?: Rendicontazione | null;
  onCancelEdit?: () => void;
}

const RendicontazioneForm: React.FC<RendicontazioneFormProps> = ({ 
  onRendicontazioneAdded, 
  rendicontazioneToEdit = null,
  onCancelEdit
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
    nome_tecnico: '',
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
    stato: 'Da fatturare',
    numero_fattura: '',
    anno_fattura: new Date().getFullYear(),
    data_fattura: ''
  };

  const [rendicontazione, setRendicontazione] = useState<RendicontazioneInsert>(initialFormState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [tecnici, setTecnici] = useState<Tecnico[]>([]);
  const [fasce, setFasce] = useState<Fascia[]>([]);
  const [clienti, setClienti] = useState<ClienteServicePaghe[]>([]);
  const [clientiSuggestions, setClientiSuggestions] = useState<ClienteServicePaghe[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [autoSelectFascia, setAutoSelectFascia] = useState(true);
  const [showInvoiceFields, setShowInvoiceFields] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedFascia, setSelectedFascia] = useState<Fascia | null>(null);
  const [mesiList, setMesiList] = useState<Mese[]>([]);
  const [selectedCliente, setSelectedCliente] = useState<ClienteServicePaghe | null>(null);
  const [fasciaAnno, setFasciaAnno] = useState<number>(new Date().getFullYear());
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const isEditing = !!rendicontazioneToEdit;

  useEffect(() => {
    fetchPartners();
    fetchTecnici();
    fetchFasce();
    fetchClienti();
    fetchMesi();
  }, []);

  useEffect(() => {
    // If we have a rendicontazione to edit, populate the form
    if (rendicontazioneToEdit) {
      setRendicontazione({
        partner: rendicontazioneToEdit.partner,
        nome_tecnico: rendicontazioneToEdit.nome_tecnico,
        mese: rendicontazioneToEdit.mese,
        id_mese: rendicontazioneToEdit.id_mese || getMeseIdFromDescrizione(rendicontazioneToEdit.mese),
        anno: rendicontazioneToEdit.anno,
        codice_cliente: rendicontazioneToEdit.codice_cliente,
        nome_cliente: rendicontazioneToEdit.nome_cliente,
        numero_commessa: rendicontazioneToEdit.numero_commessa || '',
        numero_cedolini: rendicontazioneToEdit.numero_cedolini,
        numero_cedolini_extra: rendicontazioneToEdit.numero_cedolini_extra,
        totale_cedolini: rendicontazioneToEdit.totale_cedolini,
        fascia: rendicontazioneToEdit.fascia,
        importo: rendicontazioneToEdit.importo,
        stato: rendicontazioneToEdit.stato || 'Da fatturare',
        numero_fattura: rendicontazioneToEdit.numero_fattura || '',
        anno_fattura: rendicontazioneToEdit.anno_fattura || new Date().getFullYear(),
        data_fattura: rendicontazioneToEdit.data_fattura || ''
      });
      // When editing, don't auto-select fascia by default
      setAutoSelectFascia(false);
      
      // Show invoice fields if the record has invoice data or is marked as invoiced
      setShowInvoiceFields(
        rendicontazioneToEdit.stato === 'Fatturato' || 
        !!rendicontazioneToEdit.numero_fattura || 
        !!rendicontazioneToEdit.data_fattura
      );

      // Fetch cliente details if available
      if (rendicontazioneToEdit.codice_cliente) {
        fetchClienteByCode(rendicontazioneToEdit.codice_cliente);
      }
    }
  }, [rendicontazioneToEdit]);

  useEffect(() => {
    // Calculate totale_cedolini when numero_cedolini or numero_cedolini_extra changes
    const totale = rendicontazione.numero_cedolini + rendicontazione.numero_cedolini_extra;
    
    setRendicontazione(prev => ({
      ...prev,
      totale_cedolini: totale
    }));
  }, [rendicontazione.numero_cedolini, rendicontazione.numero_cedolini_extra]);

  useEffect(() => {
    // Auto-select fascia based on totale_cedolini if autoSelectFascia is true
    if (autoSelectFascia && fasce.length > 0 && rendicontazione.totale_cedolini > 0) {
      const appropriateFascia = findAppropriateFascia(rendicontazione.totale_cedolini, fasciaAnno);
      if (appropriateFascia && appropriateFascia.nome !== rendicontazione.fascia) {
        setRendicontazione(prev => ({
          ...prev,
          fascia: appropriateFascia.nome
        }));
        setSelectedFascia(appropriateFascia);
      }
    }
  }, [rendicontazione.totale_cedolini, fasce, autoSelectFascia, fasciaAnno]);

  useEffect(() => {
    // Update selected fascia when fascia changes
    if (fasce.length > 0 && rendicontazione.fascia) {
      const fascia = fasce.find(f => f.nome === rendicontazione.fascia && f.anno === fasciaAnno);
      if (fascia) {
        setSelectedFascia(fascia);
      }
    }
  }, [rendicontazione.fascia, fasce, fasciaAnno]);

  useEffect(() => {
    // Calculate importo based on fascia and ore (not cedolini)
    if (selectedFascia) {
      // Multiply the fascia tariffa by the number of ore only
      const tariffa = selectedFascia.tariffa;
      const ore = selectedFascia.ore || 1;
      const importo = tariffa * ore;
      
      setRendicontazione(prev => ({
        ...prev,
        importo: parseFloat(importo.toFixed(2))
      }));
    }
  }, [selectedFascia]);

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

  // Show/hide invoice fields based on status
  useEffect(() => {
    if (rendicontazione.stato === 'Fatturato') {
      setShowInvoiceFields(true);
    }
  }, [rendicontazione.stato]);

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

  // Update id_mese when mese changes
  useEffect(() => {
    if (rendicontazione.mese && mesiList.length > 0) {
      const meseId = getMeseIdFromDescrizione(rendicontazione.mese);
      if (meseId && meseId !== rendicontazione.id_mese) {
        setRendicontazione(prev => ({
          ...prev,
          id_mese: meseId
        }));
      }
    }
  }, [rendicontazione.mese, mesiList]);

  // Update fasciaAnno when selectedCliente changes
  useEffect(() => {
    if (selectedCliente && selectedCliente.data_attivazione) {
      const attivationYear = new Date(selectedCliente.data_attivazione).getFullYear();
      setFasciaAnno(attivationYear);
      
      // Re-fetch fasce for this year
      fetchFasceByYear(attivationYear);
    }
  }, [selectedCliente]);

  // Check for duplicate entries when cliente, mese, and anno change
  useEffect(() => {
    if (rendicontazione.codice_cliente && rendicontazione.mese && rendicontazione.anno) {
      checkForDuplicates();
    } else {
      setDuplicateWarning(null);
    }
  }, [rendicontazione.codice_cliente, rendicontazione.mese, rendicontazione.anno]);

  const checkForDuplicates = async () => {
    // Don't check for duplicates when editing an existing record
    if (isEditing) return;
    
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

  const fetchClienteByCode = async (codiceCliente: string) => {
    try {
      const { data, error } = await supabase
        .from('clienti_service_paghe')
        .select('*')
        .eq('codice_cliente', codiceCliente)
        .single();
        
      if (error) throw error;
      
      if (data) {
        setSelectedCliente(data);
        
        // If client has activation date, set fasciaAnno
        if (data.data_attivazione) {
          const attivationYear = new Date(data.data_attivazione).getFullYear();
          setFasciaAnno(attivationYear);
          
          // Re-fetch fasce for this year
          fetchFasceByYear(attivationYear);
        }
      }
    } catch (err) {
      console.error('Error fetching cliente by code:', err);
    }
  };

  const fetchFasceByYear = async (year: number) => {
    try {
      const { data, error } = await supabase
        .from('fascia')
        .select('*')
        .eq('anno', year)
        .order('nome', { ascending: true });
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        setFasce(data);
        
        // If auto-select is enabled, find appropriate fascia
        if (autoSelectFascia && rendicontazione.totale_cedolini > 0) {
          const appropriateFascia = findAppropriateFascia(rendicontazione.totale_cedolini, year);
          if (appropriateFascia) {
            setRendicontazione(prev => ({
              ...prev,
              fascia: appropriateFascia.nome
            }));
            setSelectedFascia(appropriateFascia);
          }
        }
      } else {
        // If no fasce for this year, fetch all fasce
        fetchFasce();
      }
    } catch (err) {
      console.error('Error fetching fasce by year:', err);
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

  const getMeseIdFromDescrizione = (descrizione: string): number | undefined => {
    if (mesiList.length > 0) {
      const meseObj = mesiList.find(m => m.descrizione === descrizione);
      return meseObj?.id;
    }
    
    // Fallback mapping if mesiList is not yet loaded
    const meseMap: Record<string, number> = {
      'Gennaio': 1,
      'Febbraio': 2,
      'Marzo': 3,
      'Aprile': 4,
      'Maggio': 5,
      'Giugno': 6,
      'Luglio': 7,
      'Agosto': 8,
      'Settembre': 9,
      'Ottobre': 10,
      'Novembre': 11,
      'Dicembre': 12
    };
    
    return meseMap[descrizione];
  };

  const fetchPartners = async () => {
    try {
      const { data, error } = await supabase
        .from('partner')
        .select('*')
        .order('nome', { ascending: true });
        
      if (error) throw error;
      
      setPartners(data || []);
      
      // Set default partner if available and not editing
      if (data && data.length > 0 && !rendicontazioneToEdit) {
        setRendicontazione(prev => ({
          ...prev,
          partner: data[0].nome
        }));
      }
    } catch (err) {
      console.error('Error fetching partners:', err);
    }
  };

  const fetchTecnici = async () => {
    try {
      const { data, error } = await supabase
        .from('tecnico')
        .select('*')
        .order('nome', { ascending: true });
        
      if (error) throw error;
      
      setTecnici(data || []);
      
      // Set default tecnico if available and not editing
      if (data && data.length > 0 && !rendicontazioneToEdit) {
        setRendicontazione(prev => ({
          ...prev,
          nome_tecnico: data[0].nome
        }));
      }
    } catch (err) {
      console.error('Error fetching tecnici:', err);
    }
  };

  const fetchFasce = async () => {
    try {
      const { data, error } = await supabase
        .from('fascia')
        .select('*')
        .order('anno', { ascending: false })
        .order('nome', { ascending: true });
        
      if (error) throw error;
      
      setFasce(data || []);
      
      // Set initial selected fascia
      if (data && data.length > 0 && rendicontazione.fascia) {
        const fascia = data.find(f => f.nome === rendicontazione.fascia);
        if (fascia) {
          setSelectedFascia(fascia);
        } else if (data.length > 0 && !rendicontazioneToEdit) {
          // Set default fascia if available and not editing
          setRendicontazione(prev => ({
            ...prev,
            fascia: data[0].nome
          }));
          setSelectedFascia(data[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching fasce:', err);
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

  const findAppropriateFascia = (totaleCedolini: number, year: number): Fascia | undefined => {
    // First try to find a fascia for the specific year
    const yearFasce = fasce.filter(fascia => fascia.anno === year);
    
    if (yearFasce.length > 0) {
      // Find the fascia that matches the range for the given number of cedolini
      return yearFasce.find(fascia => {
        const min = fascia.min_cedolini || 1;
        const max = fascia.max_cedolini || Number.MAX_SAFE_INTEGER;
        return totaleCedolini >= min && totaleCedolini <= max;
      });
    }
    
    // If no fasce for the specific year, try with any fascia
    return fasce.find(fascia => {
      const min = fascia.min_cedolini || 1;
      const max = fascia.max_cedolini || Number.MAX_SAFE_INTEGER;
      return totaleCedolini >= min && totaleCedolini <= max;
    });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    
    // Handle checkbox
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setRendicontazione(prev => ({ ...prev, [name]: checked }));
      return;
    }
    
    // Handle numeric values
    if (['anno', 'numero_cedolini', 'numero_cedolini_extra', 'totale_cedolini', 'importo', 'anno_fattura', 'id_mese'].includes(name)) {
      setRendicontazione(prev => ({ 
        ...prev, 
        [name]: name === 'importo' ? parseFloat(value) : parseInt(value) || 0 
      }));
    } else {
      setRendicontazione(prev => ({ ...prev, [name]: value }));
    }
  };

  const toggleAutoSelectFascia = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAutoSelectFascia(e.target.checked);
    
    // If turning on auto-select, immediately update the fascia based on current cedolini
    if (e.target.checked && fasce.length > 0) {
      const appropriateFascia = findAppropriateFascia(rendicontazione.totale_cedolini, fasciaAnno);
      if (appropriateFascia) {
        setRendicontazione(prev => ({
          ...prev,
          fascia: appropriateFascia.nome
        }));
        setSelectedFascia(appropriateFascia);
      }
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
    
    // Update selected fascia if cliente has a fascia
    if (cliente.fascia && fasce.length > 0) {
      const fascia = fasce.find(f => f.nome === cliente.fascia);
      if (fascia) {
        setSelectedFascia(fascia);
        setAutoSelectFascia(false); // Disable auto-select when selecting a client with a specific fascia
      }
    }
    
    // If client has activation date, set fasciaAnno
    if (cliente.data_attivazione) {
      const attivationYear = new Date(cliente.data_attivazione).getFullYear();
      setFasciaAnno(attivationYear);
      
      // Re-fetch fasce for this year
      fetchFasceByYear(attivationYear);
    }
  };

  const resetForm = () => {
    // Save the current month selection
    const currentMese = rendicontazione.mese;
    const currentIdMese = rendicontazione.id_mese;
    
    // Create a new form state with default values but preserve the current month and partners/tecnici
    const newFormState = {
      ...initialFormState,
      partner: partners.length > 0 ? partners[0].nome : '',
      nome_tecnico: tecnici.length > 0 ? tecnici[0].nome : '',
      fascia: fasce.length > 0 ? fasce[0].nome : 'A',
      mese: currentMese, // Keep the current month selection
      id_mese: currentIdMese // Keep the current month id
    };
    
    setRendicontazione(newFormState);
    setShowInvoiceFields(false);
    setAutoSelectFascia(true);
    setSelectedCliente(null);
    setFasciaAnno(new Date().getFullYear());
    setDuplicateWarning(null);
    
    // Reset selected fascia
    if (fasce.length > 0) {
      const defaultFascia = fasce.find(f => f.nome === newFormState.fascia);
      if (defaultFascia) {
        setSelectedFascia(defaultFascia);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Validate invoice data if status is "Fatturato"
      if (rendicontazione.stato === 'Fatturato') {
        if (!rendicontazione.numero_fattura) {
          throw new Error('Il numero fattura è obbligatorio quando lo stato è "Fatturato"');
        }
        if (!rendicontazione.data_fattura) {
          throw new Error('La data fattura è obbligatoria quando lo stato è "Fatturato"');
        }
      }
      
      // Ensure id_mese is set
      if (!rendicontazione.id_mese) {
        rendicontazione.id_mese = getMeseIdFromDescrizione(rendicontazione.mese);
      }
      
      // Prepare data for submission
      const dataToSubmit = {
        ...rendicontazione,
        // If invoice fields are empty and status is not "Fatturato", set them to null
        numero_fattura: rendicontazione.stato !== 'Fatturato' && !rendicontazione.numero_fattura ? null : rendicontazione.numero_fattura,
        anno_fattura: rendicontazione.stato !== 'Fatturato' && !rendicontazione.anno_fattura ? null : rendicontazione.anno_fattura,
        data_fattura: rendicontazione.stato !== 'Fatturato' && !rendicontazione.data_fattura ? null : rendicontazione.data_fattura
      };

      if (isEditing && rendicontazioneToEdit) {
        // Update existing record
        const { error } = await supabase
          .from('rendicontazione')
          .update(dataToSubmit)
          .eq('id', rendicontazioneToEdit.id);
        
        if (error) throw error;
        setSuccess('Rendicontazione aggiornata con successo!');
      } else {
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
        const { error } = await supabase.from('rendicontazione').insert([dataToSubmit]);
        
        if (error) throw error;
        
        // Reset form if not editing
        resetForm();
        
        setSuccess('Rendicontazione aggiunta con successo!');
      }
      
      onRendicontazioneAdded();
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
        if (isEditing && onCancelEdit) {
          onCancelEdit();
        }
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Si è verificato un errore');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (onCancelEdit) {
      onCancelEdit();
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className={`bg-white p-6 rounded-lg shadow-md ${isFullscreen ? 'fixed inset-0 z-50 overflow-y-auto' : ''}`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">
          {isEditing ? 'Modifica Rendicontazione' : 'Nuova Rendicontazione Service Paghe'}
        </h2>
        <div className="flex items-center space-x-2">
          <FullscreenButton 
            isFullscreen={isFullscreen} 
            onClick={toggleFullscreen} 
          />
          {isEditing && onCancelEdit && (
            <button 
              onClick={handleCancel}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
      
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
            <label htmlFor="partner" className="block text-sm font-medium text-gray-700 mb-1">
              Partner
            </label>
            {partners.length > 0 ? (
              <select
                id="partner"
                name="partner"
                value={rendicontazione.partner}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleziona partner</option>
                {partners.map(partner => (
                  <option key={partner.id} value={partner.nome}>{partner.nome}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                id="partner"
                name="partner"
                value={rendicontazione.partner}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nome partner"
              />
            )}
          </div>
          
          <div className="mb-4">
            <label htmlFor="nome_tecnico" className="block text-sm font-medium text-gray-700 mb-1">
              Nome Tecnico
            </label>
            {tecnici.length > 0 ? (
              <select
                id="nome_tecnico"
                name="nome_tecnico"
                value={rendicontazione.nome_tecnico}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleziona tecnico</option>
                {tecnici.map(tecnico => (
                  <option key={tecnico.id} value={tecnico.nome}>{tecnico.nome}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                id="nome_tecnico"
                name="nome_tecnico"
                value={rendicontazione.nome_tecnico}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nome tecnico"
              />
            )}
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Compilato automaticamente se il cliente è presente nell'anagrafica
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
            <div className="flex justify-between items-center">
              <label htmlFor="fascia" className="block text-sm font-medium text-gray-700 mb-1">
                Fascia
              </label>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="autoSelectFascia"
                  checked={autoSelectFascia}
                  onChange={toggleAutoSelectFascia}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="autoSelectFascia" className="ml-2 text-xs text-gray-600">
                  Auto-seleziona fascia
                </label>
              </div>
            </div>
            {fasce.length > 0 ? (
              <select
                id="fascia"
                name="fascia"
                value={rendicontazione.fascia}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={autoSelectFascia && rendicontazione.totale_cedolini > 0}
              >
                <option value="">Seleziona fascia</option>
                {fasce.map(fascia => (
                  <option key={fascia.id} value={fascia.nome}>
                    Fascia {fascia.nome} - {fascia.min_cedolini || 1}-{fascia.max_cedolini || '∞'} cedolini ({fascia.tariffa.toFixed(2)}€ x {fascia.ore || 1} ore)
                  </option>
                ))}
              </select>
            ) : (
              <select
                id="fascia"
                name="fascia"
                value={rendicontazione.fascia}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleziona fascia</option>
                <option value="A">Fascia A</option>
                <option value="B">Fascia B</option>
                <option value="C">Fascia C</option>
                <option value="D">Fascia D</option>
                <option value="E">Fascia E</option>
                <option value="F">Fascia F</option>
              </select>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Puoi gestire le fasce e le tariffe nella sezione "Fasce"
            </p>
          </div>
          
          <div className="mb-4">
            <label htmlFor="importo" className="block text-sm font-medium text-gray-700 mb-1">
              Importo (€)
            </label>
            <input
              type="number"
              id="importo"
              name="importo"
              value={rendicontazione.importo}
              readOnly={fasce.length > 0}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${fasce.length > 0 ? 'bg-gray-50' : ''}`}
            />
            {selectedFascia && (
              <div className="mt-1 text-xs text-gray-600 bg-blue-50 p-2 rounded-md">
                <p className="font-medium flex items-center">
                  <Calculator className="w-3 h-3 mr-1" />
                  Calcolo importo:
                </p>
                <p>
                  Tariffa fascia {selectedFascia.nome}: {selectedFascia.tariffa.toFixed(2)}€ x {selectedFascia.ore || 1} ore = {formatCurrency(rendicontazione.importo)}
                </p>
              </div>
            )}
          </div>
          
          <div className="mb-4">
            <label htmlFor="stato" className="block text-sm font-medium text-gray-700 mb-1">
              Stato
            </label>
            <select
              id="stato"
              name="stato"
              value={rendicontazione.stato}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Da fatturare">Da fatturare</option>
              <option value="Fatturato">Fatturato</option>
            </select>
          </div>
        </div>
        
        {/* Invoice fields - shown when status is "Fatturato" or when editing a record with invoice data */}
        {(showInvoiceFields || rendicontazione.stato === 'Fatturato') && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h3 className="text-md font-medium text-blue-700 mb-3 flex items-center">
              <Receipt className="w-5 h-5 mr-2" />
              Dati Fatturazione
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="mb-4">
                <label htmlFor="numero_fattura" className="block text-sm font-medium text-gray-700 mb-1">
                  Numero Fattura
                </label>
                <input
                  type="text"
                  id="numero_fattura"
                  name="numero_fattura"
                  value={rendicontazione.numero_fattura || ''}
                  onChange={handleChange}
                  required={rendicontazione.stato === 'Fatturato'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="anno_fattura" className="block text-sm font-medium text-gray-700 mb-1">
                  Anno Fattura
                </label>
                <input
                  type="number"
                  id="anno_fattura"
                  name="anno_fattura"
                  value={rendicontazione.anno_fattura || new Date().getFullYear()}
                  onChange={handleChange}
                  required={rendicontazione.stato === 'Fatturato'}
                  min="2000"
                  max="2100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="data_fattura" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  Data Fattura
                </label>
                <input
                  type="date"
                  id="data_fattura"
                  name="data_fattura"
                  value={rendicontazione.data_fattura || ''}
                  onChange={handleChange}
                  required={rendicontazione.stato === 'Fatturato'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}
        
        {/* Show/hide invoice fields button */}
        {rendicontazione.stato !== 'Fatturato' && (
          <button
            type="button"
            onClick={() => setShowInvoiceFields(!showInvoiceFields)}
            className="mt-2 text-blue-600 hover:text-blue-800 text-sm flex items-center"
          >
            {showInvoiceFields ? (
              <>
                <X className="w-4 h-4 mr-1" />
                Nascondi dati fatturazione
              </>
            ) : (
              <>
                <Receipt className="w-4 h-4 mr-1" />
                Mostra dati fatturazione
              </>
            )}
          </button>
        )}
        
        {/* Cliente info */}
        {selectedCliente && ( <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-md">
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
            <div className="mt-2 text-xs text-blue-600">
              <p>Anno di riferimento per la fascia: {fasciaAnno}</p>
            </div>
          </div>
        )}
        
        {/* Fascia details */}
        {selectedFascia && (
          <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-md">
            <h3 className="text-md font-medium text-gray-700 mb-3 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-blue-600" />
              Dettagli Fascia {selectedFascia.nome}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">Range Cedolini:</p>
                <p className="font-medium">{selectedFascia.min_cedolini || 1} - {selectedFascia.max_cedolini || '∞'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Tariffa Oraria:</p>
                <p className="font-medium">{formatCurrency(selectedFascia.tariffa)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Ore:</p>
                <p className="font-medium">{selectedFascia.ore || 1} {selectedFascia.ore === 1 ? 'ora' : 'ore'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Anno Fascia:</p>
                <p className="font-medium">{selectedFascia.anno || 'N/D'}</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex justify-between mt-6">
          {isEditing && onCancelEdit && (
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Annulla
            </button>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className={`flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-300 ${isEditing ? '' : 'ml-auto'}`}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {isEditing ? 'Aggiornamento...' : 'Salvataggio...'}
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {isEditing ? 'Aggiorna Rendicontazione' : 'Salva Rendicontazione'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RendicontazioneForm;