import React, { useState, useEffect } from 'react';
import type { Workshop, AppLocation } from '../types';
import { XMarkIcon } from './Icons';
import { useTranslation } from '../hooks/useTranslation';
import { useData } from '../context/DataContext';
import { NewLocationForm } from './NewLocationForm';
import { generateId } from '../utils/idGenerator';

interface NewWorkshopFormProps {
  onClose: () => void;
  onAddWorkshop: (workshop: Omit<Workshop, 'id'>) => void;
  onUpdateWorkshop: (workshop: Workshop) => void;
  workshopToEdit: Workshop | null;
  initialLocation?: string;
}

export const NewWorkshopForm: React.FC<NewWorkshopFormProps> = ({ onClose, onAddWorkshop, onUpdateWorkshop, workshopToEdit, initialLocation }) => {
  const isEditMode = workshopToEdit !== null;
  const { t } = useTranslation();
  const { locations, createData } = useData();

  const [subName, setSubName] = useState('');
  const [arabicName, setArabicName] = useState('');
  const [foremanName, setForemanName] = useState('');
  const [location, setLocation] = useState('');
  const [showNewLocationModal, setShowNewLocationModal] = useState(false);

  useEffect(() => {
    if (isEditMode) {
      setSubName(workshopToEdit.subName);
      setArabicName(workshopToEdit.arabicName || '');
      setForemanName(workshopToEdit.foreman);
      setLocation(workshopToEdit.location || '');
    } else if (initialLocation) {
      setLocation(initialLocation);
      const selectedLoc = locations.find(l => l.name === initialLocation);
      if (selectedLoc && selectedLoc.workshopManager) {
        setForemanName(selectedLoc.workshopManager);
      }
    }
  }, [workshopToEdit, isEditMode, initialLocation, locations]);

  const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'addNew') {
      setShowNewLocationModal(true);
    } else {
      setLocation(val);
      // Auto-fill foreman if location has a workshop manager
      const selectedLoc = locations.find(l => l.name === val);
      if (selectedLoc && selectedLoc.workshopManager) {
        setForemanName(selectedLoc.workshopManager);
      }
    }
  };

  const handleAddLocation = async (locationData: Omit<AppLocation, 'id'>) => {
    try {
      const newLocation = { ...locationData, id: generateId() };
      await createData('Locations', newLocation);
      setLocation(newLocation.name);
      if (newLocation.workshopManager) {
        setForemanName(newLocation.workshopManager);
      }
      setShowNewLocationModal(false);
    } catch (error) {
      console.error('Failed to add location:', error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!subName.trim()) {
      alert(t('alert_enterWorkshopName'));
      return;
    }

    if (!foremanName.trim()) {
        alert(t('alert_enterForemanName'));
        return;
    }
    
    const workshopData = { 
        subName: subName.trim(), 
        arabicName: arabicName.trim(),
        foreman: foremanName.trim(),
        location: location
    };

    if (isEditMode) {
        onUpdateWorkshop({ ...workshopData, id: workshopToEdit.id });
    } else {
        onAddWorkshop(workshopData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl p-6 md:p-8 w-full max-w-lg relative animate-fade-in-up">
        <button onClick={onClose} className="absolute top-4 end-4 text-gray-400 hover:text-gray-600">
          <XMarkIcon className="h-6 w-6" />
        </button>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">{isEditMode ? t('editWorkshop') : t('addNewWorkshop')}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
           <div>
            <label htmlFor="workshopName" className="block text-sm font-medium text-gray-700">{t('workshopName')}</label>
            <input
              type="text"
              id="workshopName"
              value={subName}
              onChange={(e) => setSubName(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder={t('workshopNamePlaceholder')}
              required
            />
          </div>
          <div>
            <label htmlFor="arabicName" className="block text-sm font-medium text-gray-700">{t('workshopName')} (Arabic)</label>
            <input
              type="text"
              id="arabicName"
              value={arabicName}
              onChange={(e) => setArabicName(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-right"
              placeholder="اسم الورشة بالعربي"
              dir="rtl"
            />
          </div>
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700">{t('location')}</label>
            <select
              id="location"
              value={location}
              onChange={handleLocationChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">{t('selectLocation') || 'Select Location'}</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.name}>{loc.name}</option>
              ))}
              <option value="addNew" className="text-green-600 font-semibold">+ {t('addNew')}</option>
            </select>
          </div>
           <div>
            <label htmlFor="foremanName" className="block text-sm font-medium text-gray-700">{t('foremanName')}</label>
            <input
              type="text"
              id="foremanName"
              value={foremanName}
              onChange={(e) => setForemanName(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder={t('foremanNamePlaceholder')}
              required
            />
          </div>
          <div className="flex justify-end pt-4">
            <button type="button" onClick={onClose} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg me-2 hover:bg-gray-300">{t('cancel')}</button>
            <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">{isEditMode ? t('updateWorkshop') : t('addWorkshop')}</button>
          </div>
        </form>
      </div>

      {showNewLocationModal && (
        <NewLocationForm 
          onClose={() => setShowNewLocationModal(false)}
          onAddLocation={handleAddLocation}
          onUpdateLocation={() => {}}
          locationToEdit={null}
        />
      )}
    </div>
  );
};
