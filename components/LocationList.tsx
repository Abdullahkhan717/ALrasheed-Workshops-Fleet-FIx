import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useTranslation } from '../hooks/useTranslation';
import { PlusIcon, PencilSquareIcon, TrashIcon, MapPinIcon, CheckCircleIcon, XCircleIcon } from './Icons';
import { NewLocationForm } from './NewLocationForm';
import type { AppLocation } from '../types';
import { generateId } from '../utils/idGenerator';

interface LocationListProps {
  onSelectLocation?: (locationName: string) => void;
}

export const LocationList: React.FC<LocationListProps> = ({ onSelectLocation }) => {
  const { t } = useTranslation();
  const { locations, createData, updateData, deleteData } = useData();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [locationToEdit, setLocationToEdit] = useState<AppLocation | null>(null);

  const handleAddLocation = async (locationData: Omit<AppLocation, 'id'>) => {
    try {
      await createData('Locations', { ...locationData, id: generateId() });
      setIsFormOpen(false);
      alert(t('locationAdded'));
    } catch (error) {
      console.error('Failed to add location:', error);
      alert('Failed to add location.');
    }
  };

  const handleUpdateLocation = async (location: AppLocation) => {
    try {
      await updateData('Locations', location);
      setIsFormOpen(false);
      setLocationToEdit(null);
      alert(t('locationUpdated'));
    } catch (error) {
      console.error('Failed to update location:', error);
      alert('Failed to update location.');
    }
  };

  const handleDeleteLocation = async (id: string) => {
    if (window.confirm(t('actionCannotBeUndone'))) {
      try {
        await deleteData('Locations', id);
        alert(t('locationDeleted'));
      } catch (error) {
        console.error('Failed to delete location:', error);
        alert('Failed to delete location.');
      }
    }
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
        <h1 className="text-2xl md:text-4xl font-bold text-gray-800">{t('locations')}</h1>
        <button
          onClick={() => {
            setLocationToEdit(null);
            setIsFormOpen(true);
          }}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center shadow-md transition w-full sm:w-auto justify-center"
        >
          <PlusIcon className="h-5 w-5 me-2" />
          {t('addNewLocation')}
        </button>
      </div>

      {locations.length === 0 ? (
        <div className="bg-white p-8 rounded-xl shadow-md text-center">
          <MapPinIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">{t('noLocationsFound')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {locations.map((location) => (
            <div 
              key={location.id} 
              className="bg-white p-6 rounded-xl shadow-md border-t-4 border-green-500 hover:shadow-lg transition cursor-pointer"
              onClick={() => onSelectLocation?.(location.name)}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center">
                    <div className="bg-green-100 p-2 rounded-lg me-3">
                        <MapPinIcon className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-800">{location.name}</h3>
                        <p className="text-sm text-gray-500">{location.type || 'General Location'}</p>
                    </div>
                </div>
                <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => {
                      setLocationToEdit(location);
                      setIsFormOpen(true);
                    }}
                    className="text-green-600 hover:text-green-800 p-1"
                    title={t('edit')}
                  >
                    <PencilSquareIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteLocation(location.id)}
                    className="text-red-600 hover:text-red-800 p-1"
                    title={t('delete')}
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-2 border-t pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{t('siteManager')}:</span>
                  <span className="font-medium text-gray-800">{location.siteManager || '-'}</span>
                </div>
                {location.hasWorkshop && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">{t('workshopManager')}:</span>
                    <span className="font-medium text-gray-800">{location.workshopManager || '-'}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm items-center">
                  <span className="text-gray-500">{t('hasWorkshopFacility')}:</span>
                  <span className={`flex items-center font-medium ${location.hasWorkshop ? 'text-green-600' : 'text-red-600'}`}>
                    {location.hasWorkshop ? (
                        <>
                            <CheckCircleIcon className="h-4 w-4 me-1" />
                            {t('yes')}
                        </>
                    ) : (
                        <>
                            <XCircleIcon className="h-4 w-4 me-1" />
                            {t('no')}
                        </>
                    )}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isFormOpen && (
        <NewLocationForm
          onClose={() => setIsFormOpen(false)}
          onAddLocation={handleAddLocation}
          onUpdateLocation={handleUpdateLocation}
          locationToEdit={locationToEdit}
        />
      )}
    </div>
  );
};
