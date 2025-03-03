import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ClienteInsert, Cliente } from '../types/database.types';
import { Save, Loader2, Building2, MapPin, FileText, Mail, Edit, X, Check, Globe, Info, Maximize2, Minimize2 } from 'lucide-react';
import FullscreenButton from './FullscreenButton';

interface ClienteFormProps {
  onClienteAdded: () => void;
  clienteToEdit?: Cliente | null;
  onCancelEdit?: () => void;
}

const ClienteForm: React.FC<ClienteFormProps> = ({ 
  onClienteAdded, 
  clienteToEdit = null,
  onCancelEdit
}) => {
  const [cliente, setCliente] = useState<ClienteInsert>({
    denominazione: '',
    referente: '',
    cellulare: '',
    email: '',
    ufficio: '',
    indirizzo: '',
    citta: '',
    cap: '',
    provincia: '',
    codice_fiscale: '',
    partita_iva: '',
    pec: '',
    codice_univoco: '',
    sito_web: '',
    note: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResidenza, setShowResidenza] = useState(false);
  const [showFiscalData, setShowFiscalData] = useState(false);
  const [showAdditionalInfo, setShowAdditionalInfo] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isEditing = !!clienteToEdit;

  useEffect(() => {
    // If we have a cliente to edit, populate the form
    if (clienteToEdit) {
      setCliente({
        denominazione: clienteToEdit.denominazione,
        referente: clienteToEdit.referente,
        cellulare: clienteToEdit.cellulare,
        email: clienteToEdit.email,
        ufficio: clienteToEdit.ufficio || '',
        indirizzo: clienteToEdit.indirizzo || '',
        citta: clienteToEdit.citta || '',
        cap: clienteToEdit.cap || '',
        provincia: clienteToEdit.provincia || '',
        codice_fiscale: clienteToEdit.codice_fiscale || '',
        partita_iva: clienteToEdit.partita_iva || '',
        pec: clienteToEdit.pec || '',
        codice_univoco: clienteToEdit.codice_univoco || '',
        sito_web: clienteToEdit.sito_web || '',
        note: clienteToEdit.note || '',
      });
      
      // Show sections if they have data
      setShowResidenza(!!(clienteToEdit.indirizzo || clienteToEdit.citta || clienteToEdit.cap || clienteToEdit.provincia));
      setShowFiscalData(!!(clienteToEdit.codice_fiscale || clienteToEdit.partita_iva || clienteToEdit.pec || clienteToEdit.codice_univoco));
      setShowAdditionalInfo(!!(clienteToEdit.sito_web || clienteToEdit.note));
    }
  }, [clienteToEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCliente((prev) => ({ ...prev, [name]: value }));
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
          .from('clienti')
          .update(cliente)
          .eq('id', clienteToEdit.id);
        
        if (error) throw error;
        setSuccess('Cliente aggiornato con successo!');
      } else {
        // Insert new record
        const { error } = await supabase.from('clienti').insert([cliente]);
        
        if (error) throw error;
        
        // Reset form if not editing
        setCliente({
          denominazione: '',
          referente: '',
          cellulare: '',
          email: '',
          ufficio: '',
          indirizzo: '',
          citta: '',
          cap: '',
          provincia: '',
          codice_fiscale: '',
          partita_iva: '',
          pec: '',
          codice_univoco: '',
          sito_web: '',
          note: '',
        });
        
        setShowResidenza(false);
        setShowFiscalData(false);
        setShowAdditionalInfo(false);
        setSuccess('Cliente aggiunto con successo!');
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
          {isEditing ? 'Modifica Cliente' : 'Aggiungi Nuovo Cliente'}
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="mb-4">
            <label htmlFor="denominazione" className="block text-sm font-medium text-gray-700 mb-1">
              Denominazione
            </label>
            <input
              type="text"
              id="denominazione"
              name="denominazione"
              value={cliente.denominazione}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="ufficio" className="block text-sm font-medium text-gray-700 mb-1">
              Ufficio
            </label>
            <input
              type="text"
              id="ufficio"
              name="ufficio"
              value={cliente.ufficio || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="referente" className="block text-sm font-medium text-gray-700 mb-1">
              Referente
            </label>
            <input
              type="text"
              id="referente"
              name="referente"
              value={cliente.referente}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="cellulare" className="block text-sm font-medium text-gray-700 mb-1">
              Cellulare
            </label>
            <input
              type="tel"
              id="cellulare"
              name="cellulare"
              value={cliente.cellulare}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={cliente.email}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="pec" className="block text-sm font-medium text-gray-700 mb-1">
              PEC
            </label>
            <input
              type="email"
              id="pec"
              name="pec"
              value={cliente.pec || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div className="mb-4">
          <button
            type="button"
            onClick={() => setShowFiscalData(!showFiscalData)}
            className="flex items-center text-blue-600 hover:text-blue-800 mb-2"
          >
            <FileText className="w-4 h-4 mr-2" />
            {showFiscalData ? 'Nascondi dati fiscali' : 'Aggiungi dati fiscali'}
          </button>
          
          {showFiscalData && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-md mb-4">
              <div className="mb-4">
                <label htmlFor="codice_fiscale" className="block text-sm font-medium text-gray-700 mb-1">
                  Codice Fiscale
                </label>
                <input
                  type="text"
                  id="codice_fiscale"
                  name="codice_fiscale"
                  value={cliente.codice_fiscale || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="partita_iva" className="block text-sm font-medium text-gray-700 mb-1">
                  Partita IVA
                </label>
                <input
                  type="text"
                  id="partita_iva"
                  name="partita_iva"
                  value={cliente.partita_iva || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="codice_univoco" className="block text-sm font-medium text-gray-700 mb-1">
                  Codice Univoco
                </label>
                <input
                  type="text"
                  id="codice_univoco"
                  name="codice_univoco"
                  value={cliente.codice_univoco || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}
        </div>
        
        <div className="mb-4">
          <button
            type="button"
            onClick={() => setShowResidenza(!showResidenza)}
            className="flex items-center text-blue-600 hover:text-blue-800 mb-2"
          >
            <MapPin className="w-4 h-4 mr-2" />
            {showResidenza ? 'Nascondi dati residenza' : 'Aggiungi dati residenza'}
          </button>
          
          {showResidenza && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-md">
              <div className="mb-4">
                <label htmlFor="indirizzo" className="block text-sm font-medium text-gray-700 mb-1">
                  Indirizzo
                </label>
                <input
                  type="text"
                  id="indirizzo"
                  name="indirizzo"
                  value={cliente.indirizzo || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="citta" className="block text-sm font-medium text-gray-700 mb-1">
                  Città
                </label>
                <input
                  type="text"
                  id="citta"
                  name="citta"
                  value={cliente.citta || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="cap" className="block text-sm font-medium text-gray-700 mb-1">
                  CAP
                </label>
                <input
                  type="text"
                  id="cap"
                  name="cap"
                  value={cliente.cap || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="provincia" className="block text-sm font-medium text-gray-700 mb-1">
                  Provincia
                </label>
                <input
                  type="text"
                  id="provincia"
                  name="provincia"
                  value={cliente.provincia || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}
        </div>
        
        <div className="mb-4">
          <button
            type="button"
            onClick={() => setShowAdditionalInfo(!showAdditionalInfo)}
            className="flex items-center text-blue-600 hover:text-blue-800 mb-2"
          >
            <Info className="w-4 h-4 mr-2" />
            {showAdditionalInfo ? 'Nascondi informazioni aggiuntive' : 'Aggiungi informazioni aggiuntive'}
          </button>
          
          {showAdditionalInfo && (
            <div className="grid grid-cols-1 gap-4 p-4 bg-gray-50 rounded-md">
              <div className="mb-4">
                <label htmlFor="sito_web" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <Globe className="w-4 h-4 mr-2" />
                  Sito Web
                </label>
                <input
                  type="url"
                  id="sito_web"
                  name="sito_web"
                  value={cliente.sito_web || ''}
                  onChange={handleChange}
                  placeholder="https://www.esempio.it"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-1">
                  Note
                </label>
                <textarea
                  id="note"
                  name="note"
                  value={cliente.note || ''}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Inserisci eventuali note o informazioni aggiuntive sul cliente..."
                />
              </div>
            </div>
          )}
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

export default ClienteForm;