import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Fatturazione } from '../types/database.types';
import { Loader2, RefreshCw, Receipt, Calendar, Edit, Trash2, AlertCircle, CreditCard, FileText, Plus, Clock, AlertTriangle, CheckCircle, Filter, X } from 'lucide-react';

interface FatturazioneListProps {
  refreshTrigger: number;
  affidamentoId: number;
  onAddFatturazione: () => void;
  onEditFatturazione: (fatturazione: Fatturazione) => void;
}

const FatturazioneList: React.FC<FatturazioneListProps> = ({ 
  refreshTrigger, 
  affidamentoId,
  onAddFatturazione,
  onEditFatturazione
}) => {
  const [fatturazioni, setFatturazioni] = useState<Fatturazione[]>([]);
  const [filteredFatturazioni, setFilteredFatturazioni] = useState<Fatturazione[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [filterStato, setFilterStato] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState<'tutte' | 'scadenze' | 'fatturate'>('tutte');
  const [totals, setTotals] = useState({
    daEmettere: 0,
    emesse: 0,
    pagate: 0,
    scadute: 0,
    inScadenza: 0
  });

  const fetchFatturazioni = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('fatturazione')
        .select('*')
        .eq('affidamento_id', affidamentoId)
        .order('data_scadenza', { ascending: true });
        
      if (error) throw error;
      
      setFatturazioni(data || []);
      applyFilters(data || [], filterStato, activeTab);
      calculateTotals(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Si è verificato un errore nel caricamento delle scadenze');
      setFatturazioni([]);
      setFilteredFatturazioni([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFatturazioni();
  }, [refreshTrigger, affidamentoId]);

  useEffect(() => {
    applyFilters(fatturazioni, filterStato, activeTab);
  }, [filterStato, activeTab, fatturazioni]);

  const calculateTotals = (data: Fatturazione[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Add 30 days to today for "in scadenza"
    const thirtyDaysFromNow = new Date(today);
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    
    const totals = {
      daEmettere: 0,
      emesse: 0,
      pagate: 0,
      scadute: 0,
      inScadenza: 0
    };
    
    data.forEach(item => {
      const scadenzaDate = new Date(item.data_scadenza);
      scadenzaDate.setHours(0, 0, 0, 0);
      
      // Calculate totals by stato
      if (item.stato === 'Da emettere') {
        totals.daEmettere += item.importo;
      } else if (item.stato === 'Emessa') {
        totals.emesse += item.importo;
      } else if (item.stato === 'Pagata') {
        totals.pagate += item.importo;
      }
      
      // Calculate scadute (overdue)
      if (item.stato === 'Da emettere' && scadenzaDate < today) {
        totals.scadute += item.importo;
      }
      
      // Calculate in scadenza (due soon)
      if (item.stato === 'Da emettere' && scadenzaDate >= today && scadenzaDate <= thirtyDaysFromNow) {
        totals.inScadenza += item.importo;
      }
    });
    
    setTotals(totals);
  };

  const applyFilters = (data: Fatturazione[], stato: string, tab: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Add 30 days to today for "in scadenza"
    const thirtyDaysFromNow = new Date(today);
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    
    let filtered = [...data];
    
    // Apply tab filter
    if (tab === 'scadenze') {
      filtered = filtered.filter(item => item.stato === 'Da emettere');
    } else if (tab === 'fatturate') {
      filtered = filtered.filter(item => item.stato === 'Emessa' || item.stato === 'Pagata');
    }
    
    // Apply stato filter
    if (stato) {
      if (stato === 'Scadute') {
        filtered = filtered.filter(item => {
          const scadenzaDate = new Date(item.data_scadenza);
          scadenzaDate.setHours(0, 0, 0, 0);
          return item.stato === 'Da emettere' && scadenzaDate < today;
        });
      } else if (stato === 'In scadenza') {
        filtered = filtered.filter(item => {
          const scadenzaDate = new Date(item.data_scadenza);
          scadenzaDate.setHours(0, 0, 0, 0);
          return item.stato === 'Da emettere' && scadenzaDate >= today && scadenzaDate <= thirtyDaysFromNow;
        });
      } else {
        filtered = filtered.filter(item => item.stato === stato);
      }
    }
    
    setFilteredFatturazioni(filtered);
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    setDeleteError(null);
    
    try {
      const { error } = await supabase
        .from('fatturazione')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      // Refresh the list
      fetchFatturazioni();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Si è verificato un errore durante l\'eliminazione');
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusColor = (stato: string) => {
    switch (stato) {
      case 'Da emettere':
        return 'bg-yellow-100 text-yellow-800';
      case 'Emessa':
        return 'bg-blue-100 text-blue-800';
      case 'Pagata':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isScaduta = (dataScadenza: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const scadenzaDate = new Date(dataScadenza);
    scadenzaDate.setHours(0, 0, 0, 0);
    return scadenzaDate < today;
  };

  const isInScadenza = (dataScadenza: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thirtyDaysFromNow = new Date(today);
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    
    const scadenzaDate = new Date(dataScadenza);
    scadenzaDate.setHours(0, 0, 0, 0);
    
    return scadenzaDate >= today && scadenzaDate <= thirtyDaysFromNow;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/D';
    try {
      return new Date(dateString).toLocaleDateString('it-IT');
    } catch (e) {
      return 'N/D';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value);
  };

  const resetFilters = () => {
    setFilterStato('');
    setActiveTab('tutte');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-4">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Caricamento scadenze...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <p>{error}</p>
        <button 
          onClick={fetchFatturazioni}
          className="mt-2 flex items-center text-red-700 hover:text-red-900"
        >
          <RefreshCw className="w-4 h-4 mr-1" /> Riprova
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="flex justify-between items-center p-4 border-b">
        <h3 className="text-lg font-semibold">Scadenze di Fatturazione</h3>
        <div className="flex space-x-2">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center text-gray-600 hover:text-gray-800"
          >
            <Filter className="w-4 h-4 mr-1" /> 
            {showFilters ? 'Nascondi filtri' : 'Mostra filtri'}
          </button>
          <button 
            onClick={onAddFatturazione} 
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            <Plus className="w-4 h-4 mr-1" /> Aggiungi
          </button>
          <button 
            onClick={fetchFatturazioni} 
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            <RefreshCw className="w-4 h-4 mr-1" /> Aggiorna
          </button>
        </div>
      </div>
      
      {/* Dashboard Cards */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-yellow-600 font-medium">Da Emettere</p>
              <p className="text-lg font-bold text-yellow-700">{formatCurrency(totals.daEmettere)}</p>
            </div>
            <Receipt className="w-8 h-8 text-yellow-400" />
          </div>
        </div>
        
        <div className="bg-red-50 p-3 rounded-lg border border-red-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-red-600 font-medium">Scadute</p>
              <p className="text-lg font-bold text-red-700">{formatCurrency(totals.scadute)}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
        </div>
        
        <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-orange-600 font-medium">In Scadenza</p>
              <p className="text-lg font-bold text-orange-700">{formatCurrency(totals.inScadenza)}</p>
            </div>
            <Clock className="w-8 h-8 text-orange-400" />
          </div>
        </div>
        
        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-blue-600 font-medium">Emesse</p>
              <p className="text-lg font-bold text-blue-700">{formatCurrency(totals.emesse)}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-400" />
          </div>
        </div>
        
        <div className="bg-green-50 p-3 rounded-lg border border-green-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-green-600 font-medium">Pagate</p>
              <p className="text-lg font-bold text-green-700">{formatCurrency(totals.pagate)}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="border-b">
        <div className="flex">
          <button
            onClick={() => setActiveTab('tutte')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'tutte'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Tutte le scadenze
          </button>
          <button
            onClick={() => setActiveTab('scadenze')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'scadenze'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Da Emettere
          </button>
          <button
            onClick={() => setActiveTab('fatturate')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'fatturate'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Fatturate
          </button>
        </div>
      </div>
      
      {/* Filters */}
      {showFilters && (
        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-center space-x-4">
            <div className="flex-grow">
              <label htmlFor="filterStato" className="block text-sm font-medium text-gray-700 mb-1">
                Filtra per stato
              </label>
              <select
                id="filterStato"
                value={filterStato}
                onChange={(e) => setFilterStato(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Tutti gli stati</option>
                <option value="Da emettere">Da emettere</option>
                <option value="Emessa">Emessa</option>
                <option value="Pagata">Pagata</option>
                <option value="Scadute">Scadute</option>
                <option value="In scadenza">In scadenza (30 giorni)</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={resetFilters}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
      
      {deleteError && (
        <div className="m-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {deleteError}
        </div>
      )}
      
      {fatturazioni.length === 0 ? (
        <div className="p-6 text-center">
          <Receipt className="w-12 h-12 mx-auto text-gray-400 mb-2" />
          <p className="text-gray-600">Nessuna scadenza di fatturazione trovata.</p>
          <button
            onClick={onAddFatturazione}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Aggiungi Scadenza
          </button>
        </div>
      ) : filteredFatturazioni.length === 0 ? (
        <div className="p-6 text-center">
          <p className="text-gray-500">Nessuna scadenza corrisponde ai filtri selezionati.</p>
          <button
            onClick={resetFilters}
            className="mt-2 text-blue-600 hover:text-blue-800"
          >
            Reimposta filtri
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Percentuale
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Importo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data Scadenza
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stato
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fattura
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Azioni
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredFatturazioni.map((fatturazione) => (
                <tr key={fatturazione.id} className={`hover:bg-gray-50 ${
                  fatturazione.stato === 'Da emettere' && isScaduta(fatturazione.data_scadenza) 
                    ? 'bg-red-50' 
                    : fatturazione.stato === 'Da emettere' && isInScadenza(fatturazione.data_scadenza)
                    ? 'bg-orange-50'
                    : ''
                }`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{fatturazione.percentuale}%</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{formatCurrency(fatturazione.importo)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm flex items-center ${
                      fatturazione.stato === 'Da emettere' && isScaduta(fatturazione.data_scadenza)
                        ? 'text-red-600 font-medium'
                        : fatturazione.stato === 'Da emettere' && isInScadenza(fatturazione.data_scadenza)
                        ? 'text-orange-600'
                        : 'text-gray-500'
                    }`}>
                      {fatturazione.stato === 'Da emettere' && isScaduta(fatturazione.data_scadenza) ? (
                        <AlertTriangle className="w-4 h-4 mr-1 text-red-500" />
                      ) : fatturazione.stato === 'Da emettere' && isInScadenza(fatturazione.data_scadenza) ? (
                        <Clock className="w-4 h-4 mr-1 text-orange-500" />
                      ) : (
                        <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                      )}
                      {formatDate(fatturazione.data_scadenza)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(fatturazione.stato)}`}>
                      {fatturazione.stato}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {fatturazione.numero_fattura ? (
                      <div>
                        <div className="text-sm font-medium text-gray-900 flex items-center">
                          <Receipt className="w-4 h-4 mr-1 text-gray-400" />
                          {fatturazione.numero_fattura}
                        </div>
                        {fatturazione.data_emissione && (
                          <div className="text-xs text-gray-500">
                            Emessa: {formatDate(fatturazione.data_emissione)}
                          </div>
                        )}
                        {fatturazione.data_pagamento && (
                          <div className="text-xs text-gray-500 flex items-center">
                            <CreditCard className="w-3 h-3 mr-1 text-gray-400" />
                            Pagata: {formatDate(fatturazione.data_pagamento)}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-400 flex items-center">
                        <FileText className="w-3 h-3 mr-1" />
                        Non emessa
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-3">
                      <button
                        onClick={() => onEditFatturazione(fatturazione)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Modifica scadenza"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(fatturazione.id)}
                        disabled={deletingId === fatturazione.id}
                        className={`${
                          deletingId === fatturazione.id 
                            ? 'text-gray-400' 
                            : 'text-red-600 hover:text-red-800'
                        }`}
                        title="Elimina scadenza"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default FatturazioneList;