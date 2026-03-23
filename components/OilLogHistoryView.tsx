import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { useTranslation } from '../hooks/useTranslation';
import { DownloadIcon, SearchIcon } from './Icons';
import { formatDate, formatTime, parseDate, formatVehicleInfo } from '../utils/formatters';
import * as XLSX from 'xlsx';

interface OilLogHistoryViewProps {
  selectedVehicleId?: string;
}

export const OilLogHistoryView: React.FC<OilLogHistoryViewProps> = ({ selectedVehicleId }) => {
  const { t } = useTranslation();
  const { oilLogs, vehicles } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('');
  const [oilTypeFilter, setOilTypeFilter] = useState('');
  const [filterTypeFilter, setFilterTypeFilter] = useState('');

  const filteredLogs = oilLogs.filter(log => {
    if (selectedVehicleId && log.vehicleId !== selectedVehicleId) return false;
    
    const vehicle = vehicles.find(v => v.id === log.vehicleId);
    const vehicleInfo = vehicle ? `${vehicle.vehicleCompanyNumber || ''} ${vehicle.vehicleNumber || ''}`.toLowerCase() : '';
    
    if (vehicleFilter && String(log.vehicleId) !== vehicleFilter) return false;
    if (oilTypeFilter && !log.oilTypes?.some(ot => ot.toLowerCase().includes(oilTypeFilter.toLowerCase()))) return false;
    if (filterTypeFilter && !log.filters?.some(f => f.toLowerCase().includes(filterTypeFilter.toLowerCase()))) return false;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!vehicleInfo.includes(query) && !log.driverName?.toLowerCase().includes(query)) return false;
    }
    
    return true;
  }).sort((a, b) => parseDate(b.date).getTime() - parseDate(a.date).getTime());

  // Debug: Check for duplicate IDs
  useEffect(() => {
    const ids = filteredLogs.map(l => l.id);
    const uniqueIds = new Set(ids);
    if (ids.length !== uniqueIds.size) {
      console.error("Duplicate log IDs found:", ids.filter((id, index) => ids.indexOf(id) !== index));
    }
  }, [filteredLogs]);

  const handleDownloadExcel = () => {
    const data = filteredLogs.map(log => {
      const vehicle = vehicles.find(v => v.id === log.vehicleId);
      return {
        [t('date')]: log.date,
        [t('vehicle')]: vehicle ? `${t(vehicle.vehiclesType)} ${vehicle.vehicleCompanyNumber || ''}-${vehicle.vehicleNumber || ''}` : '',
        [t('driver')]: log.driverName,
        [t('mileage')]: log.mileage,
        [t('oilTypes')]: log.oilTypes?.join(', ') || '',
        [t('filters')]: log.filters?.join(', ') || ''
      };
    });
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'OilLogs');
    XLSX.writeFile(workbook, 'OilLogHistory.xlsx');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">{t('oilLogHistory')}</h2>
        <button
          onClick={handleDownloadExcel}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
        >
          <DownloadIcon className="h-5 w-5" />
          {t('downloadExcel')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="relative">
          <input
            type="text"
            placeholder={t('search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
          />
          <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        </div>
        <select value={vehicleFilter} onChange={(e) => setVehicleFilter(e.target.value)} className="p-2 border rounded-lg text-sm">
          <option value="">{t('all')}</option>
          {vehicles.map(v => <option key={v.id} value={v.id}>{formatVehicleInfo(v, t, v.id)}</option>)}
        </select>
        <select value={oilTypeFilter} onChange={(e) => setOilTypeFilter(e.target.value)} className="p-2 border rounded-lg text-sm">
          <option value="">{t('all')}</option>
          <option value="engineOil">{t('oilLog_engineOil')}</option>
          <option value="gearOil">{t('oilLog_gearOil')}</option>
          <option value="deffranceOil">{t('oilLog_deffranceOil')}</option>
          <option value="greasing">{t('oilLog_greasing')}</option>
          <option value="noOil">{t('oilLog_noOil')}</option>
        </select>
        <select value={filterTypeFilter} onChange={(e) => setFilterTypeFilter(e.target.value)} className="p-2 border rounded-lg text-sm">
          <option value="">{t('all')}</option>
          <option value="airFilter">{t('oilLog_airFilter')}</option>
          <option value="dieselFilter">{t('oilLog_dieselFilter')}</option>
          <option value="oilFilter">{t('oilLog_oilFilter')}</option>
          <option value="gearOilFilter">{t('oilLog_gearOilFilter')}</option>
          <option value="hydraulicFilter">{t('oilLog_hydraulicFilter')}</option>
        </select>
        <button
          onClick={() => {
            setSearchQuery('');
            setVehicleFilter('');
            setOilTypeFilter('');
            setFilterTypeFilter('');
          }}
          className="p-2 border rounded-lg text-sm bg-gray-100 hover:bg-gray-200"
        >
          {t('resetFilters')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredLogs.length > 0 ? (
          filteredLogs
            .map((log, index) => {
              const vehicle = vehicles.find(v => v.id === log.vehicleId);
              return (
                <div key={`${log.id}-${index}`} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="font-bold text-green-600">
                        {vehicle ? (
                          `${t(vehicle.vehiclesType)} ${vehicle.vehicleCompanyNumber ? `${vehicle.vehicleCompanyNumber}-` : ''}${vehicle.vehicleNumber}`
                        ) : 'Unknown Vehicle'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDate(log.date)}
                        {formatDate(log.date) && formatTime(log.time) && ' at '}
                        {formatTime(log.time)}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 font-medium">{t('driver')}</p>
                      <p className="font-bold">{log.driverName}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-medium">{t('mileage')}</p>
                      <p className="font-bold">{log.mileage}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-gray-500 font-medium mb-1">{t('oilTypes')}</p>
                      <div className="flex flex-wrap gap-2">
                        {(Array.isArray(log.oilTypes) ? log.oilTypes : []).map((ot, i) => (
                          <span key={i} className="bg-green-50 text-green-700 text-xs px-2 py-1 rounded font-bold border border-green-100">
                            {t(`oilLog_${ot}` as any) !== `oilLog_${ot}` ? t(`oilLog_${ot}` as any) : ot}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <p className="text-gray-500 font-medium mb-1">{t('filters')}</p>
                      <div className="flex flex-wrap gap-2">
                        {(Array.isArray(log.filters) ? log.filters : []).map((f, i) => (
                          <span key={i} className="bg-gray-50 text-gray-700 text-xs px-2 py-1 rounded font-bold border border-gray-100">
                            {t(`oilLog_${f}` as any) !== `oilLog_${f}` ? t(`oilLog_${f}` as any) : f}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
        ) : (
          <div className="col-span-2 text-center py-10 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
            <p className="text-gray-500">{t('noOilLogsFound') || 'No oil logs found.'}</p>
          </div>
        )}
      </div>
    </div>
  );
};
