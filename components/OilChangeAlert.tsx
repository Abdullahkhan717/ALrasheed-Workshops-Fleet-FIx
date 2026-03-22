import React from 'react';
import { useData } from '../context/DataContext';
import { useTranslation } from '../hooks/useTranslation';
import { formatVehicleInfo } from '../utils/formatters';
import { TruckIcon, CalendarIcon, MapPinIcon, UserIcon } from './Icons';

export const OilChangeAlert: React.FC = () => {
  const { oilLogs, vehicles } = useData();
  const { t } = useTranslation();

  const now = new Date();
  const tenDaysAgo = new Date();
  tenDaysAgo.setDate(now.getDate() - 10);

  // For each vehicle, find its latest oil log
  const overdueVehicles = vehicles.map(vehicle => {
    const vehicleLogs = oilLogs.filter(log => log.vehicleId === vehicle.id);
    const latestLog = vehicleLogs.length > 0 
      ? [...vehicleLogs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
      : null;
    
    let daysSince = Infinity;
    if (latestLog) {
      const logDate = new Date(latestLog.date);
      const diffTime = Math.abs(now.getTime() - logDate.getTime());
      daysSince = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    return { vehicle, latestLog, daysSince };
  }).filter(item => item.daysSince > 10);

  // Sort by daysSince descending (most overdue first)
  const sortedOverdue = [...overdueVehicles].sort((a, b) => b.daysSince - a.daysSince);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl md:text-4xl font-bold text-gray-800">{t('oilChangeAlert')}</h1>
        <div className="bg-red-100 text-red-800 px-4 py-2 rounded-full text-sm font-bold">
          {t('moreThan10Days')}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedOverdue.length > 0 ? (
          sortedOverdue.map(({ vehicle, latestLog, daysSince }) => {
            return (
              <div key={vehicle.id} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow">
                <div className="bg-red-600 p-4 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <TruckIcon className="h-6 w-6 mr-2" />
                      <span className="font-bold text-lg">
                        {vehicle.vehicleCompanyNumber || vehicle.vehicleNumber}
                      </span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded mb-1">
                        {daysSince === Infinity ? t('noHistory') : `${daysSince} ${t('days')}`}
                      </span>
                      {latestLog && (
                        <span className="text-[10px] opacity-80">
                          {t('last')}: {formatDate(latestLog.date)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="p-4 space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPinIcon className="h-4 w-4 mr-2 text-gray-400" />
                    <span className="font-medium mr-1">{t('location')}:</span>
                    {vehicle.branchLocation || t('noLocation')}
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <TruckIcon className="h-4 w-4 mr-2 text-gray-400" />
                    <span className="font-medium mr-1">{t('type')}:</span>
                    {t(vehicle.vehiclesType)}
                  </div>

                  {latestLog && (
                    <div className="pt-2 border-t border-gray-50">
                      <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                        {t('lastOilChangeDetails')}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-gray-400">{t('mileage')}:</span> {latestLog.mileage}
                        </div>
                        <div>
                          <span className="text-gray-400">{t('driver')}:</span> {latestLog.driverName}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full bg-white rounded-xl p-12 text-center shadow-sm border border-dashed border-gray-300">
            <div className="bg-gray-50 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <CalendarIcon className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">{t('noRecentOilChanges')}</h3>
            <p className="text-gray-500">{t('noOverdueOilChanges')}</p>
          </div>
        )}
      </div>
    </div>
  );
};
