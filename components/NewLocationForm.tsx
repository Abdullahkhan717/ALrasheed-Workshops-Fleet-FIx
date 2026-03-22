import React, { useState, useEffect } from 'react';
import type { AppLocation } from '../types';
import { XMarkIcon } from './Icons';
import { useTranslation } from '../hooks/useTranslation';

interface NewLocationFormProps {
  onClose: () => void;
  onAddLocation: (location: Omit<AppLocation, 'id'>) => void;
  onUpdateLocation: (location: AppLocation) => void;
  locationToEdit: AppLocation | null;
}

export const NewLocationForm: React.FC<NewLocationFormProps> = ({ onClose, onAddLocation, onUpdateLocation, locationToEdit }) => {
  const isEditMode = locationToEdit !== null;
  const { t } = useTranslation();

  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [siteManager, setSiteManager] = useState('');
  const [workshopManager, setWorkshopManager] = useState('');
  const [hasWorkshop, setHasWorkshop] = useState(false);

  useEffect(() => {
    if (isEditMode) {
        setName(locationToEdit.name);
        setType(locationToEdit.type);
        setSiteManager(locationToEdit.siteManager);
        setWorkshopManager(locationToEdit.workshopManager || '');
        setHasWorkshop(locationToEdit.hasWorkshop);
    }
  }, [locationToEdit, isEditMode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
        alert(t('alert_fillAllFields'));
        return;
    }

    const locationData = { 
        name, 
        type, 
        siteManager, 
        workshopManager: hasWorkshop ? workshopManager : '',
        hasWorkshop 
    };

    if (isEditMode) {
      onUpdateLocation({ ...locationData, id: locationToEdit.id });
    } else {
      onAddLocation(locationData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl p-6 md:p-8 w-full max-w-lg relative animate-fade-in-up">
        <button onClick={onClose} className="absolute top-4 end-4 text-gray-400 hover:text-gray-600">
          <XMarkIcon className="h-6 w-6" />
        </button>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">{isEditMode ? t('edit') : t('addNewLocation')}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="locationName" className="block text-sm font-medium text-gray-700">{t('locationName')}</label>
            <input
              type="text"
              id="locationName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              placeholder={t('locationNamePlaceholder')}
              required
            />
          </div>
          <div>
            <label htmlFor="locationType" className="block text-sm font-medium text-gray-700">{t('locationType')}</label>
            <input
              type="text"
              id="locationType"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              placeholder="e.g., Construction Site, Office"
            />
          </div>
          <div>
            <label htmlFor="siteManager" className="block text-sm font-medium text-gray-700">{t('siteManager')}</label>
            <input
              type="text"
              id="siteManager"
              value={siteManager}
              onChange={(e) => setSiteManager(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              placeholder={t('siteManagerPlaceholder')}
            />
          </div>
          <div className="flex items-center space-x-3 mt-4">
            <label className="text-sm font-medium text-gray-700">{t('hasWorkshopFacility')}</label>
            <div className="flex items-center space-x-4 ms-4">
                <label className="inline-flex items-center">
                    <input
                        type="radio"
                        className="form-radio h-4 w-4 text-green-600"
                        name="hasWorkshop"
                        checked={hasWorkshop === true}
                        onChange={() => setHasWorkshop(true)}
                    />
                    <span className="ms-2 text-sm text-gray-700">{t('yes')}</span>
                </label>
                <label className="inline-flex items-center">
                    <input
                        type="radio"
                        className="form-radio h-4 w-4 text-green-600"
                        name="hasWorkshop"
                        checked={hasWorkshop === false}
                        onChange={() => setHasWorkshop(false)}
                    />
                    <span className="ms-2 text-sm text-gray-700">{t('no')}</span>
                </label>
            </div>
          </div>
          {hasWorkshop && (
            <div className="animate-fade-in-down">
              <label htmlFor="workshopManager" className="block text-sm font-medium text-gray-700">{t('workshopManager')}</label>
              <input
                type="text"
                id="workshopManager"
                value={workshopManager}
                onChange={(e) => setWorkshopManager(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                placeholder={t('workshopManagerPlaceholder')}
                required={hasWorkshop}
              />
            </div>
          )}
          <div className="flex justify-end pt-4">
            <button type="button" onClick={onClose} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg me-2 hover:bg-gray-300">{t('cancel')}</button>
            <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">{isEditMode ? t('save') : t('save')}</button>
          </div>
        </form>
      </div>
    </div>
  );
};
