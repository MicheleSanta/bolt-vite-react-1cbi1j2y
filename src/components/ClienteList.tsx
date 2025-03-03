import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Cliente } from '../types/database.types';
import { Loader2, RefreshCw, Users, FileText, Building2, MapPin, Mail, CreditCard, Edit, Trash2, AlertCircle, Globe, Info } from 'lucide-react';
import SearchBar from './SearchBar';

interface ClienteListProps {
  refreshTrigger: number;
  onViewClienteAffidamenti: (clienteId: number) => void;
  onEditCliente: (cliente: Cliente) => void;
}

const ClienteList: React.FC<ClienteListProps> = ({ 
  refreshTrigger, 
  onViewClienteAffidamenti,
  onEditCliente
}) => {
  const [clienti, setClienti] = useState<Cliente[]>([]);
  const [filteredClienti, setFilteredClienti] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [affidamentiCount, setAffidamentiCount] = useState<Record<number, number>>({});
  const [expandedCliente, setExpandedCliente] = useState<number | null>(null);
  const [deletingCliente, setDeletingCliente] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchClienti = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('clienti')
        .select('*')
        .order('denominazione', { ascending: true });
        
      if (error) throw error;
      
      setClienti(data || []);
      setFilteredClienti(data || []);
      
      // Fetch affidamenti count for each client
      if (data && data.length > 0) {
        await fetchAffidamentiCount(data.map(c => c.id));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Si è verificato un errore nel caricamento dei clienti');
      setClienti([]);
      setFilteredClienti([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAffidamentiCount = async (clientIds: number[]) => {
    try {
      // Get counts for each client individually
      const counts: Record<number, number> = {};
      
      // Initialize all counts to 0
      clientIds.forEach(id => {
        counts[id] = 0;
      });
      
      // Get all affidamenti
      const { data, error } = await supabase
        .from('affidamento')
        .select('cliente_id');
        
      if (error) throw error;
      
      // Count occurrences of each cliente_id
      if (data) {
        data.forEach(item => {
          if (counts[item.cliente_id] !== undefined) {
            counts[item.cliente_id]++;
          }
        });
      }
      
      setAffidamentiCount(counts);
    } catch (err) {
      console.error('Error fetching affidamenti count:', err);
    }
  };

  useEffect(() => {
    fetchClienti();
  }, [refreshTrigger]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredClienti(clienti);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = clienti.filter(
        cliente =>
          cliente.denominazione.toLowerCase().includes(query) ||
          cliente.referente.toLowerCase().includes(query) ||
          cliente.email.toLowerCase().includes(query) ||
          cliente.cellulare.includes(query) ||
          (cliente.ufficio && cliente.ufficio.toLowerCase().includes(query)) ||
          (cliente.indirizzo && cliente.indirizzo.toLowerCase().includes(query)) ||
          (cliente.citta && cliente.citta.toLowerCase().includes(query)) ||
          (cliente.provincia && cliente.provincia.toLowerCase().includes(query)) ||
          (cliente.codice_fiscale && cliente.codice_fiscale.toLowerCase().includes(query)) ||
          (cliente.partita_iva && cliente.partita_iva.toLowerCase().includes(query)) ||
          (cliente.codice_univoco && cliente.codice_univoco.toLowerCase().includes(query)) ||
          (cliente.pec && cliente.pec.toLowerCase().includes(query)) ||
          (cliente.sito_web && cliente.sito_web.toLowerCase().includes(query)) ||
          (cliente.note && cliente.note.toLowerCase().includes(query))
      );
      setFilteredClienti(filtered);
    }
  }, [searchQuery, clienti]);

  const toggleExpandCliente = (id: number) => {
    setExpandedCliente(expandedCliente === id ? null : id);
  };

  const handleEditCliente = (cliente: Cliente) => {
    onEditCliente(cliente);
  };

  const handleDeleteCliente = async (id: number) => {
    setDeletingCliente(id);
    setDeleteError(null);
    
    try {
      // First check if there are any affidamenti for this client
      if (affidamentiCount[id] && affidamentiCount[id] > 0) {
        throw new Error(`Impossibile eliminare il cliente: ci sono ${affidamentiCount[id]} affidamenti associati.`);
      }
      
      const { error } = await supabase
        .from('clienti')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      // Refresh the list
      fetchClienti();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Si è verificato un errore durante l\'eliminazione');
    } finally {
      setDeletingCliente(null);
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

  if (clienti.length === 0) {
    return (
      <div className="bg-gray-100 p-6 rounded-lg text-center">
        <Users className="w-12 h-12 mx-auto text-gray-400 mb-2" />
        <p className="text-gray-600">Nessun cliente trovato. Aggiungi il tuo primo cliente usando il form sopra.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="text-xl font-semibold">Elenco Clienti</h2>
        <button 
          onClick={fetchClienti} 
          className="flex items-center text-blue-600 hover:text-blue-800"
        >
          <RefreshCw className="w-4 h-4 mr-1" /> Aggiorna
        </button>
      </div>
      
      <div className="p-4 border-b">
        <SearchBar 
          placeholder="Cerca cliente per nome, referente, email, telefono, ufficio, indirizzo o dati fiscali..." 
          value={searchQuery}
          onChange={setSearchQuery}
        />
      </div>
      
      {deleteError && (
        <div className="m-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {deleteError}
        </div>
      )}
      
      {filteredClienti.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-gray-500">Nessun cliente corrisponde alla ricerca.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Denominazione
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Referente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contatti
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ufficio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Affidamenti
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
                      <div className="text-sm font-medium text-gray-900">{cliente.denominazione}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{cliente.referente}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{cliente.cellulare}</div>
                      <a href={`mailto:${cliente.email}`} className="text-sm text-blue-600 hover:underline">
                        {cliente.email}
                      </a>
                      {cliente.pec && (
                        <div className="flex items-center mt-1">
                          <Mail className="w-3 h-3 mr-1 text-gray-400" />
                          <a href={`mailto:${cliente.pec}`} className="text-xs text-blue-600 hover:underline">
                            PEC: {cliente.pec}
                          </a>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {cliente.ufficio || 'Non specificato'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => onViewClienteAffidamenti(cliente.id)}
                        className="flex items-center text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        <FileText className="w-4 h-4 mr-1 text-gray-400" />
                        <span className="text-sm">
                          {affidamentiCount[cliente.id] || 0}
                        </span>
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleExpandCliente(cliente.id)}
                        className="flex items-center text-blue-600 hover:text-blue-800"
                      >
                        <MapPin className="w-4 h-4 mr-1" />
                        {expandedCliente === cliente.id ? 'Nascondi' : 'Mostra'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleEditCliente(cliente)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Modifica cliente"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCliente(cliente.id)}
                          disabled={deletingCliente === cliente.id || (affidamentiCount[cliente.id] && affidamentiCount[cliente.id] > 0)}
                          className={`${
                            deletingCliente === cliente.id 
                              ? 'text-gray-400' 
                              : affidamentiCount[cliente.id] && affidamentiCount[cliente.id] > 0
                                ? 'text-gray-300 cursor-not-allowed'
                                : 'text-red-600 hover:text-red-800'
                          }`}
                          title={
                            affidamentiCount[cliente.id] && affidamentiCount[cliente.id] > 0
                              ? 'Non è possibile eliminare un cliente con affidamenti'
                              : 'Elimina cliente'
                          }
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedCliente === cliente.id && (
                    <tr className="bg-gray-50">
                      <td colSpan={7} className="px-6 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <h4 className="font-medium text-gray-700 flex items-center mb-2">
                              <Building2 className="w-4 h-4 mr-2" />
                              Ufficio
                            </h4>
                            <p className="text-sm text-gray-600">
                              {cliente.ufficio || 'Non specificato'}
                            </p>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-700 flex items-center mb-2">
                              <MapPin className="w-4 h-4 mr-2" />
                              Indirizzo
                            </h4>
                            {cliente.indirizzo ? (
                              <div className="text-sm text-gray-600">
                                <p>{cliente.indirizzo}</p>
                                <p>
                                  {cliente.cap && `${cliente.cap} `}
                                  {cliente.citta && `${cliente.citta} `}
                                  {cliente.provincia && `(${cliente.provincia})`}
                                </p>
                              </div>
                            ) : (
                              <p className="text-sm text-gray-600">Indirizzo non specificato</p>
                            )}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-700 flex items-center mb-2">
                              <CreditCard className="w-4 h-4 mr-2" />
                              Dati Fiscali
                            </h4>
                            <div className="text-sm text-gray-600">
                              {cliente.codice_fiscale && (
                                <p>Codice Fiscale: {cliente.codice_fiscale}</p>
                              )}
                              {cliente.partita_iva && (
                                <p>Partita IVA: {cliente.partita_iva}</p>
                              )}
                              {cliente.codice_univoco && (
                                <p>Codice Univoco: {cliente.codice_univoco}</p>
                              )}
                              {!cliente.codice_fiscale && !cliente.partita_iva && !cliente.codice_univoco && (
                                <p>Dati fiscali non specificati</p>
                              )}
                            </div>
                          </div>
                          
                          {(cliente.sito_web || cliente.note) && (
                            <div className="col-span-3 mt-2 pt-2 border-t border-gray-200">
                              <h4 className="font-medium text-gray-700 flex items-center mb-2">
                                <Info className="w-4 h-4 mr-2" />
                                Informazioni Aggiuntive
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {cliente.sito_web && (
                                  <div>
                                    <p className="text-sm text-gray-500 mb-1 flex items-center">
                                      <Globe className="w-3 h-3 mr-1" /> Sito Web:
                                    </p>
                                    <a 
                                      href={cliente.sito_web.startsWith('http') ? cliente.sito_web : `https://${cliente.sito_web}`} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-sm text-blue-600 hover:underline"
                                    >
                                      {cliente.sito_web}
                                    </a>
                                  </div>
                                )}
                                
                                {cliente.note && (
                                  <div>
                                    <p className="text-sm text-gray-500 mb-1">Note:</p>
                                    <p className="text-sm text-gray-600 whitespace-pre-line">{cliente.note}</p>
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

export default ClienteList;