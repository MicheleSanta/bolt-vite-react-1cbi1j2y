import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { AffidamentoInsert, Cliente, Affidamento, Partner } from '../types/database.types';
import { Save, Loader2, Calculator, X, Check, Maximize2, Minimize2, Percent, DollarSign, Users } from 'lucide-react';
import FullscreenButton from './FullscreenButton';

interface AffidamentoFormProps {
  onAffidamentoAdded: () => void;
  affidamentoToEdit?: Affidamento | null;
  onCancelEdit?: () => void;
  preselectedClienteId?: number | null;
}

const AffidamentoForm: React.FC<AffidamentoFormProps> = ({ 
  onAffidamentoAdded, 
  affidamentoToEdit = null,
  onCancelEdit,
  preselectedClienteId = null
}) => {
  const [clienti, setClienti] = useState<Cliente[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [affidamento, setAffidamento] = useState<AffidamentoInsert>({
    anno: new Date().getFullYear(),
    determina: '',
    numero_determina: '',
    cig: '',
    data: new Date().toISOString().split('T')[0],
    data_termine: '',
    cliente_id: 0,
    descrizione: '',
    stato: 'In corso',
    quantita: 1,
    prezzo_unitario: 0,
    imponibile: 0,
    iva: 0,
    totale: 0,
    has_provvigione: false,
    tipo_provvigione: 'passiva',
    partner_provvigione: '',
    percentuale_provvigione: 10,
    importo_provvigione: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isEditing = !!affidamentoToEdit;

  useEffect(() => {
    fetchClienti();
    fetchPartners();
  }, []);

  useEffect(() => {
    // If we have an affidamento to edit, populate the form
    if (affidamentoToEdit) {
      setAffidamento({
        anno: affidamentoToEdit.anno,
        determina: affidamentoToEdit.determina,
        numero_determina: affidamentoToEdit.numero_determina || '',
        cig: affidamentoToEdit.cig || '',
        data: affidamentoToEdit.data || new Date().toISOString().split('T')[0],
        data_termine: affidamentoToEdit.data_termine || '',
        cliente_id: affidamentoToEdit.cliente_id,
        descrizione: affidamentoToEdit.descrizione,
        stato: affidamentoToEdit.stato,
        quantita: affidamentoToEdit.quantita,
        prezzo_unitario: affidamentoToEdit.prezzo_unitario,
        imponibile: affidamentoToEdit.imponibile,
        iva: affidamentoToEdit.iva,
        totale: affidamentoToEdit.totale,
        has_provvigione: affidamentoToEdit.has_provvigione || false,
        tipo_provvigione: affidamentoToEdit.tipo_provvigione || 'passiva',
        partner_provvigione: affidamentoToEdit.partner_provvigione || '',
        percentuale_provvigione: affidamentoToEdit.percentuale_provvigione || 10,
        importo_provvigione: affidamentoToEdit.importo_provvigione || 0
      });
    } else if (preselectedClienteId) {
      // If we have a preselected client ID, set it in the form
      setAffidamento(prev => ({
        ...prev,
        cliente_id: preselectedClienteId
      }));
    }
  }, [affidamentoToEdit, preselectedClienteId]);

  useEffect(() => {
    // Calculate imponibile, iva, and totale when quantita or prezzo_unitario changes
    const imponibile = affidamento.quantita * affidamento.prezzo_unitario;
    const iva = imponibile * 0.22; // Assuming 22% IVA
    const totale = imponibile + iva;

    setAffidamento(prev => ({
      ...prev,
      imponibile,
      iva,
      totale
    }));
  }, [affidamento.quantita, affidamento.prezzo_unitario]);

  // Calculate provvigione amount when percentage or totale changes
  useEffect(() => {
    if (affidamento.has_provvigione && affidamento.percentuale_provvigione) {
      const baseAmount = affidamento.tipo_provvigione === 'passiva' ? affidamento.imponibile : affidamento.totale;
      const importoProvvigione = (baseAmount * affidamento.percentuale_provvigione) / 100;
      
      setAffidamento(prev => ({
        ...prev,
        importo_provvigione: parseFloat(importoProvvigione.toFixed(2))
      }));
    }
  }, [affidamento.has_provvigione, affidamento.percentuale_provvigione, affidamento.imponibile, affidamento.totale, affidamento.tipo_provvigione]);

  const fetchClienti = async () => {
    try {
      const { data, error } = await supabase
        .from('clienti')
        .select('*')
        .order('denominazione', { ascending: true });
        
      if (error) throw error;
      
      setClienti(data || []);
      if (data && data.length > 0 && !affidamentoToEdit && !preselectedClienteId) {
        setAffidamento(prev => ({ ...prev, cliente_id: data[0].id }));
      }
    } catch (err) {
      console.error('Error fetching clienti:', err);
    }
  };

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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    
    // Handle checkbox
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setAffidamento(prev => ({ ...prev, [name]: checked }));
      return;
    }
    
    // Handle numeric values
    if (['anno', 'cliente_id', 'quantita', 'prezzo_unitario', 'percentuale_provvigione', 'importo_provvigione'].includes(name)) {
      setAffidamento(prev => ({ 
        ...prev, 
        [name]: name === 'cliente_id' ? parseInt(value) : parseFloat(value) || 0 
      }));
    } else {
      setAffidamento(prev => ({ ...prev, [name]: value }));
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
        ...affidamento,
        // If date fields are empty strings, set them to null to avoid SQL errors
        data: affidamento.data || null,
        data_termine: affidamento.data_termine || null,
        // If provvigione is not enabled, set related fields to null
        has_provvigione: affidamento.has_provvigione || false,
        tipo_provvigione: affidamento.has_provvigione ? affidamento.tipo_provvigione : null,
        partner_provvigione: affidamento.has_provvigione ? affidamento.partner_provvigione : null,
        percentuale_provvigione: affidamento.has_provvigione ? affidamento.percentuale_provvigione : null,
        importo_provvigione: affidamento.has_provvigione ? affidamento.importo_provvigione : null
      };

      if (isEditing && affidamentoToEdit) {
        // Update existing record
        const { error } = await supabase
          .from('affidamento')
          .update(dataToSubmit)
          .eq('id', affidamentoToEdit.id);
        
        if (error) throw error;
        setSuccess('Affidamento aggiornato con successo!');
      } else {
        // Insert new record
        const { error } = await supabase.from('affidamento').insert([dataToSubmit]);
        if (error) throw error;
        
        // Reset form if not editing
        setAffidamento({
          anno: new Date().getFullYear(),
          determina: '',
          numero_determina: '',
          cig: '',
          data: new Date().toISOString().split('T')[0],
          data_termine: '',
          cliente_id: preselectedClienteId || (clienti.length > 0 ? clienti[0].id : 0),
          descrizione: '',
          stato: 'In corso',
          quantita: 1,
          prezzo_unitario: 0,
          imponibile: 0,
          iva: 0,
          totale: 0,
          has_provvigione: false,
          tipo_provvigione: 'passiva',
          partner_provvigione: '',
          percentuale_provvigione: 10,
          importo_provvigione: 0
        });
        
        setSuccess('Affidamento aggiunto con successo!');
      }
      
      onAffidamentoAdded();
      
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
          {isEditing ? 'Modifica Affidamento' : 'Nuovo Affidamento'}
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
            <label htmlFor="anno" className="block text-sm font-medium text-gray-700 mb-1">
              Anno
            </label>
            <input
              type="number"
              id="anno"
              name="anno"
              value={affidamento.anno}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="determina" className="block text-sm font-medium text-gray-700 mb-1">
              Determina
            </label>
            <input
              type="text"
              id="determina"
              name="determina"
              value={affidamento.determina}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="numero_determina" className="block text-sm font-medium text-gray-700 mb-1">
              Numero Determina/Contratto
            </label>
            <input
              type="text"
              id="numero_determina"
              name="numero_determina"
              value={affidamento.numero_determina || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="cig" className="block text-sm font-medium text-gray-700 mb-1">
              CIG
            </label>
            <input
              type="text"
              id="cig"
              name="cig"
              value={affidamento.cig || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="data" className="block text-sm font-medium text-gray-700 mb-1">
              Data Inizio
            </label>
            <input
              type="date"
              id="data"
              name="data"
              value={affidamento.data || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="data_termine" className="block text-sm font-medium text-gray-700 mb-1">
              Data Termine
            </label>
            <input
              type="date"
              id="data_termine"
              name="data_termine"
              value={affidamento.data_termine || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="cliente_id" className="block text-sm font-medium text-gray-700 mb-1">
              Cliente
            </label>
            <select
              id="cliente_id"
              name="cliente_id"
              value={affidamento.cliente_id}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {clienti.length === 0 && (
                <option value="">Nessun cliente disponibile</option>
              )}
              {clienti.map(cliente => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.denominazione}
                </option>
              ))}
            </select>
          </div>
          
          <div className="mb-4">
            <label htmlFor="stato" className="block text-sm font-medium text-gray-700 mb-1">
              Stato
            </label>
            <select
              id="stato"
              name="stato"
              value={affidamento.stato}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="In corso">In corso</option>
              <option value="Completato">Completato</option>
              <option value="Annullato">Annullato</option>
            </select>
          </div>
          
          <div className="mb-4">
            <label htmlFor="quantita" className="block text-sm font-medium text-gray-700 mb-1">
              Quantità
            </label>
            <input
              type="number"
              id="quantita"
              name="quantita"
              value={affidamento.quantita}
              onChange={handleChange}
              required
              min="1"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="prezzo_unitario" className="block text-sm font-medium text-gray-700 mb-1">
              Prezzo Unitario (€)
            </label>
            <input
              type="number"
              id="prezzo_unitario"
              name="prezzo_unitario"
              value={affidamento.prezzo_unitario}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div className="mb-4 col-span-3">
          <label htmlFor="descrizione" className="block text-sm font-medium text-gray-700 mb-1">
            Descrizione
          </label>
          <textarea
            id="descrizione"
            name="descrizione"
            value={affidamento.descrizione}
            onChange={handleChange}
            required
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        {/* Provvigione Section */}
        <div className="mb-4 p-4 bg-gray-50 rounded-md border border-gray-200">
          <div className="flex items-center mb-3">
            <input
              type="checkbox"
              id="has_provvigione"
              name="has_provvigione"
              checked={affidamento.has_provvigione}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="has_provvigione" className="ml-2 block text-sm font-medium text-gray-700">
              Gestione Provvigione
            </label>
          </div>
          
          {affidamento.has_provvigione && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-3">
              <div className="mb-2">
                <label htmlFor="tipo_provvigione" className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo Provvigione
                </label>
                <select
                  id="tipo_provvigione"
                  name="tipo_provvigione"
                  value={affidamento.tipo_provvigione}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="passiva">Passiva (da pagare)</option>
                  <option value="attiva">Attiva (da ricevere)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {affidamento.tipo_provvigione === 'passiva' 
                    ? 'Provvigione da riconoscere a partner commerciale'
                    : 'Provvigione che ci viene riconosciuta'}
                </p>
              </div>
              
              <div className="mb-2">
                <label htmlFor="partner_provvigione" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <Users className="w-4 h-4 mr-1" />
                  Partner Commerciale
                </label>
                {partners.length > 0 ? (
                  <select
                    id="partner_provvigione"
                    name="partner_provvigione"
                    value={affidamento.partner_provvigione || ''}
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
                    id="partner_provvigione"
                    name="partner_provvigione"
                    value={affidamento.partner_provvigione || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nome partner"
                  />
                )}
              </div>
              
              <div className="mb-2">
                <label htmlFor="percentuale_provvigione" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <Percent className="w-4 h-4 mr-1" />
                  Percentuale
                </label>
                <input
                  type="number"
                  id="percentuale_provvigione"
                  name="percentuale_provvigione"
                  value={affidamento.percentuale_provvigione || 0}
                  onChange={handleChange}
                  min="0"
                  max="100"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="mb-2">
                <label htmlFor="importo_provvigione" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <DollarSign className="w-4 h-4 mr-1" />
                  Importo Provvigione
                </label>
                <input
                  type="number"
                  id="importo_provvigione"
                  name="importo_provvigione"
                  value={affidamento.importo_provvigione || 0}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                  readOnly
                />
                <p className="text-xs text-gray-500 mt-1">
                  Calcolato automaticamente in base alla percentuale
                </p>
              </div>
            </div>
          )}
        </div>
        
        <div className="bg-gray-50 p-4 rounded-md mb-4">
          <h3 className="text-md font-medium text-gray-700 mb-2 flex items-center">
            <Calculator className="w-4 h-4 mr-2" />
            Riepilogo Importi
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Imponibile</p>
              <p className="font-medium">€ {affidamento.imponibile.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">IVA (22%)</p>
              <p className="font-medium">€ {affidamento.iva.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Totale</p>
              <p className="font-medium">€ {affidamento.totale.toFixed(2)}</p>
            </div>
            {affidamento.has_provvigione && (
              <div className="col-span-3 mt-2 pt-2 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Provvigione {affidamento.tipo_provvigione === 'passiva' ? 'da pagare' : 'da ricevere'}
                  {affidamento.partner_provvigione ? ` a ${affidamento.partner_provvigione}` : ''}
                </p>
                <p className="font-medium">
                  € {affidamento.importo_provvigione?.toFixed(2) || '0.00'} 
                  <span className="text-sm text-gray-500 ml-1">
                    ({affidamento.percentuale_provvigione}% su {affidamento.tipo_provvigione === 'passiva' ? 'imponibile' : 'totale'})
                  </span>
                </p>
              </div>
            )}
          </div>
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
                {isEditing ? 'Aggiorna Affidamento' : 'Salva Affidamento'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AffidamentoForm;