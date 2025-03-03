import React from 'react';
import { FileSpreadsheet } from 'lucide-react';
import ClientiExport from './ClientiExport';
import AffidamentiExport from './AffidamentiExport';
import FatturazioneExport from './FatturazioneExport';
import RendicontazioneExport from './RendicontazioneExport';
import ProvvigioniExport from './ProvvigioniExport';
import ClientiServicePagheExport from './ClientiServicePagheExport';
import FasceTariffeExport from './FasceTariffeExport';
import ScadenzeFatturazioneExport from './ScadenzeFatturazioneExport';
import FattureEmesseExport from './FattureEmesseExport';
import AffidamentiScadutiExport from './AffidamentiScadutiExport';
import AnalisiFinanziariaExport from './AnalisiFinanziariaExport';

const ExportFeatures: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center mb-6">
          <FileSpreadsheet className="w-8 h-8 text-green-600 mr-3" />
          <h1 className="text-2xl font-bold">Esportazioni Excel per Analisi Dati</h1>
        </div>
        
        <p className="text-gray-600 mb-8">
          Utilizza queste funzionalità di esportazione per analizzare i dati, migliorare il business e prendere decisioni strategiche.
          Ogni esportazione è ottimizzata per un'area specifica di analisi.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ClientiExport />
          <AffidamentiExport />
          <FatturazioneExport />
          <RendicontazioneExport />
          <ProvvigioniExport />
          <ClientiServicePagheExport />
          <FasceTariffeExport />
          <ScadenzeFatturazioneExport />
          <FattureEmesseExport />
          <AffidamentiScadutiExport />
          <AnalisiFinanziariaExport />
        </div>
      </div>
    </div>
  );
};

export default ExportFeatures;