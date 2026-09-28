import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useTranslation } from '../hooks/useTranslation';
import { DownloadIcon, SearchIcon, PrinterIcon, TruckIcon } from './Icons';
import { formatDate, formatTime, parseDate, formatVehicleInfo } from '../utils/formatters';
import { calculateOilSchedule, parseOdometer, normalizeVehicleKey } from '../utils/oilSchedule';
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
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(24);

  // Reset page when any filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, vehicleFilter, oilTypeFilter, filterTypeFilter, selectedVehicleId, pageSize]);

  // Pre-index vehicles for O(1) instant lookup
  const vehicleMap = useMemo(() => {
    const map = new Map<string, Vehicle>();
    vehicles.forEach(v => {
      if (v.id) {
        map.set(String(v.id), v);
      }
    });
    return map;
  }, [vehicles]);

  // Fast mapping from any plate or company number or raw id to canonical vehicle.id
  const keyToVehicleId = useMemo(() => {
    const map = new Map<string, string>();
    vehicles.forEach(v => {
      if (!v.id) return;
      const vid = String(v.id);
      map.set(vid, vid);
      const normId = normalizeVehicleKey(vid);
      if (normId) map.set(normId, vid);

      if (v.vehicleNumber) {
        map.set(String(v.vehicleNumber), vid);
        const normPlate = normalizeVehicleKey(v.vehicleNumber);
        if (normPlate && !map.has(normPlate)) map.set(normPlate, vid);
      }

      if (v.vehicleCompanyNumber) {
        const normComp = normalizeVehicleKey(v.vehicleCompanyNumber);
        if (normComp && !map.has(normComp)) map.set(normComp, vid);
      }
    });
    return map;
  }, [vehicles]);

  // Pre-group oil logs by vehicle.id in O(N)
  const logsByVehicleId = useMemo(() => {
    const map = new Map<string, OilLog[]>();
    oilLogs.forEach(log => {
      const rawVid = String(log.vehicleId || '');
      if (!rawVid) return;
      const normVid = normalizeVehicleKey(rawVid);
      const targetVehId = keyToVehicleId.get(rawVid) || keyToVehicleId.get(normVid) || rawVid;

      let arr = map.get(targetVehId);
      if (!arr) {
        arr = [];
        map.set(targetVehId, arr);
      }
      arr.push(log);
    });
    return map;
  }, [oilLogs, keyToVehicleId]);

  // Filtered and deduplicated logs with useMemo
  const uniqueFilteredLogs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const filtered = oilLogs.filter(log => {
      if (selectedVehicleId && log.vehicleId !== selectedVehicleId) return false;
      if (vehicleFilter && String(log.vehicleId) !== vehicleFilter) return false;
      if (oilTypeFilter && !log.oilTypes?.some(ot => String(ot || '').toLowerCase().includes(oilTypeFilter.toLowerCase()))) return false;
      if (filterTypeFilter && !log.filters?.some(f => String(f || '').toLowerCase().includes(filterTypeFilter.toLowerCase()))) return false;

      if (query) {
        const rawVid = String(log.vehicleId || '');
        const resolvedId = keyToVehicleId.get(rawVid) || keyToVehicleId.get(normalizeVehicleKey(rawVid)) || rawVid;
        const vehicle = vehicleMap.get(resolvedId) || vehicleMap.get(rawVid);
        const vehicleInfo = vehicle ? `${vehicle.vehicleCompanyNumber || ''} ${vehicle.vehicleNumber || ''} ${vehicle.vehiclesType || ''}`.toLowerCase() : '';
        const driver = String(log.driverName || '').toLowerCase();
        const loc = String(log.location || '').toLowerCase();
        const mileage = String(log.mileage || '').toLowerCase();
        const remarks = String(log.remarks || '').toLowerCase();

        if (!vehicleInfo.includes(query) && !driver.includes(query) && !loc.includes(query) && !mileage.includes(query) && !remarks.includes(query)) {
          return false;
        }
      }

      return true;
    });

    // Deduplicate logs by ID
    const dedupedMap = new Map<string, OilLog>();
    for (const log of filtered) {
      if (!dedupedMap.has(log.id)) {
        dedupedMap.set(log.id, log);
      }
    }

    return Array.from(dedupedMap.values()).sort((a, b) => {
      const timeA = parseDate(a.date).getTime() || 0;
      const timeB = parseDate(b.date).getTime() || 0;
      if (timeA !== timeB) return timeB - timeA;
      return parseOdometer(b.mileage) - parseOdometer(a.mileage);
    });
  }, [oilLogs, selectedVehicleId, vehicleFilter, oilTypeFilter, filterTypeFilter, searchQuery, keyToVehicleId, vehicleMap]);

  // Pagination calculation
  const totalCount = uniqueFilteredLogs.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const pagedLogs = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return uniqueFilteredLogs.slice(start, start + pageSize);
  }, [uniqueFilteredLogs, safePage, pageSize]);

  const handleDownloadExcel = () => {
    const data = uniqueFilteredLogs.map(log => {
      const rawVid = String(log.vehicleId || '');
      const resolvedVehId = keyToVehicleId.get(rawVid) || keyToVehicleId.get(normalizeVehicleKey(rawVid)) || rawVid;
      const vehicle = vehicleMap.get(resolvedVehId) || vehicleMap.get(rawVid);
      const vehicleLogs = logsByVehicleId.get(resolvedVehId) || [];
      const schedule = calculateOilSchedule(log.mileage, log.oilTypes, log.filters, resolvedVehId, vehicleLogs, vehicles, log.id, log.date, vehicleLogs);

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

  const startIndex = totalCount === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endIndex = Math.min(safePage * pageSize, totalCount);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-800">{t('oilLogHistory')}</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {language === 'ar' ? 'انقر على أي بطاقة لعرض بطاقة C5 والطباعة والمشاركة' : 'Click on any entry to view C5 service card, print and share'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg">
            {language === 'ar' ? `${totalCount} سجل` : `${totalCount} records`}
          </span>
          <button
            onClick={handleDownloadExcel}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition text-sm font-semibold shadow-sm"
          >
            <DownloadIcon className="h-4 w-4" />
            {t('downloadExcel')}
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="relative">
          <input
            type="text"
            placeholder={t('search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
          <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        </div>
        <select value={vehicleFilter} onChange={(e) => setVehicleFilter(e.target.value)} className="p-2 border rounded-lg text-sm bg-white">
          <option value="">{t('all')}</option>
          {vehicles.map(v => <option key={v.id} value={v.id}>{formatVehicleInfo(v, t, v.id)}</option>)}
        </select>
        <select value={oilTypeFilter} onChange={(e) => setOilTypeFilter(e.target.value)} className="p-2 border rounded-lg text-sm bg-white">
          <option value="">{t('all')}</option>
          <option value="engineOil">{t('oilLog_engineOil')}</option>
          <option value="gearOil">{t('oilLog_gearOil')}</option>
          <option value="deffranceOil">{t('oilLog_deffranceOil')}</option>
          <option value="greasing">{t('oilLog_greasing')}</option>
          <option value="noOil">{t('oilLog_noOil')}</option>
        </select>
        <select value={filterTypeFilter} onChange={(e) => setFilterTypeFilter(e.target.value)} className="p-2 border rounded-lg text-sm bg-white">
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
          className="p-2 border rounded-lg text-sm bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium transition"
        >
          {t('resetFilters')}
        </button>
      </div>

      {/* Pagination Bar Top */}
      {totalCount > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white px-4 py-2.5 rounded-xl border border-gray-100 text-xs text-gray-600">
          <div>
            {language === 'ar'
              ? `عرض ${startIndex} - ${endIndex} من إجمالي ${totalCount}`
              : `Showing ${startIndex} - ${endIndex} of ${totalCount}`}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400">{language === 'ar' ? 'لكل صفحة:' : 'Per page:'}</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="border border-gray-200 rounded px-2 py-1 text-xs bg-gray-50 font-medium"
            >
              <option value={12}>12</option>
              <option value={24}>24</option>
              <option value={48}>48</option>
              <option value={100}>100</option>
            </select>
            <div className="flex items-center gap-1 ms-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                className="px-2.5 py-1 rounded border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
              >
                {language === 'ar' ? 'السابق' : 'Previous'}
              </button>
              <span className="px-2 font-bold text-gray-700">
                {safePage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                className="px-2.5 py-1 rounded border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
              >
                {language === 'ar' ? 'التالي' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {pagedLogs.length > 0 ? (
          pagedLogs.map((log, index) => {
            const rawVid = String(log.vehicleId || '');
            const resolvedVehId = keyToVehicleId.get(rawVid) || keyToVehicleId.get(normalizeVehicleKey(rawVid)) || rawVid;
            const vehicle = vehicleMap.get(resolvedVehId) || vehicleMap.get(rawVid);
            const vehicleLogs = logsByVehicleId.get(resolvedVehId) || [];
            const schedule = calculateOilSchedule(log.mileage, log.oilTypes, log.filters, resolvedVehId, vehicleLogs, vehicles, log.id, log.date, vehicleLogs);
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
                      <p className="font-bold text-gray-800">{log.driverName || '-'}</p>
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

      {/* Pagination Bar Bottom */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white px-4 py-3 rounded-xl border border-gray-100 text-xs text-gray-600">
          <div>
            {language === 'ar'
              ? `عرض ${startIndex} - ${endIndex} من إجمالي ${totalCount}`
              : `Showing ${startIndex} - ${endIndex} of ${totalCount}`}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={safePage <= 1}
              className="px-2 py-1 rounded border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-[11px]"
            >
              {language === 'ar' ? 'الأولى' : 'First'}
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className="px-2.5 py-1 rounded border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
            >
              {language === 'ar' ? 'السابق' : 'Previous'}
            </button>
            <span className="px-3 font-bold text-gray-700 text-xs">
              {safePage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              className="px-2.5 py-1 rounded border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
            >
              {language === 'ar' ? 'التالي' : 'Next'}
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={safePage >= totalPages}
              className="px-2 py-1 rounded border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-[11px]"
            >
              {language === 'ar' ? 'الأخيرة' : 'Last'}
            </button>
          </div>
        </div>
      )}

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
