import React, { useState } from 'react';
import type { OilLog, Vehicle } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { useData } from '../context/DataContext';
import { 
  XMarkIcon, 
  PrinterIcon, 
  ShareIcon, 
  TruckIcon, 
  CheckCircleIcon,
  CalendarIcon
} from './Icons';
import { formatDate, formatTime, formatVehicleInfo } from '../utils/formatters';
import { calculateOilSchedule, parseOdometer } from '../utils/oilSchedule';

interface OilChangeCardModalProps {
  log: OilLog;
  vehicle?: Vehicle;
  allLogs?: OilLog[];
  onClose: () => void;
}

export const OilChangeCardModal: React.FC<OilChangeCardModalProps> = ({
  log,
  vehicle,
  allLogs,
  onClose,
}) => {
  const { t, language } = useTranslation();
  const { oilLogs: contextOilLogs, vehicles: contextVehicles } = useData();
  const [copied, setCopied] = useState(false);

  const logsToUse = allLogs && allLogs.length > 0 ? allLogs : contextOilLogs;
  const vehiclesToUse = contextVehicles;

  const currentOdo = parseOdometer(log.mileage);
  const schedule = calculateOilSchedule(
    log.mileage,
    log.oilTypes,
    log.filters,
    log.vehicleId,
    logsToUse,
    vehiclesToUse,
    log.id,
    log.date
  );

  const engineOilItem = schedule.find(s => s.id === 'engineOil');
  const gearOilItem = schedule.find(s => s.id === 'gearOil');
  const deffranceOilItem = schedule.find(s => s.id === 'deffranceOil');
  const oilFilterItem = schedule.find(s => s.id === 'oilFilter');
  const dieselFilterItem = schedule.find(s => s.id === 'dieselFilter');
  const airFilterItem = schedule.find(s => s.id === 'airFilter');

  const vehicleTitle = vehicle 
    ? formatVehicleInfo(vehicle, t, log.vehicleId)
    : `Vehicle #${log.vehicleId}`;

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    let msg = `🛢️ *${t('oilDetails') || 'Oil Service Details'}*\n`;
    msg += `🏢 *AL RASHEED CO. / شركة الرشيد المحدودة*\n`;
    msg += `────────────────────────────\n`;
    msg += `🚛 *${t('vehicle')}*: ${vehicleTitle}\n`;
    if (vehicle?.serialNumber) {
      msg += `🔢 *${t('serialNumber')}*: ${vehicle.serialNumber}\n`;
    }
    msg += `👤 *${t('driver')}*: ${log.driverName}\n`;
    msg += `📍 *${t('location')} / ${t('workshop')}*: ${log.location}\n`;
    msg += `📅 *${t('date')}*: ${formatDate(log.date)} ${log.time ? formatTime(log.time) : ''}\n`;
    msg += `⚡ *${t('currentOdometer') || 'Current Odometer'}*: *${currentOdo.toLocaleString()} KM*\n`;
    msg += `────────────────────────────\n`;
    msg += `📋 *${t('servicesPerformed') || 'Services Performed'}*:\n`;
    if (log.oilTypes && log.oilTypes.length > 0) {
      const oilsStr = log.oilTypes.map(ot => t(`oilLog_${ot}` as any) !== `oilLog_${ot}` ? t(`oilLog_${ot}` as any) : ot).join(', ');
      msg += `• *${t('oilLog_oilTypes')}*: ${oilsStr}\n`;
    }
    if (log.filters && log.filters.length > 0) {
      const filtersStr = log.filters.map(f => t(`oilLog_${f}` as any) !== `oilLog_${f}` ? t(`oilLog_${f}` as any) : f).join(', ');
      msg += `• *${t('oilLog_filters')}*: ${filtersStr}\n`;
    }
    msg += `────────────────────────────\n`;
    msg += `⏱️ *${t('nextDueSchedule') || 'Next Due Schedule (Odometer)'}*:\n`;
    schedule.forEach(item => {
      const mark = item.wasChanged ? '✅ ' : '▫️ ';
      const name = language === 'ar' ? item.nameAr : item.defaultName;
      msg += `${mark}*${name}* (+${item.intervalKm.toLocaleString()} KM): *${item.nextOdo.toLocaleString()} KM*\n`;
    });
    if (log.remarks) {
      msg += `────────────────────────────\n`;
      msg += `📝 *${t('remarks')}*: ${log.remarks}\n`;
    }
    msg += `────────────────────────────\n`;
    msg += `🏷️ Al Rasheed Co Workshop System`;

    const encoded = encodeURIComponent(msg);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header - Identical structure to TyreDetailModal */}
        <div className="p-4 md:p-6 bg-white border-b flex justify-between items-center sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{t('oilDetails') || 'Oil Service Details'}</h2>
            <p className="text-sm text-gray-500">
              {t('vehicle')}: <span className="font-bold text-emerald-600">{vehicleTitle}</span>
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            title={t('close')}
          >
            <XMarkIcon className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        {/* Content - Clean and organized */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {/* Top Truck & Current Service Details */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase">{t('truckNumber') || t('vehicle')}</p>
                <p className="font-bold text-gray-900 text-sm">{vehicleTitle}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase">{t('driver')}</p>
                <p className="font-bold text-gray-900 text-sm truncate">{log.driverName || '-'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase">{t('lastDateChange') || 'Last Date Change'}</p>
                <p className="font-bold text-gray-900 text-sm">{formatDate(log.date)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase">{t('lastOdometer') || 'Last Odometer'}</p>
                <p className="font-mono font-bold text-emerald-700 text-base">{currentOdo.toLocaleString()} KM</p>
              </div>
            </div>

            {/* Service Type */}
            <div className="pt-2 border-t border-gray-200 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-bold text-gray-600 uppercase text-[11px]">{t('serviceType') || 'Service Type'}:</span>
              <div className="flex flex-wrap gap-1.5">
                {(log.oilTypes && log.oilTypes.length > 0) && log.oilTypes.map((ot, i) => (
                  <span key={i} className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-xs border border-emerald-300">
                    🛢️ {t(`oilLog_${ot}` as any) !== `oilLog_${ot}` ? t(`oilLog_${ot}` as any) : ot}
                  </span>
                ))}
                {(log.filters && log.filters.length > 0) && log.filters.map((f, i) => (
                  <span key={i} className="bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded text-xs border border-blue-300">
                    ⚙️ {t(`oilLog_${f}` as any) !== `oilLog_${f}` ? t(`oilLog_${f}` as any) : f}
                  </span>
                ))}
                {(!log.oilTypes?.length && !log.filters?.length) && (
                  <span className="text-gray-400 italic">Routine check</span>
                )}
              </div>
            </div>
          </div>

          {/* Next Due Schedule in Two Columns: First Oils, Next Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. Next Oils Column */}
            <div className="border border-emerald-200 rounded-xl p-4 bg-emerald-50/40">
              <h3 className="text-xs font-black text-emerald-950 uppercase tracking-wider mb-3 flex items-center justify-between">
                <span>🛢️ Next Oils (الزيوت القادمة)</span>
                <span className="text-[10px] font-normal text-emerald-700">Next Odometer</span>
              </h3>
              <div className="space-y-2.5">
                <div className={`bg-white p-3 rounded-lg border flex justify-between items-center shadow-2xs ${engineOilItem?.wasChanged ? 'border-emerald-300 ring-1 ring-emerald-300' : 'border-emerald-200'}`}>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-gray-900 block">Next Engine Oil</span>
                      {engineOilItem?.wasChanged ? (
                        <span className="text-[9px] text-emerald-700 bg-emerald-100 font-bold px-1 rounded">✓ {language === 'ar' ? 'تم التغيير' : 'Changed'}</span>
                      ) : (
                        <span className="text-[9px] text-gray-500 bg-gray-100 font-medium px-1 rounded">{language === 'ar' ? 'سابق' : 'Previous'}</span>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-500">زيت الماكينة (+20,000 KM)</span>
                  </div>
                  <span className="font-mono font-black text-sm text-emerald-800 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                    {(engineOilItem ? engineOilItem.nextOdo : currentOdo + 20000).toLocaleString()} KM
                  </span>
                </div>

                <div className={`bg-white p-3 rounded-lg border flex justify-between items-center shadow-2xs ${gearOilItem?.wasChanged ? 'border-emerald-300 ring-1 ring-emerald-300' : 'border-emerald-200'}`}>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-gray-900 block">Next Gear Oil</span>
                      {gearOilItem?.wasChanged ? (
                        <span className="text-[9px] text-emerald-700 bg-emerald-100 font-bold px-1 rounded">✓ {language === 'ar' ? 'تم التغيير' : 'Changed'}</span>
                      ) : (
                        <span className="text-[9px] text-amber-700 bg-amber-50 border border-amber-200 font-medium px-1 rounded">{language === 'ar' ? 'سابق' : 'Previous'}</span>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-500">زيت القير (+60,000 KM)</span>
                  </div>
                  <span className="font-mono font-black text-sm text-emerald-800 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                    {(gearOilItem ? gearOilItem.nextOdo : currentOdo + 60000).toLocaleString()} KM
                  </span>
                </div>

                <div className={`bg-white p-3 rounded-lg border flex justify-between items-center shadow-2xs ${deffranceOilItem?.wasChanged ? 'border-emerald-300 ring-1 ring-emerald-300' : 'border-emerald-200'}`}>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-gray-900 block">Next Differential Oil</span>
                      {deffranceOilItem?.wasChanged ? (
                        <span className="text-[9px] text-emerald-700 bg-emerald-100 font-bold px-1 rounded">✓ {language === 'ar' ? 'تم التغيير' : 'Changed'}</span>
                      ) : (
                        <span className="text-[9px] text-amber-700 bg-amber-50 border border-amber-200 font-medium px-1 rounded">{language === 'ar' ? 'سابق' : 'Previous'}</span>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-500">زيت الدفرنش (+100,000 KM)</span>
                  </div>
                  <span className="font-mono font-black text-sm text-emerald-800 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                    {(deffranceOilItem ? deffranceOilItem.nextOdo : currentOdo + 100000).toLocaleString()} KM
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Next Filters Column */}
            <div className="border border-blue-200 rounded-xl p-4 bg-blue-50/40">
              <h3 className="text-xs font-black text-blue-950 uppercase tracking-wider mb-3 flex items-center justify-between">
                <span>⚙️ Next Filters (الفلاتر القادمة)</span>
                <span className="text-[10px] font-normal text-blue-700">Next Odometer</span>
              </h3>
              <div className="space-y-2.5">
                <div className={`bg-white p-3 rounded-lg border flex justify-between items-center shadow-2xs ${oilFilterItem?.wasChanged ? 'border-blue-300 ring-1 ring-blue-300' : 'border-blue-200'}`}>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-gray-900 block">Next Oil Filter</span>
                      {oilFilterItem?.wasChanged ? (
                        <span className="text-[9px] text-blue-700 bg-blue-100 font-bold px-1 rounded">✓ {language === 'ar' ? 'تم التغيير' : 'Changed'}</span>
                      ) : (
                        <span className="text-[9px] text-gray-500 bg-gray-100 font-medium px-1 rounded">{language === 'ar' ? 'سابق' : 'Previous'}</span>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-500">فلتر الزيت (+20,000 KM)</span>
                  </div>
                  <span className="font-mono font-black text-sm text-blue-900 bg-blue-50 px-2 py-1 rounded border border-blue-200">
                    {(oilFilterItem ? oilFilterItem.nextOdo : currentOdo + 20000).toLocaleString()} KM
                  </span>
                </div>

                <div className={`bg-white p-3 rounded-lg border flex justify-between items-center shadow-2xs ${dieselFilterItem?.wasChanged ? 'border-blue-300 ring-1 ring-blue-300' : 'border-blue-200'}`}>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-gray-900 block">Next Fuel (Diesel) Filter</span>
                      {dieselFilterItem?.wasChanged ? (
                        <span className="text-[9px] text-blue-700 bg-blue-100 font-bold px-1 rounded">✓ {language === 'ar' ? 'تم التغيير' : 'Changed'}</span>
                      ) : (
                        <span className="text-[9px] text-amber-700 bg-amber-50 border border-amber-200 font-medium px-1 rounded">{language === 'ar' ? 'سابق' : 'Previous'}</span>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-500">فلتر الديزل (+40,000 KM)</span>
                  </div>
                  <span className="font-mono font-black text-sm text-blue-900 bg-blue-50 px-2 py-1 rounded border border-blue-200">
                    {(dieselFilterItem ? dieselFilterItem.nextOdo : currentOdo + 40000).toLocaleString()} KM
                  </span>
                </div>

                <div className={`bg-white p-3 rounded-lg border flex justify-between items-center shadow-2xs ${airFilterItem?.wasChanged ? 'border-blue-300 ring-1 ring-blue-300' : 'border-blue-200'}`}>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-gray-900 block">Next Air Filter</span>
                      {airFilterItem?.wasChanged ? (
                        <span className="text-[9px] text-blue-700 bg-blue-100 font-bold px-1 rounded">✓ {language === 'ar' ? 'تم التغيير' : 'Changed'}</span>
                      ) : (
                        <span className="text-[9px] text-amber-700 bg-amber-50 border border-amber-200 font-medium px-1 rounded">{language === 'ar' ? 'سابق' : 'Previous'}</span>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-500">فلتر الهواء (+60,000 KM)</span>
                  </div>
                  <span className="font-mono font-black text-sm text-blue-900 bg-blue-50 px-2 py-1 rounded border border-blue-200">
                    {(airFilterItem ? airFilterItem.nextOdo : currentOdo + 60000).toLocaleString()} KM
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Clean, Focused Print Section (No extra clutter) */}
        <div id="oil-print-section" className="hidden print:block font-sans text-black p-8">
          <div className="text-center mb-6 border-b-2 border-black pb-3">
            <h1 className="text-2xl font-black uppercase tracking-wider">OIL SERVICE & SCHEDULE / خدمة وجدول الزيوت</h1>
            <p className="text-sm font-bold mt-1 text-gray-700">Al Rasheed Co. / شركة الرشيد المحدودة</p>
          </div>

          {/* Truck and Last Change Details */}
          <div className="border-2 border-black p-4 mb-6">
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
              <div className="flex justify-between border-b border-gray-400 pb-1.5">
                <span className="font-bold text-gray-700">Truck Number (رقم الشاحنة):</span>
                <span className="font-black text-base">{vehicleTitle}</span>
              </div>
              <div className="flex justify-between border-b border-gray-400 pb-1.5">
                <span className="font-bold text-gray-700">Driver Name (اسم السائق):</span>
                <span className="font-bold text-base">{log.driverName || '-'}</span>
              </div>
              <div className="flex justify-between border-b border-gray-400 pb-1.5">
                <span className="font-bold text-gray-700">Last Date Change (تاريخ التغيير):</span>
                <span className="font-bold text-base">{formatDate(log.date)}</span>
              </div>
              <div className="flex justify-between border-b border-gray-400 pb-1.5">
                <span className="font-bold text-gray-700">Last Odometer (قراءة العداد):</span>
                <span className="font-black font-mono text-lg">{currentOdo.toLocaleString()} KM</span>
              </div>
              <div className="flex justify-between border-b border-gray-400 pb-1.5 col-span-2">
                <span className="font-bold text-gray-700">Service Type (نوع الخدمة):</span>
                <span className="font-bold text-sm text-end">
                  {[
                    ...(log.oilTypes || []).map(ot => t(`oilLog_${ot}` as any) !== `oilLog_${ot}` ? t(`oilLog_${ot}` as any) : ot),
                    ...(log.filters || []).map(f => t(`oilLog_${f}` as any) !== `oilLog_${f}` ? t(`oilLog_${f}` as any) : f)
                  ].join(', ') || '-'}
                </span>
              </div>
            </div>
          </div>

          {/* Next Oils and Next Filters Columns */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            {/* Column 1: Next Oils */}
            <div className="border-2 border-black p-4">
              <div className="border-b-2 border-black pb-2 mb-3">
                <h2 className="text-base font-black uppercase tracking-wider">Next Oils (الزيوت القادمة)</h2>
              </div>
              <div className="space-y-3 text-sm">
                <div className="p-2.5 border border-black bg-gray-50 flex justify-between items-center">
                  <div>
                    <span className="font-bold block">Next Engine Oil</span>
                    <span className="text-xs text-gray-600">زيت الماكينة (+20,000 KM)</span>
                  </div>
                  <span className="font-mono font-black text-lg">
                    {(engineOilItem ? engineOilItem.nextOdo : currentOdo + 20000).toLocaleString()} KM
                  </span>
                </div>

                <div className="p-2.5 border border-black bg-gray-50 flex justify-between items-center">
                  <div>
                    <span className="font-bold block">Next Gear Oil</span>
                    <span className="text-xs text-gray-600">زيت القير (+60,000 KM)</span>
                  </div>
                  <span className="font-mono font-black text-lg">
                    {(gearOilItem ? gearOilItem.nextOdo : currentOdo + 60000).toLocaleString()} KM
                  </span>
                </div>

                <div className="p-2.5 border border-black bg-gray-50 flex justify-between items-center">
                  <div>
                    <span className="font-bold block">Next Differential Oil</span>
                    <span className="text-xs text-gray-600">زيت الدفرنش (+100,000 KM)</span>
                  </div>
                  <span className="font-mono font-black text-lg">
                    {(deffranceOilItem ? deffranceOilItem.nextOdo : currentOdo + 100000).toLocaleString()} KM
                  </span>
                </div>
              </div>
            </div>

            {/* Column 2: Next Filters */}
            <div className="border-2 border-black p-4">
              <div className="border-b-2 border-black pb-2 mb-3">
                <h2 className="text-base font-black uppercase tracking-wider">Next Filters (الفلاتر القادمة)</h2>
              </div>
              <div className="space-y-3 text-sm">
                <div className="p-2.5 border border-black bg-gray-50 flex justify-between items-center">
                  <div>
                    <span className="font-bold block">Next Oil Filter</span>
                    <span className="text-xs text-gray-600">فلتر الزيت (+20,000 KM)</span>
                  </div>
                  <span className="font-mono font-black text-lg">
                    {(oilFilterItem ? oilFilterItem.nextOdo : currentOdo + 20000).toLocaleString()} KM
                  </span>
                </div>

                <div className="p-2.5 border border-black bg-gray-50 flex justify-between items-center">
                  <div>
                    <span className="font-bold block">Next Fuel (Diesel) Filter</span>
                    <span className="text-xs text-gray-600">فلتر الديزل (+40,000 KM)</span>
                  </div>
                  <span className="font-mono font-black text-lg">
                    {(dieselFilterItem ? dieselFilterItem.nextOdo : currentOdo + 40000).toLocaleString()} KM
                  </span>
                </div>

                <div className="p-2.5 border border-black bg-gray-50 flex justify-between items-center">
                  <div>
                    <span className="font-bold block">Next Air Filter</span>
                    <span className="text-xs text-gray-600">فلتر الهواء (+60,000 KM)</span>
                  </div>
                  <span className="font-mono font-black text-lg">
                    {(airFilterItem ? airFilterItem.nextOdo : currentOdo + 60000).toLocaleString()} KM
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions - Matching TyreDetailModal buttons */}
        <div className="p-4 md:p-6 bg-gray-50 border-t flex flex-wrap gap-3">
          <button 
            onClick={handleWhatsAppShare}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl transition-all font-bold text-sm bg-teal-600 text-white hover:bg-teal-700 shadow-md active:scale-95"
          >
            <ShareIcon className="h-5 w-5" />
            {t('share')}
          </button>

          <button 
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl transition-all font-bold text-sm bg-gray-800 text-white hover:bg-gray-900 shadow-md active:scale-95"
          >
            <PrinterIcon className="h-5 w-5" />
            {t('print')}
          </button>
        </div>

      </div>
    </div>
  );
};
