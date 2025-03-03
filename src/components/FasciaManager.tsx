import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Fascia, FasciaInsert } from '../types/database.types';
import { Save, Loader2, Edit, Trash2, AlertCircle, Check, X, Tag, Info, Clock, Copy, Calendar, Calculator } from 'lucide-react';

const FasciaManager: React.FC = () => {
  const [fasce, setFasce] = useState<Fascia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fasciaToEdit, setFasciaToEdit] = useState<Fascia | null>(null);
  const [newFascia, setNewFascia] = useState<FasciaInsert>({ 
    nome: '', 
    tariffa: 0,
    descrizione: '',
    min_cedolini: 1,
    max_cedolini: 10,
    ore: 1,
    anno: new Date().getFullYear()
  });
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<number | null>(null);
  const [filterAnno, setFilterAnno] = useState<number | ''>('');
  const [showCalculator, setShowCalculator] = useState(false);
  const [calculatorValues, setCalculatorValues] = useState({
    tariffa: 0,
    ore: 1,
    risultato: 0
  });

  useEffect(() => {
    fetchFasce();
  }, []);

  const fetchFasce = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let query = supabase
        .from('fascia')
        .select('*');
        
      // Apply year filter if selected
      if (filterAnno !== '') {
        query = query.eq('anno', filterAnno);
      }
      
      const { data, error } = await query.order('anno', { ascending: false }).order('nome', { ascending: true });
        
      if (error) throw error;
      
      setFasce(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Si è verificato un errore nel caricamento delle fasce');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    
    // Handle numeric values
    if (['tariffa', 'min_cedolini', 'max_cedolini', 'ore', 'anno'].includes(name)) {
      const numericValue = parseFloat(value) || 0;
      
      if (fasciaToEdit) {
        setFasciaToEdit({ ...fasciaToEdit, [name]: numericValue });
      } else {
        setNewFascia({ ...newFascia, [name]: numericValue });
      }
    } else {
      if (fasciaToEdit) {
        setFasciaToEdit({ ...fasciaToEdit, [name]: value });
      } else {
        setNewFascia({ ...newFascia, [name]: value });
      }
    }
  };

  const handleCalculatorChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    const numericValue = parseFloat(value) || 0;
    
    setCalculatorValues(prev => {
      const newValues = { ...prev, [name]: numericValue };
      // Calculate result - only multiply tariffa by ore
      newValues.risultato = newValues.tariffa * newValues.ore;
      return newValues;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (fasciaToEdit) {
        // Update existing fascia
        const { error } = await supabase
          .from('fascia')
          .update({
            nome: fasciaToEdit.nome,
            tariffa: fasciaToEdit.tariffa,
            descrizione: fasciaToEdit.descrizione,
            min_cedolini: fasciaToEdit.min_cedolini,
            max_cedolini: fasciaToEdit.max_cedolini,
            ore: fasciaToEdit.ore,
            anno: fasciaToEdit.anno
          })
          .eq('id', fasciaToEdit.id);
        
        if (error) throw error;
        
        setSuccess('Fascia aggiornata con successo!');
        setFasciaToEdit(null);
      } else {
        // Insert new fascia
        const { error } = await supabase
          .from('fascia')
          .insert([newFascia]);
        
        if (error) throw error;
        
        setSuccess('Fascia aggiunta con successo!');
        setNewFascia({ 
          nome: '', 
          tariffa: 0,
          descrizione: '',
          min_cedolini: 1,
          max_cedolini: 10,
          ore: 1,
          anno: new Date().getFullYear()
        });
      }
      
      // Refresh the list
      fetchFasce();
      
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

  const handleEdit = (fascia: Fascia) => {
    setFasciaToEdit(fascia);
    setNewFascia({ 
      nome: '', 
      tariffa: 0,
      descrizione: '',
      min_cedolini: 1,
      max_cedolini: 10,
      ore: 1,
      anno: new Date().getFullYear()
    });
  };

  const handleCancelEdit = () => {
    setFasciaToEdit(null);
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    setError(null);
    
    try {
      const { error } = await supabase
        .from('fascia')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      // Refresh the list
      fetchFasce();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Si è verificato un errore durante l\'eliminazione');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDuplicate = async (fascia: Fascia) => {
    setDuplicatingId(fascia.id);
    setError(null);
    
    try {
      // Create a new fascia object without id and created_at
      const newFasciaData: FasciaInsert = {
        // Generate a unique name by adding a suffix to avoid unique constraint violation
        nome: `${fascia.nome}_${new Date().getFullYear()}`,
        tariffa: fascia.tariffa,
        descrizione: fascia.descrizione ? `${fascia.descrizione} (Duplicato)` : 'Duplicato',
        min_cedolini: fascia.min_cedolini,
        max_cedolini: fascia.max_cedolini,
        ore: fascia.ore,
        anno: new Date().getFullYear() // Set to current year by default
      };
      
      // Insert the new fascia
      const { error } = await supabase
        .from('fascia')
        .insert([newFasciaData]);
      
      if (error) throw error;
      
      setSuccess('Fascia duplicata con successo!');
      
      // Refresh the list
      fetchFasce();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Si è verificato un errore durante la duplicazione');
    } finally {
      setDuplicatingId(null);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value);
  };

  const getUniqueYears = () => {
    const years = [...new Set(fasce.map(f => f.anno).filter(Boolean))];
    return years.sort((a, b) => b - a); // Sort descending
  };

  const calculateTotalTariffa = (fascia: Fascia): number => {
    return fascia.tariffa * (fascia.ore || 1);
  };

  if (loading && fasce.length === 0) {
    return (
      <div className="flex justify-center items-center p-4">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Caricamento fasce...</span>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Gestione Fasce e Tariffe</h2>
      
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
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          <div>
            <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-1">
              Nome Fascia
            </label>
            <input
              type="text"
              id="nome"
              name="nome"
              value={fasciaToEdit ? fasciaToEdit.nome : newFascia.nome}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Es. A, B, C, ecc."
            />
          </div>
          
          <div>
            <label htmlFor="anno" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              Anno
            </label>
            <input
              type="number"
              id="anno"
              name="anno"
              value={fasciaToEdit ? fasciaToEdit.anno || new Date().getFullYear() : newFascia.anno}
              onChange={handleChange}
              required
              min="2000"
              max="2100"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label htmlFor="tariffa" className="block text-sm font-medium text-gray-700 mb-1">
              Tariffa (€)
            </label>
            <input
              type="number"
              id="tariffa"
              name="tariffa"
              value={fasciaToEdit ? fasciaToEdit.tariffa : newFascia.tariffa}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
            />
          </div>
          
          <div>
            <label htmlFor="ore" className="block text-sm font-medium text-gray-700 mb-1">
              Ore
            </label>
            <input
              type="number"
              id="ore"
              name="ore"
              value={fasciaToEdit ? fasciaToEdit.ore || 1 : newFascia.ore}
              onChange={handleChange}
              required
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="1"
            />
          </div>
          
          <div>
            <label htmlFor="min_cedolini" className="block text-sm font-medium text-gray-700 mb-1">
              Min Cedolini
            </label>
            <input
              type="number"
              id="min_cedolini"
              name="min_cedolini"
              value={fasciaToEdit ? fasciaToEdit.min_cedolini : newFascia.min_cedolini}
              onChange={handleChange}
              required
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="1"
            />
          </div>
          
          <div>
            <label htmlFor="max_cedolini" className="block text-sm font-medium text-gray-700 mb-1">
              Max Cedolini
            </label>
            <input
              type="number"
              id="max_cedolini"
              name="max_cedolini"
              value={fasciaToEdit ? fasciaToEdit.max_cedolini : newFascia.max_cedolini}
              onChange={handleChange}
              required
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="10"
            />
          </div>
          
          <div>
            <label htmlFor="descrizione" className="block text-sm font-medium text-gray-700 mb-1">
              Descrizione
            </label>
            <input
              type="text"
              id="descrizione"
              name="descrizione"
              value={fasciaToEdit ? fasciaToEdit.descrizione || '' : newFascia.descrizione || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Descrizione opzionale"
            />
          </div>
        </div>
        
        <div className="flex justify-end mt-4 space-x-2">
          {fasciaToEdit && (
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
                {fasciaToEdit ? 'Aggiorna' : 'Salva'}
              </>
            )}
          </button>
        </div>
      </form>
      
      {/* Calculator */}
      <div className="mb-6">
        <button
          type="button"
          onClick={() => setShowCalculator(!showCalculator)}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-2"
        >
          <Calculator className="w-4 h-4 mr-2" />
          {showCalculator ? 'Nascondi calcolatore' : 'Mostra calcolatore tariffa'}
        </button>
        
        {showCalculator && (
          <div className="p-4 bg-blue-50 rounded-md border border-blue-200">
            <h3 className="text-md font-medium text-blue-700 mb-3">Calcolatore Tariffa</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="calc_tariffa" className="block text-sm font-medium text-gray-700 mb-1">
                  Tariffa (€)
                </label>
                <input
                  type="number"
                  id="calc_tariffa"
                  name="tariffa"
                  value={calculatorValues.tariffa}
                  onChange={handleCalculatorChange}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="calc_ore" className="block text-sm font-medium text-gray-700 mb-1">
                  Ore
                </label>
                <input
                  type="number"
                  id="calc_ore"
                  name="ore"
                  value={calculatorValues.ore}
                  onChange={handleCalculatorChange}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="calc_risultato" className="block text-sm font-medium text-gray-700 mb-1">
                  Risultato
                </label>
                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white font-medium">
                  {formatCurrency(calculatorValues.risultato)}
                </div>
              </div>
            </div>
            
            <div className="mt-3 text-sm text-blue-700">
              <p>Formula: Tariffa × Ore = Importo Totale</p>
              <p className="mt-1">
                {formatCurrency(calculatorValues.tariffa)} × {calculatorValues.ore} ore = {formatCurrency(calculatorValues.risultato)}
              </p>
            </div>
          </div>
        )}
      </div>
      
      {/* Filter by year */}
      <div className="mb-4 flex items-center space-x-4">
        <div className="w-64">
          <label htmlFor="filterAnno" className="block text-sm font-medium text-gray-700 mb-1">
            Filtra per anno
          </label>
          <select
            id="filterAnno"
            value={filterAnno}
            onChange={(e) => setFilterAnno(e.target.value ? parseInt(e.target.value) : '')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Tutti gli anni</option>
            {getUniqueYears().map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
        
        <button
          onClick={() => {
            setFilterAnno('');
            fetchFasce();
          }}
          className="mt-6 px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm"
        >
          Reimposta filtri
        </button>
      </div>
      
      <div className="border rounded-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fascia
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Anno
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tariffa
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ore
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tariffa Totale
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Range Cedolini
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Descrizione
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Azioni
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {fasce.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
                  <div className="flex flex-col items-center justify-center py-4">
                    <Tag className="w-8 h-8 text-gray-300 mb-2" />
                    <p>Nessuna fascia trovata</p>
                  </div>
                </td>
              </tr>
            ) : (
              fasce.map((fascia) => (
                <tr key={fascia.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">Fascia {fascia.nome}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{fascia.anno || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{formatCurrency(fascia.tariffa)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 flex items-center">
                      <Clock className="w-4 h-4 mr-1 text-blue-500" />
                      {fascia.ore || 1} {fascia.ore === 1 ? 'ora' : 'ore'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-blue-600">
                      {formatCurrency(calculateTotalTariffa(fascia))}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatCurrency(fascia.tariffa)} × {fascia.ore || 1} ore
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {fascia.min_cedolini || 1} - {fascia.max_cedolini || '∞'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{fascia.descrizione || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => handleEdit(fascia)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Modifica fascia"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDuplicate(fascia)}
                        disabled={duplicatingId === fascia.id}
                        className={`${
                          duplicatingId === fascia.id 
                            ? 'text-gray-400' 
                            : 'text-green-600 hover:text-green-800'
                        }`}
                        title="Duplica fascia"
                      >
                        {duplicatingId === fascia.id ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Copy className="w-5 h-5" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(fascia.id)}
                        disabled={deletingId === fascia.id}
                        className={`${
                          deletingId === fascia.id 
                            ? 'text-gray-400' 
                            : 'text-red-600 hover:text-red-800'
                        }`}
                        title="Elimina fascia"
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

export default FasciaManager;