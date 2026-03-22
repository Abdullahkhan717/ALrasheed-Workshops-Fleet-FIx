import React, { useState } from 'react';
import type { User } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { useData } from '../context/DataContext';
import { PencilIcon, TrashIcon, CheckIcon } from './Icons';
import { UserForm } from './UserForm';
import { UserDeleteConfirmationModal } from './UserDeleteConfirmationModal';

interface AdminPanelProps {
  users: User[];
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ users }) => {
  const { t } = useTranslation();
  const { updateData, deleteData } = useData();
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const handleApprove = async (user: User) => {
    try {
        await updateData('Users', { ...user, status: 'active' });
        alert(t('alert_userApproved', { userId: user.id }));
    } catch (error) {
        console.error("Failed to approve user:", error);
        alert('Failed to approve user in Google Sheet.');
    }
  };
  
  const handleUpdateUser = async (updatedUser: User) => {
    try {
        await updateData('Users', updatedUser);
        alert(t('alert_userUpdated', { userId: updatedUser.id }));
        setUserToEdit(null);
    } catch (error) {
        console.error("Failed to update user:", error);
        alert('Failed to update user in Google Sheet.');
    }
  };
  
  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
        await deleteData('Users', userToDelete.id);
        alert(t('alert_userDeleted', { userId: userToDelete.id }));
        setUserToDelete(null);
    } catch (error) {
        console.error("Failed to delete user:", error);
        alert('Failed to delete user in Google Sheet.');
    }
  };

  const pendingUsers = users.filter(u => u.status === 'pending');
  const activeUsers = users.filter(u => u.status === 'active');

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl md:text-4xl font-bold text-gray-800 mb-8">{t('adminPanel')}</h1>

      <div className="mb-10">
        <h2 className="text-xl md:text-2xl font-semibold text-gray-700 mb-4">{t('admin_pendingUsers')}</h2>
        <div className="bg-white rounded-xl shadow-md overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase">{t('login_userId')}</th>
                <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase">{t('role')}</th>
                <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase">{t('location')}</th>
                <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pendingUsers.length > 0 ? (
                pendingUsers.map(user => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 font-medium">{user.id}</td>
                    <td className="px-6 py-4 text-sm">{t(user.role) || user.role}</td>
                    <td className="px-6 py-4 text-sm">{user.location || '-'}</td>
                    <td className="px-6 py-4">
                      <button onClick={() => handleApprove(user)} className="flex items-center text-sm bg-green-500 text-white px-3 py-1.5 rounded-md hover:bg-green-600">
                        <CheckIcon className="h-4 w-4 me-2" />
                        {t('approve')}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={4} className="text-center py-6 text-gray-500">{t('admin_noPendingUsers')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="text-xl md:text-2xl font-semibold text-gray-700 mb-4">{t('admin_manageUsers')}</h2>
        <div className="bg-white rounded-xl shadow-md overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase">{t('login_userId')}</th>
                <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase">{t('password')}</th>
                <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase">{t('role')}</th>
                <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase">{t('location')}</th>
                <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {activeUsers.map(user => (
                <tr key={user.id}>
                  <td className="px-6 py-4 font-medium">{user.id}</td>
                  <td className="px-6 py-4 font-mono text-gray-600">{user.password}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'admin' ? 'bg-green-200 text-green-900' : 'bg-green-100 text-green-800'}`}>
                        {t(user.role) || user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">{user.location || '-'}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button onClick={() => setUserToEdit(user)} className="p-2 text-green-600 hover:text-green-900 hover:bg-green-100 rounded-full" title={t('edit')}>
                          <PencilIcon className="h-5 w-5"/>
                      </button>
                      {user.role !== 'admin' && (
                        <button onClick={() => setUserToDelete(user)} className="p-2 text-red-600 hover:text-red-900 hover:bg-red-100 rounded-full" title={t('delete')}>
                            <TrashIcon className="h-5 w-5"/>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {userToEdit && (
        <UserForm 
            user={userToEdit}
            onSave={handleUpdateUser}
            onClose={() => setUserToEdit(null)}
        />
      )}
      {userToDelete && (
          <UserDeleteConfirmationModal
            user={userToDelete}
            onConfirm={handleDeleteUser}
            onCancel={() => setUserToDelete(null)}
          />
      )}
    </div>
  );
};
