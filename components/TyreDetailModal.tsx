import React from 'react';
import { XMarkIcon, ShareIcon, PencilIcon, ArrowsRightLeftIcon, PrinterIcon } from './Icons';
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

  // Find all logs related to this tyre serial number
  const history = tyreLogs
    .filter(log => log.tyreDetails?.some(td => td.serialNumber === serialNumber))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const latestLog = history[0];
  const tyreDetail = latestLog?.tyreDetails.find(td => td.serialNumber === serialNumber);

  const getVehicleInfo = (vehicleId: string) => {
    const vehicle = vehicles.find(v => String(v.id) === String(vehicleId));
    return formatVehicleInfo(vehicle, t, vehicleId);
  };

  const handleWhatsAppShare = () => {
    if (!tyreDetail) return;

    const condition = tyreDetail.condition === 'NEW' || tyreDetail.condition === 'New' ? t('tyreType_NEW') : 
                     tyreDetail.condition === 'Used' ? t('tyreType_Used') : 
                     tyreDetail.condition === 'Repaired' ? t('tyreType_Repaired') : tyreDetail.condition;

    let message = `${t('tyreHistory')}\n`;
    message += `${t('serialNumber')}: ${serialNumber}\n`;
    message += `${t('brand')}: ${tyreDetail.brand || '-'}\n`;
    message += `${t('size')}: ${tyreDetail.size}\n`;
    message += `${t('condition')}: ${condition}\n`;
    message += `${getVehicleInfo(latestLog.vehicleId)}\n`;
    message += `${t('date')}: ${formatDate(latestLog.date)}\n`;
    message += `${t('workshop')}: ${latestLog.workshopLocation}\n`;
    message += `${t('driver')}/${t('complainer') || 'complainer'}: ${latestLog.driverName}\n`;
    message += `${t('mileage')} / KM: ${latestLog.mileage}\n`;
    
    if (tyreDetail.fromVehicle) {
      message += `${t('fromVehicle')}: ${tyreDetail.fromVehicle}\n`;
    }
    if (tyreDetail.remarks) {
      message += `${t('remarks')}: ${tyreDetail.remarks}\n`;
    }

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
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center">
              <span className="bg-green-100 text-green-600 p-1 rounded mr-2">
                <ArrowsRightLeftIcon className="h-4 w-4" />
              </span>
              {t('tyreHistory')}
            </h3>
            <div className="relative space-y-4 before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
              {history.map((log, index) => (
                <div key={log.id} className="relative pl-10">
                  <div className={`absolute left-0 top-1.5 w-8 h-8 rounded-full border-4 border-white flex items-center justify-center shadow-sm ${index === 0 ? 'bg-green-500' : 'bg-gray-300'}`}>
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                  <div className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-bold text-gray-900">{getVehicleInfo(log.vehicleId)}</p>
                      <span className="text-[10px] bg-gray-50 px-2 py-1 rounded text-gray-500 font-medium">{formatDate(log.date)}</span>
                    </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                        <div><span className="text-gray-400">{t('workshop')}:</span> {log.workshopLocation}</div>
                        <div><span className="text-gray-400">{t('driver')}:</span> {log.driverName}</div>
                        <div><span className="text-gray-400">{t('mileage')}:</span> {log.mileage}</div>
                        {log.tyreDetails.find(td => td.serialNumber === serialNumber)?.fromVehicle && (
                          <div className="col-span-2"><span className="text-gray-400">{t('fromVehicle')}:</span> {log.tyreDetails.find(td => td.serialNumber === serialNumber)?.fromVehicle}</div>
                        )}
                        {log.tyreDetails.find(td => td.serialNumber === serialNumber)?.remarks && (
                          <div className="col-span-2"><span className="text-gray-400">{t('remarks')}:</span> {log.tyreDetails.find(td => td.serialNumber === serialNumber)?.remarks}</div>
                        )}
                      </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Hidden Print Section */}
        <div id="tyre-print-section" className="hidden print:block font-sans text-black">
          <div className="border-2 border-black p-6 h-full flex flex-col justify-between">
            <div>
              <h1 className="text-2xl font-bold border-b-2 border-black pb-2 mb-4 text-center uppercase tracking-wider">{t('tyreHistory')}</h1>
              <div className="grid grid-cols-2 gap-y-3 gap-x-8">
                <div className="flex justify-between border-b border-gray-300 pb-1">
                  <span className="font-bold text-sm uppercase text-gray-600">{t('serialNumber')}:</span>
                  <span className="font-mono font-bold text-lg">{serialNumber}</span>
                </div>
                <div className="flex justify-between border-b border-gray-300 pb-1">
                  <span className="font-bold text-sm uppercase text-gray-600">{t('brand')}:</span>
                  <span className="font-bold">{tyreDetail.brand || '-'}</span>
                </div>
                <div className="flex justify-between border-b border-gray-300 pb-1">
                  <span className="font-bold text-sm uppercase text-gray-600">{t('size')}:</span>
                  <span className="font-bold">{tyreDetail.size}</span>
                </div>
                <div className="flex justify-between border-b border-gray-300 pb-1">
                  <span className="font-bold text-sm uppercase text-gray-600">{t('condition')}:</span>
                  <span className="font-bold">
                    {tyreDetail.condition === 'NEW' || tyreDetail.condition === 'New' ? t('tyreType_NEW') : 
                     tyreDetail.condition === 'Used' ? t('tyreType_Used') : 
                     tyreDetail.condition === 'Repaired' ? t('tyreType_Repaired') : tyreDetail.condition}
                  </span>
                </div>
                <div className="flex justify-between border-b border-gray-300 pb-1">
                  <span className="font-bold text-sm uppercase text-gray-600">{t('vehicle')}:</span>
                  <span className="font-bold">{getVehicleInfo(latestLog.vehicleId)}</span>
                </div>
                <div className="flex justify-between border-b border-gray-300 pb-1">
                  <span className="font-bold text-sm uppercase text-gray-600">{t('date')}:</span>
                  <span className="font-bold">{formatDate(latestLog.date)}</span>
                </div>
                <div className="flex justify-between border-b border-gray-300 pb-1">
                  <span className="font-bold text-sm uppercase text-gray-600">{t('workshop')}:</span>
                  <span className="font-bold">{latestLog.workshopLocation}</span>
                </div>
                <div className="flex justify-between border-b border-gray-300 pb-1">
                  <span className="font-bold text-sm uppercase text-gray-600">{t('driver')}/{t('complainer') || 'complainer'}:</span>
                  <span className="font-bold">{latestLog.driverName || '-'}</span>
                </div>
                <div className="flex justify-between border-b border-gray-300 pb-1">
                  <span className="font-bold text-sm uppercase text-gray-600">{t('mileage')} / KM:</span>
                  <span className="font-bold">{latestLog.mileage}</span>
                </div>
                <div className="flex justify-between border-b border-gray-300 pb-1">
                  <span className="font-bold text-sm uppercase text-gray-600">{t('fromVehicle')}:</span>
                  <span className="font-bold">{tyreDetail.fromVehicle || '-'}</span>
                </div>
              </div>
              <div className="mt-4">
                <span className="font-bold text-sm uppercase text-gray-600 block mb-1">{t('remarks')}:</span>
                <p className="text-sm border border-gray-300 p-2 rounded min-h-[60px]">{tyreDetail.remarks || '-'}</p>
              </div>
            </div>
            <div className="text-center text-[10px] text-gray-400 uppercase tracking-widest mt-4">
              Computer Generated Document - {new Date().toLocaleString()}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 md:p-6 bg-gray-50 border-t flex flex-wrap gap-3">
          <button 
            onClick={handleWhatsAppShare}
            className="flex-1 flex items-center justify-center gap-2 bg-teal-600 text-white px-4 py-2.5 rounded-xl hover:bg-teal-700 transition-colors font-bold text-sm"
          >
            <ShareIcon className="h-5 w-5" />
            {t('shareTyreInfo')}
          </button>

          <button 
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 bg-gray-600 text-white px-4 py-2.5 rounded-xl hover:bg-gray-700 transition-colors font-bold text-sm"
          >
            <PrinterIcon className="h-5 w-5" />
            {t('print')}
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
