import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Rendicontazione, Fascia, Mese } from '../types/database.types';
import { Loader2, RefreshCw, FileSpreadsheet, Edit, Trash2, AlertCircle, Filter, X, Calculator, Receipt, Calendar, CheckCircle, Clock, DollarSign } from 'lucide-react';
import SearchBar from './SearchBar';
import ExcelExport from './ExcelExport';

interface RendicontazioneListProps {
  refreshTrigger: number;
  onEditRendicontazione: (rendicontazione: Rendicontazione) => void;
}

const RendicontazioneList: React.FC<RendicontazioneListProps> = ({ 
  refreshTrigger, 
  onEditRendicontazione
}) => {
  const [rendicontazioni, setRendicontazioni] = useState<Rendicontazione[]>([]);
  const [filteredRendicontazioni, setFilteredRendicontazioni] = useState<Rendicontazione[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMese, setFilterMese] = useState<string>('');
  const [filterAnno, setFilterAnno] = useState<number | ''>('');
  const [filterPartner, setFilterPartner] = useState<string>('');
  const [filterStato, setFilterStato] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<number | null>(null);
  const [fasce, setFasce] = useState<Fascia[]>([]);
  const [mesiList, setMesiList] = useState<Mese[]>([]);
  const [totals, setTotals] = useState({
    daFatturare: 0,
    fatturato: 0,
    filteredDaFatturare: 0,
    filteredFatturato: 0
  });

  // Month order mapping for sorting
  const monthOrder: Record<string, number> = {
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

  const fetchRendicontazioni = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('rendicontazione')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      // Sort data by year (descending) and month (chronological)
      const sortedData = [...(data || [])].sort((a, b) => {
        // First sort by year (descending)
        if (a.anno !== b.anno) {
          return b.anno - a.anno;
        }
        
        // Then sort by month (chronological)
        const aMonthIndex = a.id_mese || monthOrder[a.mese] || 0;
        const bMonthIndex = b.id_mese || monthOrder[b.mese] || 0;
        return aMonthIndex - bMonthIndex;
      });
      
      setRendicontazioni(sortedData);
      applyFilters(sortedData, filterMese, filterAnno, filterPartner, filterStato, searchQuery);
      calculateTotals(sortedData, []);
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

  useEffect(() => {
    fetchRendicontazioni();
    fetchFasce();
    fetchMesi();
  }, [refreshTrigger]);

  useEffect(() => {
    applyFilters(rendicontazioni, filterMese, filterAnno, filterPartner, filterStato, searchQuery);
  }, [filterMese, filterAnno, filterPartner, filterStato, searchQuery, rendicontazioni]);

  const calculateTotals = (allData: Rendicontazione[], filteredData: Rendicontazione[]) => {
    // Calculate totals for all data
    const allTotals = {
      daFatturare: 0,
      fatturato: 0,
      filteredDaFatturare: 0,
      filteredFatturato: 0
    };
    
    // Calculate totals for all data
    allData.forEach(item => {
      if (item.stato === 'Da fatturare') {
        allTotals.daFatturare += item.importo;
      } else if (item.stato === 'Fatturato') {
        allTotals.fatturato += item.importo;
      }
    });
    
    // Calculate totals for filtered data
    filteredData.forEach(item => {
      if (item.stato === 'Da fatturare') {
        allTotals.filteredDaFatturare += item.importo;
      } else if (item.stato === 'Fatturato') {
        allTotals.filteredFatturato += item.importo;
      }
    });
    
    setTotals(allTotals);
  };

  const applyFilters = (
    data: Rendicontazione[], 
    mese: string, 
    anno: number | string,
    partner: string,
    stato: string,
    search: string
  ) => {
    let filtered = [...data];
    
    // Apply mese filter
    if (mese) {
      filtered = filtered.filter(item => item.mese === mese);
    }
    
    // Apply anno filter
    if (anno !== '') {
      filtered = filtered.filter(item => item.anno === anno);
    }
    
    // Apply partner filter
    if (partner) {
      filtered = filtered.filter(item => item.partner === partner);
    }
    
    // Apply stato filter
    if (stato) {
      filtered = filtered.filter(item => item.stato === stato);
    }
    
    // Apply search query
    if (search.trim() !== '') {
      const query = search.toLowerCase();
      filtered = filtered.filter(item => 
        (item.nome_cliente && item.nome_cliente.toLowerCase().includes(query)) ||
        (item.codice_cliente && item.codice_cliente.toLowerCase().includes(query)) ||
        (item.nome_tecnico && item.nome_tecnico.toLowerCase().includes(query)) ||
        (item.partner && item.partner.toLowerCase().includes(query)) ||
        (item.numero_commessa && item.numero_commessa.toLowerCase().includes(query)) ||
        (item.numero_fattura && item.numero_fattura.toLowerCase().includes(query))
      );
    }
    
    setFilteredRendicontazioni(filtered);
    calculateTotals(data, filtered);
  };

  const getUniqueMesi = () => {
    if (mesiList.length > 0) {
      return [...mesiList].sort((a, b) => a.id - b.id).map(m => m.descrizione);
    }
    return [...new Set(rendicontazioni.map(r => r.mese))].sort((a, b) => {
      return monthOrder[a] - monthOrder[b];
    });
  };

  const getUniqueAnni = () => {
    return [...new Set(rendicontazioni.map(r => r.anno))].sort((a, b) => b - a);
  };

  const getUniquePartners = () => {
    return [...new Set(rendicontazioni.map(r => r.partner).filter(Boolean))].sort();
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    setDeleteError(null);
    
    try {
      const { error } = await supabase
        .from('rendicontazione')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      // Refresh the list
      fetchRendicontazioni();
      setDeleteConfirmation(null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Si è verificato un errore durante l\'eliminazione');
    } finally {
      setDeletingId(null);
    }
  };

  const resetFilters = () => {
    setFilterMese('');
    setFilterAnno('');
    setFilterPartner('');
    setFilterStato('');
    setSearchQuery('');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/D';
    try {
      return new Date(dateString).toLocaleDateString('it-IT');
    } catch (e) {
      return 'N/D';
    }
  };

  const getFasciaOre = (fasciaName: string): number => {
    const fasciaFound = fasce.find(f => f.nome === fasciaName);
    return fasciaFound?.ore || 1;
  };

  // Determine if filters are active
  const areFiltersActive = filterMese !== '' || filterAnno !== '' || filterPartner !== '' || filterStato !== '' || searchQuery !== '';

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Caricamento rendicontazioni...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <p>{error}</p>
        <button 
          onClick={fetchRendicontazioni}
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
        <h2 className="text-xl font-semibold">Elenco Rendicontazioni</h2>
        <div className="flex space-x-2">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center text-gray-600 hover:text-gray-800"
          >
            <Filter className="w-4 h-4 mr-1" /> 
            {showFilters ? 'Nascondi filtri' : 'Mostra filtri'}
          </button>
          <button 
            onClick={fetchRendicontazioni} 
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            <RefreshCw className="w-4 h-4 mr-1" /> Aggiorna
          </button>
        </div>
      </div>
      
      {/* Dashboard Cards */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-yellow-600 font-medium">Da Fatturare (Totale)</p>
              <p className="text-lg font-bold text-yellow-700">{formatCurrency(totals.daFatturare)}</p>
            </div>
            <Receipt className="w-8 h-8 text-yellow-400" />
          </div>
        </div>
        
        <div className="bg-green-50 p-3 rounded-lg border border-green-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-green-600 font-medium">Fatturato (Totale)</p>
              <p className="text-lg font-bold text-green-700">{formatCurrency(totals.fatturato)}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </div>
        
        {areFiltersActive && (
          <>
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-blue-600 font-medium">Da Fatturare (Filtrato)</p>
                  <p className="text-lg font-bold text-blue-700">{formatCurrency(totals.filteredDaFatturare)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-blue-400" />
              </div>
            </div>
            
            <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-200">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-indigo-600 font-medium">Fatturato (Filtrato)</p>
                  <p className="text-lg font-bold text-indigo-700">{formatCurrency(totals.filteredFatturato)}</p>
                </div>
                <Calculator className="w-8 h-8 text-indigo-400" />
              </div>
            </div>
          </>
        )}
      </div>
      
      {/* Export to Excel */}
      {rendicontazioni.length > 0 && (
        <div className="px-4 pb-4">
          <ExcelExport 
            data={filteredRendicontazioni.length > 0 ? filteredRendicontazioni : rendicontazioni}
            filename="Rendicontazioni_Service_Paghe"
            sheetName="Rendicontazioni"
            buttonText="Esporta Excel"
            filterOptions={{
              years: getUniqueAnni(),
              months: getUniqueMesi()
            }}
          />
        </div>
      )}
      
      {/* Search Bar */}
      <div className="p-4 border-b">
        <SearchBar 
          placeholder="Cerca per cliente, tecnico, partner..." 
          value={searchQuery}
          onChange={setSearchQuery}
        />
      </div>
      
      {/* Filters */}
      {showFilters && (
        <div className="p-4 border-b bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label htmlFor="filterMese" className="block text-sm font-medium text-gray-700 mb-1">
                Filtra per mese
              </label>
              <select
                id="filterMese"
                value={filterMese}
                onChange={(e) => setFilterMese(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Tutti i mesi</option>
                {getUniqueMesi().map(mese => (
                  <option key={mese} value={mese}>{mese}</option>
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
            
            <div>
              <label htmlFor="filterPartner" className="block text-sm font-medium text-gray-700 mb-1">
                Filtra per partner
              </label>
              <select
                id="filterPartner"
                value={filterPartner}
                onChange={(e) => setFilterPartner(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Tutti i partner</option>
                {getUniquePartners().map(partner => (
                  <option key={partner} value={partner}>{partner}</option>
                ))}
              </select>
            </div>
            
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
                <option value="Da fatturare">Da fatturare</option>
                <option value="Fatturato">Fatturato</option>
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
            <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-200">
              <h3 className="text-sm font-medium text-blue-700 mb-2 flex items-center">
                <Calculator className="w-4 h-4 mr-2" />
                Riepilogo Filtri Applicati
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-blue-600">Filtri attivi:</p>
                  <ul className="text-sm text-blue-800 mt-1">
                    {filterMese && <li>Mese: {filterMese}</li>}
                    {filterAnno !== '' && <li>Anno: {filterAnno}</li>}
                    {filterPartner && <li>Partner: {filterPartner}</li>}
                    {filterStato && <li>Stato: {filterStato}</li>}
                    {searchQuery && <li>Ricerca: "{searchQuery}"</li>}
                  </ul>
                </div>
                <div>
                  <p className="text-xs text-blue-600">Totali filtrati:</p>
                  <p className="text-sm text-blue-800 mt-1">
                    Da Fatturare: {formatCurrency(totals.filteredDaFatturare)}
                    <br />
                    Fatturato: {formatCurrency(totals.filteredFatturato)}
                    <br />
                    Totale: {formatCurrency(totals.filteredDaFatturare + totals.filteredFatturato)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      
      {deleteError && (
        <div className="m-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {deleteError}
        </div>
      )}
      
      {rendicontazioni.length === 0 ? (
        <div className="p-8 text-center">
          <FileSpreadsheet className="w-12 h-12 mx-auto text-gray-400 mb-2" />
          <p className="text-gray-600">Nessuna rendicontazione trovata.</p>
        </div>
      ) : filteredRendicontazioni.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-gray-500">Nessuna rendicontazione corrisponde ai filtri selezionati.</p>
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
                  Periodo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Partner/Tecnico
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cedolini
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fascia/Ore
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Importo
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
              {filteredRendicontazioni.map((rendicontazione) => (
                <tr key={rendicontazione.id} className="hover:bg-gray-50">
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
                    <div className="text-sm text-gray-900">{rendicontazione.partner}</div>
                    <div className="text-xs text-gray-500">Tecnico: {rendicontazione.nome_tecnico}</div>
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
                    <div className="text-xs text-gray-500 flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {getFasciaOre(rendicontazione.fascia)} {getFasciaOre(rendicontazione.fascia) === 1 ? 'ora' : 'ore'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{formatCurrency(rendicontazione.importo)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      rendicontazione.stato === 'Fatturato' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {rendicontazione.stato || 'Da fatturare'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {rendicontazione.numero_fattura ? (
                      <div>
                        <div className="text-sm font-medium text-gray-900">{rendicontazione.numero_fattura}/{rendicontazione.anno_fattura}</div>
                        {rendicontazione.data_fattura && (
                          <div className="text-xs text-gray-500">
                            Data: {formatDate(rendicontazione.data_fattura)}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-400">Non fatturato</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-3">
                      <button
                        onClick={() => onEditRendicontazione(rendicontazione)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Modifica rendicontazione"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      {deleteConfirmation === rendicontazione.id ? (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleDelete(rendicontazione.id)}
                            disabled={deletingId === rendicontazione.id}
                            className="text-red-600 hover:text-red-800 text-xs font-bold"
                          >
                            {deletingId === rendicontazione.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              'Conferma'
                            )}
                          </button>
                          <button
                            onClick={() => setDeleteConfirmation(null)}
                            className="text-gray-600 hover:text-gray-800 text-xs"
                          >
                            Annulla
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmation(rendicontazione.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Elimina rendicontazione"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
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

export default RendicontazioneList;