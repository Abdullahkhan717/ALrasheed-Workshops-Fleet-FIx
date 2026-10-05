import React, { useState } from 'react';
import type { TyreLog, Vehicle } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { XMarkIcon, WhatsappIcon, PrinterIcon, SpeedometerIcon, ClipboardDocumentCheckIcon } from './Icons';
import { formatVehicleInfo, formatDate, parseDate } from '../utils/formatters';
import { parseOdometer } from '../utils/oilSchedule';

interface TyreLifespanModalProps {
  serialNumber: string;
  tyreLogs: TyreLog[];
  vehicles: Vehicle[];
  onClose: () => void;
  onOpenDetails?: () => void;
}

export const TyreLifespanModal: React.FC<TyreLifespanModalProps> = ({
  serialNumber,
  tyreLogs,
  vehicles,
  onClose,
  onOpenDetails
}) => {
  const { t } = useTranslation();

  // Find all logs related to this tyre serial number
  const history = tyreLogs
    .filter(log => log.tyreDetails?.some(td => td.serialNumber === serialNumber))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const latestLog = history[0];
  const tyreDetail = latestLog?.tyreDetails.find(td => td.serialNumber === serialNumber);

  const installedOdo = latestLog ? parseOdometer(latestLog.mileage) : 0;
  const [currentOdoInput, setCurrentOdoInput] = useState<string>('');
  const [benchmarkKm, setBenchmarkKm] = useState<number>(100000);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const getVehicleInfo = (vehicleId: string) => {
    const vehicle = vehicles.find(v => String(v.id) === String(vehicleId));
    return formatVehicleInfo(vehicle, t, vehicleId);
  };

  const currentOdo = parseOdometer(currentOdoInput);
  const hasInput = currentOdoInput.trim().length > 0;
  const isInvalidReading = hasInput && currentOdo < installedOdo;

  const lifeSpentKm = hasInput && currentOdo >= installedOdo ? currentOdo - installedOdo : 0;

  // Days calculation
  const installDate = latestLog ? parseDate(latestLog.date) : new Date();
  const today = new Date();
  const diffTime = Math.max(0, today.getTime() - installDate.getTime());
  const daysInService = Math.max(1, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
  const monthsInService = (daysInService / 30.4).toFixed(1);

  const avgKmPerDay = daysInService > 0 ? Math.round(lifeSpentKm / daysInService) : 0;
  const avgKmPerMonth = Math.round(avgKmPerDay * 30.4);

  const percentageSpent = benchmarkKm > 0 ? Math.min(200, Math.round((lifeSpentKm / benchmarkKm) * 100)) : 0;

  // Health Status
  const getStatusInfo = () => {
    if (percentageSpent < 35) {
      return {
        label: t('excellentCondition') || 'Excellent (Low Usage)',
        color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
        barColor: 'bg-emerald-500',
        badge: '🟢'
      };
    }
    if (percentageSpent < 70) {
      return {
        label: t('goodCondition') || 'Good (Normal Wear)',
        color: 'text-blue-700 bg-blue-50 border-blue-200',
        barColor: 'bg-blue-500',
        badge: '🔵'
      };
    }
    if (percentageSpent < 90) {
      return {
        label: t('fairCondition') || 'Moderate Wear (Mid-Life)',
        color: 'text-amber-700 bg-amber-50 border-amber-200',
        barColor: 'bg-amber-500',
        badge: '🟡'
      };
    }
    if (percentageSpent <= 100) {
      return {
        label: t('warningNearReplacement') || 'Warning: Near Replacement',
        color: 'text-orange-700 bg-orange-50 border-orange-200',
        barColor: 'bg-orange-500',
        badge: '🟠'
      };
    }
    return {
      label: t('expiredReplacementNeeded') || 'Replacement Needed / Exceeded',
      color: 'text-red-700 bg-red-50 border-red-200',
      barColor: 'bg-red-500',
      badge: '🔴'
    };
  };

  const statusInfo = getStatusInfo();

  const generateReportText = () => {
    const vehName = latestLog ? getVehicleInfo(latestLog.vehicleId) : '-';
    return [
      `══════════════════════════════`,
      `🛞 *${t('tyreLifespan') || 'TYRE LIFESPAN REPORT'}*`,
      `══════════════════════════════`,
      `🔢 *${t('serialNumber')}*: ${serialNumber}`,
      `🏷️ *${t('brand')}*: ${tyreDetail?.brand || '-'}`,
      `📏 *${t('size')}*: ${tyreDetail?.size || '-'}`,
      `⚙️ *${t('condition')}*: ${tyreDetail?.condition || '-'}`,
      `🚚 *${t('vehicle')}*: ${vehName}`,
      `📍 *${t('workshopLocation')}*: ${latestLog?.workshopLocation || '-'}`,
      `👤 *${t('driver')}*: ${latestLog?.driverName || '-'}`,
      `──────────────────────────────`,
      `📅 *${t('installedDate')}*: ${formatDate(latestLog?.date)}`,
      `🏁 *${t('installedOdometer')}*: ${installedOdo.toLocaleString()} KM`,
      `📍 *${t('currentOdometer')}*: ${currentOdo.toLocaleString()} KM`,
      `──────────────────────────────`,
      `⚡ *${t('distanceCovered')}*: *${lifeSpentKm.toLocaleString()} KM*`,
      `⏱️ *${t('daysInService')}*: ${daysInService} ${t('days') || 'Days'} (~${monthsInService} ${t('months') || 'Months'})`,
      `📊 *${t('avgKmPerDay')}*: ${avgKmPerDay.toLocaleString()} KM / ${t('day') || 'day'}`,
      `🩺 *${t('lifespanStatus')}*: ${statusInfo.badge} ${statusInfo.label} (${percentageSpent}%)`,
      `══════════════════════════════`,
      `AlRasheed Co Workshop System`
    ].join('\n');
  };

  const handleCopyReport = async () => {
    try {
      await navigator.clipboard.writeText(generateReportText());
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(generateReportText());
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  if (!latestLog || !tyreDetail) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex justify-center items-center z-50 p-4">
        <div className="bg-white rounded-2xl w-full max-w-md p-6 text-center shadow-xl">
          <p className="text-gray-500 font-medium mb-4">{t('tyreNotFound') || 'Tyre not found.'}</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-bold text-sm"
          >
            {t('close') || 'Close'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex justify-center items-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-2xl my-8 overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-700 to-teal-800 text-white flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl">
              <SpeedometerIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold">
                {t('checkLifespan') || 'Check Tyre Lifespan'}
              </h2>
              <p className="text-xs text-emerald-100 flex items-center gap-2 mt-0.5">
                <span>{t('serialNumber')}:</span>
                <span className="font-mono font-bold bg-white/20 px-2 py-0.5 rounded text-white">
                  {serialNumber}
                </span>
                {tyreDetail.brand && <span>• {tyreDetail.brand}</span>}
                {tyreDetail.size && <span>• {tyreDetail.size}</span>}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
          >
            <XMarkIcon className="h-6 w-6 text-white" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-6">
          {/* Vehicle & Installation Context */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 p-4 rounded-xl border border-gray-200 text-xs">
            <div>
              <p className="text-gray-400 font-bold uppercase text-[10px] mb-0.5">{t('currentVehicle') || t('vehicle')}</p>
              <p className="font-bold text-gray-800 truncate">{getVehicleInfo(latestLog.vehicleId)}</p>
            </div>
            <div>
              <p className="text-gray-400 font-bold uppercase text-[10px] mb-0.5">{t('installedDate')}</p>
              <p className="font-bold text-gray-800">{formatDate(latestLog.date)}</p>
            </div>
            <div>
              <p className="text-gray-400 font-bold uppercase text-[10px] mb-0.5">{t('installedOdometer')}</p>
              <p className="font-bold font-mono text-emerald-700 text-sm">{installedOdo.toLocaleString()} KM</p>
            </div>
            <div>
              <p className="text-gray-400 font-bold uppercase text-[10px] mb-0.5">{t('condition')}</p>
              <p className="font-bold text-gray-800">{tyreDetail.condition || '-'}</p>
            </div>
          </div>

          {/* Odometer Input Card */}
          <div className="bg-gradient-to-br from-emerald-50/70 to-teal-50/50 p-5 rounded-2xl border-2 border-emerald-200/80 shadow-xs">
            <label className="block text-xs font-black uppercase tracking-wider text-emerald-900 mb-2">
              🔢 {t('enterCurrentOdo') || 'Enter Current Odometer Reading (KM)'}
            </label>
            <div className="relative">
              <input
                type="number"
                value={currentOdoInput}
                onChange={(e) => setCurrentOdoInput(e.target.value)}
                placeholder={`e.g. ${(installedOdo + 15000).toLocaleString()}`}
                className="w-full p-3.5 pe-16 border-2 border-emerald-400 rounded-xl text-lg font-mono font-bold text-gray-900 focus:outline-none focus:ring-4 focus:ring-emerald-200 bg-white shadow-inner"
                autoFocus
              />
              <span className="absolute end-4 top-1/2 -translate-y-1/2 text-xs font-black text-gray-400 font-mono">
                KM
              </span>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-2 mt-3 items-center">
              <span className="text-[11px] font-bold text-gray-500 uppercase">Quick Add:</span>
              {[5000, 15000, 30000, 50000, 80000].map(addKm => (
                <button
                  key={addKm}
                  type="button"
                  onClick={() => setCurrentOdoInput(String(installedOdo + addKm))}
                  className="px-2.5 py-1 text-xs font-mono font-semibold bg-white hover:bg-emerald-100 text-emerald-800 rounded-lg border border-emerald-300 transition"
                >
                  +{addKm.toLocaleString()} KM
                </button>
              ))}
            </div>

            {isInvalidReading && (
              <p className="text-xs text-red-600 font-bold mt-2 bg-red-50 p-2 rounded-lg border border-red-200">
                ⚠️ {t('currentReadingMustBeHigher') || 'Current reading should be greater than or equal to installed mileage.'}
              </p>
            )}
          </div>

          {/* Formatted Lifespan Result */}
          {hasInput && !isInvalidReading && (
            <div className="space-y-4 animate-in fade-in duration-300">
              {/* Highlight Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Distance Covered */}
                <div className="bg-white p-4 rounded-xl border-2 border-emerald-300 shadow-xs flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
                      {t('distanceCovered') || 'Distance Covered'}
                    </span>
                    <p className="text-2xl md:text-3xl font-black font-mono text-emerald-600 mt-1">
                      {lifeSpentKm.toLocaleString()}
                      <span className="text-xs text-gray-500 font-normal ms-1">KM</span>
                    </p>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-2 border-t border-gray-100 pt-1.5 font-mono">
                    {currentOdo.toLocaleString()} - {installedOdo.toLocaleString()}
                  </p>
                </div>

                {/* Duration */}
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
                      {t('daysInService') || 'Duration in Service'}
                    </span>
                    <p className="text-2xl font-black text-gray-800 mt-1">
                      {daysInService}
                      <span className="text-xs text-gray-500 font-normal ms-1">{t('days') || 'days'}</span>
                    </p>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-2 border-t border-gray-100 pt-1.5">
                    ~{monthsInService} {t('months') || 'months'}
                  </p>
                </div>

                {/* Average Daily Usage */}
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
                      {t('avgKmPerDay') || 'Avg Usage / Day'}
                    </span>
                    <p className="text-2xl font-black font-mono text-teal-700 mt-1">
                      {avgKmPerDay.toLocaleString()}
                      <span className="text-xs text-gray-500 font-normal ms-1">KM/day</span>
                    </p>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-2 border-t border-gray-100 pt-1.5 font-mono">
                    ~{avgKmPerMonth.toLocaleString()} KM/month
                  </p>
                </div>
              </div>

              {/* Lifecycle Progress Bar */}
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-700">{t('lifespanStatus') || 'Lifespan Health'}:</span>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black border ${statusInfo.color}`}>
                      <span>{statusInfo.badge}</span>
                      <span>{statusInfo.label}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-500">
                    <span className="font-bold font-mono text-gray-800">{percentageSpent}%</span>
                    <span>of {benchmarkKm.toLocaleString()} KM</span>
                  </div>
                </div>

                {/* Progress track */}
                <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden p-0.5 border border-gray-200">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${statusInfo.barColor}`}
                    style={{ width: `${Math.min(100, percentageSpent)}%` }}
                  />
                </div>

                {/* Target Benchmark Switcher */}
                <div className="flex justify-between items-center pt-1 text-[11px] text-gray-500">
                  <span>Target Benchmark:</span>
                  <div className="flex gap-1.5">
                    {[80000, 100000, 120000].map(bm => (
                      <button
                        key={bm}
                        type="button"
                        onClick={() => setBenchmarkKm(bm)}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition ${benchmarkKm === bm ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                      >
                        {(bm / 1000)}k KM
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Formatted Report Card (Visual Format) */}
              <div className="bg-gray-900 text-gray-100 p-4 md:p-5 rounded-2xl shadow-lg border border-gray-800 relative font-mono text-xs space-y-3">
                <div className="flex justify-between items-center border-b border-gray-800 pb-2.5">
                  <span className="text-emerald-400 font-bold tracking-wider uppercase text-[11px] flex items-center gap-1.5">
                    <span>🛞</span>
                    <span>{t('tyreLifespan') || 'TYRE LIFESPAN REPORT'}</span>
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {new Date().toLocaleDateString()}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-[11px]">
                  <div>
                    <span className="text-gray-400 block text-[9px] uppercase">{t('serialNumber')}:</span>
                    <span className="font-bold text-white text-sm">{serialNumber}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[9px] uppercase">{t('brand')} & {t('size')}:</span>
                    <span className="font-bold text-white">{tyreDetail.brand || '-'} ({tyreDetail.size || '-'})</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[9px] uppercase">{t('vehicle')}:</span>
                    <span className="font-bold text-emerald-300">{getVehicleInfo(latestLog.vehicleId)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[9px] uppercase">{t('workshopLocation')}:</span>
                    <span className="text-gray-300">{latestLog.workshopLocation || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[9px] uppercase">{t('installedOdometer')}:</span>
                    <span className="text-gray-300">{installedOdo.toLocaleString()} KM ({formatDate(latestLog.date)})</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[9px] uppercase">{t('currentOdometer')}:</span>
                    <span className="text-emerald-300 font-bold">{currentOdo.toLocaleString()} KM</span>
                  </div>
                </div>

                <div className="border-t border-gray-800 pt-3 bg-gray-950/60 -mx-4 md:-mx-5 -mb-4 md:-mb-5 p-4 rounded-b-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                  <div>
                    <span className="text-gray-400 text-[10px] block uppercase font-bold">{t('distanceCovered')} (Life Spent):</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-emerald-400">{lifeSpentKm.toLocaleString()} KM</span>
                      <span className="text-[11px] text-gray-400">({daysInService} days • {avgKmPerDay} KM/day)</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleCopyReport}
                      className="flex items-center gap-1.5 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-xs font-bold transition active:scale-95"
                    >
                      <ClipboardDocumentCheckIcon className="h-4 w-4 text-emerald-400" />
                      <span>{isCopied ? (t('reportCopied') || 'Copied!') : (t('copyLifespanReport') || 'Copy')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleShareWhatsApp}
                      className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-md active:scale-95"
                    >
                      <WhatsappIcon className="h-4 w-4 text-white" />
                      <span>{t('share') || 'WhatsApp'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex flex-wrap justify-between items-center gap-2">
          {onOpenDetails ? (
            <button
              type="button"
              onClick={onOpenDetails}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-900 underline"
            >
              {t('viewDetails') || 'View Full Tyre History'} →
            </button>
          ) : <div />}

          <div className="flex gap-2">
            {hasInput && !isInvalidReading && (
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-xl text-xs font-bold transition shadow-xs"
              >
                <PrinterIcon className="h-4 w-4" />
                <span>{t('print')}</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl text-xs font-bold transition"
            >
              {t('close') || 'Close'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
