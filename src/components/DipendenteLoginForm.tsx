import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { User, LogIn, AlertCircle, Check } from 'lucide-react';

interface DipendenteLoginFormProps {
  onLogin: (nomeDipendente: string) => void;
}

const DipendenteLoginForm: React.FC<DipendenteLoginFormProps> = ({ onLogin }) => {
  const [nomeDipendente, setNomeDipendente] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!nomeDipendente.trim()) {
        throw new Error('Inserisci il tuo nome per continuare');
      }
      
      // Check if the employee exists and is active in the tecnico table
      // Using ilike for case-insensitive matching
      const { data, error } = await supabase
        .from('tecnico')
        .select('*')
        .ilike('nome', nomeDipendente.trim())
        .eq('attivo', true);
        
      if (error) throw error;
      
      if (!data || data.length === 0) {
        throw new Error('Dipendente non trovato o non attivo nel sistema');
      }
      
      // Use the exact name from the database to ensure consistency
      onLogin(data[0].nome);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Si è verificato un errore durante il login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <User className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">
            Accesso Dipendenti
          </h1>
          <p className="text-gray-600 mt-1">
            Inserisci il tuo nome per accedere al sistema di rendicontazione
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="nomeDipendente" className="block text-sm font-medium text-gray-700 mb-1">
              Nome e Cognome
            </label>
            <input
              id="nomeDipendente"
              type="text"
              value={nomeDipendente}
              onChange={(e) => setNomeDipendente(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Es. Mario Rossi"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Accesso in corso...
              </span>
            ) : (
              <span className="flex items-center">
                <LogIn className="w-4 h-4 mr-2" />
                Accedi
              </span>
            )}
          </button>
        </form>

        <div className="mt-6 bg-gray-50 p-4 rounded-md border border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Informazioni</h3>
          <p className="text-xs text-gray-600">
            Questo form è per l'accesso dei dipendenti al sistema di rendicontazione mensile dei cedolini.
            Solo i dipendenti attivi nel sistema possono accedere. Se hai problemi di accesso, contatta l'amministratore.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DipendenteLoginForm;