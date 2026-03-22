import React, { useState, useEffect } from 'react';
import type { Vehicle, AppLocation } from '../types';
import { XMarkIcon } from './Icons';
import { useTranslation } from '../hooks/useTranslation';
import { useData } from '../context/DataContext';
import { NewLocationForm } from './NewLocationForm';
import { generateId } from '../utils/idGenerator';

import { useAuth } from '../context/AuthContext';

interface NewVehicleFormProps {
  onClose: () => void;
  onAddVehicle: (vehicle: Omit<Vehicle, 'id'>) => void;
  onUpdateVehicle: (vehicle: Vehicle) => void;
  vehicleToEdit: Vehicle | null;
}

const PRESET_TYPES = [
  'CAR', 'dyina', 'isuzu', 'Small bus', 'Truck', 'lobat', 'Diesel tanker', 'water tanker', 'Sandook',
  'Shovel', 'Loader', 'Excavator', 'Generator', 'Dump Truck', 'Forklift', 'Poclain'
];

export const NewVehicleForm: React.FC<NewVehicleFormProps> = ({ onClose, onAddVehicle, onUpdateVehicle, vehicleToEdit }) => {
  const isEditMode = vehicleToEdit !== null;
  const { t } = useTranslation();
  const { locations, createData } = useData();
  const { currentUser } = useAuth();

  const [vehicleType, setVehicleType] = useState(PRESET_TYPES[0]);
  const [customVehicleType, setCustomVehicleType] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleCompanyNumber, setVehicleCompanyNumber] = useState('');
  const [make, setMake] = useState('');
  const [modelNumber, setModelNumber] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [branchLocation, setBranchLocation] = useState('');
  const [arabicName, setArabicName] = useState('');
  const [condition, setCondition] = useState<Vehicle['condition']>('Working');
  const [isAddingLocation, setIsAddingLocation] = useState(false);

  useEffect(() => {
    if (isEditMode) {
        setVehicleNumber(vehicleToEdit.vehicleNumber);
        setVehicleCompanyNumber(vehicleToEdit.vehicleCompanyNumber || '');
        setMake(vehicleToEdit.make);
        setModelNumber(vehicleToEdit.modelNumber);
        setSerialNumber(vehicleToEdit.serialNumber);
        setBranchLocation(vehicleToEdit.branchLocation);
        setArabicName(vehicleToEdit.arabicName || '');
        setCondition(vehicleToEdit.condition || 'Working');
        
        if (PRESET_TYPES.includes(vehicleToEdit.vehiclesType)) {
            setVehicleType(vehicleToEdit.vehiclesType);
            setCustomVehicleType('');
        } else {
            setVehicleType('AddNew');
            setCustomVehicleType(vehicleToEdit.vehiclesType);
        }
    } else if (currentUser && currentUser.role !== 'admin') {
        setBranchLocation(currentUser.location || '');
    }
  }, [vehicleToEdit, isEditMode, currentUser]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleNumber || !serialNumber) {
        alert(t('alert_fillRequiredFields'));
        return;
    }

    let finalType = vehicleType;
    if (vehicleType === 'AddNew') {
        if (!customVehicleType.trim()) {
            alert(t('alert_specifyNewVehicleType'));
            return;
        }
        finalType = customVehicleType.trim();
    }

    const vehicleData = { 
        vehiclesType: finalType, 
        vehicleNumber: vehicleNumber, 
        vehicleCompanyNumber: vehicleCompanyNumber,
        make, 
        modelNumber, 
        serialNumber, 
        branchLocation,
        arabicName: arabicName.trim(),
        condition
    };

    if (isEditMode) {
      onUpdateVehicle({ ...vehicleData, id: vehicleToEdit.id } as any);
    } else {
      onAddVehicle(vehicleData as any);
    }
  };

  const handleAddLocation = async (locationData: Omit<AppLocation, 'id'>) => {
    try {
      const newLoc = { ...locationData, id: generateId() };
      await createData('Locations', newLoc);
      setBranchLocation(newLoc.name);
      setIsAddingLocation(false);
    } catch (error) {
      console.error('Failed to add location:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-lg relative animate-fade-in-up">
        <button onClick={onClose} className="absolute top-4 end-4 text-gray-400 hover:text-gray-600">
          <XMarkIcon className="h-6 w-6" />
        </button>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">{isEditMode ? t('editVehicle') : t('addNewVehicle')}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="vehicleType" className="block text-sm font-medium text-gray-700">{t('vehicleType')}</label>
              <select
                id="vehicleType"
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              >
                {PRESET_TYPES.map(type => <option key={type} value={type}>{t(type)}</option>)}
                <option value="AddNew">{t('addNew')}</option>
              </select>
            </div>
             {vehicleType === 'AddNew' && (
              <div>
                <label htmlFor="customVehicleType" className="block text-sm font-medium text-gray-700">{t('newVehicleType')}</label>
                <input
                  type="text"
                  id="customVehicleType"
                  value={customVehicleType}
                  onChange={(e) => setCustomVehicleType(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm"
                  placeholder={t('newVehicleTypePlaceholder')}
                  required
                />
              </div>
            )}
            <div>
              <label htmlFor="vehicleCompanyNumber" className="block text-sm font-medium text-gray-700">{t('companyNumber')}</label>
              <input
                type="text"
                id="vehicleCompanyNumber"
                value={vehicleCompanyNumber}
                onChange={(e) => setVehicleCompanyNumber(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm"
              />
            </div>
            <div>
              <label htmlFor="vehicleNumber" className="block text-sm font-medium text-gray-700">{t('vehicleNumber')}</label>
              <input
                type="text"
                id="vehicleNumber"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm"
                required
              />
            </div>
            <div>
              <label htmlFor="arabicName" className="block text-sm font-medium text-gray-700">{t('arabicName')}</label>
              <input
                type="text"
                id="arabicName"
                value={arabicName}
                onChange={(e) => setArabicName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-right"
                placeholder="اسم المركبة بالعربي"
                dir="rtl"
              />
            </div>
            <div>
              <label htmlFor="make" className="block text-sm font-medium text-gray-700">{t('make')}</label>
              <input
                type="text"
                id="make"
                value={make}
                onChange={(e) => setMake(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm"
              />
            </div>
             <div>
              <label htmlFor="modelNumber" className="block text-sm font-medium text-gray-700">{t('modelNumber')}</label>
              <input
                type="text"
                id="modelNumber"
                value={modelNumber}
                onChange={(e) => setModelNumber(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm"
              />
            </div>
             <div>
              <label htmlFor="serialNumber" className="block text-sm font-medium text-gray-700">{t('serialNumber')}</label>
              <input
                type="text"
                id="serialNumber"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm"
                required
              />
            </div>
             <div>
              <label htmlFor="branchLocation" className="block text-sm font-medium text-gray-700">{t('branchLocation')}</label>
              <select
                id="branchLocation"
                value={branchLocation}
                onChange={(e) => {
                  if (e.target.value === 'AddNew') {
                      setIsAddingLocation(true);
                  } else {
                      setBranchLocation(e.target.value);
                  }
                }}
                disabled={!isEditMode && currentUser?.role !== 'admin'}
                className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm ${!isEditMode && currentUser?.role !== 'admin' ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
              >
                <option value="">{t('location')}</option>
                {locations.map(loc => (
                  <option key={loc.id} value={loc.name}>{loc.name}</option>
                ))}
                <option value="AddNew">{t('addNew')}</option>
              </select>
            </div>
            <div>
              <label htmlFor="condition" className="block text-sm font-medium text-gray-700">{t('condition')}</label>
              <select
                id="condition"
                value={condition}
                onChange={(e) => setCondition(e.target.value as Vehicle['condition'])}
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
              >
                <option value="Working">{t('working')}</option>
                <option value="Ready for work">{t('readyForWork')}</option>
                <option value="Damage">{t('damage')}</option>
                <option value="Other">{t('other')}</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end pt-4 border-t border-gray-100 mt-6">
            <button type="button" onClick={onClose} className="bg-gray-200 text-gray-700 px-6 py-2.5 rounded-lg me-3 hover:bg-gray-300 transition-colors font-medium">{t('cancel')}</button>
            <button type="submit" className="bg-green-600 text-white px-6 py-2.5 rounded-lg hover:bg-green-700 transition-colors shadow-md font-medium">{isEditMode ? t('updateVehicle') : t('addVehicle')}</button>
          </div>
        </form>
      </div>
      {isAddingLocation && (
        <NewLocationForm
            onClose={() => setIsAddingLocation(false)}
            onAddLocation={handleAddLocation}
            onUpdateLocation={() => {}}
            locationToEdit={null}
        />
      )}
    </div>
  );
};
