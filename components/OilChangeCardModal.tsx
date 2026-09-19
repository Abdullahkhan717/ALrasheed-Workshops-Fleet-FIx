import React, { useState } from 'react';
import type { OilLog, Vehicle } from '../types';
import { useTranslation } from '../hooks/useTranslation';
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
  onClose: () => void;
}

export const OilChangeCardModal: React.FC<OilChangeCardModalProps> = ({
  log,
  vehicle,
  onClose,
}) => {
  const { t, language } = useTranslation();
  const [copied, setCopied] = useState(false);

  const currentOdo = parseOdometer(log.mileage);
  const schedule = calculateOilSchedule(log.mileage, log.oilTypes, log.filters);

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

        {/* Content - Identical layout to TyreDetailModal */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {/* Top Quick Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">{t('currentOdometer') || t('mileage')}</p>
              <p className="font-mono font-bold text-emerald-700 text-base">{currentOdo.toLocaleString()} KM</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">{t('driver')}</p>
              <p className="font-bold text-gray-800 text-sm truncate">{log.driverName}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">{t('location') || t('workshop')}</p>
              <p className="font-bold text-gray-800 text-sm truncate">{log.location}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">{t('date')}</p>
              <p className="font-bold text-gray-800 text-sm">{formatDate(log.date)}</p>
            </div>
          </div>

          {/* Service Details Card */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center gap-1.5">
              <CheckCircleIcon className="h-4 w-4 text-emerald-600" />
              {t('servicesPerformed') || 'Services Performed'}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-gray-500 font-bold mb-1.5 uppercase text-[10px]">{t('oilTypes')}:</p>
                <div className="flex flex-wrap gap-1.5">
                  {(log.oilTypes && log.oilTypes.length > 0) ? (
                    log.oilTypes.map((ot, i) => (
                      <span key={i} className="bg-emerald-50 text-emerald-800 font-bold px-2 py-1 rounded border border-emerald-200">
                        🛢️ {t(`oilLog_${ot}` as any) !== `oilLog_${ot}` ? t(`oilLog_${ot}` as any) : ot}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-400 italic">None specified</span>
                  )}
                </div>
              </div>

              <div>
                <p className="text-gray-500 font-bold mb-1.5 uppercase text-[10px]">{t('filters')}:</p>
                <div className="flex flex-wrap gap-1.5">
                  {(log.filters && log.filters.length > 0) ? (
                    log.filters.map((f, i) => (
                      <span key={i} className="bg-blue-50 text-blue-800 font-bold px-2 py-1 rounded border border-blue-200">
                        ⚙️ {t(`oilLog_${f}` as any) !== `oilLog_${f}` ? t(`oilLog_${f}` as any) : f}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-400 italic">None specified</span>
                  )}
                </div>
              </div>
            </div>

            {log.remarks && (
              <div className="pt-2 border-t border-gray-100 text-xs">
                <span className="font-bold text-gray-500 uppercase text-[10px] block mb-0.5">{t('remarks')}:</span>
                <p className="text-gray-700 italic bg-gray-50 p-2 rounded">{log.remarks}</p>
              </div>
            )}
          </div>

          {/* Next Due Odometer Schedule Section */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                {t('nextDueSchedule') || 'Next Due Schedule (Odometer)'}
              </h3>
              <span className="text-xs text-gray-500 font-medium">
                {language === 'ar' ? 'المواعيد القادمة المحسوبة' : 'Calculated target readings'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {schedule.map(item => {
                const itemName = language === 'ar' ? item.nameAr : item.defaultName;
                return (
                  <div 
                    key={item.id} 
                    className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                      item.wasChanged 
                        ? 'bg-emerald-50/70 border-emerald-300 shadow-xs' 
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${item.wasChanged ? 'bg-emerald-600' : 'bg-gray-300'}`} />
                        <span className="font-bold text-xs text-gray-900">{itemName}</span>
                      </div>
                      <span className="text-[10px] text-gray-500 ms-3.5 block">
                        (+{item.intervalKm.toLocaleString()} KM interval)
                      </span>
                    </div>

                    <div className="text-end">
                      <div className="font-mono font-black text-sm text-emerald-800 bg-white px-2.5 py-1 rounded border border-gray-200">
                        {item.nextOdo.toLocaleString()} <span className="text-[10px] font-sans text-gray-500 font-bold">KM</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Hidden Print Section - EXACTLY like #tyre-print-section */}
        <div id="oil-print-section" className="hidden print:block font-sans text-black p-8">
          <div className="text-center mb-8 border-b-2 border-black pb-4">
            <h1 className="text-3xl font-black uppercase tracking-widest">{t('oilDetails') || 'OIL SERVICE DETAILS'}</h1>
            <p className="text-lg font-bold mt-2 font-mono">{vehicleTitle}</p>
            <p className="text-sm font-bold mt-1 text-gray-600">Al Rasheed Co. / شركة الرشيد المحدودة</p>
          </div>

          <div className="grid grid-cols-4 gap-4 mb-8 bg-gray-50 p-4 border border-black">
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase">{t('vehicle')}</p>
              <p className="text-base font-bold">{vehicleTitle}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase">{t('driver')}</p>
              <p className="text-base font-bold">{log.driverName}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase">{t('currentOdometer') || 'CURRENT ODOMETER'}</p>
              <p className="text-base font-bold font-mono">{currentOdo.toLocaleString()} KM</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase">{t('date')}</p>
              <p className="text-base font-bold">{formatDate(log.date)} {log.time ? formatTime(log.time) : ''}</p>
            </div>
          </div>

          {/* Record Details Box (same as Tyre Record) */}
          <div className="border-2 border-black p-4 mb-6 page-break-inside-avoid">
            <div className="flex justify-between items-center mb-4 border-b border-black pb-2">
              <h2 className="text-xl font-bold uppercase">{t('oilServiceDetails') || 'SERVICE RECORD SUMMARY'}</h2>
              <p className="font-bold font-mono">{formatDate(log.date)}</p>
            </div>
            <div className="grid grid-cols-2 gap-y-4 gap-x-12">
              <div className="flex justify-between border-b border-gray-300">
                <span className="font-bold text-xs uppercase text-gray-600">{t('vehicle')}:</span>
                <span className="font-bold">{vehicleTitle}</span>
              </div>
              <div className="flex justify-between border-b border-gray-300">
                <span className="font-bold text-xs uppercase text-gray-600">{t('workshop') || t('location')}:</span>
                <span className="font-bold">{log.location}</span>
              </div>
              <div className="flex justify-between border-b border-gray-300">
                <span className="font-bold text-xs uppercase text-gray-600">{t('driver')}:</span>
                <span className="font-bold">{log.driverName}</span>
              </div>
              <div className="flex justify-between border-b border-gray-300">
                <span className="font-bold text-xs uppercase text-gray-600">{t('currentOdometer') || t('mileage')}:</span>
                <span className="font-bold font-mono">{currentOdo.toLocaleString()} KM</span>
              </div>
              <div className="flex justify-between border-b border-gray-300 col-span-2">
                <span className="font-bold text-xs uppercase text-gray-600">{t('oilLog_oilTypes')}:</span>
                <span className="font-bold">
                  {(log.oilTypes || []).map(ot => t(`oilLog_${ot}` as any) !== `oilLog_${ot}` ? t(`oilLog_${ot}` as any) : ot).join(', ') || '-'}
                </span>
              </div>
              <div className="flex justify-between border-b border-gray-300 col-span-2">
                <span className="font-bold text-xs uppercase text-gray-600">{t('oilLog_filters')}:</span>
                <span className="font-bold">
                  {(log.filters || []).map(f => t(`oilLog_${f}` as any) !== `oilLog_${f}` ? t(`oilLog_${f}` as any) : f).join(', ') || '-'}
                </span>
              </div>
            </div>
            {log.remarks && (
              <div className="mt-4">
                <span className="font-bold text-xs uppercase text-gray-600 block mb-1">{t('remarks')}:</span>
                <p className="text-sm italic">{log.remarks}</p>
              </div>
            )}
          </div>

          {/* Next Due Odometer Schedule Table - Clean Black and White High Contrast */}
          <div className="border-2 border-black p-4 mb-6 page-break-inside-avoid">
            <div className="flex justify-between items-center mb-3 border-b border-black pb-2">
              <h2 className="text-lg font-black uppercase tracking-wider">{t('nextDueSchedule') || 'NEXT DUE ODOMETER SCHEDULE'}</h2>
              <span className="text-sm font-bold">جدول قراءات العداد القادمة</span>
            </div>
            
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-black text-xs uppercase bg-gray-100">
                  <th className="p-2 font-black">Service / Oil & Filter (الخدمة)</th>
                  <th className="p-2 font-black">Interval (المسافة)</th>
                  <th className="p-2 font-black">Current Service</th>
                  <th className="p-2 font-black text-right">Next Due Odometer (قراءة العداد القادمة)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-300 text-sm">
                {schedule.map(item => (
                  <tr key={item.id} className={item.wasChanged ? "bg-gray-50 font-bold" : ""}>
                    <td className="p-2.5">
                      <span className="font-bold">{item.defaultName}</span>
                      <span className="text-xs text-gray-600 block font-normal">{item.nameAr}</span>
                    </td>
                    <td className="p-2.5 font-mono">+{item.intervalKm.toLocaleString()} KM</td>
                    <td className="p-2.5">
                      {item.wasChanged ? (
                        <span className="inline-block border border-black px-2 py-0.5 text-xs font-black uppercase">
                          CHANGED (تم التغيير)
                        </span>
                      ) : (
                        <span className="text-gray-500 text-xs">Routine</span>
                      )}
                    </td>
                    <td className="p-2.5 font-mono font-black text-base text-right">
                      {item.nextOdo.toLocaleString()} KM
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Signatures & Stamp */}
          <div className="grid grid-cols-2 gap-12 mt-10 mb-4 page-break-inside-avoid">
            <div className="border-t-2 border-dashed border-black pt-2 text-center">
              <p className="font-bold text-sm uppercase">{t('driver')} Signature</p>
              <p className="text-xs text-gray-500">توقيع السائق</p>
            </div>
            <div className="border-t-2 border-dashed border-black pt-2 text-center">
              <p className="font-bold text-sm uppercase">Foreman / Stamp</p>
              <p className="text-xs text-gray-500">مسؤول الصيانة والختم</p>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t-2 border-black flex justify-between text-xs font-bold uppercase tracking-widest text-gray-500">
            <span>AlRasheed Co Workshop System</span>
            <span>Generated: {new Date().toLocaleString()}</span>
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
