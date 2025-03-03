import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Fatturazione } from '../types/database.types';
import { Loader2, RefreshCw, Receipt, Calendar, Edit, AlertTriangle, Clock, CheckCircle, Filter, X, FileText, CreditCard, Search, DollarSign, Calculator } from 'lucide-react';
import FatturazioneForm from './FatturazioneForm';
import SearchBar from './SearchBar';

interface ScadenziarioManagerProps {}

interface FatturazioneWithAffidamento extends Fatturazione {
  affidamento: {
    id: number;
    determina: string;
    anno: number;
    cliente_id: number;
    totale: number;
    clienti: {
      denominazione: string;
    };
  };
}

const ScadenziarioManager: React.FC<ScadenziarioManagerProps> = () => {
  const [fatturazioni, setFatturazioni] = useState<FatturazioneWithAffidamento[]>([]);
  const [filteredFatturazioni, setFilteredFatturazioni] = useState<FatturazioneWithAffidamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [filterStato, setFilterStato] = useState<string>('');
  const [filterCliente, setFilterCliente] = useState<string>('');
  const [filterAnno, setFilterAnno] = useState<number | ''>('');
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState<'tutte' | 'scadenze' | 'fatturate'>('tutte');
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [fatturazioneToEdit, setFatturazioneToEdit] = useState<Fatturazione | null>(null);
  const [selectedAffidamentoId, setSelectedAffidamentoId] = useState<number | null>(null);
  const [selectedAffidamentoTotale, setSelectedAffidamentoTotale] = useState<number>(0);
  const [totals, setTotals] = useState({
    daEmettere: 0,
    emesse: 0,
    pagate: 0,
    scadute: 0,
    inScadenza: 0,
    filteredDaEmettere: 0,
    filteredEmesse: 0,
    filteredPagate: 0,
    filteredScadute: 0,
    filteredInScadenza: 0
  });

  // Check if any filters are active
  const areFiltersActive = filterStato !== '' || filterCliente !== '' || filterAnno !== '' || searchQuery !== '' || activeTab !== 'tutte';

  const fetchFatturazioni = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('fatturazione')
        .select(`
          *,
          affidamento:affidamento_id (
            id,
            determina,
            anno,
            cliente_id,
            totale,
            clienti (
              denominazione
            )
          )
        `)
        .order('data_scadenza', { ascending: true });
        
      if (error) throw error;
      
      setFatturazioni(data || []);
      applyFilters(data || [], filterStato, activeTab, filterCliente, filterAnno, searchQuery);
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
  }, [refreshTrigger]);

  useEffect(() => {
    applyFilters(fatturazioni, filterStato, activeTab, filterCliente, filterAnno, searchQuery);
  }, [filterStato, activeTab, filterCliente, filterAnno, searchQuery, fatturazioni]);

  const calculateTotals = (data: FatturazioneWithAffidamento[], filtered: FatturazioneWithAffidamento[]) => {
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
      inScadenza: 0,
      filteredDaEmettere: 0,
      filteredEmesse: 0,
      filteredPagate: 0,
      filteredScadute: 0,
      filteredInScadenza: 0
    };
    
    // Calculate totals for all data
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
    
    // Calculate totals for filtered data
    filtered.forEach(item => {
      const scadenzaDate = new Date(item.data_scadenza);
      scadenzaDate.setHours(0, 0, 0, 0);
      
      // Calculate totals by stato
      if (item.stato === 'Da emettere') {
        totals.filteredDaEmettere += item.importo;
      } else if (item.stato === 'Emessa') {
        totals.filteredEmesse += item.importo;
      } else if (item.stato === 'Pagata') {
        totals.filteredPagate += item.importo;
      }
      
      // Calculate scadute (overdue)
      if (item.stato === 'Da emettere' && scadenzaDate < today) {
        totals.filteredScadute += item.importo;
      }
      
      // Calculate in scadenza (due soon)
      if (item.stato === 'Da emettere' && scadenzaDate >= today && scadenzaDate <= thirtyDaysFromNow) {
        totals.filteredInScadenza += item.importo;
      }
    });
    
    setTotals(totals);
  };

  const applyFilters = (
    data: FatturazioneWithAffidamento[], 
    stato: string, 
    tab: string, 
    cliente: string, 
    anno: number | string,
    search: string
  ) => {
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
    
    // Apply cliente filter
    if (cliente) {
      filtered = filtered.filter(item => 
        item.affidamento?.clienti?.denominazione === cliente
      );
    }
    
    // Apply anno filter
    if (anno !== '') {
      filtered = filtered.filter(item => 
        item.affidamento?.anno === anno
      );
    }
    
    // Apply search query
    if (search.trim() !== '') {
      const query = search.toLowerCase();
      filtered = filtered.filter(item => 
        (item.affidamento?.determina && item.affidamento.determina.toLowerCase().includes(query)) ||
        (item.affidamento?.clienti?.denominazione && item.affidamento.clienti.denominazione.toLowerCase().includes(query)) ||
        (item.numero_fattura && item.numero_fattura.toLowerCase().includes(query)) ||
        (item.note && item.note.toLowerCase().includes(query))
      );
    }
    
    setFilteredFatturazioni(filtered);
    calculateTotals(data, filtered);
  };

  const getUniqueClienti = () => {
    const clienti = fatturazioni
      .map(f => f.affidamento?.clienti?.denominazione)
      .filter((value, index, self) => 
        value && self.indexOf(value) === index
      ) as string[];
    
    return clienti.sort();
  };

  const getUniqueAnni = () => {
    const anni = fatturazioni
      .map(f => f.affidamento?.anno)
      .filter((value, index, self) => 
        value && self.indexOf(value) === index
      ) as number[];
    
    return anni.sort((a, b) => b - a); // Sort descending
  };

  const handleFatturazioneAdded = () => {
    setRefreshTrigger(prev => prev + 1);
    setShowForm(false);
    setFatturazioneToEdit(null);
    setSelectedAffidamentoId(null);
  };

  const handleAddFatturazione = async (affidamentoId: number) => {
    try {
      // Fetch the affidamento to get the total
      const { data, error } = await supabase
        .from('affidamento')
        .select('totale')
        .eq('id', affidamentoId)
        .single();
        
      if (error) throw error;
      
      setSelectedAffidamentoId(affidamentoId);
      setSelectedAffidamentoTotale(data.totale);
      setFatturazioneToEdit(null);
      setShowForm(true);
    } catch (err) {
      console.error('Error fetching affidamento:', err);
    }
  };

  const handleEditFatturazione = async (fatturazione: Fatturazione) => {
    try {
      // Fetch the affidamento to get the total
      const { data, error } = await supabase
        .from('affidamento')
        .select('totale')
        .eq('id', fatturazione.affidamento_id)
        .single();
        
      if (error) throw error;
      
      setSelectedAffidamentoId(fatturazione.affidamento_id);
      setSelectedAffidamentoTotale(data.totale);
      setFatturazioneToEdit(fatturazione);
      setShowForm(true);
    } catch (err) {
      console.error('Error fetching affidamento:', err);
    }
  };

  const handleCancelEdit = () => {
    setFatturazioneToEdit(null);
    setShowForm(false);
    setSelectedAffidamentoId(null);
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
    setFilterCliente('');
    setFilterAnno('');
    setActiveTab('tutte');
    setSearchQuery('');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Caricamento scadenziario...</span>
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
          <RefreshCw className="w-4 h-4 mr-1" />
          Riprova
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showForm ? (
        <FatturazioneForm 
          onFatturazioneAdded={handleFatturazioneAdded}
          fatturazioneToEdit={fatturazioneToEdit}
          onCancelEdit={handleCancelEdit}
          affidamentoId={selectedAffidamentoId!}
          affidamentoTotale={selectedAffidamentoTotale}
        />
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="flex justify-between items-center p-4 border-b">
            <h2 className="text-xl font-semibold">Scadenziario Generale</h2>
            <div className="flex space-x-2">
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center text-gray-600 hover:text-gray-800"
              >
                <Filter className="w-4 h-4 mr-1" />
                {showFilters ? 'Nascondi filtri' : 'Mostra filtri'}
              </button>
              <button 
                onClick={fetchFatturazioni} 
                className="flex items-center text-blue-600 hover:text-blue-800"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Aggiorna
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
          
          {/* Filtered Totals */}
          {areFiltersActive && (
            <div className="px-4 pb-4">
              <div className="p-4 bg-blue-50 rounded-md border border-blue-200">
                <h3 className="text-md font-medium text-blue-700 mb-3 flex items-center">
                  <Calculator className="w-5 h-5 mr-2" />
                  Totali Filtrati
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div>
                    <p className="text-sm text-blue-600">Da Emettere:</p>
                    <p className="text-md font-medium text-blue-800">{formatCurrency(totals.filteredDaEmettere)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-600">Scadute:</p>
                    <p className="text-md font-medium text-blue-800">{formatCurrency(totals.filteredScadute)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-600">In Scadenza:</p>
                    <p className="text-md font-medium text-blue-800">{formatCurrency(totals.filteredInScadenza)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-600">Emesse:</p>
                    <p className="text-md font-medium text-blue-800">{formatCurrency(totals.filteredEmesse)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-600">Pagate:</p>
                    <p className="text-md font-medium text-blue-800">{formatCurrency(totals.filteredPagate)}</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-blue-600">
                      Visualizzazione di <span className="font-medium">{filteredFatturazioni.length}</span> su <span className="font-medium">{fatturazioni.length}</span> scadenze
                    </div>
                    <div className="text-sm font-medium text-blue-800">
                      Totale importi filtrati: {formatCurrency(totals.filteredDaEmettere + totals.filteredEmesse + totals.filteredPagate)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Search Bar */}
          <div className="p-4 border-b">
            <SearchBar 
              placeholder="Cerca per cliente, determina, numero fattura..." 
              value={searchQuery}
              onChange={setSearchQuery}
            />
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
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
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
                
                <div>
                  <label htmlFor="filterCliente" className="block text-sm font-medium text-gray-700 mb-1">
                    Filtra per cliente
                  </label>
                  <select
                    id="filterCliente"
                    value={filterCliente}
                    onChange={(e) => setFilterCliente(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Tutti i clienti</option>
                    {getUniqueClienti().map(cliente => (
                      <option key={cliente} value={cliente}>{cliente}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="filterAnno" className="block text-sm font-medium text-gray-700 mb-1">
                    Filtra per anno
                  </label>
                  <select
                    id="filterAnno"
                    value={filterAnno}
                    onChange={(e) => setFilterAnno(e.target.value ? parseInt(e.target.value) : '')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Tutti gli anni</option>
                    {getUniqueAnni().map(anno => (
                      <option key={anno} value={anno}>{anno}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-end">
                  <button
                    onClick={resetFilters}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Reimposta filtri
                  </button>
                </div>
              </div>
              
              {areFiltersActive && (
                <div className="mt-4 text-sm text-gray-600">
                  <p>
                    Filtri attivi: 
                    {activeTab !== 'tutte' && <span className="ml-1 px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs">{activeTab === 'scadenze' ? 'Da Emettere' : 'Fatturate'}</span>}
                    {filterStato && <span className="ml-1 px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs">Stato: {filterStato}</span>}
                    {filterCliente && <span className="ml-1 px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs">Cliente: {filterCliente}</span>}
                    {filterAnno !== '' && <span className="ml-1 px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs">Anno: {filterAnno}</span>}
                    {searchQuery && <span className="ml-1 px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs">Ricerca: "{searchQuery}"</span>}
                  </p>
                </div>
              )}
            </div>
          )}
          
          {fatturazioni.length === 0 ? (
            <div className="p-8 text-center">
              <Receipt className="w-12 h-12 mx-auto text-gray-400 mb-2" />
              <p className="text-gray-600">Nessuna scadenza di fatturazione trovata.</p>
            </div>
          ) : filteredFatturazioni.length === 0 ? (
            <div className="p-8 text-center">
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
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Affidamento
                    </th>
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
                        <div className="text-sm font-medium text-gray-900">
                          {fatturazione.affidamento?.clienti?.denominazione || 'N/D'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {fatturazione.affidamento?.determina || 'N/D'}
                        </div>
                        <div className="text-xs text-gray-500">
                          Anno: {fatturazione.affidamento?.anno || 'N/D'}
                        </div>
                      </td>
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
                        <button
                          onClick={() => handleEditFatturazione(fatturazione)}
                          className="text-blue-600 hover:text-blue-800 flex items-center"
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Modifica
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Summary footer when filters are active */}
          {areFiltersActive && filteredFatturazioni.length > 0 && (
            <div className="p-4 bg-gray-50 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-700">
                  Visualizzazione di <span className="font-medium">{filteredFatturazioni.length}</span> su <span className="font-medium">{fatturazioni.length}</span> scadenze
                </div>
                <div className="text-sm font-medium text-gray-900">
                  Totale importi filtrati: {formatCurrency(totals.filteredDaEmettere + totals.filteredEmesse + totals.filteredPagate)}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ScadenziarioManager;