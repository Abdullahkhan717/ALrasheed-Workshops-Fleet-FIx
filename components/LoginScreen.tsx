import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useTranslation } from '../hooks/useTranslation';
import { useLanguage } from '../context/LanguageContext';
import { CogIcon, UserCircleIcon, ArrowRightOnRectangleIcon, LanguageIcon } from './Icons';

export const LoginScreen: React.FC = () => {
  const { users, login, createUser } = useAuth();
  const { locations } = useData();
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();

  const [selectedUserId, setSelectedUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saveLogin, setSaveLogin] = useState(false);
  const [showCreateUser, setShowCreateUser] = useState(false);
  
  const [newUserId, setNewUserId] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'user' | 'User Manager' | 'Site Manager' | 'Other'>('user');
  const [newUserLocation, setNewUserLocation] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) {
      alert(t('alert_selectUser'));
      return;
    }
    if (!password) {
      alert(t('alert_enterPassword'));
      return;
    }
    const success = login(selectedUserId, password, saveLogin);
    if (!success) {
      alert(t('alert_invalidCredentials') || 'Invalid ID or Password');
    }
  };
  
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserId.trim() || !newUserPassword.trim()) {
        alert(t('alert_fillAllFields'));
        return;
    }
    const success = await createUser({ 
        id: newUserId.trim(), 
        password: newUserPassword.trim(),
        role: newUserRole,
        location: newUserLocation === 'other' ? '' : newUserLocation
    });
    if (success) {
        alert(t('alert_userCreated'));
        setNewUserId('');
        setNewUserPassword('');
        setNewUserRole('user');
        setNewUserLocation('');
        setShowCreateUser(false);
    } else {
        alert(t('alert_userExists'));
    }
  };
  
  const activeUsers = users.filter(u => u.status === 'active').sort((a, b) => {
      if (a.role === 'admin') return -1;
      if (b.role === 'admin') return 1;
      return a.id.localeCompare(b.id);
  });

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg">
        <div className="text-center relative">
          <button 
            onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
            className="absolute top-0 right-0 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-full inline-flex items-center transition text-xs"
          >
            <LanguageIcon className="h-4 w-4 mr-1" />
            <span>{language === 'en' ? 'العربية' : 'English'}</span>
          </button>
          
          {/* Logo AR Green + White */}
          <div className="w-24 h-24 mx-auto mb-4 bg-green-600 rounded-full flex items-center justify-center border-4 border-white shadow-md">
            <span className="text-4xl font-black text-white">AR</span>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-800">{t('login_title')}</h1>
          <p className="text-lg text-gray-600 font-medium">{t('login_subtitle')}</p>
        </div>
        
        {!showCreateUser ? (
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
                <label htmlFor="userId" className="block text-sm font-medium text-gray-700">{t('login_userId')}</label>
                <select 
                    id="userId" 
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                >
                    <option value="">{t('login_selectUser')}</option>
                    {activeUsers.map(user => <option key={user.id} value={user.id}>{user.id}</option>)}
                </select>
            </div>
            <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">{t('login_password')}</label>
                <div className="relative">
                    <input 
                        type={showPassword ? "text" : "password"} 
                        id="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5 text-gray-500 hover:text-gray-700"
                    >
                        {showPassword ? t('hide') || 'Hide' : t('show') || 'Show'}
                    </button>
                </div>
            </div>
            <div className="flex items-center justify-between">
                <div className="flex items-center">
                    <input id="saveLogin" type="checkbox" checked={saveLogin} onChange={(e) => setSaveLogin(e.target.checked)} className="h-4 w-4 text-green-600 border-gray-300 rounded" />
                    <label htmlFor="saveLogin" className="ms-2 block text-sm text-gray-900">{t('login_saveLogin')}</label>
                </div>
            </div>
            <div>
                <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700">
                    <ArrowRightOnRectangleIcon className="h-5 w-5 me-2" />
                    {t('login_button')}
                </button>
            </div>
            <div className="text-center">
                <button type="button" onClick={() => setShowCreateUser(true)} className="font-medium text-sm text-green-600 hover:text-green-500">
                    {t('login_createUser')}
                </button>
            </div>
          </form>
        ) : (
             <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                    <label htmlFor="newUserId" className="block text-sm font-medium text-gray-700">{t('createUser_id')}</label>
                    <input type="text" id="newUserId" value={newUserId} onChange={(e) => setNewUserId(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" placeholder={t('createUser_idPlaceholder')} required />
                </div>
                <div>
                    <label htmlFor="newUserPassword">{t('createUser_password')}</label>
                    <input type="password" id="newUserPassword" value={newUserPassword} onChange={(e) => setNewUserPassword(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" placeholder={t('createUser_passwordPlaceholder')} required />
                </div>
                <div>
                    <label htmlFor="newUserRole" className="block text-sm font-medium text-gray-700">{t('role')}</label>
                    <select 
                        id="newUserRole" 
                        value={newUserRole}
                        onChange={(e) => setNewUserRole(e.target.value as any)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                        <option value="user">{t('user')}</option>
                        <option value="User Manager">{t('userManager') || 'User Manager'}</option>
                        <option value="Site Manager">{t('siteManager') || 'Site Manager'}</option>
                        <option value="Other">{t('other') || 'Other'}</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="newUserLocation" className="block text-sm font-medium text-gray-700">{t('location')}</label>
                    <select 
                        id="newUserLocation" 
                        value={newUserLocation}
                        onChange={(e) => setNewUserLocation(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                        <option value="">{t('selectLocation') || 'Select Location'}</option>
                        {locations.map(loc => (
                            <option key={loc.id} value={loc.name}>{loc.name}</option>
                        ))}
                        <option value="other">{t('other') || 'Other'}</option>
                    </select>
                </div>
                 <div>
                    <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700">
                        <UserCircleIcon className="h-5 w-5 me-2" />
                       {t('createUser_button')}
                    </button>
                </div>
                <div className="text-center">
                    <button type="button" onClick={() => setShowCreateUser(false)} className="font-medium text-sm text-gray-600 hover:text-gray-500">
                        {t('login_back')}
                    </button>
                </div>
             </form>
        )}
      </div>
    </div>
  );
};
