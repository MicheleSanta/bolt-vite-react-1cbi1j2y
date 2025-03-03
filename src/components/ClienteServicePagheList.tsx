import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ClienteServicePaghe } from '../types/database.types';
import { Loader2, RefreshCw, Building2, Calendar, Edit, Trash2, AlertCircle, Filter, X, User, Tag, Info, FileBox, Globe, KeyRound } from 'lucide-react';
import SearchBar from './SearchBar';

interface ClienteServicePagheListProps {
  refreshTrigger: number;
  onEditCliente: (cliente: ClienteServicePaghe) => void;
  onViewDocumenti: (cliente: ClienteServicePaghe) => void;
}

const ClienteServicePagheList: React.FC<ClienteServicePagheListProps> = ({ 
  refreshTrigger, 
  onEditCliente,
  onViewDocumenti
}) => {
  const [clienti, setClienti] = useState<ClienteServicePaghe[]>([]);
  const [filteredClienti, setFilteredClienti] = useState<ClienteServicePaghe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPartner, setFilterPartner] = useState<string>('');
  const [filterFascia, setFilterFascia] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [expandedCliente, setExpandedCliente] = useState<number | null>(null);

  const fetchClienti = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('clienti_service_paghe')
        .select('*')
        .order('nome_cliente', { ascending: true });
        
      if (error) throw error;
      
      setClienti(data || []);
      setFilteredClienti(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Si è verificato un errore nel caricamento dei clienti');
      setClienti([]);
      setFilteredClienti([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClienti();
  }, [refreshTrigger]);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, filterPartner, filterFascia, clienti]);

  const applyFilters = () => {
    let filtered = [...clienti];
    
    // Apply search query
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        cliente =>
          cliente.codice_cliente.toLowerCase().includes(query) ||
          cliente.nome_cliente.toLowerCase().includes(query) ||
          (cliente.numero_commessa && cliente.numero_commessa.toLowerCase().includes(query)) ||
          (cliente.tipo_servizio && cliente.tipo_servizio.toLowerCase().includes(query)) ||
          (cliente.software && cliente.software.toLowerCase().includes(query)) ||
          (cliente.referente && cliente.referente.toLowerCase().includes(query)) ||
          (cliente.url_gestionale && cliente.url_gestionale.toLowerCase().includes(query)) ||
          (cliente.login_gestionale && cliente.login_gestionale.toLowerCase().includes(query))
      );
    }
    
    // Apply partner filter
    if (filterPartner) {
      filtered = filtered.filter(cliente => cliente.partner === filterPartner);
    }
    
    // Apply fascia filter
    if (filterFascia) {
      filtered = filtered.filter(cliente => cliente.fascia === filterFascia);
    }
    
    setFilteredClienti(filtered);
  };

  const getUniquePartners = () => {
    const partners = [...new Set(clienti.map(c => c.partner).filter(Boolean))];
    return partners.sort();
  };

  const getUniqueFasce = () => {
    const fasce = [...new Set(clienti.map(c => c.fascia).filter(Boolean))];
    return fasce.sort();
  };

  const toggleExpandCliente = (id: number) => {
    setExpandedCliente(expandedCliente === id ? null : id);
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    setDeleteError(null);
    
    try {
      const { error } = await supabase
        .from('clienti_service_paghe')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      // Refresh the list
      fetchClienti();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Si è verificato un errore durante l\'eliminazione');
    } finally {
      setDeletingId(null);
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setFilterPartner('');
    setFilterFascia('');
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/D';
    try {
      return new Date(dateString).toLocaleDateString('it-IT');
    } catch (e) {
      return 'N/D';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Caricamento clienti...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <p>{error}</p>
        <button 
          onClick={fetchClienti}
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
        <h2 className="text-xl font-semibold">Elenco Clienti Service Paghe</h2>
        <div className="flex space-x-2">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center text-gray-600 hover:text-gray-800"
          >
            <Filter className="w-4 h-4 mr-1" /> 
            {showFilters ? 'Nascondi filtri' : 'Mostra filtri'}
          </button>
          <button 
            onClick={fetchClienti} 
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            <RefreshCw className="w-4 h-4 mr-1" /> Aggiorna
          </button>
        </div>
      </div>
      
      <div className="p-4 border-b">
        <SearchBar 
          placeholder="Cerca cliente per codice, nome, commessa, servizio..." 
          value={searchQuery}
          onChange={setSearchQuery}
        />
      </div>
      
      {showFilters && (
        <div className="p-4 border-b bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <label htmlFor="filterFascia" className="block text-sm font-medium text-gray-700 mb-1">
                Filtra per fascia
              </label>
              <select
                id="filterFascia"
                value={filterFascia}
                onChange={(e) => setFilterFascia(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Tutte le fasce</option>
                {getUniqueFasce().map(fascia => (
                  <option key={fascia} value={fascia}>{fascia}</option>
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
        </div>
      )}
      
      {deleteError && (
        <div className="m-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {deleteError}
        </div>
      )}
      
      {clienti.length === 0 ? (
        <div className="p-8 text-center">
          <Building2 className="w-12 h-12 mx-auto text-gray-400 mb-2" />
          <p className="text-gray-600">Nessun cliente trovato. Aggiungi il tuo primo cliente usando il form sopra.</p>
        </div>
      ) : filteredClienti.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-gray-500">Nessun cliente corrisponde ai filtri selezionati.</p>
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
                  Codice/Nome
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Commessa
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Periodo Servizio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo Servizio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cedolini
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fascia
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Partner
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dettagli
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Azioni
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredClienti.map((cliente) => (
                <React.Fragment key={cliente.id}>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{cliente.nome_cliente}</div>
                      <div className="text-xs text-gray-500">Cod: {cliente.codice_cliente}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{cliente.numero_commessa || 'N/D'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs text-gray-500 flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {formatDate(cliente.data_attivazione)}
                        {cliente.data_cessazione && (
                          <> → {formatDate(cliente.data_cessazione)}</>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{cliente.tipo_servizio || 'N/D'}</div>
                      <div className="text-xs text-gray-500">{cliente.software || ''}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {cliente.cedolini_previsti || 'N/D'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {cliente.fascia ? (
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${cliente.fascia_personalizzata ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                            Fascia {cliente.fascia} {cliente.fascia_personalizzata ? '(P)' : ''}
                          </span>
                        ) : (
                          'N/D'
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{cliente.partner || 'N/D'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleExpandCliente(cliente.id)}
                        className="flex items-center text-blue-600 hover:text-blue-800"
                      >
                        <Info className="w-4 h-4 mr-1" />
                        {expandedCliente === cliente.id ? 'Nascondi' : 'Mostra'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-3">
                        <button
                          onClick={() => onEditCliente(cliente)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Modifica cliente"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => onViewDocumenti(cliente)}
                          className="text-green-600 hover:text-green-800"
                          title="Gestisci documenti"
                        >
                          <FileBox className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(cliente.id)}
                          disabled={deletingId === cliente.id}
                          className={`${
                            deletingId === cliente.id 
                              ? 'text-gray-400' 
                              : 'text-red-600 hover:text-red-800'
                          }`}
                          title="Elimina cliente"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedCliente === cliente.id && (
                    <tr className="bg-gray-50">
                      <td colSpan={9} className="px-6 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <h4 className="font-medium text-gray-700 flex items-center mb-2">
                              <User className="w-4 h-4 mr-2" />
                              Referente
                            </h4>
                            <p className="text-sm text-gray-600">
                              {cliente.referente || 'Non specificato'}
                            </p>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-700 flex items-center mb-2">
                              <Tag className="w-4 h-4 mr-2" />
                              Adempimenti
                            </h4>
                            <p className="text-sm text-gray-600">
                              {cliente.adempimenti || 'Non specificato'}
                            </p>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-700 flex items-center mb-2">
                              <Info className="w-4 h-4 mr-2" />
                              Altre Informazioni
                            </h4>
                            <p className="text-sm text-gray-600 whitespace-pre-line">
                              {cliente.altre_informazioni || 'Nessuna informazione aggiuntiva'}
                            </p>
                          </div>
                          
                          {/* Credenziali Gestionale */}
                          {(cliente.url_gestionale || cliente.login_gestionale || cliente.password_gestionale) && (
                            <div className="col-span-3 mt-2 pt-2 border-t border-gray-200">
                              <h4 className="font-medium text-gray-700 flex items-center mb-2">
                                <KeyRound className="w-4 h-4 mr-2" />
                                Credenziali Gestionale
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {cliente.url_gestionale && (
                                  <div>
                                    <p className="text-sm text-gray-500 mb-1 flex items-center">
                                      <Globe className="w-3 h-3 mr-1" /> URL:
                                    </p>
                                    <a 
                                      href={cliente.url_gestionale.startsWith('http') ? cliente.url_gestionale : `https://${cliente.url_gestionale}`} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-sm text-blue-600 hover:underline"
                                    >
                                      {cliente.url_gestionale}
                                    </a>
                                  </div>
                                )}
                                
                                {cliente.login_gestionale && (
                                  <div>
                                    <p className="text-sm text-gray-500 mb-1 flex items-center">
                                      <User className="w-3 h-3 mr-1" /> Login:
                                    </p>
                                    <p className="text-sm text-gray-900">{cliente.login_gestionale}</p>
                                  </div>
                                )}
                                
                                {cliente.password_gestionale && (
                                  <div>
                                    <p className="text-sm text-gray-500 mb-1 flex items-center">
                                      <KeyRound className="w-3 h-3 mr-1" /> Password:
                                    </p>
                                    <p className="text-sm text-gray-900">••••••••</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ClienteServicePagheList;