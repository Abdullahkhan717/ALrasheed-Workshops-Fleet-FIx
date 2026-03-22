import React from 'react';
import { useData } from '../context/DataContext';
import { useTranslation } from '../hooks/useTranslation';
import { PlusIcon } from './Icons';
import { formatDate, formatTime } from '../utils/formatters';

interface OilLogHistoryViewProps {
  selectedVehicleId?: string;
}

export const OilLogHistoryView: React.FC<OilLogHistoryViewProps> = ({ selectedVehicleId }) => {
  const { t, language } = useTranslation();
  const { oilLogs, vehicles } = useData();

  const filteredLogs = oilLogs.filter(log => {
    if (selectedVehicleId && log.vehicleId !== selectedVehicleId) return false;
    return true;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">{t('oilLogHistory')}</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredLogs.length > 0 ? (
          filteredLogs
            .map(log => {
              const vehicle = vehicles.find(v => v.id === log.vehicleId);
              return (
                <div key={log.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="font-bold text-green-600">
                        {vehicle ? (
                          `${t(vehicle.vehiclesType)} ${vehicle.vehicleCompanyNumber ? `${vehicle.vehicleCompanyNumber}-` : ''}${vehicle.vehicleNumber}`
                        ) : 'Unknown Vehicle'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDate(log.date)}
                        {formatDate(log.date) && formatTime(log.time) && ' at '}
                        {formatTime(log.time)}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 font-medium">{t('driver')}</p>
                      <p className="font-bold">{log.driverName}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-medium">{t('mileage')}</p>
                      <p className="font-bold">{log.mileage}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-gray-500 font-medium mb-1">{t('oilTypes')}</p>
                      <div className="flex flex-wrap gap-2">
                        {(Array.isArray(log.oilTypes) ? log.oilTypes : []).map((ot, i) => (
                          <span key={i} className="bg-green-50 text-green-700 text-xs px-2 py-1 rounded font-bold border border-green-100">
                            {t(`oilLog_${ot}` as any) !== `oilLog_${ot}` ? t(`oilLog_${ot}` as any) : ot}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <p className="text-gray-500 font-medium mb-1">{t('filters')}</p>
                      <div className="flex flex-wrap gap-2">
                        {(Array.isArray(log.filters) ? log.filters : []).map((f, i) => (
                          <span key={i} className="bg-gray-50 text-gray-700 text-xs px-2 py-1 rounded font-bold border border-gray-100">
                            {t(`oilLog_${f}` as any) !== `oilLog_${f}` ? t(`oilLog_${f}` as any) : f}
                          </span>
                        ))}
                      </div>
                    </div>
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
    </div>
  );
};
