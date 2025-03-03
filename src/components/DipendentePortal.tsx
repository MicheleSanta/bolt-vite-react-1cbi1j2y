import React, { useState } from 'react';
import DipendenteLoginForm from './DipendenteLoginForm';
import DipendenteRendicontazioneManager from './DipendenteRendicontazioneManager';
import { LogOut, User } from 'lucide-react';
import { supabase } from '../lib/supabase';

const DipendentePortal: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [nomeDipendente, setNomeDipendente] = useState('');

  const handleLogin = (nome: string) => {
    setNomeDipendente(nome);
    setIsLoggedIn(true);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setIsLoggedIn(false);
      setNomeDipendente('');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  if (!isLoggedIn) {
    return <DipendenteLoginForm onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-blue-700 text-white shadow-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <User className="w-8 h-8 mr-3" />
              <div>
                <h1 className="text-2xl font-bold">Portale Dipendenti</h1>
                <p className="mt-1 text-blue-100">Sistema di rendicontazione mensile</p>
              </div>
            </div>
            <div className="flex items-center">
              <span className="mr-4 text-sm font-medium">{nomeDipendente}</span>
              <button
                onClick={handleLogout}
                className="flex items-center px-3 py-2 bg-blue-800 rounded-md hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <DipendenteRendicontazioneManager nomeDipendente={nomeDipendente} />
      </main>

      <footer className="bg-gray-800 text-white py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-center text-gray-400">
              &copy; {new Date().getFullYear()} Portale Dipendenti - Rendicontazione
            </p>
            <p className="text-center text-gray-500 mt-2 md:mt-0">
              by M. Santa
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default DipendentePortal;