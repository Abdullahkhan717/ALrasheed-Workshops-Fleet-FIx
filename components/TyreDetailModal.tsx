import React, { useState, useEffect } from 'react';
import { XMarkIcon, ShareIcon, PencilIcon, ArrowsRightLeftIcon, PrinterIcon, CheckCircleIcon } from './Icons';
import { useTranslation } from '../hooks/useTranslation';
import type { TyreLog, Vehicle } from '../types';
import { formatVehicleInfo, formatDate, formatTime } from '../utils/formatters';

interface TyreDetailModalProps {
  serialNumber: string;
  tyreLogs: TyreLog[];
  vehicles: Vehicle[];
  onClose: () => void;
  onEdit?: (log: TyreLog) => void;
  onTransfer?: (serial: string) => void;
}

export const TyreDetailModal: React.FC<TyreDetailModalProps> = ({ 
  serialNumber, 
  tyreLogs, 
  vehicles, 
  onClose,
  onEdit,
  onTransfer
}) => {
  const { t } = useTranslation();
  const [selectedLogIds, setSelectedLogIds] = useState<string[]>([]);

  // Find all logs related to this tyre serial number
  const history = tyreLogs
    .filter(log => log.tyreDetails?.some(td => td.serialNumber === serialNumber))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  useEffect(() => {
    // Select all logs by default when component mounts or serialNumber changes
    if (history.length > 0) {
      setSelectedLogIds(history.map(log => log.id).filter(id => id !== undefined) as string[]);
    }
  }, [serialNumber]);

  const selectedLogs = history.filter(log => selectedLogIds.includes(log.id as string));
  const latestLog = history[0];
  const tyreDetail = latestLog?.tyreDetails.find(td => td.serialNumber === serialNumber);

  const getVehicleInfo = (vehicleId: string) => {
    const vehicle = vehicles.find(v => String(v.id) === String(vehicleId));
    return formatVehicleInfo(vehicle, t, vehicleId);
  };

  const handleToggleSelectAll = () => {
    if (selectedLogIds.length === history.length) {
      setSelectedLogIds([]);
    } else {
      setSelectedLogIds(history.map(log => log.id).filter(id => id !== undefined) as string[]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedLogIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleWhatsAppShare = () => {
    if (!tyreDetail || selectedLogs.length === 0) return;

    let message = `📦 *${t('tyreHistory')}*\n`;
    message += `🔢 *${t('serialNumber')}*: ${serialNumber}\n`;
    message += `🏷️ *${t('brand')}*: ${tyreDetail.brand || '-'}\n`;
    message += `📏 *${t('size')}*: ${tyreDetail.size}\n\n`;

    selectedLogs.forEach((log, index) => {
      const td = log.tyreDetails.find(d => d.serialNumber === serialNumber);
      if (!td) return;
      
      const condition = td.condition === 'NEW' || td.condition === 'New' ? t('tyreType_NEW') : 
                       td.condition === 'Used' ? t('tyreType_Used') : 
                       td.condition === 'Repaired' ? t('tyreType_Repaired') : td.condition;

      message += `📌 *${t('record')} ${selectedLogs.length - index}*\n`;
      message += `🚗 *${t('vehicle')}*: ${getVehicleInfo(log.vehicleId)}\n`;
      message += `📅 *${t('date')}*: ${formatDate(log.date)}\n`;
      message += `📍 *${t('workshop')}*: ${log.workshopLocation}\n`;
      message += `👤 *${t('driver')}*: ${log.driverName}\n`;
      message += `🛣️ *${t('mileage')}*: ${log.mileage}\n`;
      message += `⚙️ *${t('condition')}*: ${condition}\n`;
      
      if (td.fromVehicle) {
        message += `🔄 *${t('fromVehicle')}*: ${td.fromVehicle}\n`;
      }
      if (td.remarks) {
        message += `📝 *${t('remarks')}*: ${td.remarks}\n`;
      }
      message += `\n`;
    });

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  if (!tyreDetail) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 md:p-6 bg-white border-b flex justify-between items-center sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{t('tyreDetails')}</h2>
            <p className="text-sm text-gray-500">{t('serialNumber')}: <span className="font-mono font-bold text-green-600">{serialNumber}</span></p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <XMarkIcon className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">{t('brand')}</p>
              <p className="font-bold text-gray-800">{tyreDetail.brand || '-'}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">{t('size')}</p>
              <p className="font-bold text-gray-800">{tyreDetail.size}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">{t('condition')}</p>
              <p className="font-bold text-gray-800">
                {tyreDetail.condition === 'NEW' || tyreDetail.condition === 'New' ? t('tyreType_NEW') : 
                 tyreDetail.condition === 'Used' ? t('tyreType_Used') : 
                 tyreDetail.condition === 'Repaired' ? t('tyreType_Repaired') : tyreDetail.condition}
              </p>
            </div>
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 col-span-2 md:col-span-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">{t('currentVehicle') || t('vehicle')}</p>
              <p className="font-bold text-gray-800">{getVehicleInfo(latestLog.vehicleId)}</p>
            </div>
          </div>

          {/* History Timeline */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest flex items-center">
                <span className="bg-green-100 text-green-600 p-1 rounded mr-2">
                  <ArrowsRightLeftIcon className="h-4 w-4" />
                </span>
                {t('tyreHistory')}
              </h3>
              <button 
                onClick={handleToggleSelectAll}
                className="text-xs font-bold text-green-600 hover:text-green-700 bg-green-50 px-3 py-1 rounded-full border border-green-100 transition-colors"
              >
                {selectedLogIds.length === history.length ? t('deselectAll') : t('selectAll')}
              </button>
            </div>
            
            <div className="relative space-y-4 before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
              {history.map((log, index) => {
                const isSelected = selectedLogIds.includes(log.id as string);
                const logTyreDetail = log.tyreDetails.find(td => td.serialNumber === serialNumber);
                
                return (
                  <div key={log.id} className="relative pl-10">
                    <div 
                      onClick={() => handleToggleSelect(log.id as string)}
                      className={`absolute left-0 top-1.5 w-8 h-8 rounded-full border-4 border-white flex items-center justify-center shadow-sm cursor-pointer transition-colors ${isSelected ? 'bg-green-500' : 'bg-gray-200'}`}
                    >
                      {isSelected && <CheckCircleIcon className="h-5 w-5 text-white" />}
                      {!isSelected && <div className="w-2 h-2 bg-white rounded-full"></div>}
                    </div>
                    <div 
                      onClick={() => handleToggleSelect(log.id as string)}
                      className={`bg-white border rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer p-4 ${isSelected ? 'border-green-200 bg-green-50/30' : 'border-gray-100'}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-bold text-gray-900">{getVehicleInfo(log.vehicleId)}</p>
                        <span className="text-[10px] bg-white px-2 py-1 rounded shadow-sm border border-gray-100 text-gray-500 font-medium">{formatDate(log.date)}</span>
                      </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                          <div><span className="text-gray-400 uppercase text-[9px] font-bold block">{t('workshop')}</span> {log.workshopLocation}</div>
                          <div><span className="text-gray-400 uppercase text-[9px] font-bold block">{t('driver')}</span> {log.driverName}</div>
                          <div><span className="text-gray-400 uppercase text-[9px] font-bold block">{t('mileage')}</span> {log.mileage}</div>
                          <div>
                            <span className="text-gray-400 uppercase text-[9px] font-bold block">{t('condition')}</span>
                            {logTyreDetail?.condition === 'NEW' || logTyreDetail?.condition === 'New' ? t('tyreType_NEW') : 
                             logTyreDetail?.condition === 'Used' ? t('tyreType_Used') : 
                             logTyreDetail?.condition === 'Repaired' ? t('tyreType_Repaired') : logTyreDetail?.condition}
                          </div>
                          {logTyreDetail?.fromVehicle && (
                            <div className="col-span-2"><span className="text-gray-400 uppercase text-[9px] font-bold block">{t('fromVehicle')}</span> {logTyreDetail.fromVehicle}</div>
                          )}
                          {logTyreDetail?.remarks && (
                            <div className="col-span-2"><span className="text-gray-400 uppercase text-[9px] font-bold block">{t('remarks')}</span> {logTyreDetail.remarks}</div>
                          )}
                        </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Hidden Print Section */}
        <div id="tyre-print-section" className="hidden print:block font-sans text-black p-8">
          <div className="text-center mb-8 border-b-2 border-black pb-4">
            <h1 className="text-3xl font-black uppercase tracking-widest">{t('tyreHistory')}</h1>
            <p className="text-lg font-bold mt-2 font-mono">{serialNumber}</p>
          </div>

          <div className="grid grid-cols-3 gap-6 mb-8 bg-gray-50 p-4 border border-black">
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase">{t('brand')}</p>
              <p className="text-lg font-bold">{tyreDetail.brand || '-'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase">{t('size')}</p>
              <p className="text-lg font-bold">{tyreDetail.size}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase">{t('currentVehicle')}</p>
              <p className="text-lg font-bold">{getVehicleInfo(latestLog.vehicleId)}</p>
            </div>
          </div>

          <div className="space-y-6">
            {selectedLogs.map((log, index) => {
              const td = log.tyreDetails.find(d => d.serialNumber === serialNumber);
              return (
                <div key={log.id} className="border-2 border-black p-4 page-break-inside-avoid">
                  <div className="flex justify-between items-center mb-4 border-b border-black pb-2">
                    <h2 className="text-xl font-bold uppercase">{t('record')} {selectedLogs.length - index}</h2>
                    <p className="font-bold font-mono">{formatDate(log.date)}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-y-4 gap-x-12">
                    <div className="flex justify-between border-b border-gray-300">
                      <span className="font-bold text-xs uppercase text-gray-600">{t('vehicle')}:</span>
                      <span className="font-bold">{getVehicleInfo(log.vehicleId)}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-300">
                      <span className="font-bold text-xs uppercase text-gray-600">{t('workshop')}:</span>
                      <span className="font-bold">{log.workshopLocation}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-300">
                      <span className="font-bold text-xs uppercase text-gray-600">{t('driver')}:</span>
                      <span className="font-bold">{log.driverName}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-300">
                      <span className="font-bold text-xs uppercase text-gray-600">{t('mileage')}:</span>
                      <span className="font-bold">{log.mileage}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-300">
                      <span className="font-bold text-xs uppercase text-gray-600">{t('condition')}:</span>
                      <span className="font-bold">
                        {td?.condition === 'NEW' || td?.condition === 'New' ? t('tyreType_NEW') : 
                         td?.condition === 'Used' ? t('tyreType_Used') : 
                         td?.condition === 'Repaired' ? t('tyreType_Repaired') : td?.condition}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-gray-300">
                      <span className="font-bold text-xs uppercase text-gray-600">{t('fromVehicle')}:</span>
                      <span className="font-bold">{td?.fromVehicle || '-'}</span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <span className="font-bold text-xs uppercase text-gray-600 block mb-1">{t('remarks')}:</span>
                    <p className="text-sm italic">{td?.remarks || '-'}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-12 pt-8 border-t-2 border-black flex justify-between text-xs font-bold uppercase tracking-widest text-gray-500">
            <span>AlRasheed Co Workshop System</span>
            <span>Generated: {new Date().toLocaleString()}</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 md:p-6 bg-gray-50 border-t flex flex-wrap gap-3">
          <button 
            onClick={handleWhatsAppShare}
            disabled={selectedLogs.length === 0}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl transition-all font-bold text-sm ${selectedLogs.length > 0 ? 'bg-teal-600 text-white hover:bg-teal-700 shadow-md active:scale-95' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
          >
            <ShareIcon className="h-5 w-5" />
            {t('share')} ({selectedLogs.length})
          </button>

          <button 
            onClick={handlePrint}
            disabled={selectedLogs.length === 0}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl transition-all font-bold text-sm ${selectedLogs.length > 0 ? 'bg-gray-800 text-white hover:bg-gray-900 shadow-md active:scale-95' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
          >
            <PrinterIcon className="h-5 w-5" />
            {t('print')} ({selectedLogs.length})
          </button>
          
          {onEdit && (
            <button 
              onClick={() => onEdit(latestLog)}
              className="flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-200 px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-colors font-bold text-sm"
            >
              <PencilIcon className="h-5 w-5" />
              {t('editTyre')}
            </button>
          )}

          {onTransfer && (
            <button 
              onClick={() => onTransfer(serialNumber)}
              className="flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-200 px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-colors font-bold text-sm"
            >
              <ArrowsRightLeftIcon className="h-5 w-5" />
              {t('transferTyre')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
