import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Partner, PartnerInsert } from '../types/database.types';
import { Save, Loader2, Edit, Trash2, AlertCircle, Check, X, Users } from 'lucide-react';

const PartnerManager: React.FC = () => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [partnerToEdit, setPartnerToEdit] = useState<Partner | null>(null);
  const [newPartner, setNewPartner] = useState<PartnerInsert>({ nome: '' });
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('partner')
        .select('*')
        .order('nome', { ascending: true });
        
      if (error) throw error;
      
      setPartners(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Si è verificato un errore nel caricamento dei partner');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (partnerToEdit) {
      setPartnerToEdit({ ...partnerToEdit, [name]: value });
    } else {
      setNewPartner({ ...newPartner, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (partnerToEdit) {
        // Update existing partner
        const { error } = await supabase
          .from('partner')
          .update({ nome: partnerToEdit.nome })
          .eq('id', partnerToEdit.id);
        
        if (error) throw error;
        
        setSuccess('Partner aggiornato con successo!');
        setPartnerToEdit(null);
      } else {
        // Insert new partner
        const { error } = await supabase
          .from('partner')
          .insert([newPartner]);
        
        if (error) throw error;
        
        setSuccess('Partner aggiunto con successo!');
        setNewPartner({ nome: '' });
      }
      
      // Refresh the list
      fetchPartners();
      
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

  const handleEdit = (partner: Partner) => {
    setPartnerToEdit(partner);
    setNewPartner({ nome: '' });
  };

  const handleCancelEdit = () => {
    setPartnerToEdit(null);
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    setError(null);
    
    try {
      const { error } = await supabase
        .from('partner')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      // Refresh the list
      fetchPartners();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Si è verificato un errore durante l\'eliminazione');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading && partners.length === 0) {
    return (
      <div className="flex justify-center items-center p-4">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Caricamento partner...</span>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Gestione Partner</h2>
      
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
        <div className="flex items-end gap-4">
          <div className="flex-grow">
            <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-1">
              {partnerToEdit ? 'Modifica Partner' : 'Nuovo Partner'}
            </label>
            <input
              type="text"
              id="nome"
              name="nome"
              value={partnerToEdit ? partnerToEdit.nome : newPartner.nome}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nome partner"
            />
          </div>
          
          <div className="flex space-x-2">
            {partnerToEdit && (
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
                  {partnerToEdit ? 'Aggiorna' : 'Salva'}
                </>
              )}
            </button>
          </div>
        </div>
      </form>
      
      <div className="border rounded-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nome Partner
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Azioni
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {partners.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-6 py-4 text-center text-sm text-gray-500">
                  <div className="flex flex-col items-center justify-center py-4">
                    <Users className="w-8 h-8 text-gray-300 mb-2" />
                    <p>Nessun partner trovato</p>
                  </div>
                </td>
              </tr>
            ) : (
              partners.map((partner) => (
                <tr key={partner.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{partner.nome}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => handleEdit(partner)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Modifica partner"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(partner.id)}
                        disabled={deletingId === partner.id}
                        className={`${
                          deletingId === partner.id 
                            ? 'text-gray-400' 
                            : 'text-red-600 hover:text-red-800'
                        }`}
                        title="Elimina partner"
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

export default PartnerManager;