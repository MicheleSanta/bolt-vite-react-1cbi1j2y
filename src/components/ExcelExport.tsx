import React, { useState } from 'react';
import { Download, Filter, X } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ExcelExportProps {
  data: any[];
  filename: string;
  sheetName?: string;
  buttonText?: string;
  filterOptions?: {
    years: number[];
    months: string[];
  };
}

const ExcelExport: React.FC<ExcelExportProps> = ({
  data,
  filename,
  sheetName = 'Sheet1',
  buttonText = 'Esporta Excel',
  filterOptions
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number | ''>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  
  const exportToExcel = () => {
    // Filter data if filters are applied
    let filteredData = [...data];
    
    if (selectedYear) {
      filteredData = filteredData.filter(item => 
        item.Anno === selectedYear || item.anno === selectedYear
      );
    }
    
    if (selectedMonth) {
      filteredData = filteredData.filter(item => 
        item.Mese === selectedMonth || item.mese === selectedMonth
      );
    }
    
    // Create a new workbook
    const wb = XLSX.utils.book_new();
    
    // Convert JSON to worksheet
    const ws = XLSX.utils.json_to_sheet(filteredData);
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    
    // Generate Excel file and trigger download
    XLSX.writeFile(wb, `${filename}${selectedYear ? `_${selectedYear}` : ''}${selectedMonth ? `_${selectedMonth}` : ''}.xlsx`);
  };
  
  const resetFilters = () => {
    setSelectedYear('');
    setSelectedMonth('');
  };
  
  return (
    <div className="mb-4">
      <div className="flex items-center space-x-2 mb-2">
        <button
          onClick={exportToExcel}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <Download className="w-4 h-4 mr-2" />
          {buttonText}
        </button>
        
        {filterOptions && (
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Filter className="w-4 h-4 mr-2" />
            {showFilters ? 'Nascondi filtri' : 'Filtra esportazione'}
          </button>
        )}
      </div>
      
      {showFilters && filterOptions && (
        <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700">Filtra dati da esportare</h3>
            <button
              onClick={resetFilters}
              className="text-xs text-gray-500 hover:text-gray-700 flex items-center"
            >
              <X className="w-3 h-3 mr-1" />
              Reset
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="exportYear" className="block text-sm font-medium text-gray-700 mb-1">
                Anno
              </label>
              <select
                id="exportYear"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value ? parseInt(e.target.value) : '')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Tutti gli anni</option>
                {filterOptions.years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="exportMonth" className="block text-sm font-medium text-gray-700 mb-1">
                Mese
              </label>
              <select
                id="exportMonth"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Tutti i mesi</option>
                {filterOptions.months.map(month => (
                  <option key={month} value={month}>{month}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="mt-4 text-sm text-gray-500">
            {selectedYear || selectedMonth ? (
              <p>
                Esportazione filtrata per: 
                {selectedYear ? ` Anno ${selectedYear}` : ''}
                {selectedMonth ? ` Mese ${selectedMonth}` : ''}
              </p>
            ) : (
              <p>Nessun filtro applicato. Verranno esportati tutti i dati.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExcelExport;