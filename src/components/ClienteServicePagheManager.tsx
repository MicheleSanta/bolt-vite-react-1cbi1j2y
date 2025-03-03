import React, { useState, useEffect } from 'react';
import ClienteServicePagheForm from './ClienteServicePagheForm';
import ClienteServicePagheList from './ClienteServicePagheList';
import ClienteDocumentiManager from './ClienteDocumentiManager';
import { ClienteServicePaghe } from '../types/database.types';

const ClienteServicePagheManager: React.FC = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [clienteToEdit, setClienteToEdit] = useState<ClienteServicePaghe | null>(null);
  const [showForm, setShowForm] = useState(true);
  const [selectedClienteId, setSelectedClienteId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'form' | 'documenti'>('form');

  const handleClienteAdded = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleEditCliente = (cliente: ClienteServicePaghe) => {
    setClienteToEdit(cliente);
    setSelectedClienteId(cliente.id);
    setShowForm(true);
    setActiveTab('form');
  };

  const handleViewDocumenti = (cliente: ClienteServicePaghe) => {
    setSelectedClienteId(cliente.id);
    setActiveTab('documenti');
  };

  const handleCancelEdit = () => {
    setClienteToEdit(null);
  };

  return (
    <div className="space-y-6">
      {selectedClienteId && activeTab === 'documenti' ? (
        <ClienteDocumentiManager 
          clienteId={selectedClienteId} 
          onBack={() => setActiveTab('form')}
        />
      ) : (
        <>
          {showForm && (
            <ClienteServicePagheForm 
              onClienteAdded={handleClienteAdded} 
              clienteToEdit={clienteToEdit}
              onCancelEdit={handleCancelEdit}
            />
          )}
          
          <ClienteServicePagheList 
            refreshTrigger={refreshTrigger} 
            onEditCliente={handleEditCliente}
            onViewDocumenti={handleViewDocumenti}
          />
        </>
      )}
    </div>
  );
};

export default ClienteServicePagheManager;