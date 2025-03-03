import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { FatturazioneInsert, Fatturazione, Affidamento } from '../types/database.types';
import { Save, Loader2, Calendar, X, Check, Receipt, CreditCard, FileText } from 'lucide-react';
import FullscreenButton from './FullscreenButton';

interface FatturazioneFormProps {
  onFatturazioneAdded: () => void;
  fatturazioneToEdit?: Fatturazione | null;
  onCancelEdit?: () => void;
  affidamentoId: number;
  affidamentoTotale: number;
}

const FatturazioneForm: React.FC<FatturazioneFormProps> = ({ 
  onFatturazioneAdded, 
  fatturazioneToEdit = null,
  onCancelEdit,
  affidamentoId,
  affidamentoTotale
}) => {
  const [fatturazione, setFatturazione] = useState<FatturazioneInsert>({
    affidamento_id: affidamentoId,
    percentuale: 100,
    importo: affidamentoTotale,
    data_scadenza: new Date().toISOString().split('T')[0],
    stato: 'Da emettere',
    numero_fattura: '',
    data_emissione: '',
    data_pagamento: '',
    note: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showAdvancedFields, setShowAdvancedFields] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isEditing = !!fatturazioneToEdit;

  useEffect(() => {
    // If we have a fatturazione to edit, populate the form
    if (fatturazioneToEdit) {
      setFatturazione({
        affidamento_id: fatturazioneToEdit.affidamento_id,
        percentuale: fatturazioneToEdit.percentuale,
        importo: fatturazioneToEdit.importo,
        data_scadenza: fatturazioneToEdit.data_scadenza,
        stato: fatturazioneToEdit.stato,
        numero_fattura: fatturazioneToEdit.numero_fattura || '',
        data_emissione: fatturazioneToEdit.data_emissione || '',
        data_pagamento: fatturazioneToEdit.data_pagamento || '',
        note: fatturazioneToEdit.note || ''
      });
      
      // Show advanced fields if they have data
      setShowAdvancedFields(!!(
        fatturazioneToEdit.numero_fattura || 
        fatturazioneToEdit.data_emissione || 
        fatturazioneToEdit.data_pagamento || 
        fatturazioneToEdit.note
      ));
    } else {
      // Reset form for new entry
      setFatturazione({
        affidamento_id: affidamentoId,
        percentuale: 100,
        importo: affidamentoTotale,
        data_scadenza: new Date().toISOString().split('T')[0],
        stato: 'Da emettere',
        numero_fattura: '',
        data_emissione: '',
        data_pagamento: '',
        note: ''
      });
      setShowAdvancedFields(false);
    }
  }, [fatturazioneToEdit, affidamentoId, affidamentoTotale]);

  // Update importo when percentuale changes
  useEffect(() => {
    const importo = (affidamentoTotale * fatturazione.percentuale) / 100;
    setFatturazione(prev => ({
      ...prev,
      importo: parseFloat(importo.toFixed(2))
    }));
  }, [fatturazione.percentuale, affidamentoTotale]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    
    // Handle numeric values
    if (['percentuale', 'importo'].includes(name)) {
      setFatturazione(prev => ({ 
        ...prev, 
        [name]: parseFloat(value) || 0 
      }));
    } else {
      setFatturazione(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Prepare data for submission - ensure dates are properly formatted or null
      const dataToSubmit = {
        ...fatturazione,
        data_scadenza: fatturazione.data_scadenza || null,
        data_emissione: fatturazione.data_emissione || null,
        data_pagamento: fatturazione.data_pagamento || null
      };

      if (isEditing && fatturazioneToEdit) {
        // Update existing record
        const { error } = await supabase
          .from('fatturazione')
          .update(dataToSubmit)
          .eq('id', fatturazioneToEdit.id);
        
        if (error) throw error;
        setSuccess('Scadenza di fatturazione aggiornata con successo!');
      } else {
        // Insert new record
        const { error } = await supabase.from('fatturazione').insert([dataToSubmit]);
        
        if (error) throw error;
        
        // Reset form if not editing
        setFatturazione({
          affidamento_id: affidamentoId,
          percentuale: 100,
          importo: affidamentoTotale,
          data_scadenza: new Date().toISOString().split('T')[0],
          stato: 'Da emettere',
          numero_fattura: '',
          data_emissione: '',
          data_pagamento: '',
          note: ''
        });
        
        setShowAdvancedFields(false);
        setSuccess('Scadenza di fatturazione aggiunta con successo!');
      }
      
      onFatturazioneAdded();
      
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
    <div className={`bg-white p-6 rounded-lg shadow-md mb-6 ${isFullscreen ? 'fixed inset-0 z-50 overflow-y-auto' : ''}`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">
          {isEditing ? 'Modifica Scadenza Fatturazione' : 'Nuova Scadenza Fatturazione'}
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
            <label htmlFor="percentuale" className="block text-sm font-medium text-gray-700 mb-1">
              Percentuale (%)
            </label>
            <input
              type="number"
              id="percentuale"
              name="percentuale"
              value={fatturazione.percentuale}
              onChange={handleChange}
              required
              min="0"
              max="100"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="importo" className="block text-sm font-medium text-gray-700 mb-1">
              Importo (€)
            </label>
            <input
              type="number"
              id="importo"
              name="importo"
              value={fatturazione.importo}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="data_scadenza" className="block text-sm font-medium text-gray-700 mb-1">
              Data Scadenza
            </label>
            <input
              type="date"
              id="data_scadenza"
              name="data_scadenza"
              value={fatturazione.data_scadenza}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="stato" className="block text-sm font-medium text-gray-700 mb-1">
              Stato
            </label>
            <select
              id="stato"
              name="stato"
              value={fatturazione.stato}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Da emettere">Da emettere</option>
              <option value="Emessa">Emessa</option>
              <option value="Pagata">Pagata</option>
            </select>
          </div>
        </div>
        
        <div className="mb-4">
          <button
            type="button"
            onClick={() => setShowAdvancedFields(!showAdvancedFields)}
            className="flex items-center text-blue-600 hover:text-blue-800 mb-2"
          >
            <FileText className="w-4 h-4 mr-2" />
            {showAdvancedFields ? 'Nascondi campi avanzati' : 'Mostra campi avanzati'}
          </button>
          
          {showAdvancedFields && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-md">
              <div className="mb-4">
                <label htmlFor="numero_fattura" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <Receipt className="w-4 h-4 mr-2" />
                  Numero Fattura
                </label>
                <input
                  type="text"
                  id="numero_fattura"
                  name="numero_fattura"
                  value={fatturazione.numero_fattura || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="data_emissione" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  Data Emissione
                </label>
                <input
                  type="date"
                  id="data_emissione"
                  name="data_emissione"
                  value={fatturazione.data_emissione || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="data_pagamento" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Data Pagamento
                </label>
                <input
                  type="date"
                  id="data_pagamento"
                  name="data_pagamento"
                  value={fatturazione.data_pagamento || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="mb-4 md:col-span-3">
                <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-1">
                  Note
                </label>
                <textarea
                  id="note"
                  name="note"
                  value={fatturazione.note || ''}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Inserisci eventuali note sulla fatturazione..."
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
                {isEditing ? 'Aggiorna Scadenza' : 'Salva Scadenza'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FatturazioneForm;