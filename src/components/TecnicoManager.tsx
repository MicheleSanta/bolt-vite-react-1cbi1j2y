import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Tecnico, TecnicoInsert } from '../types/database.types';
import { Save, Loader2, Edit, Trash2, AlertCircle, Check, X, UserCircle, Calendar } from 'lucide-react';

const TecnicoManager: React.FC = () => {
  const [tecnici, setTecnici] = useState<Tecnico[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [tecnicoToEdit, setTecnicoToEdit] = useState<Tecnico | null>(null);
  const [newTecnico, setNewTecnico] = useState<TecnicoInsert>({ 
    nome: '',
    codice_fiscale: '',
    attivo: true,
    data_attivazione: new Date().toISOString().split('T')[0]
  });
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    fetchTecnici();
  }, []);

  const fetchTecnici = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('tecnico')
        .select('*')
        .order('nome', { ascending: true });
        
      if (error) throw error;
      
      setTecnici(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Si è verificato un errore nel caricamento dei tecnici');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    if (tecnicoToEdit) {
      if (type === 'checkbox') {
        setTecnicoToEdit({ ...tecnicoToEdit, [name]: checked });
      } else {
        setTecnicoToEdit({ ...tecnicoToEdit, [name]: value });
      }
    } else {
      if (type === 'checkbox') {
        setNewTecnico({ ...newTecnico, [name]: checked });
      } else {
        setNewTecnico({ ...newTecnico, [name]: value });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (tecnicoToEdit) {
        // Update existing tecnico
        const { error } = await supabase
          .from('tecnico')
          .update({ 
            nome: tecnicoToEdit.nome,
            codice_fiscale: tecnicoToEdit.codice_fiscale,
            attivo: tecnicoToEdit.attivo,
            data_attivazione: tecnicoToEdit.data_attivazione
          })
          .eq('id', tecnicoToEdit.id);
        
        if (error) throw error;
        
        setSuccess('Tecnico aggiornato con successo!');
        setTecnicoToEdit(null);
      } else {
        // Insert new tecnico
        const { error } = await supabase
          .from('tecnico')
          .insert([newTecnico]);
        
        if (error) throw error;
        
        setSuccess('Tecnico aggiunto con successo!');
        setNewTecnico({ 
          nome: '',
          codice_fiscale: '',
          attivo: true,
          data_attivazione: new Date().toISOString().split('T')[0]
        });
      }
      
      // Refresh the list
      fetchTecnici();
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Si è verificato un errore');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (tecnico: Tecnico) => {
    setTecnicoToEdit(tecnico);
    setNewTecnico({ 
      nome: '',
      codice_fiscale: '',
      attivo: true,
      data_attivazione: new Date().toISOString().split('T')[0]
    });
  };

  const handleCancelEdit = () => {
    setTecnicoToEdit(null);
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    setError(null);
    
    try {
      const { error } = await supabase
        .from('tecnico')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      // Refresh the list
      fetchTecnici();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Si è verificato un errore durante l\'eliminazione');
    } finally {
      setDeletingId(null);
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

  if (loading && tecnici.length === 0) {
    return (
      <div className="flex justify-center items-center p-4">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Caricamento tecnici...</span>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Gestione Tecnici</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 flex items-center">
          <Check className="w-5 h-5 mr-2" />
          {success}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-1">
              {tecnicoToEdit ? 'Modifica Tecnico' : 'Nuovo Tecnico'}
            </label>
            <input
              type="text"
              id="nome"
              name="nome"
              value={tecnicoToEdit ? tecnicoToEdit.nome : newTecnico.nome}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nome tecnico"
            />
          </div>
          
          <div>
            <label htmlFor="codice_fiscale" className="block text-sm font-medium text-gray-700 mb-1">
              Codice Fiscale
            </label>
            <input
              type="text"
              id="codice_fiscale"
              name="codice_fiscale"
              value={tecnicoToEdit ? tecnicoToEdit.codice_fiscale || '' : newTecnico.codice_fiscale}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Codice fiscale"
            />
          </div>
          
          <div>
            <label htmlFor="data_attivazione" className="block text-sm font-medium text-gray-700 mb-1">
              Data Attivazione
            </label>
            <input
              type="date"
              id="data_attivazione"
              name="data_attivazione"
              value={tecnicoToEdit ? tecnicoToEdit.data_attivazione || new Date().toISOString().split('T')[0] : newTecnico.data_attivazione}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="attivo"
              name="attivo"
              checked={tecnicoToEdit ? tecnicoToEdit.attivo || false : newTecnico.attivo}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="attivo" className="ml-2 block text-sm text-gray-700">
              Tecnico attivo
            </label>
          </div>
        </div>
        
        <div className="flex justify-end mt-4 space-x-2">
          {tecnicoToEdit && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              <X className="w-5 h-5" />
            </button>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-300"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                {tecnicoToEdit ? 'Aggiorna' : 'Salva'}
              </>
            )}
          </button>
        </div>
      </form>
      
      <div className="border rounded-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nome Tecnico
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Codice Fiscale
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Data Attivazione
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stato
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Azioni
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tecnici.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                  <div className="flex flex-col items-center justify-center py-4">
                    <UserCircle className="w-8 h-8 text-gray-300 mb-2" />
                    <p>Nessun tecnico trovato</p>
                  </div>
                </td>
              </tr>
            ) : (
              tecnici.map((tecnico) => (
                <tr key={tecnico.id} className={`hover:bg-gray-50 ${!tecnico.attivo ? 'bg-gray-50 text-gray-500' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{tecnico.nome}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{tecnico.codice_fiscale || 'Non specificato'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 flex items-center">
                      <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                      {formatDate(tecnico.data_attivazione)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      tecnico.attivo 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {tecnico.attivo ? 'Attivo' : 'Inattivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => handleEdit(tecnico)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Modifica tecnico"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(tecnico.id)}
                        disabled={deletingId === tecnico.id}
                        className={`${
                          deletingId === tecnico.id 
                            ? 'text-gray-400' 
                            : 'text-red-600 hover:text-red-800'
                        }`}
                        title="Elimina tecnico"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TecnicoManager;