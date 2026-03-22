import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../hooks/useTranslation';
import { XMarkIcon } from './Icons';

interface ChangePasswordModalProps {
  onClose: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ onClose }) => {
  const { changePassword } = useAuth();
  const { t } = useTranslation();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) {
      alert(t('alert_enterNewPassword'));
      return;
    }
    if (newPassword !== confirmPassword) {
      alert(t('alert_passwordsDoNotMatch'));
      return;
    }

    const success = changePassword(oldPassword, newPassword);
    if (success) {
      alert(t('alert_passwordChanged'));
      onClose();
    } else {
      alert(t('alert_oldPasswordIncorrect'));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4 animate-fade-in-up">
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="p-6 border-b flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">{t('changePassword')}</h2>
            <button type="button" onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-full">
                <XMarkIcon className="h-6 w-6" />
            </button>
        </div>

        <div className="p-6 space-y-4">
            <div>
                <label htmlFor="oldPassword" className="block text-sm font-medium text-gray-700">{t('oldPassword')}</label>
                <input
                    type="password"
                    id="oldPassword"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                    required
                />
            </div>
             <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">{t('newPassword')}</label>
                <input
                    type="password"
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                    required
                />
            </div>
             <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">{t('confirmNewPassword')}</label>
                <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                    required
                />
            </div>
        </div>
        
        <div className="p-6 bg-gray-50 flex justify-end space-x-3 rounded-b-xl">
            <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300">
                {t('cancel')}
            </button>
            <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                {t('save')}
            </button>
        </div>
      </form>
    </div>
  );
};
