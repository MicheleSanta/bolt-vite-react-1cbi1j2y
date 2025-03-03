import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2, RefreshCw, FileText, Copy, Calendar, Edit, AlertCircle, Filter, X, Receipt, Trash2, Eye, EyeOff, Clock, Percent, DollarSign, FileBox } from 'lucide-react';
import { Affidamento, Fatturazione } from '../types/database.types';
import SearchBar from './SearchBar';
import FatturazioneForm from './FatturazioneForm';
import FatturazioneList from './FatturazioneList';
import FatturazioneScheduleGenerator from './FatturazioneScheduleGenerator';
import AffidamentoDocumentiManager from './AffidamentoDocumentiManager';

interface AffidamentoWithCliente {
  id: number;
  anno: number;
  determina: string;
  numero_determina?: string;
  cig?: string;
  data?: string;
  data_termine?: string;
  cliente_id: number;
  descrizione: string;
  stato: string;
  quantita: number;
  prezzo_unitario: number;
  imponibile: number;
  iva: number;
  totale: number;
  has_provvigione?: boolean;
  tipo_provvigione?: 'attiva' | 'passiva';
  partner_provvigione?: string;
  percentuale_provvigione?: number;
  importo_provvigione?: number;
  created_at: string;
  clienti: {
    denominazione: string;
  };
}

interface AffidamentoListProps {
  refreshTrigger: number;
  onEditAffidamento: (affidamento: Affidamento) => void;
  filterClienteId?: number | null;
  onClearClienteFilter?: () => void;
}

const AffidamentoList: React.FC<AffidamentoListProps> = ({ 
  refreshTrigger, 
  onEditAffidamento,
  filterClienteId = null,
  onClearClienteFilter
}) => {
  const [affidamenti, setAffidamenti] = useState<AffidamentoWithCliente[]>([]);
  const [filteredAffidamenti, setFilteredAffidamenti] = useState<AffidamentoWithCliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [duplicating, setDuplicating] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStato, setFilterStato] = useState<string>('');
  const [filterAnno, setFilterAnno] = useState<number | ''>('');
  const [filterProvvigione, setFilterProvvigione] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [clienteFilter, setClienteFilter] = useState<{id: number, nome: string} | null>(null);
  const [selectedAffidamento, setSelectedAffidamento] = useState<number | null>(null);
  const [showFatturazione, setShowFatturazione] = useState(false);
  const [showScheduleGenerator, setShowScheduleGenerator] = useState(false);
  const [showDocumenti, setShowDocumenti] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<number | null>(null);
  const [hideExpired, setHideExpired] = useState<boolean>(false);

  const fetchAffidamenti = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let query = supabase
        .from('affidamento')
        .select(`
          *,
          clienti (
            denominazione
          )
        `);
      
      // Apply cliente filter if provided
      if (filterClienteId) {
        query = query.eq('cliente_id', filterClienteId);
        
        // Also fetch the cliente name for display
        const { data: clienteData } = await supabase
          .from('clienti')
          .select('denominazione')
          .eq('id', filterClienteId)
          .single();
          
        if (clienteData) {
          setClienteFilter({
            id: filterClienteId,
            nome: clienteData.denominazione
          });
        }
      } else {
        setClienteFilter(null);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
        
      if (error) throw error;
      
      setAffidamenti(data || []);
      applyFilters(data || [], searchQuery, filterStato, filterAnno, hideExpired, filterProvvigione);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Si è verificato un errore nel caricamento degli affidamenti');
      setAffidamenti([]);
      setFilteredAffidamenti([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAffidamenti();
  }, [refreshTrigger, filterClienteId]);

  useEffect(() => {
    applyFilters(affidamenti, searchQuery, filterStato, filterAnno, hideExpired, filterProvvigione);
  }, [searchQuery, filterStato, filterAnno, hideExpired, filterProvvigione, affidamenti]);

  const applyFilters = (
    data: AffidamentoWithCliente[], 
    search: string, 
    stato: string, 
    anno: number | string,
    hideExpiredFlag: boolean,
    provvigione: string
  ) => {
    let filtered = [...data];
    
    // Apply search query
    if (search.trim() !== '') {
      const query = search.toLowerCase();
      filtered = filtered.filter(
        aff =>
          aff.determina.toLowerCase().includes(query) ||
          aff.descrizione.toLowerCase().includes(query) ||
          aff.clienti?.denominazione.toLowerCase().includes(query) ||
          (aff.cig && aff.cig.toLowerCase().includes(query)) ||
          (aff.numero_determina && aff.numero_determina.toLowerCase().includes(query)) ||
          (aff.partner_provvigione && aff.partner_provvigione.toLowerCase().includes(query))
      );
    }
    
    // Apply stato filter
    if (stato) {
      filtered = filtered.filter(aff => aff.stato === stato);
    }
    
    // Apply anno filter
    if (anno !== '') {
      filtered = filtered.filter(aff => aff.anno === anno);
    }
    
    // Apply provvigione filter
    if (provvigione) {
      if (provvigione === 'con_provvigione') {
        filtered = filtered.filter(aff => aff.has_provvigione === true);
      } else if (provvigione === 'senza_provvigione') {
        filtered = filtered.filter(aff => !aff.has_provvigione);
      } else if (provvigione === 'provvigione_attiva') {
        filtered = filtered.filter(aff => aff.has_provvigione && aff.tipo_provvigione === 'attiva');
      } else if (provvigione === 'provvigione_passiva') {
        filtered = filtered.filter(aff => aff.has_provvigione && aff.tipo_provvigione === 'passiva');
      }
    }
    
    // Apply hide expired filter
    if (hideExpiredFlag) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      filtered = filtered.filter(aff => {
        // If no end date, it's not expired
        if (!aff.data_termine) return true;
        
        // Check if end date is in the future
        const endDate = new Date(aff.data_termine);
        endDate.setHours(0, 0, 0, 0);
        return endDate >= today;
      });
    }
    
    setFilteredAffidamenti(filtered);
  };

  const getStatusColor = (stato: string) => {
    switch (stato) {
      case 'In corso':
        return 'bg-yellow-100 text-yellow-800';
      case 'Completato':
        return 'bg-green-100 text-green-800';
      case 'Annullato':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDuplicate = async (affidamento: AffidamentoWithCliente) => {
    setDuplicating(affidamento.id);
    
    try {
      // Create a new affidamento object without id and created_at
      const newAffidamento: Omit<Affidamento, 'id' | 'created_at'> = {
        anno: new Date().getFullYear(), // Set to current year
        determina: affidamento.determina,
        numero_determina: affidamento.numero_determina,
        cig: affidamento.cig,
        data: new Date().toISOString().split('T')[0], // Set to current date
        data_termine: affidamento.data_termine,
        cliente_id: affidamento.cliente_id,
        descrizione: `${affidamento.descrizione} (Duplicato)`,
        stato: 'In corso', // Reset to "In corso"
        quantita: affidamento.quantita,
        prezzo_unitario: affidamento.prezzo_unitario,
        imponibile: affidamento.imponibile,
        iva: affidamento.iva,
        totale: affidamento.totale,
        has_provvigione: affidamento.has_provvigione,
        tipo_provvigione: affidamento.tipo_provvigione,
        partner_provvigione: affidamento.partner_provvigione,
        percentuale_provvigione: affidamento.percentuale_provvigione,
        importo_provvigione: affidamento.importo_provvigione
      };
      
      // Ensure dates are properly formatted or null
      const dataToSubmit = {
        ...newAffidamento,
        data: newAffidamento.data || null,
        data_termine: newAffidamento.data_termine || null,
        // If provvigione is not enabled, set related fields to null
        has_provvigione: newAffidamento.has_provvigione || false,
        tipo_provvigione: newAffidamento.has_provvigione ? newAffidamento.tipo_provvigione : null,
        partner_provvigione: newAffidamento.has_provvigione ? newAffidamento.partner_provvigione : null,
        percentuale_provvigione: newAffidamento.has_provvigione ? newAffidamento.percentuale_provvigione : null,
        importo_provvigione: newAffidamento.has_provvigione ? newAffidamento.importo_provvigione : null
      };
      
      const { error } = await supabase.from('affidamento').insert([dataToSubmit]);
      
      if (error) throw error;
      
      // Refresh the list
      fetchAffidamenti();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Si è verificato un errore durante la duplicazione');
    } finally {
      setDuplicating(null);
    }
  };

  const handleEdit = (affidamento: AffidamentoWithCliente) => {
    onEditAffidamento(affidamento as Affidamento);
  };

  const handleDelete = async (id: number) => {
    setDeleting(id);
    setError(null);
    
    try {
      // First check if there are any fatturazioni for this affidamento
      const { data: fatturazioni, error: checkError } = await supabase
        .from('fatturazione')
        .select('id')
        .eq('affidamento_id', id);
        
      if (checkError) throw checkError;
      
      if (fatturazioni && fatturazioni.length > 0) {
        throw new Error(`Impossibile eliminare l'affidamento: ci sono ${fatturazioni.length} fatturazioni associate.`);
      }
      
      // Check if there are any documents for this affidamento
      const { data: documenti, error: docCheckError } = await supabase
        .from('affidamento_documenti')
        .select('id')
        .eq('affidamento_id', id);
        
      if (docCheckError) throw docCheckError;
      
      if (documenti && documenti.length > 0) {
        throw new Error(`Impossibile eliminare l'affidamento: ci sono ${documenti.length} documenti associati.`);
      }
      
      // If no fatturazioni or documents, proceed with deletion
      const { error } = await supabase
        .from('affidamento')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      // Refresh the list
      fetchAffidamenti();
      
      // Clear delete confirmation
      setDeleteConfirmation(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Si è verificato un errore durante l\'eliminazione');
    } finally {
      setDeleting(null);
    }
  };

  const handleToggleFatturazione = (affidamentoId: number) => {
    if (selectedAffidamento === affidamentoId && showFatturazione) {
      setSelectedAffidamento(null);
      setShowFatturazione(false);
      setShowScheduleGenerator(false);
      setShowDocumenti(false);
    } else {
      setSelectedAffidamento(affidamentoId);
      setShowFatturazione(true);
      setShowScheduleGenerator(false);
      setShowDocumenti(false);
    }
  };

  const handleToggleScheduleGenerator = (affidamentoId: number) => {
    if (selectedAffidamento === affidamentoId && showScheduleGenerator) {
      setSelectedAffidamento(null);
      setShowScheduleGenerator(false);
      setShowFatturazione(false);
      setShowDocumenti(false);
    } else {
      setSelectedAffidamento(affidamentoId);
      setShowScheduleGenerator(true);
      setShowFatturazione(false);
      setShowDocumenti(false);
    }
  };

  const handleToggleDocumenti = (affidamentoId: number) => {
    if (selectedAffidamento === affidamentoId && showDocumenti) {
      setSelectedAffidamento(null);
      setShowDocumenti(false);
      setShowFatturazione(false);
      setShowScheduleGenerator(false);
    } else {
      setSelectedAffidamento(affidamentoId);
      setShowDocumenti(true);
      setShowFatturazione(false);
      setShowScheduleGenerator(false);
    }
  };

  const handleScheduleGenerated = () => {
    setShowScheduleGenerator(false);
    setShowFatturazione(true);
    fetchAffidamenti();
  };

  const getUniqueYears = () => {
    const years = [...new Set(affidamenti.map(a => a.anno))];
    return years.sort((a, b) => b - a); // Sort descending
  };

  const resetFilters = () => {
    setSearchQuery('');
    setFilterStato('');
    setFilterAnno('');
    setFilterProvvigione('');
    setHideExpired(false);
  };

  const handleClearClienteFilter = () => {
    if (onClearClienteFilter) {
      onClearClienteFilter();
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/D';
    try {
      return new Date(dateString).toLocaleDateString('it-IT');
    } catch (e) {
      return 'N/D';
    }
  };

  const isExpired = (dateString?: string): boolean => {
    if (!dateString) return false;
    
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const endDate = new Date(dateString);
      endDate.setHours(0, 0, 0, 0);
      
      return endDate < today;
    } catch (e) {
      return false;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Caricamento affidamenti...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <p>{error}</p>
        <button 
          onClick={fetchAffidamenti}
          className="mt-2 flex items-center text-red-700 hover:text-red-900"
        >
          <RefreshCw className="w-4 h-4 mr-1" /> Riprova
        </button>
      </div>
    );
  }

  if (affidamenti.length === 0) {
    return (
      <div className="bg-gray-100 p-6 rounded-lg text-center">
        <FileText className="w-12 h-12 mx-auto text-gray-400 mb-2" />
        <p className="text-gray-600">
          {clienteFilter 
            ? `Nessun affidamento trovato per il cliente ${clienteFilter.nome}.` 
            : 'Nessun affidamento trovato. Aggiungi il tuo primo affidamento usando il form sopra.'}
        </p>
        {clienteFilter && onClearClienteFilter && (
          <button
            onClick={handleClearClienteFilter}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Mostra tutti gli affidamenti
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="text-xl font-semibold">
          {clienteFilter 
            ? `Affidamenti per ${clienteFilter.nome}` 
            : 'Elenco Affidamenti'}
        </h2>
        <div className="flex items-center space-x-2">
          {clienteFilter && onClearClienteFilter && (
            <button
              onClick={handleClearClienteFilter}
              className="flex items-center text-blue-600 hover:text-blue-800"
            >
              <X className="w-4 h-4 mr-1" /> 
              Rimuovi filtro cliente
            </button>
          )}
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center text-gray-600 hover:text-gray-800"
          >
            <Filter className="w-4 h-4 mr-1" /> 
            {showFilters ? 'Nascondi filtri' : 'Mostra filtri'}
          </button>
          <button 
            onClick={fetchAffidamenti} 
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            <RefreshCw className="w-4 h-4 mr-1" /> Aggiorna
          </button>
        </div>
      </div>
      
      <div className="p-4 border-b">
        <SearchBar 
          placeholder="Cerca per cliente, determina, CIG, descrizione..." 
          value={searchQuery}
          onChange={setSearchQuery}
        />
        
        {showFilters && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <option value="In corso">In corso</option>
                <option value="Completato">Completato</option>
                <option value="Annullato">Annullato</option>
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
                {getUniqueYears().map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="filterProvvigione" className="block text-sm font-medium text-gray-700 mb-1">
                Filtra per provvigione
              </label>
              <select
                id="filterProvvigione"
                value={filterProvvigione}
                onChange={(e) => setFilterProvvigione(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Tutti gli affidamenti</option>
                <option value="con_provvigione">Con provvigione</option>
                <option value="senza_provvigione">Senza provvigione</option>
                <option value="provvigione_attiva">Provvigione attiva</option>
                <option value="provvigione_passiva">Provvigione passiva</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="hideExpired"
                  checked={hideExpired}
                  onChange={(e) => setHideExpired(e.target.checked)}
                  className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="hideExpired" className="ml-2 text-sm text-gray-700">
                  Nascondi affidamenti scaduti
                </label>
              </div>
            </div>
            
            <div className="flex items-end md:col-span-4">
              <button
                onClick={resetFilters}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Reimposta filtri
              </button>
            </div>
          </div>
        )}
      </div>
      
      {filteredAffidamenti.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-gray-500">Nessun affidamento corrisponde ai criteri di ricerca.</p>
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
                  Anno/Determina
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CIG
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descrizione
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Periodo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stato
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Importo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Azioni
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAffidamenti.map((affidamento) => (
                <React.Fragment key={affidamento.id}>
                  <tr className={`hover:bg-gray-50 ${isExpired(affidamento.data_termine) ? 'bg-gray-50' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{affidamento.anno}</div>
                      <div className="text-sm text-gray-500">{affidamento.determina}</div>
                      {affidamento.numero_determina && (
                        <div className="text-xs text-gray-500">N. {affidamento.numero_determina}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {affidamento.cig ? (
                        <div className="text-sm text-gray-900">{affidamento.cig}</div>
                      ) : (
                        <div className="text-xs text-gray-400 flex items-center">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Non specificato
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{affidamento.clienti?.denominazione}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">{affidamento.descrizione}</div>
                      {affidamento.has_provvigione && (
                        <div className="mt-1 flex items-center text-xs text-gray-500">
                          <Percent className="w-3 h-3 mr-1" />
                          Provvigione {affidamento.tipo_provvigione === 'passiva' ? 'da pagare' : 'da ricevere'}: 
                          <span className="font-medium ml-1">
                            {affidamento.percentuale_provvigione}% 
                            ({affidamento.importo_provvigione?.toFixed(2) || '0.00'}€)
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-xs ${isExpired(affidamento.data_termine) ? 'text-red-500 font-medium' : 'text-gray-500'} flex items-center`}>
                        <Calendar className={`w-3 h-3 mr-1 ${isExpired(affidamento.data_termine) ? 'text-red-500' : 'text-gray-400'}`} />
                        {formatDate(affidamento.data)}
                        {affidamento.data_termine && (
                          <> → {formatDate(affidamento.data_termine)}</>
                        )}
                        {isExpired(affidamento.data_termine) && (
                          <span className="ml-1 text-xs text-red-500 font-medium">(Scaduto)</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(affidamento.stato)}`}>
                        {affidamento.stato}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">€ {affidamento.totale.toFixed(2)}</div>
                      <div className="text-xs text-gray-500">
                        Imponibile: € {affidamento.imponibile.toFixed(2)} + IVA: € {affidamento.iva.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex flex-col space-y-2">
                        <button
                          onClick={() => handleEdit(affidamento)}
                          className="text-blue-600 hover:text-blue-900 flex items-center"
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Modifica
                        </button>
                        <button
                          onClick={() => handleToggleFatturazione(affidamento.id)}
                          className="text-blue-600 hover:text-blue-900 flex items-center"
                        >
                          <Receipt className="w-4 h-4 mr-1" />
                          Fatturazione
                        </button>
                        <button
                          onClick={() => handleToggleScheduleGenerator(affidamento.id)}
                          className="text-blue-600 hover:text-blue-900 flex items-center"
                        >
                          <Clock className="w-4 h-4 mr-1" />
                          Piano Rate
                        </button>
                        <button
                          onClick={() => handleToggleDocumenti(affidamento.id)}
                          className="text-blue-600 hover:text-blue-900 flex items-center"
                        >
                          <FileBox className="w-4 h-4 mr-1" />
                          Documenti
                        </button>
                        <button
                          onClick={() => handleDuplicate(affidamento)}
                          disabled={duplicating === affidamento.id}
                          className="text-blue-600 hover:text-blue-900 flex items-center"
                        >
                          {duplicating === affidamento.id ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                              Duplicazione...
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4 mr-1" />
                              Duplica
                            </>
                          )}
                        </button>
                        {deleteConfirmation === affidamento.id ? (
                          <div className="flex space-x-2 mt-1">
                            <button
                              onClick={() => handleDelete(affidamento.id)}
                              disabled={deleting === affidamento.id}
                              className="text-red-600 hover:text-red-800 text-xs font-bold"
                            >
                              {deleting === affidamento.id ? (
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
                            onClick={() => setDeleteConfirmation(affidamento.id)}
                            className="text-red-600 hover:text-red-800 flex items-center"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Elimina
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {selectedAffidamento === affidamento.id && showFatturazione && (
                    <tr>
                      <td colSpan={8} className="px-6 py-4 bg-gray-50">
                        <FatturazioneManager 
                          affidamentoId={affidamento.id} 
                          affidamentoTotale={affidamento.totale}
                        />
                      </td>
                    </tr>
                  )}
                  {selectedAffidamento === affidamento.id && showScheduleGenerator && (
                    <tr>
                      <td colSpan={8} className="px-6 py-4 bg-gray-50">
                        <FatturazioneScheduleGenerator
                          affidamentoId={affidamento.id}
                          affidamentoTotale={affidamento.totale}
                          onScheduleGenerated={handleScheduleGenerated}
                          onCancel={() => setShowScheduleGenerator(false)}
                        />
                      </td>
                    </tr>
                  )}
                  {selectedAffidamento === affidamento.id && showDocumenti && (
                    <tr>
                      <td colSpan={8} className="px-6 py-4 bg-gray-50">
                        <AffidamentoDocumentiManager
                          affidamentoId={affidamento.id}
                          onBack={() => setShowDocumenti(false)}
                        />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Toggle expired assignments button (fixed at bottom right) */}
      <div className="fixed bottom-6 right-6">
        <button
          onClick={() => setHideExpired(!hideExpired)}
          className={`flex items-center justify-center p-3 rounded-full shadow-lg ${
            hideExpired ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 border border-blue-200'
          }`}
          title={hideExpired ? "Mostra affidamenti scaduti" : "Nascondi affidamenti scaduti"}
        >
          {hideExpired ? (
            <Eye className="w-5 h-5" />
          ) : (
            <EyeOff className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  );
};

interface FatturazioneManagerProps {
  affidamentoId: number;
  affidamentoTotale: number;
}

const FatturazioneManager: React.FC<FatturazioneManagerProps> = ({ affidamentoId, affidamentoTotale }) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [fatturazioneToEdit, setFatturazioneToEdit] = useState<Fatturazione | null>(null);

  const handleFatturazioneAdded = () => {
    setRefreshTrigger(prev => prev + 1);
    setShowForm(false);
    setFatturazioneToEdit(null);
  };

  const handleAddFatturazione = () => {
    setFatturazioneToEdit(null);
    setShowForm(true);
  };

  const handleEditFatturazione = (fatturazione: Fatturazione) => {
    setFatturazioneToEdit(fatturazione);
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setFatturazioneToEdit(null);
    setShowForm(false);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900 mb-2">Gestione Fatturazione</h3>
      
      {showForm ? (
        <FatturazioneForm 
          onFatturazioneAdded={handleFatturazioneAdded}
          fatturazioneToEdit={fatturazioneToEdit}
          onCancelEdit={handleCancelEdit}
          affidamentoId={affidamentoId}
          affidamentoTotale={affidamentoTotale}
        />
      ) : (
        <button
          onClick={handleAddFatturazione}
          className="mb-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Aggiungi Scadenza di Fatturazione
        </button>
      )}
      
      <FatturazioneList 
        refreshTrigger={refreshTrigger}
        affidamentoId={affidamentoId}
        onAddFatturazione={handleAddFatturazione}
        onEditFatturazione={handleEditFatturazione}
      />
    </div>
  );
};

export default AffidamentoList;