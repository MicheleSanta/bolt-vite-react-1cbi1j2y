import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User, Shield, UserPlus, Loader2, AlertCircle, Check, X, Key, Mail, Phone, FileText, UserCheck } from 'lucide-react';

interface UserData {
  id: string;
  email: string;
  role: string;
  nome: string | null;
  telefono: string | null;
  note: string | null;
  attivo: boolean;
  ultimo_accesso: string | null;
  created_at: string;
}

const UserManager: React.FC = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [userToEdit, setUserToEdit] = useState<UserData | null>(null);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    role: 'user',
    nome: '',
    telefono: '',
    note: '',
    attivo: true
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('users_custom')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      setUsers(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Si è verificato un errore nel caricamento degli utenti');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      if (userToEdit) {
        setUserToEdit({ ...userToEdit, [name]: checked });
      } else {
        setNewUser({ ...newUser, [name]: checked });
      }
    } else {
      if (userToEdit) {
        setUserToEdit({ ...userToEdit, [name]: value });
      } else {
        setNewUser({ ...newUser, [name]: value });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (userToEdit) {
        // Update existing user
        const { error } = await supabase
          .from('users_custom')
          .update({
            role: userToEdit.role,
            nome: userToEdit.nome,
            telefono: userToEdit.telefono,
            note: userToEdit.note,
            attivo: userToEdit.attivo
          })
          .eq('id', userToEdit.id);
        
        if (error) throw error;
        setSuccess('Utente aggiornato con successo!');
        setUserToEdit(null);
      } else {
        // Create new user
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: newUser.email,
          password: newUser.password,
          options: {
            data: {
              role: newUser.role
            }
          }
        });
        
        if (signUpError) throw signUpError;
        
        if (signUpData.user) {
          // Add user to custom table
          const { error: insertError } = await supabase
            .from('users_custom')
            .insert([{
              id: signUpData.user.id,
              email: newUser.email,
              role: newUser.role,
              nome: newUser.nome || null,
              telefono: newUser.telefono || null,
              note: newUser.note || null,
              attivo: newUser.attivo
            }]);
            
          if (insertError) throw insertError;
        }
        
        setSuccess('Utente creato con successo!');
        setNewUser({
          email: '',
          password: '',
          role: 'user',
          nome: '',
          telefono: '',
          note: '',
          attivo: true
        });
      }
      
      // Refresh the list
      fetchUsers();
      
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

  const handleEdit = (user: UserData) => {
    setUserToEdit(user);
  };

  const handleCancelEdit = () => {
    setUserToEdit(null);
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'N/D';
    try {
      return new Date(dateString).toLocaleString('it-IT');
    } catch (e) {
      return 'N/D';
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex justify-center items-center p-4">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Caricamento utenti...</span>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Gestione Utenti</h2>
      
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
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={userToEdit ? userToEdit.email : newUser.email}
              onChange={handleChange}
              required
              readOnly={!!userToEdit}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${userToEdit ? 'bg-gray-50' : ''}`}
            />
          </div>
          
          {!userToEdit && (
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={newUser.password}
                onChange={handleChange}
                required={!userToEdit}
                minLength={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
          
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
              Ruolo
            </label>
            <select
              id="role"
              name="role"
              value={userToEdit ? userToEdit.role : newUser.role}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="user">Utente</option>
              <option value="admin">Amministratore</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-1">
              Nome
            </label>
            <input
              type="text"
              id="nome"
              name="nome"
              value={userToEdit ? userToEdit.nome || '' : newUser.nome}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 mb-1">
              Telefono
            </label>
            <input
              type="tel"
              id="telefono"
              name="telefono"
              value={userToEdit ? userToEdit.telefono || '' : newUser.telefono}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="md:col-span-2">
            <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-1">
              Note
            </label>
            <textarea
              id="note"
              name="note"
              value={userToEdit ? userToEdit.note || '' : newUser.note}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="attivo"
              name="attivo"
              checked={userToEdit ? userToEdit.attivo : newUser.attivo}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="attivo" className="ml-2 block text-sm text-gray-700">
              Utente attivo
            </label>
          </div>
        </div>
        
        <div className="flex justify-end mt-4 space-x-2">
          {userToEdit && (
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
                {userToEdit ? 'Aggiorna' : 'Salva'}
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
                Utente
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ruolo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contatti
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stato
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ultimo Accesso
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Azioni
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                  <div className="flex flex-col items-center justify-center py-4">
                    <User className="w-8 h-8 text-gray-300 mb-2" />
                    <p>Nessun utente trovato</p>
                  </div>
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className={`hover:bg-gray-50 ${!user.attivo ? 'bg-gray-50 text-gray-500' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{user.nome || 'N/D'}</div>
                    <div className="text-xs text-gray-500">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.role === 'admin' 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {user.role === 'admin' ? 'Amministratore' : 'Utente'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 flex items-center">
                      <Phone className="w-4 h-4 mr-1 text-gray-400" />
                      {user.telefono || 'N/D'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.attivo 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.attivo ? 'Attivo' : 'Inattivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{formatDate(user.ultimo_accesso)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(user)}
                      className="text-blue-600 hover:text-blue-800"
                      title="Modifica utente"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
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

export default UserManager;