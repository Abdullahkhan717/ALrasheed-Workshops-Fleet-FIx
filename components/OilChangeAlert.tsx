import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { useData } from '../context/DataContext';
import { useTranslation } from '../hooks/useTranslation';
import { formatVehicleInfo } from '../utils/formatters';
import { TruckIcon, CalendarIcon, MapPinIcon, UserIcon, DownloadIcon, SearchIcon } from './Icons';
import { formatDate, parseDate } from '../utils/formatters';

interface OilChangeAlertProps {
  onVehicleClick?: (vehicleId: string) => void;
}

export const OilChangeAlert: React.FC<OilChangeAlertProps> = ({ onVehicleClick }) => {
  const { oilLogs, vehicles } = useData();
  const { t } = useTranslation();

  const [locationFilter, setLocationFilter] = useState('');
  const [conditionFilter, setConditionFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const now = new Date();
  const tenDaysAgo = new Date();
  tenDaysAgo.setDate(now.getDate() - 10);

  // For each vehicle, find its latest oil log
  const overdueVehicles = vehicles.map(vehicle => {
    const vehicleLogs = oilLogs.filter(log => log.vehicleId === vehicle.id);
    const latestLog = vehicleLogs.length > 0 
      ? [...vehicleLogs].sort((a, b) => parseDate(b.date).getTime() - parseDate(a.date).getTime())[0]
      : null;
    
    let daysSince = Infinity;
    if (latestLog) {
      const logDate = parseDate(latestLog.date);
      if (!isNaN(logDate.getTime())) {
        const diffTime = Math.abs(now.getTime() - logDate.getTime());
        daysSince = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }
    }

    return { vehicle, latestLog, daysSince };
  }).filter(item => item.daysSince > 10);

  // Apply filters
  const filteredOverdue = overdueVehicles.filter(({ vehicle }) => {
    const matchesLocation = locationFilter ? vehicle.branchLocation === locationFilter : true;
    const matchesCondition = conditionFilter ? vehicle.condition === conditionFilter : true;
    const matchesType = typeFilter ? vehicle.vehiclesType === typeFilter : true;
    const matchesSearch = searchQuery ? (
      String(vehicle.vehicleNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(vehicle.vehicleCompanyNumber || '').toLowerCase().includes(searchQuery.toLowerCase())
    ) : true;
    return matchesLocation && matchesCondition && matchesType && matchesSearch;
  });

  // Sort by daysSince descending (most overdue first)
  const sortedOverdue = [...filteredOverdue].sort((a, b) => b.daysSince - a.daysSince);

  const exportToExcel = () => {
    const data = sortedOverdue.map(({ vehicle, latestLog, daysSince }) => ({
      Vehicle: vehicle.vehicleCompanyNumber || vehicle.vehicleNumber,
      DaysOverdue: daysSince === Infinity ? 'No History' : daysSince,
      LastOilChangeDate: latestLog ? formatDate(latestLog.date) : 'N/A',
      Location: vehicle.branchLocation,
      Type: vehicle.vehiclesType,
      Mileage: latestLog ? latestLog.mileage : 'N/A',
      Driver: latestLog ? latestLog.driverName : 'N/A'
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'OilChangeAlerts');
    XLSX.writeFile(workbook, 'OilChangeAlerts.xlsx');
  };

  const locations = Array.from(new Set(vehicles.map(v => v.branchLocation))).filter(Boolean);
  const conditions = Array.from(new Set(vehicles.map(v => v.condition))).filter(Boolean);
  const types = Array.from(new Set(vehicles.map(v => v.vehiclesType))).filter(Boolean);

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl md:text-4xl font-bold text-gray-800">{t('oilChangeAlert')}</h1>
        <div className="flex items-center gap-4">
          <button 
            onClick={exportToExcel}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
          >
            <DownloadIcon className="h-5 w-5" />
            {t('exportToExcel')}
          </button>
          <div className="bg-red-100 text-red-800 px-4 py-2 rounded-full text-sm font-bold">
            {t('moreThan10Days')}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input 
            type="text" 
            placeholder={t('search')} 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            className="w-full p-2 pl-10 border rounded-md"
          />
        </div>
        <select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} className="p-2 border rounded-md">
          <option value="">{t('allLocations')}</option>
          {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
        </select>
        <select value={conditionFilter} onChange={(e) => setConditionFilter(e.target.value)} className="p-2 border rounded-md">
          <option value="">{t('allConditions')}</option>
          {conditions.map(cond => <option key={cond} value={cond}>{cond}</option>)}
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="p-2 border rounded-md">
          <option value="">{t('allTypes')}</option>
          {types.map(type => <option key={type} value={type}>{t(type)}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedOverdue.length > 0 ? (
          sortedOverdue.map(({ vehicle, latestLog, daysSince }) => {
            return (
              <div 
                key={vehicle.id} 
                onClick={() => onVehicleClick?.(vehicle.id)}
                className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow cursor-pointer"
              >
                <div className="bg-red-600 p-4 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <TruckIcon className="h-6 w-6 mr-2" />
                      <span className="font-bold text-lg">
                        {vehicle.vehicleCompanyNumber || vehicle.vehicleNumber}
                      </span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded mb-1">
                        {daysSince === Infinity ? t('noHistory') : `${daysSince} ${t('days')}`}
                      </span>
                      {latestLog && (
                        <span className="text-[10px] opacity-80">
                          {t('last')}: {formatDate(latestLog.date)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="p-4 space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPinIcon className="h-4 w-4 mr-2 text-gray-400" />
                    <span className="font-medium mr-1">{t('location')}:</span>
                    {vehicle.branchLocation || t('noLocation')}
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <TruckIcon className="h-4 w-4 mr-2 text-gray-400" />
                    <span className="font-medium mr-1">{t('type')}:</span>
                    {t(vehicle.vehiclesType)}
                  </div>

                  {latestLog && (
                    <div className="pt-2 border-t border-gray-50">
                      <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                        {t('lastOilChangeDetails')}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-gray-400">{t('mileage')}:</span> {latestLog.mileage}
                        </div>
                        <div>
                          <span className="text-gray-400">{t('driver')}:</span> {latestLog.driverName}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full bg-white rounded-xl p-12 text-center shadow-sm border border-dashed border-gray-300">
            <div className="bg-gray-50 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <CalendarIcon className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">{t('noRecentOilChanges')}</h3>
            <p className="text-gray-500">{t('noOverdueOilChanges')}</p>
          </div>
        )}
      </div>
    </div>
  );
};
