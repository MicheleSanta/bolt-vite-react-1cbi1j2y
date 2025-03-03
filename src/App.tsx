import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, FileText, Calendar, LogOut, FileBarChart2, FileOutput } from 'lucide-react';
import ClienteForm from './components/ClienteForm';
import ClienteList from './components/ClienteList';
import AffidamentoForm from './components/AffidamentoForm';
import AffidamentoList from './components/AffidamentoList';
import ScadenziarioManager from './components/ScadenziarioManager';
import RendicontazioneManager from './components/RendicontazioneManager';
import ExportFeatures from './components/ExportFeatures';
import { Affidamento, Cliente } from './types/database.types';
import { supabase, checkSession, getUserRole } from './lib/supabase';
import Auth from './components/Auth';
import UserMenu from './components/UserMenu';
import DipendentePortal from './components/DipendentePortal';

function App() {
  const [refreshClientiTrigger, setRefreshClientiTrigger] = useState(0);
  const [refreshAffidamentiTrigger, setRefreshAffidamentiTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState<'clienti' | 'affidamenti' | 'scadenziario' | 'rendicontazione' | 'export'>('clienti');
  const [affidamentoToEdit, setAffidamentoToEdit] = useState<Affidamento | null>(null);
  const [selectedClienteId, setSelectedClienteId] = useState<number | null>(null);
  const [clienteToEdit, setClienteToEdit] = useState<Cliente | null>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    // Check if we're on the employee portal route
    const isEmployeePortal = window.location.pathname === '/dipendenti';

    // Check for existing session
    checkSession().then(async (session) => {
      setSession(session);
      if (session?.user) {
        const role = await getUserRole(session.user.id);
        setUserRole(role);
        
        // Handle routing based on role and current path
        if (role === 'admin' && isEmployeePortal) {
          // Admin trying to access employee portal - redirect to admin dashboard
          window.location.href = '/';
        } else if (role !== 'admin' && !isEmployeePortal) {
          // Non-admin trying to access admin area - redirect to employee portal
          window.location.href = '/dipendenti';
        }
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session?.user) {
        const role = await getUserRole(session.user.id);
        setUserRole(role);
        
        // Handle routing based on role and current path
        if (role === 'admin' && isEmployeePortal) {
          window.location.href = '/';
        } else if (role !== 'admin' && !isEmployeePortal) {
          window.location.href = '/dipendenti';
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleClienteAdded = () => {
    setRefreshClientiTrigger(prev => prev + 1);
  };

  const handleAffidamentoAdded = () => {
    setRefreshAffidamentiTrigger(prev => prev + 1);
  };

  const handleEditAffidamento = (affidamento: Affidamento) => {
    setAffidamentoToEdit(affidamento);
  };

  const handleCancelEdit = () => {
    setAffidamentoToEdit(null);
  };

  const handleViewClienteAffidamenti = (clienteId: number) => {
    setSelectedClienteId(clienteId);
    setActiveTab('affidamenti');
  };

  const handleEditCliente = (cliente: Cliente) => {
    setClienteToEdit(cliente);
    setActiveTab('clienti');
  };

  const handleCancelEditCliente = () => {
    setClienteToEdit(null);
  };

  const handleLogin = () => {
    setSession(true);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUserRole(null);
    window.location.href = window.location.pathname; // Refresh current page
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Check if we're on the employee portal route
  if (window.location.pathname === '/dipendenti') {
    return <DipendentePortal />;
  }

  if (!session) {
    return <Auth onLogin={handleLogin} isEmployeePortal={window.location.pathname === '/dipendenti'} />;
  }

  // If user is not admin and trying to access admin area, redirect
  if (userRole !== 'admin' && window.location.pathname !== '/dipendenti') {
    window.location.href = '/dipendenti';
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-blue-700 text-white shadow-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FileSpreadsheet className="w-8 h-8 mr-3" />
              <div>
                <h1 className="text-2xl font-bold">Gestione Affidamenti</h1>
                <p className="mt-1 text-blue-100">Sistema di gestione clienti per affidamenti</p>
              </div>
            </div>
            <UserMenu 
              userEmail={session.user?.email || 'Utente'} 
              onLogout={handleLogout} 
            />
          </div>
        </div>
      </header>

      <div className="bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap">
            <button
              onClick={() => {
                setActiveTab('clienti');
                setSelectedClienteId(null);
              }}
              className={`px-4 py-3 font-medium flex items-center ${
                activeTab === 'clienti'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Clienti
            </button>
            <button
              onClick={() => setActiveTab('affidamenti')}
              className={`px-4 py-3 font-medium flex items-center ${
                activeTab === 'affidamenti'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <FileText className="w-4 h-4 mr-2" />
              Affidamenti
            </button>
            <button
              onClick={() => setActiveTab('scadenziario')}
              className={`px-4 py-3 font-medium flex items-center ${
                activeTab === 'scadenziario'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Scadenziario
            </button>
            <button
              onClick={() => setActiveTab('rendicontazione')}
              className={`px-4 py-3 font-medium flex items-center ${
                activeTab === 'rendicontazione'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <FileBarChart2 className="w-4 h-4 mr-2" />
              Service Paghe
            </button>
            <button
              onClick={() => setActiveTab('export')}
              className={`px-4 py-3 font-medium flex items-center ${
                activeTab === 'export'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <FileOutput className="w-4 h-4 mr-2" />
              Esportazioni
            </button>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8 flex-grow">
        {activeTab === 'clienti' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <ClienteForm 
                onClienteAdded={handleClienteAdded} 
                clienteToEdit={clienteToEdit}
                onCancelEdit={handleCancelEditCliente}
              />
            </div>
            
            <div className="lg:col-span-2">
              <ClienteList 
                refreshTrigger={refreshClientiTrigger} 
                onViewClienteAffidamenti={handleViewClienteAffidamenti}
                onEditCliente={handleEditCliente}
              />
            </div>
          </div>
        )}

        {activeTab === 'affidamenti' && (
          <div className="space-y-6">
            <AffidamentoForm 
              onAffidamentoAdded={handleAffidamentoAdded} 
              affidamentoToEdit={affidamentoToEdit}
              onCancelEdit={handleCancelEdit}
              preselectedClienteId={selectedClienteId}
            />
            <AffidamentoList 
              refreshTrigger={refreshAffidamentiTrigger} 
              onEditAffidamento={handleEditAffidamento}
              filterClienteId={selectedClienteId}
              onClearClienteFilter={() => setSelectedClienteId(null)}
            />
          </div>
        )}

        {activeTab === 'scadenziario' && (
          <ScadenziarioManager />
        )}

        {activeTab === 'rendicontazione' && (
          <RendicontazioneManager />
        )}

        {activeTab === 'export' && (
          <ExportFeatures />
        )}
      </main>

      <footer className="bg-gray-800 text-white py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-center text-gray-400">
              &copy; {new Date().getFullYear()} Gestione Affidamenti
            </p>
            <p className="text-center text-gray-500 mt-2 md:mt-0">
              by M. Santa
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;