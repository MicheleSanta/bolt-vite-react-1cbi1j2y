import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import DipendenteRendicontazioneForm from './DipendenteRendicontazioneForm';
import { Rendicontazione } from '../types/database.types';
import { Loader2, RefreshCw, AlertCircle, Calendar, Clock, FileText } from 'lucide-react';
import SearchBar from './SearchBar';

interface DipendenteRendicontazioneManagerProps {
  nomeDipendente: string;
}

const DipendenteRendicontazioneManager: React.FC<DipendenteRendicontazioneManagerProps> = ({ 
  nomeDipendente 
}) => {
  const [rendicontazioni, setRendicontazioni] = useState<Rendicontazione[]>([]);
  const [filteredRendicontazioni, setFilteredRendicontazioni] = useState<Rendicontazione[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    fetchRendicontazioni();
  }, [refreshTrigger, nomeDipendente]);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, rendicontazioni]);

  const fetchRendicontazioni = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('rendicontazione')
        .select('*')
        .eq('nome_tecnico', nomeDipendente)
        .order('created_at', { ascending: false });
        
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
        (item.mese && item.mese.toLowerCase().includes(query))
    );
    
    setFilteredRendicontazioni(filtered);
  };

  const handleRendicontazioneSubmitted = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value);
  };

  const getStatusColor = (stato: string) => {
    switch (stato) {
      case 'Da validare':
        return 'bg-yellow-100 text-yellow-800';
      case 'Da fatturare':
        return 'bg-green-100 text-green-800';
      case 'Fatturato':
        return 'bg-blue-100 text-blue-800';
      case 'Rifiutata':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <DipendenteRendicontazioneForm 
        onRendicontazioneSubmitted={handleRendicontazioneSubmitted}
        nomeDipendente={nomeDipendente}
      />
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">Le Mie Rendicontazioni</h2>
          <button 
            onClick={() => setRefreshTrigger(prev => prev + 1)} 
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            <RefreshCw className="w-4 h-4 mr-1" /> Aggiorna
          </button>
        </div>
        
        <div className="p-4 border-b">
          <SearchBar 
            placeholder="Cerca per cliente, mese..." 
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
        
        {loading ? (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Caricamento rendicontazioni...</span>
          </div>
        ) : rendicontazioni.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="w-12 h-12 mx-auto text-gray-400 mb-2" />
            <p className="text-gray-600">Non hai ancora inserito rendicontazioni.</p>
            <p className="text-gray-500 mt-2">Utilizza il form sopra per inserire la tua prima rendicontazione.</p>
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
                    Perio do
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
                    Importo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stato
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRendicontazioni.map((rendicontazione) => (
                  <tr key={rendicontazione.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-blue-500" />
                        <div className="text-sm font-medium text-gray-900">
                          {rendicontazione.mese} {rendicontazione.anno}
                        </div>
                      </div>
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
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{formatCurrency(rendicontazione.importo)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(rendicontazione.stato || 'Da validare')}`}>
                        {rendicontazione.stato || 'Da validare'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DipendenteRendicontazioneManager;