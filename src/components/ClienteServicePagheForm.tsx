import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ClienteServicePagheInsert, ClienteServicePaghe, Partner, Fascia } from '../types/database.types';
import { Save, Loader2, X, Check, Building2, Calendar, User, Info, Tag, AlertCircle, RefreshCw, Globe, Lock, KeyRound } from 'lucide-react';
import FullscreenButton from './FullscreenButton';

interface ClienteServicePagheFormProps {
  onClienteAdded: () => void;
  clienteToEdit?: ClienteServicePaghe | null;
  onCancelEdit?: () => void;
}

const ClienteServicePagheForm: React.FC<ClienteServicePagheFormProps> = ({ 
  onClienteAdded, 
  clienteToEdit = null,
  onCancelEdit
}) => {
  const [cliente, setCliente] = useState<ClienteServicePagheInsert>({
    codice_cliente: '',
    nome_cliente: '',
    numero_commessa: '',
    data_attivazione: '',
    data_cessazione: '',
    tipo_servizio: '',
    software: '',
    fascia: '',
    adempimenti: '',
    referente: '',
    altre_informazioni: '',
    partner: '',
    cedolini_previsti: 1,
    fascia_personalizzata: false,
    url_gestionale: '',
    login_gestionale: '',
    password_gestionale: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [fasce, setFasce] = useState<Fascia[]>([]);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [isCodeManuallyEdited, setIsCodeManuallyEdited] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isEditing = !!clienteToEdit;

  useEffect(() => {
    fetchPartners();
    fetchFasce();
    if (!isEditing) {
      generateNextClientCode();
    }
  }, []);

  useEffect(() => {
    // If we have a cliente to edit, populate the form
    if (clienteToEdit) {
      setCliente({
        codice_cliente: clienteToEdit.codice_cliente,
        nome_cliente: clienteToEdit.nome_cliente,
        numero_commessa: clienteToEdit.numero_commessa || '',
        data_attivazione: clienteToEdit.data_attivazione || '',
        data_cessazione: clienteToEdit.data_cessazione || '',
        tipo_servizio: clienteToEdit.tipo_servizio || '',
        software: clienteToEdit.software || '',
        fascia: clienteToEdit.fascia || '',
        adempimenti: clienteToEdit.adempimenti || '',
        referente: clienteToEdit.referente || '',
        altre_informazioni: clienteToEdit.altre_informazioni || '',
        partner: clienteToEdit.partner || '',
        cedolini_previsti: clienteToEdit.cedolini_previsti || 1,
        fascia_personalizzata: clienteToEdit.fascia_personalizzata || false,
        url_gestionale: clienteToEdit.url_gestionale || '',
        login_gestionale: clienteToEdit.login_gestionale || '',
        password_gestionale: clienteToEdit.password_gestionale || ''
      });
      setIsCodeManuallyEdited(true); // When editing, assume code is manually set
      
      // Show credentials section if any of the fields have data
      if (clienteToEdit.url_gestionale || clienteToEdit.login_gestionale || clienteToEdit.password_gestionale) {
        setShowCredentials(true);
      }
    }
  }, [clienteToEdit]);

  // Auto-select fascia based on cedolini_previsti when not personalized
  useEffect(() => {
    if (!cliente.fascia_personalizzata && cliente.cedolini_previsti && fasce.length > 0) {
      const appropriateFascia = findAppropriateFascia(cliente.cedolini_previsti);
      if (appropriateFascia && appropriateFascia.nome !== cliente.fascia) {
        setCliente(prev => ({
          ...prev,
          fascia: appropriateFascia.nome
        }));
      }
    }
  }, [cliente.cedolini_previsti, cliente.fascia_personalizzata, fasce]);

  const fetchPartners = async () => {
    try {
      const { data, error } = await supabase
        .from('partner')
        .select('*')
        .order('nome', { ascending: true });
        
      if (error) throw error;
      
      setPartners(data || []);
    } catch (err) {
      console.error('Error fetching partners:', err);
    }
  };

  const fetchFasce = async () => {
    try {
      const { data, error } = await supabase
        .from('fascia')
        .select('*')
        .order('nome', { ascending: true });
        
      if (error) throw error;
      
      setFasce(data || []);
    } catch (err) {
      console.error('Error fetching fasce:', err);
    }
  };

  const generateNextClientCode = async () => {
    setIsGeneratingCode(true);
    try {
      // Call the Supabase function to get the next client code
      const { data, error } = await supabase.rpc('get_next_client_code');
      
      if (error) throw error;
      
      if (data) {
        setCliente(prev => ({ ...prev, codice_cliente: data }));
      } else {
        // Fallback if the function doesn't return data
        const { data: manualData, error: manualError } = await supabase
          .from('clienti_service_paghe')
          .select('codice_cliente')
          .order('codice_cliente', { ascending: false })
          .limit(1);
          
        if (manualError) throw manualError;
        
        let nextCode = "C0001"; // Default starting code
        
        if (manualData && manualData.length > 0 && manualData[0].codice_cliente) {
          // Extract the numeric part of the code
          const currentCode = manualData[0].codice_cliente;
          const match = currentCode.match(/^C(\d+)$/);
          
          if (match && match[1]) {
            // Increment the numeric part and pad with zeros
            const nextNumber = parseInt(match[1]) + 1;
            nextCode = `C${nextNumber.toString().padStart(4, '0')}`;
          }
        }
        
        setCliente(prev => ({ ...prev, codice_cliente: nextCode }));
      }
    } catch (err) {
      console.error('Error generating next client code:', err);
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const findAppropriateFascia = (cedoliniPrevisti: number): Fascia | undefined => {
    // Find the fascia that matches the range for the given number of cedolini
    return fasce.find(fascia => {
      const min = fascia.min_cedolini || 1;
      const max = fascia.max_cedolini || Number.MAX_SAFE_INTEGER;
      return cedoliniPrevisti >= min && cedoliniPrevisti <= max;
    });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setCliente(prev => ({ ...prev, [name]: checked }));
    } else if (['cedolini_previsti'].includes(name)) {
      // Handle numeric value for cedolini_previsti
      const numericValue = parseInt(value) || 1;
      setCliente(prev => ({ 
        ...prev, 
        [name]: numericValue 
      }));
    } else if (name === 'codice_cliente') {
      // Mark code as manually edited
      setIsCodeManuallyEdited(true);
      setCliente(prev => ({ ...prev, [name]: value }));
    } else {
      setCliente(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (isEditing && clienteToEdit) {
        // Update existing record
        const { error } = await supabase
          .from('clienti_service_paghe')
          .update(cliente)
          .eq('id', clienteToEdit.id);
        
        if (error) throw error;
        setSuccess('Cliente aggiornato con successo!');
      } else {
        // Insert new record
        const { error } = await supabase.from('clienti_service_paghe').insert([cliente]);
        
        if (error) throw error;
        
        // Reset form if not editing
        setCliente({
          codice_cliente: '',
          nome_cliente: '',
          numero_commessa: '',
          data_attivazione: '',
          data_cessazione: '',
          tipo_servizio: '',
          software: '',
          fascia: '',
          adempimenti: '',
          referente: '',
          altre_informazioni: '',
          partner: '',
          cedolini_previsti: 1,
          fascia_personalizzata: false,
          url_gestionale: '',
          login_gestionale: '',
          password_gestionale: ''
        });
        
        setSuccess('Cliente aggiunto con successo!');
        setIsCodeManuallyEdited(false);
        generateNextClientCode(); // Generate next code for the next client
      }
      
      onClienteAdded();
      
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

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className={`bg-white p-6 rounded-lg shadow-md ${isFullscreen ? 'fixed inset-0 z-50 overflow-y-auto' : ''}`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">
          {isEditing ? 'Modifica Cliente Service Paghe' : 'Aggiungi Nuovo Cliente Service Paghe'}
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
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="mb-4">
            <label htmlFor="codice_cliente" className="block text-sm font-medium text-gray-700 mb-1">
              Codice Cliente
            </label>
            <div className="flex">
              <input
                type="text"
                id="codice_cliente"
                name="codice_cliente"
                value={cliente.codice_cliente}
                onChange={handleChange}
                required
                className="flex-grow px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={generateNextClientCode}
                disabled={isGeneratingCode}
                className="px-3 py-2 bg-blue-100 text-blue-700 border border-blue-300 rounded-r-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                title="Genera codice automaticamente"
              >
                {isGeneratingCode ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <RefreshCw className="w-5 h-5" />
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {isCodeManuallyEdited 
                ? "Codice cliente modificato manualmente" 
                : "Codice cliente generato automaticamente"}
            </p>
          </div>
          
          <div className="mb-4">
            <label htmlFor="nome_cliente" className="block text-sm font-medium text-gray-700 mb-1">
              Nome Cliente
            </label>
            <input
              type="text"
              id="nome_cliente"
              name="nome_cliente"
              value={cliente.nome_cliente}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="numero_commessa" className="block text-sm font-medium text-gray-700 mb-1">
              Numero Commessa
            </label>
            <input
              type="text"
              id="numero_commessa"
              name="numero_commessa"
              value={cliente.numero_commessa || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="data_attivazione" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              Data Attivazione Servizio
            </label>
            <input
              type="date"
              id="data_attivazione"
              name="data_attivazione"
              value={cliente.data_attivazione || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="data_cessazione" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              Data Cessazione Servizio
            </label>
            <input
              type="date"
              id="data_cessazione"
              name="data_cessazione"
              value={cliente.data_cessazione || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="tipo_servizio" className="block text-sm font-medium text-gray-700 mb-1">
              Tipo Servizio
            </label>
            <input
              type="text"
              id="tipo_servizio"
              name="tipo_servizio"
              value={cliente.tipo_servizio || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="software" className="block text-sm font-medium text-gray-700 mb-1">
              Software
            </label>
            <input
              type="text"
              id="software"
              name="software"
              value={cliente.software || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="adempimenti" className="block text-sm font-medium text-gray-700 mb-1">
              Adempimenti
            </label>
            <input
              type="text"
              id="adempimenti"
              name="adempimenti"
              value={cliente.adempimenti || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="referente" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <User className="w-4 h-4 mr-1" />
              Referente
            </label>
            <input
              type="text"
              id="referente"
              name="referente"
              value={cliente.referente || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="cedolini_previsti" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <Tag className="w-4 h-4 mr-1" />
              Cedolini Previsti
            </label>
            <input
              type="number"
              id="cedolini_previsti"
              name="cedolini_previsti"
              value={cliente.cedolini_previsti || 1}
              onChange={handleChange}
              min="1"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Numero di cedolini mensili previsti per questo cliente
            </p>
          </div>
          
          <div className="mb-4">
            <div className="flex justify-between items-center">
              <label htmlFor="fascia" className="block text-sm font-medium text-gray-700 mb-1">
                Fascia
              </label>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="fascia_personalizzata"
                  name="fascia_personalizzata"
                  checked={cliente.fascia_personalizzata}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="fascia_personalizzata" className="ml-2 text-xs text-gray-600">
                  Personalizzata
                </label>
              </div>
            </div>
            {fasce.length > 0 ? (
              <select
                id="fascia"
                name="fascia"
                value={cliente.fascia || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!cliente.fascia_personalizzata && cliente.cedolini_previsti > 0}
              >
                <option value="">Seleziona fascia</option>
                {fasce.map(fascia => (
                  <option key={fascia.id} value={fascia.nome}>
                    Fascia {fascia.nome} - {fascia.min_cedolini || 1}-{fascia.max_cedolini || '∞'} cedolini ({fascia.tariffa.toFixed(2)}€)
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                id="fascia"
                name="fascia"
                value={cliente.fascia || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}
            {!cliente.fascia_personalizzata && (
              <div className="mt-1 text-xs text-gray-500 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                La fascia viene selezionata automaticamente in base al numero di cedolini previsti
              </div>
            )}
          </div>
          
          <div className="mb-4">
            <label htmlFor="partner" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <Building2 className="w-4 h-4 mr-1" />
              Partner
            </label>
            {partners.length > 0 ? (
              <select
                id="partner"
                name="partner"
                value={cliente.partner || ''}
                onChange={handleChange}
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
                value={cliente.partner || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}
          </div>
        </div>
        
        {/* Software Gestionale Credentials Section */}
        <div className="mb-4">
          <button
            type="button"
            onClick={() => setShowCredentials(!showCredentials)}
            className="flex items-center text-blue-600 hover:text-blue-800 mb-2"
          >
            <Lock className="w-4 h-4 mr-2" />
            {showCredentials ? 'Nascondi credenziali gestionale' : 'Aggiungi credenziali gestionale'}
          </button>
          
          {showCredentials && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-md border border-gray-200">
              <div className="mb-4">
                <label htmlFor="url_gestionale" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <Globe className="w-4 h-4 mr-1" />
                  URL Gestionale
                </label>
                <input
                  type="url"
                  id="url_gestionale"
                  name="url_gestionale"
                  value={cliente.url_gestionale || ''}
                  onChange={handleChange}
                  placeholder="https://gestionale.esempio.it"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  URL di accesso al software gestionale
                </p>
              </div>
              
              <div className="mb-4">
                <label htmlFor="login_gestionale" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <User className="w-4 h-4 mr-1" />
                  Login/Username
                </label>
                <input
                  type="text"
                  id="login_gestionale"
                  name="login_gestionale"
                  value={cliente.login_gestionale || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="password_gestionale" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <KeyRound className="w-4 h-4 mr-1" />
                  Password
                </label>
                <input
                  type="password"
                  id="password_gestionale"
                  name="password_gestionale"
                  value={cliente.password_gestionale || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}
        </div>
        
        <div className="mb-4">
          <label htmlFor="altre_informazioni" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
            <Info className="w-4 h-4 mr-1" />
            Altre Informazioni
          </label>
          <textarea
            id="altre_informazioni"
            name="altre_informazioni"
            value={cliente.altre_informazioni || ''}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="flex justify-between">
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
                {isEditing ? 'Aggiorna Cliente' : 'Salva Cliente'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ClienteServicePagheForm;