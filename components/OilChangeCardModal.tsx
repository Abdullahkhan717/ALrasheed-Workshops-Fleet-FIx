import React, { useState } from 'react';
import type { OilLog, Vehicle } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { 
  XMarkIcon, 
  PrinterIcon, 
  WhatsappIcon, 
  ShareIcon, 
  TruckIcon, 
  CheckCircleIcon,
  MapPinIcon,
  UserIcon,
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
    ? `${t(vehicle.vehiclesType)} ${vehicle.vehicleCompanyNumber ? `${vehicle.vehicleCompanyNumber} - ` : ''}${vehicle.vehicleNumber}`
    : `Vehicle #${log.vehicleId}`;

  const vehiclePlate = vehicle?.vehicleNumber || log.vehicleId;
  const companyNo = vehicle?.vehicleCompanyNumber || '-';

  const handlePrint = () => {
    const style = document.createElement('style');
    style.id = 'c5-oil-print-style';
    style.innerHTML = `@page { size: 162mm 229mm portrait; margin: 4mm; }`;
    document.head.appendChild(style);
    document.body.classList.add('printing-oil-c5');

    window.print();

    setTimeout(() => {
      document.body.classList.remove('printing-oil-c5');
      const existing = document.getElementById('c5-oil-print-style');
      if (existing) existing.remove();
    }, 1000);
  };

  const handleWhatsAppShare = () => {
    let msg = `🛢️ *${t('oilServiceCard') || 'Oil Service & Maintenance Card'}*\n`;
    msg += `🏢 *AL RASHEED CO. / شركة الرشيد المحدودة*\n`;
    msg += `────────────────────────────\n`;
    msg += `🚛 *${t('vehicle')}*: ${vehicleTitle}\n`;
    if (vehicle?.serialNumber) {
      msg += `🔢 *${t('serialNumber')}*: ${vehicle.serialNumber}\n`;
    }
    msg += `👤 *${t('driver')}*: ${log.driverName}\n`;
    msg += `📍 *${t('location')}*: ${log.location}\n`;
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
    msg += `⏱️ *${t('nextDueSchedule') || 'Next Due Schedule (Odometer Reading)'}*:\n`;
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
    msg += `🏷️ *Format*: C5 Portrait Card`;

    const encoded = encodeURIComponent(msg);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  const handleCopyDetails = async () => {
    let text = `${t('oilServiceCard') || 'Oil Service & Maintenance Card'} - AL RASHEED CO.\n`;
    text += `${t('vehicle')}: ${vehicleTitle}\n`;
    text += `${t('driver')}: ${log.driverName}\n`;
    text += `${t('date')}: ${formatDate(log.date)}\n`;
    text += `${t('currentOdometer') || 'Current Odometer'}: ${currentOdo.toLocaleString()} KM\n\n`;
    text += `${t('nextDueSchedule') || 'Next Due Schedule'}:\n`;
    schedule.forEach(item => {
      const name = language === 'ar' ? item.nameAr : item.defaultName;
      text += `• ${name} (+${item.intervalKm.toLocaleString()} KM) -> ${item.nextOdo.toLocaleString()} KM\n`;
    });
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4 overflow-y-auto backdrop-blur-sm animate-fade-in">
      <div className="relative flex flex-col items-center max-w-full my-auto">
        {/* Top Control Bar (Screen only) */}
        <div className="w-full max-w-[430px] flex items-center justify-between bg-gray-900/90 text-white px-4 py-2.5 rounded-t-xl shadow-lg print:hidden">
          <div className="flex items-center gap-2">
            <span className="bg-green-500 text-white text-xs font-black px-2 py-0.5 rounded uppercase tracking-wider">
              {t('c5RatioPortrait') || 'C5 Portrait'}
            </span>
            <span className="text-xs text-gray-300 font-medium hidden sm:inline">162 × 229 mm</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleWhatsAppShare}
              className="p-1.5 bg-green-600 hover:bg-green-500 text-white rounded-lg transition"
              title={t('shareViaWhatsApp') || 'Share via WhatsApp'}
            >
              <WhatsappIcon className="h-4 w-4" />
            </button>
            <button
              onClick={handlePrint}
              className="p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition"
              title={t('printC5Card') || 'Print C5 Card'}
            >
              <PrinterIcon className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition ms-2"
              title={t('close') || 'Close'}
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* The C5 Portrait Card Container */}
        <div 
          id="oil-c5-print-section" 
          className="bg-white text-gray-900 w-full max-w-[430px] shadow-2xl rounded-b-xl border-x-2 border-b-2 border-gray-300 print:border-2 print:border-gray-800 print:shadow-none print:rounded-none overflow-hidden"
          style={{
            // Ratio 162/229 (approx 0.707 C5 portrait proportion)
            aspectRatio: '162 / 229',
            minHeight: '560px'
          }}
        >
          {/* Card Border & Decorative Header */}
          <div className="p-3.5 sm:p-4 flex flex-col h-full justify-between bg-gradient-to-b from-emerald-50/40 via-white to-gray-50/50">
            
            {/* Header */}
            <div>
              <div className="border-b-2 border-emerald-600 pb-2.5 mb-2.5">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <div className="bg-emerald-600 text-white p-1 rounded">
                        <TruckIcon className="h-4 w-4" />
                      </div>
                      <div>
                        <h1 className="text-xs sm:text-sm font-black text-gray-900 tracking-tight leading-none uppercase">
                          {t('alRasheedCo') || 'AL RASHEED CO.'}
                        </h1>
                        <p className="text-[10px] font-bold text-emerald-800 leading-tight">
                          شركة الرشيد المحدودة
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-end">
                    <span className="inline-block bg-emerald-700 text-white text-[9px] font-black px-2 py-0.5 rounded tracking-wider uppercase">
                      OIL SERVICE CARD
                    </span>
                    <p className="text-[9px] font-bold text-gray-500 mt-0.5">
                      بطاقة تغيير الزيت
                    </p>
                  </div>
                </div>
              </div>

              {/* Vehicle & Info Pill Grid */}
              <div className="bg-emerald-900 text-white rounded-lg p-2.5 mb-2.5 shadow-sm">
                <div className="flex justify-between items-center mb-1">
                  <div>
                    <p className="text-[9px] text-emerald-300 font-bold uppercase tracking-wider">
                      {t('vehicle') || 'Truck / Vehicle'}
                    </p>
                    <p className="text-sm sm:text-base font-black tracking-wide">
                      {vehicle?.vehicleCompanyNumber ? `${vehicle.vehicleCompanyNumber} - ` : ''}{vehiclePlate}
                    </p>
                  </div>
                  <div className="text-end">
                    <p className="text-[9px] text-emerald-300 font-bold uppercase">
                      {t('type') || 'Type'}
                    </p>
                    <p className="text-xs font-bold text-emerald-100">
                      {vehicle ? t(vehicle.vehiclesType) : 'Truck'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-1.5 pt-1.5 border-t border-emerald-700/60 text-[10px]">
                  <div>
                    <span className="text-emerald-300 block text-[8px]">{t('driver')}</span>
                    <span className="font-semibold truncate block">{log.driverName}</span>
                  </div>
                  <div>
                    <span className="text-emerald-300 block text-[8px]">{t('location')}</span>
                    <span className="font-semibold truncate block">{log.location}</span>
                  </div>
                  <div className="text-end">
                    <span className="text-emerald-300 block text-[8px]">{t('date')}</span>
                    <span className="font-semibold block">{formatDate(log.date)}</span>
                  </div>
                </div>
              </div>

              {/* Present Odometer Box - Prominent */}
              <div className="bg-gray-900 text-white rounded-lg p-2.5 mb-2.5 border-2 border-emerald-500/40 flex items-center justify-between shadow-inner">
                <div>
                  <span className="text-[9px] text-gray-400 uppercase tracking-wider block font-bold">
                    {t('currentOdometer') || 'Current Odometer Reading'}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-semibold block">
                    قراءة العداد الحالية عند التغيير
                  </span>
                </div>
                <div className="bg-black/80 px-3 py-1 rounded border border-gray-700 text-center font-mono">
                  <span className="text-base sm:text-lg font-black text-yellow-400 tracking-widest">
                    {currentOdo.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-gray-400 ms-1 font-bold">KM</span>
                </div>
              </div>

              {/* Services Performed in This Log */}
              <div className="bg-white rounded-lg border border-gray-200 p-2 mb-2 text-[10px]">
                <p className="font-bold text-gray-700 text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1">
                  <CheckCircleIcon className="h-3.5 w-3.5 text-emerald-600" />
                  {t('servicesPerformed') || 'Services Performed'}:
                </p>
                <div className="flex flex-wrap gap-1">
                  {(log.oilTypes || []).map((ot, i) => (
                    <span key={`ot-${i}`} className="bg-emerald-100 text-emerald-900 px-1.5 py-0.5 rounded text-[9px] font-bold border border-emerald-300">
                      🛢️ {t(`oilLog_${ot}` as any) !== `oilLog_${ot}` ? t(`oilLog_${ot}` as any) : ot}
                    </span>
                  ))}
                  {(log.filters || []).map((f, i) => (
                    <span key={`f-${i}`} className="bg-blue-100 text-blue-900 px-1.5 py-0.5 rounded text-[9px] font-bold border border-blue-300">
                      ⚙️ {t(`oilLog_${f}` as any) !== `oilLog_${f}` ? t(`oilLog_${f}` as any) : f}
                    </span>
                  ))}
                  {(!log.oilTypes?.length && !log.filters?.length) && (
                    <span className="text-gray-400 italic text-[9px]">Standard Service</span>
                  )}
                </div>
              </div>

              {/* Next Due Schedule Table - The Core Feature */}
              <div className="rounded-lg border-2 border-emerald-600/30 overflow-hidden bg-white mb-2 shadow-sm">
                <div className="bg-emerald-700 text-white px-2.5 py-1 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider">
                    {t('nextDueSchedule') || 'Next Due Schedule (Odometer)'}
                  </span>
                  <span className="text-[9px] text-emerald-100 font-bold">
                    قراءة العداد القادمة
                  </span>
                </div>

                <div className="divide-y divide-gray-200 text-[10px]">
                  {schedule.map((item) => {
                    const name = language === 'ar' ? item.nameAr : item.defaultName;
                    return (
                      <div 
                        key={item.id} 
                        className={`flex items-center justify-between px-2.5 py-1.5 transition ${
                          item.wasChanged ? 'bg-emerald-50/70 font-semibold' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 min-w-0 pr-1">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${
                            item.wasChanged ? 'bg-emerald-600' : 'bg-gray-300'
                          }`} />
                          <div className="truncate">
                            <span className="text-gray-900 block truncate font-medium text-[10px]">
                              {name}
                            </span>
                            <span className="text-[8px] text-gray-500 block">
                              (+{item.intervalKm.toLocaleString()} KM)
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {item.wasChanged && (
                            <span className="bg-emerald-600 text-white text-[8px] font-bold px-1 py-0.5 rounded leading-none hidden xs:inline">
                              {language === 'ar' ? 'تم تغييره' : 'Changed'}
                            </span>
                          )}
                          <div className="text-end bg-gray-100 px-2 py-0.5 rounded border border-gray-300 font-mono">
                            <span className="text-xs font-black text-emerald-800">
                              {item.nextOdo.toLocaleString()}
                            </span>
                            <span className="text-[8px] text-gray-500 ms-0.5 font-sans font-bold">KM</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {log.remarks && (
                <div className="bg-amber-50 rounded border border-amber-200 p-1.5 mb-2 text-[9px] text-amber-900">
                  <span className="font-bold">{t('remarks')}:</span> {log.remarks}
                </div>
              )}
            </div>

            {/* Bottom Signatures & Stamp block */}
            <div className="pt-2 border-t border-gray-300">
              <div className="grid grid-cols-2 gap-4 text-[9px] text-gray-600 mb-1.5">
                <div className="border-t border-dashed border-gray-400 pt-1 text-center">
                  <p className="font-bold text-gray-700">{t('driver') || 'Driver'}</p>
                  <p className="text-[8px] text-gray-400 italic">توقيع السائق</p>
                </div>
                <div className="border-t border-dashed border-gray-400 pt-1 text-center">
                  <p className="font-bold text-gray-700">{t('workshopForeman') || 'Technician / Foreman'}</p>
                  <p className="text-[8px] text-gray-400 italic">مسؤول الصيانة والختم</p>
                </div>
              </div>

              <div className="text-center text-[8px] text-gray-400 border-t border-gray-100 pt-1 flex justify-between">
                <span>Ref: #{log.id.slice(0, 8)}</span>
                <span>Al Rasheed Co. Maintenance System • C5 Standard</span>
              </div>
            </div>

          </div>
        </div>

        {/* Bottom Actions Bar (Screen only) */}
        <div className="w-full max-w-[430px] flex flex-wrap items-center justify-between gap-2 bg-white p-3 rounded-b-xl shadow-lg mt-2 print:hidden border border-gray-200">
          <div className="flex items-center gap-2">
            <button
              onClick={handleWhatsAppShare}
              className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm"
            >
              <WhatsappIcon className="h-4 w-4" />
              {t('shareViaWhatsApp') || 'WhatsApp'}
            </button>
            <button
              onClick={handleCopyDetails}
              className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-1.5 rounded-lg text-xs font-medium transition border border-gray-300"
            >
              <ShareIcon className="h-3.5 w-3.5" />
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition shadow-sm"
            >
              <PrinterIcon className="h-4 w-4" />
              {t('printC5Card') || 'Print C5 Card'}
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-800 font-semibold"
            >
              {t('close') || 'Close'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
