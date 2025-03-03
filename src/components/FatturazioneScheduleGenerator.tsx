import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { FatturazioneInsert } from '../types/database.types';
import { Calendar, Check, Clock, Loader2, Save, X } from 'lucide-react';
import FullscreenButton from './FullscreenButton';

interface FatturazioneScheduleGeneratorProps {
  affidamentoId: number;
  affidamentoTotale: number;
  onScheduleGenerated: () => void;
  onCancel: () => void;
}

type ScheduleType = 'mensile' | 'trimestrale' | 'quadrimestrale' | 'semestrale' | 'annuale' | 'personalizzato';

interface ScheduleItem {
  data_scadenza: string;
  percentuale: number;
  importo: number;
}

const FatturazioneScheduleGenerator: React.FC<FatturazioneScheduleGeneratorProps> = ({
  affidamentoId,
  affidamentoTotale,
  onScheduleGenerated,
  onCancel
}) => {
  const [scheduleType, setScheduleType] = useState<ScheduleType>('mensile');
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [numRates, setNumRates] = useState<number>(12);
  const [equalRates, setEqualRates] = useState<boolean>(true);
  const [customRates, setCustomRates] = useState<ScheduleItem[]>([]);
  const [generatedSchedule, setGeneratedSchedule] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Initialize custom rates when schedule type changes
  useEffect(() => {
    if (scheduleType === 'personalizzato') {
      try {
        // Initialize with 2 custom rates
        const startDateObj = new Date(startDate);
        if (isNaN(startDateObj.getTime())) {
          throw new Error("Data di inizio non valida");
        }
        
        const nextMonthDate = new Date(startDateObj);
        nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
        
        const initialRates = [
          {
            data_scadenza: startDate,
            percentuale: 50,
            importo: affidamentoTotale * 0.5
          },
          {
            data_scadenza: nextMonthDate.toISOString().split('T')[0],
            percentuale: 50,
            importo: affidamentoTotale * 0.5
          }
        ];
        setCustomRates(initialRates);
        setGeneratedSchedule(initialRates);
      } catch (err) {
        setError("Errore nell'inizializzazione delle rate personalizzate. Verifica la data di inizio.");
        console.error(err);
      }
    } else {
      generateSchedule();
    }
  }, [scheduleType, startDate]);

  // Generate schedule when parameters change
  useEffect(() => {
    if (scheduleType !== 'personalizzato') {
      generateSchedule();
    }
  }, [scheduleType, startDate, numRates, equalRates]);

  const generateSchedule = () => {
    setLoading(true);
    setError(null);

    try {
      const schedule: ScheduleItem[] = [];
      const startDateObj = new Date(startDate);
      
      // Validate start date
      if (isNaN(startDateObj.getTime())) {
        throw new Error("Data di inizio non valida");
      }
      
      let ratePercentage: number;
      let rateAmount: number;

      if (equalRates) {
        // Equal distribution of percentages and amounts
        ratePercentage = 100 / numRates;
        rateAmount = affidamentoTotale / numRates;
      }

      for (let i = 0; i < numRates; i++) {
        const dateObj = new Date(startDateObj);
        
        // Calculate date based on schedule type
        switch (scheduleType) {
          case 'mensile':
            dateObj.setMonth(dateObj.getMonth() + i);
            break;
          case 'trimestrale':
            dateObj.setMonth(dateObj.getMonth() + (i * 3));
            break;
          case 'quadrimestrale':
            dateObj.setMonth(dateObj.getMonth() + (i * 4));
            break;
          case 'semestrale':
            dateObj.setMonth(dateObj.getMonth() + (i * 6));
            break;
          case 'annuale':
            dateObj.setFullYear(dateObj.getFullYear() + i);
            break;
        }

        if (equalRates) {
          schedule.push({
            data_scadenza: dateObj.toISOString().split('T')[0],
            percentuale: parseFloat(ratePercentage.toFixed(2)),
            importo: parseFloat(rateAmount.toFixed(2))
          });
        } else {
          // For non-equal rates, we'll implement a different distribution
          // For example, increasing percentages
          const percentage = ((i + 1) * 2 * 100) / (numRates * (numRates + 1));
          const amount = (percentage / 100) * affidamentoTotale;
          
          schedule.push({
            data_scadenza: dateObj.toISOString().split('T')[0],
            percentuale: parseFloat(percentage.toFixed(2)),
            importo: parseFloat(amount.toFixed(2))
          });
        }
      }

      // Adjust the last rate to ensure total is exactly 100%
      if (equalRates && schedule.length > 0) {
        const totalPercentage = schedule.reduce((sum, item) => sum + item.percentuale, 0);
        const totalAmount = schedule.reduce((sum, item) => sum + item.importo, 0);
        
        if (totalPercentage !== 100 || Math.abs(totalAmount - affidamentoTotale) > 0.01) {
          const lastItem = schedule[schedule.length - 1];
          lastItem.percentuale = parseFloat((lastItem.percentuale + (100 - totalPercentage)).toFixed(2));
          lastItem.importo = parseFloat((lastItem.importo + (affidamentoTotale - totalAmount)).toFixed(2));
        }
      }

      setGeneratedSchedule(schedule);
    } catch (err) {
      setError('Errore nella generazione del piano rate: ' + (err instanceof Error ? err.message : 'Errore sconosciuto'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomRate = () => {
    try {
      if (customRates.length === 0) {
        // If no rates exist, add one with today's date
        setCustomRates([
          {
            data_scadenza: new Date().toISOString().split('T')[0],
            percentuale: 100,
            importo: affidamentoTotale
          }
        ]);
      } else {
        // Add a new rate with date one month after the last one
        const lastDate = new Date(customRates[customRates.length - 1].data_scadenza);
        
        // Validate last date
        if (isNaN(lastDate.getTime())) {
          throw new Error("Data dell'ultima rata non valida");
        }
        
        const newDate = new Date(lastDate);
        newDate.setMonth(newDate.getMonth() + 1);
        
        // Calculate remaining percentage and amount
        const totalPercentage = customRates.reduce((sum, rate) => sum + rate.percentuale, 0);
        const remainingPercentage = Math.max(0, 100 - totalPercentage);
        const remainingAmount = Math.max(0, affidamentoTotale - customRates.reduce((sum, rate) => sum + rate.importo, 0));
        
        setCustomRates([
          ...customRates,
          {
            data_scadenza: newDate.toISOString().split('T')[0],
            percentuale: remainingPercentage,
            importo: remainingAmount
          }
        ]);
      }
    } catch (err) {
      setError("Errore nell'aggiunta di una nuova rata: " + (err instanceof Error ? err.message : 'Errore sconosciuto'));
      console.error(err);
    }
  };

  const handleRemoveCustomRate = (index: number) => {
    const updatedRates = [...customRates];
    updatedRates.splice(index, 1);
    setCustomRates(updatedRates);
    
    // Recalculate percentages to ensure they sum to 100%
    if (updatedRates.length > 0) {
      const totalPercentage = updatedRates.reduce((sum, rate) => sum + rate.percentuale, 0);
      if (totalPercentage < 100) {
        // Distribute remaining percentage to the last rate
        const lastIndex = updatedRates.length - 1;
        updatedRates[lastIndex].percentuale += (100 - totalPercentage);
        updatedRates[lastIndex].importo = (updatedRates[lastIndex].percentuale / 100) * affidamentoTotale;
      }
    }
    
    setGeneratedSchedule(updatedRates);
  };

  const handleCustomRateChange = (index: number, field: keyof ScheduleItem, value: string | number) => {
    const updatedRates = [...customRates];
    
    if (field === 'data_scadenza') {
      updatedRates[index].data_scadenza = value as string;
    } else if (field === 'percentuale') {
      const newPercentage = parseFloat(value as string) || 0;
      updatedRates[index].percentuale = newPercentage;
      updatedRates[index].importo = (newPercentage / 100) * affidamentoTotale;
    } else if (field === 'importo') {
      const newImporto = parseFloat(value as string) || 0;
      updatedRates[index].importo = newImporto;
      updatedRates[index].percentuale = (newImporto / affidamentoTotale) * 100;
    }
    
    setCustomRates(updatedRates);
    setGeneratedSchedule(updatedRates);
  };

  const saveSchedule = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Validate that all dates are valid and not empty
      for (const item of generatedSchedule) {
        if (!item.data_scadenza) {
          throw new Error("Tutte le date di scadenza devono essere specificate");
        }
        
        // Validate date format
        const dateObj = new Date(item.data_scadenza);
        if (isNaN(dateObj.getTime())) {
          throw new Error(`Data non valida: ${item.data_scadenza}`);
        }
      }
      
      // Prepare data for insertion
      const fatturazioni: FatturazioneInsert[] = generatedSchedule.map(item => ({
        affidamento_id: affidamentoId,
        percentuale: item.percentuale,
        importo: item.importo,
        data_scadenza: item.data_scadenza,
        stato: 'Da emettere'
      }));
      
      // Insert all records
      const { error } = await supabase.from('fatturazione').insert(fatturazioni);
      
      if (error) throw error;
      
      setSuccess('Piano rate salvato con successo!');
      
      // Notify parent component
      setTimeout(() => {
        onScheduleGenerated();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Si è verificato un errore durante il salvataggio');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('it-IT');
    } catch (e) {
      return dateString;
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className={`bg-white p-6 rounded-lg shadow-md mb-6 ${isFullscreen ? 'fixed inset-0 z-50 overflow-y-auto' : ''}`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Generatore Piano Rate</h2>
        <div className="flex items-center space-x-2">
          <FullscreenButton 
            isFullscreen={isFullscreen} 
            onClick={toggleFullscreen} 
          />
          <button 
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 flex items-center">
          <Check className="w-5 h-5 mr-2" />
          {success}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="bg-gray-50 p-4 rounded-md mb-4">
            <h3 className="text-md font-medium text-gray-700 mb-3">Parametri di Generazione</h3>
            
            <div className="mb-4">
              <label htmlFor="scheduleType" className="block text-sm font-medium text-gray-700 mb-1">
                Tipo di Piano Rate
              </label>
              <select
                id="scheduleType"
                value={scheduleType}
                onChange={(e) => setScheduleType(e.target.value as ScheduleType)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="mensile">Mensile</option>
                <option value="trimestrale">Trimestrale</option>
                <option value="quadrimestrale">Quadrimestrale</option>
                <option value="semestrale">Semestrale</option>
                <option value="annuale">Annuale</option>
                <option value="personalizzato">Personalizzato</option>
              </select>
            </div>
            
            <div className="mb-4">
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                Data Prima Rata
              </label>
              <input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            {scheduleType !== 'personalizzato' && (
              <>
                <div className="mb-4">
                  <label htmlFor="numRates" className="block text-sm font-medium text-gray-700 mb-1">
                    Numero di Rate
                  </label>
                  <input
                    type="number"
                    id="numRates"
                    value={numRates}
                    onChange={(e) => setNumRates(parseInt(e.target.value) || 1)}
                    min="1"
                    max="60"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="mb-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="equalRates"
                      checked={equalRates}
                      onChange={(e) => setEqualRates(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="equalRates" className="ml-2 block text-sm text-gray-700">
                      Rate di importo uguale
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {equalRates 
                      ? "Le rate avranno tutte lo stesso importo" 
                      : "Le rate avranno importi crescenti"}
                  </p>
                </div>
              </>
            )}
            
            {scheduleType === 'personalizzato' && (
              <div className="mb-4">
                <button
                  type="button"
                  onClick={handleAddCustomRate}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Aggiungi Rata
                </button>
                
                <div className="mt-3 space-y-3">
                  {customRates.map((rate, index) => (
                    <div key={index} className="flex items-center space-x-2 p-2 border border-gray-200 rounded-md">
                      <div className="flex-grow grid grid-cols-3 gap-2">
                        <input
                          type="date"
                          value={rate.data_scadenza}
                          onChange={(e) => handleCustomRateChange(index, 'data_scadenza', e.target.value)}
                          className="px-2 py-1 border border-gray-300 rounded-md text-sm"
                        />
                        <div className="relative">
                          <input
                            type="number"
                            value={rate.percentuale}
                            onChange={(e) => handleCustomRateChange(index, 'percentuale', e.target.value)}
                            min="0"
                            max="100"
                            step="0.01"
                            className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm pr-6"
                          />
                          <span className="absolute right-2 top-1 text-gray-500 text-sm">%</span>
                        </div>
                        <input
                          type="number"
                          value={rate.importo.toFixed(2)}
                          onChange={(e) => handleCustomRateChange(index, 'importo', e.target.value)}
                          min="0"
                          step="0.01"
                          className="px-2 py-1 border border-gray-300 rounded-md text-sm"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomRate(index)}
                        disabled={customRates.length <= 1}
                        className={`p-1 rounded-full ${
                          customRates.length <= 1 
                            ? 'text-gray-300 cursor-not-allowed' 
                            : 'text-red-500 hover:bg-red-50'
                        }`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="bg-blue-50 p-4 rounded-md">
            <h3 className="text-md font-medium text-blue-700 mb-2">Riepilogo</h3>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-sm text-blue-600">Importo Totale:</p>
                <p className="font-medium">{formatCurrency(affidamentoTotale)}</p>
              </div>
              <div>
                <p className="text-sm text-blue-600">Numero Rate:</p>
                <p className="font-medium">{generatedSchedule.length}</p>
              </div>
              <div>
                <p className="text-sm text-blue-600">Tipo Piano:</p>
                <p className="font-medium capitalize">{scheduleType}</p>
              </div>
              <div>
                <p className="text-sm text-blue-600">Prima Rata:</p>
                <p className="font-medium">{formatDate(startDate)}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div>
          <div className="bg-white border border-gray-200 rounded-md">
            <div className="p-3 border-b bg-gray-50">
              <h3 className="font-medium text-gray-700 flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                Anteprima Piano Rate
              </h3>
            </div>
            
            {loading ? (
              <div className="p-4 flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              </div>
            ) : generatedSchedule.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                Nessuna rata generata
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        #
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data Scadenza
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Percentuale
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Importo
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {generatedSchedule.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                          {index + 1}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(item.data_scadenza)}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                          {item.percentuale.toFixed(2)}%
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(item.importo)}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50">
                      <td colSpan={2} className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                        Totale
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                        {generatedSchedule.reduce((sum, item) => sum + item.percentuale, 0).toFixed(2)}%
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(generatedSchedule.reduce((sum, item) => sum + item.importo, 0))}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
          <div className="mt-4 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Annulla
            </button>
            <button
              type="button"
              onClick={saveSchedule}
              disabled={saving || generatedSchedule.length === 0}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-300"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvataggio...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salva Piano Rate
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FatturazioneScheduleGenerator;