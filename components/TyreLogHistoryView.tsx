import React, { useState, useEffect } from 'react';
import type { TyreLog, Vehicle } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { SearchIcon, EyeIcon, PencilIcon, ArrowsRightLeftIcon, DownloadIcon } from './Icons';
import { formatVehicleInfo, formatDate, formatTime, parseDate } from '../utils/formatters';
import * as XLSX from 'xlsx';
import { SearchableVehicleSelect } from './SearchableVehicleSelect';
import { TyreDetailModal } from './TyreDetailModal';

interface TyreLogHistoryViewProps {
  tyreLogs: TyreLog[];
  vehicles: Vehicle[];
  selectedVehicleId?: string;
  initialSearchQuery?: string;
  onEditTyre?: (log: TyreLog, tyreIndex: number) => void;
  onTransferTyre?: (log: TyreLog, tyreIndex: number) => void;
}

export const TyreLogHistoryView: React.FC<TyreLogHistoryViewProps> = ({ 
  tyreLogs, 
  vehicles, 
  selectedVehicleId, 
  initialSearchQuery = '',
  onEditTyre,
  onTransferTyre
}) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [selectedSerial, setSelectedSerial] = useState<string | null>(null);
  const [tyreTypeFilter, setTyreTypeFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [selectedVehicleIdFilter, setSelectedVehicleIdFilter] = useState('');

  useEffect(() => {
    if (initialSearchQuery) {
      setSearchQuery(initialSearchQuery);
    }
  }, [initialSearchQuery]);

  useEffect(() => {
    if (selectedVehicleId) {
      setSelectedVehicleIdFilter(selectedVehicleId);
    } else {
      setSelectedVehicleIdFilter('');
    }
  }, [selectedVehicleId]);

  const getVehicleInfo = (vehicleId: string) => {
    const vehicle = vehicles.find(v => String(v.id) === String(vehicleId));
    return formatVehicleInfo(vehicle, t, vehicleId);
  };

  const filteredLogs = tyreLogs
    .filter(log => {
      const query = searchQuery.toLowerCase();
      
      // Vehicle Filter
      if (selectedVehicleIdFilter && String(log.vehicleId) !== String(selectedVehicleIdFilter)) return false;

      // Month Filter
      if (monthFilter) {
        const logDate = parseDate(log.date);
        const logMonth = !isNaN(logDate.getTime()) ? logDate.toISOString().slice(0, 7) : '';
        if (logMonth !== monthFilter) return false;
      }

      // Tyre Type Filter
      if (tyreTypeFilter) {
        const filterValue = tyreTypeFilter.toLowerCase();
        if (!log.tyreDetails?.some(td => String(td.condition || '').toLowerCase() === filterValue)) return false;
      }

      // Search Query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const vehicleInfo = getVehicleInfo(log.vehicleId).toLowerCase();
        const vehicleNum = String(log.vehicleNumber || '').toLowerCase();
        const serialMatch = log.tyreDetails?.some(td => 
          String(td.serialNumber || '').toLowerCase().includes(query) || 
          String(td.remarks || '').toLowerCase().includes(query)
        );
        const vehicleMatch = vehicleInfo.includes(query) || vehicleNum.includes(query);
        if (!vehicleMatch && !serialMatch) return false;
      }
      
      return true;
    })
    .sort((a, b) => parseDate(b.date).getTime() - parseDate(a.date).getTime());

  const handleDownloadExcel = () => {
    const data: any[] = [];
    filteredLogs.forEach(log => {
      const logTyres = log.tyreDetails?.filter(td => {
        if (!tyreTypeFilter) return true;
        return String(td.condition || '').toLowerCase() === tyreTypeFilter.toLowerCase();
      });

      logTyres?.forEach(td => {
        data.push({
          [t('serialNumber')]: td.serialNumber,
          [t('brand')]: td.brand,
          [t('size')]: td.size,
          [t('condition')]: td.condition,
          [t('vehicle')]: getVehicleInfo(log.vehicleId),
          [t('date')]: formatDate(log.date),
          [t('workshop')]: log.workshopLocation,
          [t('driver')]: log.driverName,
          [t('mileage')]: log.mileage,
          [t('fromVehicle')]: td.fromVehicle || '',
          [t('remarks')]: td.remarks || ''
        });
      });
    });
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'TyreLogs');
    XLSX.writeFile(workbook, 'TyreLogHistory.xlsx');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-xl font-bold text-gray-800">{t('tyreLogHistory')}</h2>
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
        <SearchableVehicleSelect
          vehicles={vehicles}
          value={selectedVehicleIdFilter}
          onChange={setSelectedVehicleIdFilter}
          placeholder={t('allVehicles')}
        />
        <select value={tyreTypeFilter} onChange={(e) => setTyreTypeFilter(e.target.value)} className="p-2 border rounded-lg text-sm">
          <option value="">{t('allTyreTypes')}</option>
          <option value="new">{t('tyreType_NEW')}</option>
          <option value="used">{t('tyreType_Used')}</option>
        </select>
        <input type="month" value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} className="p-2 border rounded-lg text-sm" />
      </div>

      <div className="space-y-4">
        {filteredLogs.length > 0 ? (
          filteredLogs.map((log) => (
            <div key={log.id} className="bg-white rounded-xl shadow-md p-4 md:p-6 border border-gray-100">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {getVehicleInfo(log.vehicleId)}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDate(log.date)}
                    {formatDate(log.date) && formatTime(log.time) && ' at '}
                    {formatTime(log.time)}
                  </p>
                </div>
                <div className="text-end">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('mileage')}</p>
                  <p className="text-sm font-medium text-gray-800">{log.mileage}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-gray-50 pt-4">
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <span className="text-gray-500 w-24 flex-shrink-0">{t('driver')}:</span>
                    <span className="font-medium text-gray-800">{log.driverName}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="text-gray-500 w-24 flex-shrink-0">{t('workshop')}:</span>
                    <span className="font-medium text-gray-800">{log.workshopLocation}</span>
                  </div>
                  {log.mechanicName && (
                    <div className="flex items-center text-sm">
                      <span className="text-gray-500 w-24 flex-shrink-0">{t('mechanic')}:</span>
                      <span className="font-medium text-gray-800">{log.mechanicName}</span>
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{t('tyreDetails')}:</p>
                  <div className="space-y-2">
                    {log.tyreDetails?.filter(td => {
                      if (!tyreTypeFilter) return true;
                      return String(td.condition || '').toLowerCase() === tyreTypeFilter.toLowerCase();
                    }).map((td, idx) => (
                      <div 
                        key={td.id || idx} 
                        className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-sm cursor-pointer hover:border-green-300 hover:bg-green-50 transition-all group"
                        onClick={() => setSelectedSerial(td.serialNumber)}
                      >
                        <div className="flex justify-between mb-1">
                          <span className="font-bold text-green-600 group-hover:text-green-700">{t('tyre')} {idx + 1}</span>
                          <span className="text-xs bg-white px-2 py-0.5 rounded border border-gray-200 font-medium">
                            {td.condition === 'NEW' || td.condition === 'New' ? t('tyreType_NEW') : 
                             td.condition === 'Used' ? t('tyreType_Used') : 
                             td.condition === 'Repaired' ? t('tyreType_Repaired') : td.condition}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                          <div><span className="text-gray-400">{t('brand')}:</span> {td.brand || '-'}</div>
                          <div><span className="text-gray-400">{t('size')}:</span> {td.size}</div>
                          <div><span className="text-gray-400">{t('serial')}:</span> <span className="font-mono font-bold">{td.serialNumber}</span></div>
                          {td.remarks && <div className="col-span-2"><span className="text-gray-400">{t('remarks')}:</span> {td.remarks}</div>}
                        </div>
                        {td.fromVehicle && (
                          <div className="mt-1 text-[10px] text-gray-500 italic">
                            {t('fromVehicle')}: {td.fromVehicle}
                          </div>
                        )}
                        <div className="mt-3 flex items-center justify-between">
                          <div className="text-[10px] text-green-600 font-bold flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <EyeIcon className="h-3 w-3 mr-1" />
                            {t('viewDetails')}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditTyre?.(log, idx);
                              }}
                              className="p-1.5 bg-white border border-gray-200 rounded-md text-blue-600 hover:bg-blue-50 transition-colors"
                              title={t('editTyre')}
                            >
                              <PencilIcon className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onTransferTyre?.(log, idx);
                              }}
                              className="p-1.5 bg-white border border-gray-200 rounded-md text-green-600 hover:bg-green-50 transition-colors"
                              title={t('transferTyre')}
                            >
                              <ArrowsRightLeftIcon className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <EyeIcon className="h-8 w-8 text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium">{t('noLogsFound')}</p>
          </div>
        )}
      </div>

      {selectedSerial && (
        <TyreDetailModal
          serialNumber={selectedSerial}
          tyreLogs={tyreLogs}
          vehicles={vehicles}
          onClose={() => setSelectedSerial(null)}
        />
      )}
    </div>
  );
};
