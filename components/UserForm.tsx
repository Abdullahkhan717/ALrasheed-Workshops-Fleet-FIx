import React, { useState, useEffect } from 'react';
import type { User } from '../types';
import { XMarkIcon } from './Icons';
import { useTranslation } from '../hooks/useTranslation';
import { useData } from '../context/DataContext';

interface UserFormProps {
  user: User;
  onSave: (user: User) => void;
  onClose: () => void;
}

export const UserForm: React.FC<UserFormProps> = ({ user, onSave, onClose }) => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<User['role']>('user');
  const [location, setLocation] = useState('');
  const { t } = useTranslation();
  const { locations } = useData();

  useEffect(() => {
    setUserId(user.id);
    setPassword(user.password);
    setRole(user.role);
    setLocation(user.location || '');
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId.trim() || !password.trim()) {
      alert(t('alert_fillAllFields'));
      return;
    }
    onSave({ ...user, id: userId, password, role, location });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl p-6 md:p-8 w-full max-w-md relative animate-fade-in-up">
        <button onClick={onClose} className="absolute top-4 end-4 text-gray-400 hover:text-gray-600">
          <XMarkIcon className="h-6 w-6" />
        </button>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">{t('admin_editUser')}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="userIdEdit" className="block text-sm font-medium text-gray-700">{t('login_userId')}</label>
            <input
              type="text"
              id="userIdEdit"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              required
              disabled={user.role === 'admin'}
            />
          </div>
          <div>
            <label htmlFor="passwordEdit" className="block text-sm font-medium text-gray-700">{t('password')}</label>
            <input
              type="text"
              id="passwordEdit"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          <div>
            <label htmlFor="roleEdit" className="block text-sm font-medium text-gray-700">{t('role')}</label>
            <select
              id="roleEdit"
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              disabled={user.role === 'admin'}
            >
              <option value="admin">{t('admin')}</option>
              <option value="user">{t('user')}</option>
              <option value="User Manager">{t('userManager') || 'User Manager'}</option>
              <option value="Site Manager">{t('siteManager') || 'Site Manager'}</option>
              <option value="Other">{t('other') || 'Other'}</option>
            </select>
          </div>
          <div>
            <label htmlFor="locationEdit" className="block text-sm font-medium text-gray-700">{t('location')}</label>
            <select
              id="locationEdit"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">{t('noLocation') || 'No Location'}</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.name}>{loc.name}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end pt-4">
            <button type="button" onClick={onClose} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg me-2 hover:bg-gray-300">{t('cancel')}</button>
            <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">{t('admin_updateUser')}</button>
          </div>
        </form>
      </div>
    </div>
  );
};
