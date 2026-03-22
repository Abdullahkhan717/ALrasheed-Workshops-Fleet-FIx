import React from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../hooks/useTranslation';
import type { User } from '../types';

export const Settings: React.FC = () => {
  const { users, updateData } = useData();
  const { currentUser } = useAuth();
  const { t } = useTranslation();

  const handleStatusChange = async (user: User, newStatus: 'active' | 'pending') => {
    if (currentUser?.role !== 'admin') {
      alert(t('alert_adminsOnly'));
      return;
    }
    if (user.id === 'Admin') {
      alert(t('alert_cannotChangeAdminStatus'));
      return;
    }
    try {
      await updateData('users', { ...user, status: newStatus });
      alert(t('alert_statusUpdated'));
    } catch (error) {
      console.error('Failed to update user status:', error);
      alert(t('alert_statusUpdateFailed'));
    }
  };

  if (currentUser?.role !== 'admin') {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-gray-800">{t('settings')}</h1>
        <p className="mt-4 text-gray-600">{t('settings_accessDenied')}</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">{t('userManagement')}</h1>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('user')}</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('role')}</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('status')}</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.role}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <select
                    value={user.status}
                    onChange={(e) => handleStatusChange(user, e.target.value as 'active' | 'pending')}
                    disabled={user.id === 'Admin'}
                    className={`p-1 rounded ${user.id === 'Admin' ? 'bg-gray-100' : 'border-gray-300'}`}>
                    <option value="active">{t('active')}</option>
                    <option value="pending">{t('pending')}</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
