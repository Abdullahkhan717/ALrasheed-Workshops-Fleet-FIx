import React, { useState } from 'react';
import type { Workshop, RepairRequest, Vehicle, AppLocation } from '../types';
import { NewWorkshopForm } from './NewWorkshopForm';
import { WorkshopHistoryModal } from './WorkshopHistoryModal';
import { PlusIcon, PencilIcon, TrashIcon } from './Icons';
import { WorkshopDeleteConfirmationModal } from './WorkshopDeleteConfirmationModal';
import { useTranslation } from '../hooks/useTranslation';

interface WorkshopListProps {
  workshops: Workshop[];
  locations: AppLocation[];
  onAddWorkshop: (workshop: Omit<Workshop, 'id'>) => Promise<void>;
  onUpdateWorkshop: (workshop: Workshop) => Promise<void>;
  onDeleteWorkshop: (id: string) => Promise<void>;
  repairRequests: RepairRequest[];
  vehicles: Vehicle[];
}

export const WorkshopList: React.FC<WorkshopListProps> = ({ workshops, locations, onAddWorkshop, onUpdateWorkshop, onDeleteWorkshop, repairRequests, vehicles }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWorkshop, setEditingWorkshop] = useState<Workshop | null>(null);
  const [workshopToDelete, setWorkshopToDelete] = useState<Workshop | null>(null);
  const [historyWorkshop, setHistoryWorkshop] = useState<Workshop | null>(null);
  const { t, language } = useTranslation();

  const handleAddWorkshop = async (workshop: Omit<Workshop, 'id'>) => {
    try {
      await onAddWorkshop(workshop);
      handleCloseModal();
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpdateWorkshop = async (updatedWorkshop: Workshop) => {
    try {
      await onUpdateWorkshop(updatedWorkshop);
      handleCloseModal();
    } catch (error) {
      console.error('Failed to update workshop:', error);
      alert(t('alert_workshopUpdateFailed'));
    }
  };

  const handleEditClick = (workshop: Workshop) => {
    setEditingWorkshop(workshop);
    setIsModalOpen(true);
  };
  
  const handleAddClick = () => {
    setEditingWorkshop(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingWorkshop(null);
  };

  const handleDeleteRequest = (workshop: Workshop) => {
    const isWorkshopInUse = repairRequests.some(req => req.faults.some(f => f.workshopId === workshop.id));
    if (isWorkshopInUse) {
      alert(t('alert_workshopInUse'));
      return;
    }
    setWorkshopToDelete(workshop);
  };

  const confirmDelete = async () => {
    if (!workshopToDelete) return;
    try {
      await onDeleteWorkshop(workshopToDelete.id);
      cancelDelete();
    } catch (error) {
      console.error('Failed to delete workshop:', error);
      alert(t('alert_workshopDeleteFailed'));
    }
  };

  const cancelDelete = () => {
    setWorkshopToDelete(null);
  };


  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold text-gray-800">{t('workshopList')}</h1>
        <button
          onClick={handleAddClick}
          className="flex items-center bg-green-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-green-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5 me-2" />
          {t('addNewWorkshop')}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">{t('workshopName')}</th>
              <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">{t('location')}</th>
              <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">{t('foreman')}</th>
              <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">{t('history')}</th>
              <th scope="col" className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">{t('actions')}</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {workshops.length > 0 ? (
                workshops.map(ws => (
                <tr key={ws.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {language === 'ar' && ws.arabicName ? ws.arabicName : ws.subName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ws.location || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ws.foreman}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button 
                      onClick={() => setHistoryWorkshop(ws)}
                      className="text-green-600 hover:text-green-800 font-semibold"
                    >
                        {t('viewHistory')}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                        <button onClick={() => handleEditClick(ws)} className="p-2 text-green-600 hover:text-green-900 hover:bg-green-100 rounded-full" title={t('editWorkshop')}>
                            <PencilIcon className="h-5 w-5"/>
                        </button>
                        <button onClick={() => handleDeleteRequest(ws)} className="p-2 text-red-600 hover:text-red-900 hover:bg-red-100 rounded-full" title={t('deleteWorkshop')}>
                            <TrashIcon className="h-5 w-5"/>
                        </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
                <tr>
                    <td colSpan={4} className="text-center py-10 text-gray-500">{t('noWorkshopsFound')}</td>
                </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <NewWorkshopForm
          onClose={handleCloseModal}
          onAddWorkshop={handleAddWorkshop}
          onUpdateWorkshop={handleUpdateWorkshop}
          workshopToEdit={editingWorkshop}
        />
      )}
      {workshopToDelete && (
        <WorkshopDeleteConfirmationModal
          workshop={workshopToDelete}
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
        />
      )}
      {historyWorkshop && (
        <WorkshopHistoryModal 
            workshop={historyWorkshop}
            allRequests={repairRequests}
            allVehicles={vehicles}
            allWorkshops={workshops}
            onClose={() => setHistoryWorkshop(null)}
        />
      )}
    </div>
  );
};
