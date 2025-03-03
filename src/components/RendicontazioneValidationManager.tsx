import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Rendicontazione, Fascia } from '../types/database.types';
import { Loader2, RefreshCw, Check, X, AlertCircle, Edit, Calculator, Clock, Info } from 'lucide-react';
import SearchBar from './SearchBar';
import RendicontazioneForm from './RendicontazioneForm';

interface RendicontazioneValidationManagerProps {}

const RendicontazioneValidationManager: React.FC<RendicontazioneValidationManagerProps> = () => {
  const [rendicontazioni, setRendicontazioni] = useState<Rendicontazione[]>([]);
  const [filteredRendicontazioni, setFilteredRendicontazioni] = useState<Rendicontazione[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showValidated, setShowValidated] = useState(false);
  const [rendicontazioneToEdit, setRendicontazioneToEdit] = useState<Rendicontazione | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [fasce, setFasce] = useState<Fascia[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    fetchRendicontazioni();
    fetchFasce();
  }, [refreshTrigger, showValidated]);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, rendicontazioni]);

  const fetchRendicontazioni = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let query = supabase
        .from('rendicontazione')
        .select('*')
        .order('created_at', { ascending: false });
      
      // Filter by status if needed
      if (!showValidated) {
        query = query.eq('stato', 'Da validare');
      }
        
      const { data, error } = await query;
        
      if (error) throw error;
      
      setRendicontazioni(data || []);
      applyFilters();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Si è verificato un errore nel caricamento delle rendicontazioni');
      setRendicontazioni([]);
      setFilteredRendicontazioni([]);
    } finally {
      setLoading(false);
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

  const applyFilters = () => {
    if (!searchQuery.trim()) {
      setFilteredRendicontazioni(rendicontazioni);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = rendicontazioni.filter(
      item =>
        (item.nome_cliente && item.nome_cliente.toLowerCase().includes(query)) ||
        (item.codice_cliente && item.codice_cliente.toLowerCase().includes(query)) ||
        (item.nome_tecnico && item.nome_tecnico.toLowerCase().includes(query)) ||
        (item.partner && item.partner.toLowerCase().includes(query)) ||
        (item.mese && item.mese.toLowerCase().includes(query))
    );
    
    setFilteredRendicontazioni(filtered);
  };

  const handleValidate = async (id: number) => {
    try {
      const { error } = await supabase
        .from('rendicontazione')
        .update({ stato: 'Da fatturare' })
        .eq('id', id);
        
      if (error) throw error;
      
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Si è verificato un errore durante la validazione');
    }
  };

  const handleReject = async (id: number) => {
    try {
      const { error } = await supabase
        .from('rendicontazione')
        .update({ stato: 'Rifiutata' })
        .eq('id', id);
        
      if (error) throw error;
      
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Si è verificato un errore durante il rifiuto');
    }
  };

  const handleEdit = (rendicontazione: Rendicontazione) => {
    setRendicontazioneToEdit(rendicontazione);
    setShowForm(true);
  };

  const handleRendicontazioneAdded = () => {
    setRefreshTrigger(prev => prev + 1);
    setShowForm(false);
    setRendicontazioneToEdit(null);
  };

  const handleCancelEdit = () => {
    setRendicontazioneToEdit(null);
    setShowForm(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value);
  };

  const getFasciaDetails = (fasciaName: string): Fascia | undefined => {
    return fasce.find(f => f.nome === fasciaName);
  };

  if (showForm) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Modifica Rendicontazione</h2>
          <button
            onClick={handleCancelEdit}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Torna alla lista
          </button>
        </div>
        
        <RendicontazioneForm 
          onRendicontazioneAdded={handleRendicontazioneAdded} 
          rendicontazioneToEdit={rendicontazioneToEdit}
          onCancelEdit={handleCancelEdit}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Caricamento rendicontazioni...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="text-xl font-semibold">Validazione Rendicontazioni</h2>
        <div className="flex space-x-2">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="showValidated"
              checked={showValidated}
              onChange={(e) => setShowValidated(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="showValidated" className="ml-2 text-sm text-gray-700">
              Mostra anche validate
            </label>
          </div>
          <button 
            onClick={() => setRefreshTrigger(prev => prev + 1)} 
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            <RefreshCw className="w-4 h-4 mr-1" /> Aggiorna
          </button>
        </div>
      </div>
      
      <div className="p-4 border-b">
        <SearchBar 
          placeholder="Cerca per cliente, dipendente, mese..." 
          value={searchQuery}
          onChange={setSearchQuery}
        />
      </div>
      
      {error && (
        <div className="m-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}
      
      {rendicontazioni.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-gray-600">
            {showValidated 
              ? 'Nessuna rendicontazione trovata.' 
              : 'Nessuna rendicontazione da validare.'}
          </p>
        </div>
      ) : filteredRendicontazioni.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-gray-500">Nessuna rendicontazione corrisponde ai criteri di ricerca.</p>
          <button
            onClick={() => setSearchQuery('')}
            className="mt-2 text-blue-600 hover:text-blue-800"
          >
            Mostra tutte le rendicontazioni
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dipendente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Periodo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cedolini
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fascia
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stato
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Azioni
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRendicontazioni.map((rendicontazione) => {
                const fasciaDetails = getFasciaDetails(rendicontazione.fascia);
                
                return (
                  <tr key={rendicontazione.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{rendicontazione.nome_tecnico}</div>
                      <div className="text-xs text-gray-500">{rendicontazione.partner || 'N/D'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{rendicontazione.mese} {rendicontazione.anno}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{rendicontazione.nome_cliente}</div>
                      <div className="text-xs text-gray-500">Cod: {rendicontazione.codice_cliente}</div>
                      {rendicontazione.numero_commessa && (
                        <div className="text-xs text-gray-500">Commessa: {rendicontazione.numero_commessa}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{rendicontazione.totale_cedolini}</div>
                      {rendicontazione.numero_cedolini_extra > 0 && (
                        <div className="text-xs text-gray-500">
                          Base: {rendicontazione.numero_cedolini} + Extra: {rendicontazione.numero_cedolini_extra}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">Fascia {rendicontazione.fascia}</div>
                      {fasciaDetails && (
                        <div className="text-xs text-gray-500 flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {fasciaDetails.ore || 1} {fasciaDetails.ore === 1 ? 'ora' : 'ore'} - {formatCurrency(fasciaDetails.tariffa)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        rendicontazione.stato === 'Da validare' 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : rendicontazione.stato === 'Da fatturare'
                          ? 'bg-green-100 text-green-800'
                          : rendicontazione.stato === 'Rifiutata'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {rendicontazione.stato}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(rendicontazione)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Modifica rendicontazione"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        
                        {rendicontazione.stato === 'Da validare' && (
                          <>
                            <button
                              onClick={() => handleValidate(rendicontazione.id)}
                              className="text-green-600 hover:text-green-800"
                              title="Approva rendicontazione"
                            >
                              <Check className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleReject(rendicontazione.id)}
                              className="text-red-600 hover:text-red-800"
                              title="Rifiuta rendicontazione"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default RendicontazioneValidationManager;