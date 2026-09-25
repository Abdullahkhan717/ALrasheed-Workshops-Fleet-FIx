import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { useTranslation } from '../hooks/useTranslation';
import { DownloadIcon, SearchIcon, PrinterIcon, WhatsappIcon, TruckIcon } from './Icons';
import { formatDate, formatTime, parseDate, formatVehicleInfo } from '../utils/formatters';
import { calculateOilSchedule, parseOdometer } from '../utils/oilSchedule';
import { OilChangeCardModal } from './OilChangeCardModal';
import type { OilLog, Vehicle } from '../types';
import * as XLSX from 'xlsx';

interface OilLogHistoryViewProps {
  selectedVehicleId?: string;
}

export const OilLogHistoryView: React.FC<OilLogHistoryViewProps> = ({ selectedVehicleId }) => {
  const { t, language } = useTranslation();
  const { oilLogs, vehicles } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('');
  const [oilTypeFilter, setOilTypeFilter] = useState('');
  const [filterTypeFilter, setFilterTypeFilter] = useState('');
  const [selectedCardLog, setSelectedCardLog] = useState<{ log: OilLog; vehicle?: Vehicle } | null>(null);

  const filteredLogs = oilLogs.filter(log => {
    if (selectedVehicleId && log.vehicleId !== selectedVehicleId) return false;
    
    const vehicle = vehicles.find(v => v.id === log.vehicleId);
    const vehicleInfo = vehicle ? `${vehicle.vehicleCompanyNumber || ''} ${vehicle.vehicleNumber || ''}`.toLowerCase() : '';
    
    if (vehicleFilter && String(log.vehicleId) !== vehicleFilter) return false;
    if (oilTypeFilter && !log.oilTypes?.some(ot => String(ot || '').toLowerCase().includes(oilTypeFilter.toLowerCase()))) return false;
    if (filterTypeFilter && !log.filters?.some(f => String(f || '').toLowerCase().includes(filterTypeFilter.toLowerCase()))) return false;
    
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!vehicleInfo.includes(query) && !String(log.driverName || '').toLowerCase().includes(query)) return false;
      }
    
    return true;
  }).sort((a, b) => parseDate(b.date).getTime() - parseDate(a.date).getTime());

  // Deduplicate logs by ID
  const uniqueFilteredLogs = Array.from(new Map(filteredLogs.map(log => [log.id, log])).values());

  const handleDownloadExcel = () => {
    const data = uniqueFilteredLogs.map(log => {
      const vehicle = vehicles.find(v => v.id === log.vehicleId);
      const schedule = calculateOilSchedule(log.mileage, log.oilTypes, log.filters, log.vehicleId, oilLogs, vehicles, log.id, log.date);
      const engineOilItem = schedule.find(s => s.id === 'engineOil');
      const gearOilItem = schedule.find(s => s.id === 'gearOil');
      const deffranceItem = schedule.find(s => s.id === 'deffranceOil');
      const oilFilterItem = schedule.find(s => s.id === 'oilFilter');
      const dieselFilterItem = schedule.find(s => s.id === 'dieselFilter');
      const airFilterItem = schedule.find(s => s.id === 'airFilter');

      return {
        [t('date')]: formatDate(log.date),
        [t('vehicle')]: vehicle ? `${t(vehicle.vehiclesType)} ${vehicle.vehicleCompanyNumber || ''}-${vehicle.vehicleNumber || ''}` : log.vehicleId,
        [t('driver')]: log.driverName,
        [t('location')]: log.location,
        [t('currentOdometer') || 'Current Odometer']: log.mileage,
        [t('oilTypes')]: log.oilTypes?.join(', ') || '',
        [t('filters')]: log.filters?.join(', ') || '',
        'Next Engine Oil (+20k KM)': engineOilItem ? engineOilItem.nextOdo : '',
        'Next Oil Filter (+20k KM)': oilFilterItem ? oilFilterItem.nextOdo : '',
        'Next Fuel Filter (+40k KM)': dieselFilterItem ? dieselFilterItem.nextOdo : '',
        'Next Gear Oil (+60k KM)': gearOilItem ? gearOilItem.nextOdo : '',
        'Next Air Filter (+60k KM)': airFilterItem ? airFilterItem.nextOdo : '',
        'Next Diff Oil (+80k KM)': deffranceItem ? deffranceItem.nextOdo : '',
        [t('remarks')]: log.remarks || ''
      };
    });
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'OilLogs');
    XLSX.writeFile(workbook, 'OilLogHistory.xlsx');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-800">{t('oilLogHistory')}</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {language === 'ar' ? 'انقر على أي بطاقة لعرض بطاقة C5 والطباعة والمشاركة' : 'Click on any entry to view C5 service card, print and share'}
          </p>
        </div>
        <button
          onClick={handleDownloadExcel}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition text-sm font-semibold shadow-sm"
        >
          <DownloadIcon className="h-4 w-4" />
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {uniqueFilteredLogs.length > 0 ? (
          uniqueFilteredLogs
            .map((log, index) => {
              const vehicle = vehicles.find(v => v.id === log.vehicleId);
              const schedule = calculateOilSchedule(log.mileage, log.oilTypes, log.filters, log.vehicleId, oilLogs, vehicles, log.id, log.date);
              const currentOdo = parseOdometer(log.mileage);

              return (
                <div 
                  key={`${log.id}-${index}`} 
                  onClick={() => setSelectedCardLog({ log, vehicle })}
                  className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-emerald-400 transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start mb-3 pb-2 border-b border-gray-100">
                      <div>
                        <p className="font-bold text-emerald-700 text-base flex items-center gap-1.5">
                          <TruckIcon className="h-4 w-4 text-emerald-600" />
                          {vehicle ? (
                            `${t(vehicle.vehiclesType)} ${vehicle.vehicleCompanyNumber ? `${vehicle.vehicleCompanyNumber}-` : ''}${vehicle.vehicleNumber}`
                          ) : log.vehicleId}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {formatDate(log.date)}
                          {formatDate(log.date) && formatTime(log.time) && ' • '}
                          {formatTime(log.time)}
                          {log.location && ` • ${log.location}`}
                        </p>
                      </div>
                      <span className="bg-emerald-50 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-full border border-emerald-200">
                        C5 Card
                      </span>
                    </div>

                    {/* Driver & Current Mileage */}
                    <div className="grid grid-cols-2 gap-3 mb-3 bg-gray-50 p-2.5 rounded-lg text-xs">
                      <div>
                        <p className="text-gray-500 font-medium">{t('driver')}</p>
                        <p className="font-bold text-gray-800">{log.driverName}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 font-medium">{t('currentOdometer') || 'Current Odometer'}</p>
                        <p className="font-black text-emerald-700 font-mono text-sm">
                          {currentOdo.toLocaleString()} <span className="text-xs font-sans text-gray-500">KM</span>
                        </p>
                      </div>
                    </div>

                    {/* Services Performed */}
                    <div className="space-y-2 mb-3">
                      {(log.oilTypes && log.oilTypes.length > 0) && (
                        <div>
                          <p className="text-xs text-gray-500 font-semibold mb-1">{t('oilLog_oilTypes')}:</p>
                          <div className="flex flex-wrap gap-1.5">
                            {log.oilTypes.map((ot, i) => (
                              <span key={i} className="bg-emerald-100 text-emerald-900 text-xs px-2 py-0.5 rounded font-bold border border-emerald-200">
                                {t(`oilLog_${ot}` as any) !== `oilLog_${ot}` ? t(`oilLog_${ot}` as any) : ot}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {(log.filters && log.filters.length > 0) && (
                        <div>
                          <p className="text-xs text-gray-500 font-semibold mb-1">{t('oilLog_filters')}:</p>
                          <div className="flex flex-wrap gap-1.5">
                            {log.filters.map((f, i) => (
                              <span key={i} className="bg-blue-50 text-blue-900 text-xs px-2 py-0.5 rounded font-bold border border-blue-200">
                                {t(`oilLog_${f}` as any) !== `oilLog_${f}` ? t(`oilLog_${f}` as any) : f}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Next Due Odometer Readings Schedule Grid */}
                    <div className="bg-emerald-50/70 border border-emerald-200 rounded-lg p-3 mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-black text-emerald-900 uppercase tracking-wide">
                          {t('nextDueSchedule') || 'Next Due Schedule (Odometer)'}
                        </span>
                        <span className="text-[10px] text-emerald-700 font-bold">
                          قراءة العداد القادمة
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                        {schedule.map(item => {
                          const itemName = language === 'ar' ? item.nameAr : item.defaultName;
                          return (
                            <div 
                              key={item.id} 
                              className={`p-2 rounded border bg-white flex flex-col justify-between ${
                                item.wasChanged ? 'border-emerald-500 ring-1 ring-emerald-400' : 'border-gray-200'
                              }`}
                            >
                              <div className="flex justify-between items-start gap-1 mb-1">
                                <span className="font-semibold text-[11px] text-gray-800 leading-tight">
                                  {itemName}
                                </span>
                                {item.wasChanged && (
                                  <span className="text-[9px] bg-emerald-600 text-white font-bold px-1 rounded">
                                    ✓
                                  </span>
                                )}
                              </div>
                              <div className="flex items-baseline justify-between mt-1">
                                <span className="text-[10px] text-gray-400">+{item.intervalKm / 1000}k</span>
                                <span className="font-black text-emerald-700 font-mono text-xs">
                                  {item.nextOdo.toLocaleString()} <span className="text-[9px] text-gray-500 font-sans">KM</span>
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {log.remarks && (
                      <div className="text-xs text-gray-600 italic bg-gray-50 p-2 rounded mb-2">
                        "{log.remarks}"
                      </div>
                    )}
                  </div>

                  {/* Card Bottom CTA */}
                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2 mt-2">
                    <span className="text-xs text-gray-400">
                      ID: #{log.id.slice(0, 6)}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCardLog({ log, vehicle });
                      }}
                      className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm transition"
                    >
                      <PrinterIcon className="h-3.5 w-3.5" />
                      {t('viewOilDetails') || 'View Details & Print'}
                    </button>
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

      {/* C5 Portrait Modal */}
      {selectedCardLog && (
        <OilChangeCardModal
          log={selectedCardLog.log}
          vehicle={selectedCardLog.vehicle}
          allLogs={oilLogs}
          onClose={() => setSelectedCardLog(null)}
        />
      )}
    </div>
  );
};

