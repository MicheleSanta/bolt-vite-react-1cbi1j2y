import React, { useState, useEffect } from 'react';
import RendicontazioneForm from './RendicontazioneForm';
import RendicontazioneList from './RendicontazioneList';
import { Rendicontazione } from '../types/database.types';
import PartnerManager from './PartnerManager';
import TecnicoManager from './TecnicoManager';
import FasciaManager from './FasciaManager';
import ClienteServicePagheManager from './ClienteServicePagheManager';
import RendicontazioneValidationManager from './RendicontazioneValidationManager';
import { Settings, FileBarChart2, Users, Tag, Building2, CheckSquare } from 'lucide-react';

const RendicontazioneManager: React.FC = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [rendicontazioneToEdit, setRendicontazioneToEdit] = useState<Rendicontazione | null>(null);
  const [showForm, setShowForm] = useState(true);
  const [activeTab, setActiveTab] = useState<'rendicontazioni' | 'validazione' | 'clienti' | 'partner' | 'tecnici' | 'fasce'>('rendicontazioni');

  const handleRendicontazioneAdded = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleEditRendicontazione = (rendicontazione: Rendicontazione) => {
    setRendicontazioneToEdit(rendicontazione);
    setShowForm(true);
    setActiveTab('rendicontazioni');
  };

  const handleCancelEdit = () => {
    setRendicontazioneToEdit(null);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="flex flex-wrap">
          <button
            onClick={() => setActiveTab('rendicontazioni')}
            className={`px-4 py-3 font-medium flex items-center ${
              activeTab === 'rendicontazioni'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <FileBarChart2 className="w-4 h-4 mr-2" />
            Rendicontazioni
          </button>
          <button
            onClick={() => setActiveTab('validazione')}
            className={`px-4 py-3 font-medium flex items-center ${
              activeTab === 'validazione'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <CheckSquare className="w-4 h-4 mr-2" />
            Validazione
          </button>
          <button
            onClick={() => setActiveTab('clienti')}
            className={`px-4 py-3 font-medium flex items-center ${
              activeTab === 'clienti'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Building2 className="w-4 h-4 mr-2" />
            Clienti
          </button>
          <button
            onClick={() => setActiveTab('partner')}
            className={`px-4 py-3 font-medium flex items-center ${
              activeTab === 'partner'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Users className="w-4 h-4 mr-2" />
            Partner
          </button>
          <button
            onClick={() => setActiveTab('tecnici')}
            className={`px-4 py-3 font-medium flex items-center ${
              activeTab === 'tecnici'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Users className="w-4 h-4 mr-2" />
            Tecnici
          </button>
          <button
            onClick={() => setActiveTab('fasce')}
            className={`px-4 py-3 font-medium flex items-center ${
              activeTab === 'fasce'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Tag className="w-4 h-4 mr-2" />
            Fasce
          </button>
        </div>
      </div>
      
      {activeTab === 'rendicontazioni' && (
        <>
          {showForm && (
            <RendicontazioneForm 
              onRendicontazioneAdded={handleRendicontazioneAdded} 
              rendicontazioneToEdit={rendicontazioneToEdit}
              onCancelEdit={handleCancelEdit}
            />
          )}
          
          <RendicontazioneList 
            refreshTrigger={refreshTrigger} 
            onEditRendicontazione={handleEditRendicontazione}
          />
        </>
      )}
      
      {activeTab === 'validazione' && (
        <RendicontazioneValidationManager />
      )}
      
      {activeTab === 'clienti' && (
        <ClienteServicePagheManager />
      )}
      
      {activeTab === 'partner' && (
        <PartnerManager />
      )}
      
      {activeTab === 'tecnici' && (
        <TecnicoManager />
      )}
      
      {activeTab === 'fasce' && (
        <FasciaManager />
      )}
    </div>
  );
};

export default RendicontazioneManager;