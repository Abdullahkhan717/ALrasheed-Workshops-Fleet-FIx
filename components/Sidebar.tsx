import React from 'react';
import { HomeIcon, TruckIcon, WrenchScrewdriverIcon, ClockIcon, BuildingStorefrontIcon, CheckBadgeIcon, HistoryIcon, CogIcon, ArrowRightOnRectangleIcon, ShieldCheckIcon, KeyIcon, XMarkIcon, MapPinIcon } from './Icons';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from '../hooks/useTranslation';
import { useAuth } from '../context/AuthContext';

type View = 'dashboard' | 'fleet' | 'request' | 'history' | 'pending' | 'workshops' | 'completed' | 'admin' | 'oilLog' | 'locations' | 'transfers' | 'outsourcedLog' | 'tyreLogs' | 'myVehicles' | 'oilChangeAlert';

interface SidebarProps {
  activeView: View;
  setActiveView: (view: View) => void;
  onChangePasswordClick: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const NavItem: React.FC<{
    icon: React.ReactNode;
    label: string;
    isActive: boolean;
    onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
        isActive
            ? 'bg-green-600 text-white'
            : 'text-gray-600 hover:bg-gray-200 hover:text-gray-800'
        }`}
    >
        {icon}
        <span className="ms-4">{label}</span>
    </button>
);

export const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, onChangePasswordClick, isOpen, onClose }) => {
  const { language, setLanguage } = useLanguage();
  const { currentUser, logout } = useAuth();
  const { t } = useTranslation();
  
  return (
    <>
        {/* Mobile Overlay */}
        {isOpen && (
            <div 
                className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
                onClick={onClose}
            />
        )}

        <aside className={`
            fixed inset-y-0 start-0 z-40 w-64 bg-white shadow-lg flex flex-col transition-transform duration-300 transform
            ${isOpen ? 'translate-x-0' : (language === 'ar' ? 'translate-x-full' : '-translate-x-full')}
            lg:translate-x-0 lg:static lg:inset-0
        `}>
            <div className="flex items-center justify-between h-20 border-b px-4">
                <div className="flex flex-col">
                    <div className="flex items-center">
                        <CogIcon className="h-8 w-8 text-green-600" />
                        <h1 className="text-xl font-bold text-gray-800 ms-2">{t('repairSystem')}</h1>
                    </div>
                    {currentUser && (
                        <p className="text-xs text-gray-500 ms-10 -mt-1 font-medium">
                            ID: {currentUser.id}
                        </p>
                    )}
                </div>
                <button onClick={onClose} className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-md">
                    <XMarkIcon className="h-6 w-6" />
                </button>
            </div>
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        <NavItem
            icon={<HomeIcon className="h-6 w-6" />}
            label={t('dashboard')}
            isActive={activeView === 'dashboard'}
            onClick={() => setActiveView('dashboard')}
        />
        <NavItem
            icon={<TruckIcon className="h-6 w-6" />}
            label={t('vehicleList')}
            isActive={activeView === 'fleet'}
            onClick={() => setActiveView('fleet')}
        />
        <NavItem
            icon={<TruckIcon className="h-6 w-6" />}
            label={t('myVehicles')}
            isActive={activeView === 'myVehicles'}
            onClick={() => setActiveView('myVehicles')}
        />
        <NavItem
            icon={<WrenchScrewdriverIcon className="h-6 w-6" />}
            label={t('newRepairRequest')}
            isActive={activeView === 'request'}
            onClick={() => setActiveView('request')}
        />
        <NavItem
            icon={<ClockIcon className="h-6 w-6" />}
            label={t('pendingRequests')}
            isActive={activeView === 'pending'}
            onClick={() => setActiveView('pending')}
        />
        <NavItem
            icon={<CheckBadgeIcon className="h-6 w-6" />}
            label={t('completedRequests')}
            isActive={activeView === 'completed'}
            onClick={() => setActiveView('completed')}
        />
        <NavItem
            icon={<ClockIcon className="h-6 w-6" />}
            label={t('oilChangeAlert')}
            isActive={activeView === 'oilChangeAlert'}
            onClick={() => setActiveView('oilChangeAlert')}
        />
         <NavItem
            icon={<BuildingStorefrontIcon className="h-6 w-6" />}
            label={t('workshops')}
            isActive={activeView === 'workshops'}
            onClick={() => setActiveView('workshops')}
        />
        <NavItem
            icon={<MapPinIcon className="h-6 w-6" />}
            label={t('locations')}
            isActive={activeView === 'locations'}
            onClick={() => setActiveView('locations')}
        />
        <NavItem
            icon={<HistoryIcon className="h-6 w-6" />}
            label={t('history')}
            isActive={activeView === 'history'}
            onClick={() => setActiveView('history')}
        />
        {currentUser?.role === 'admin' && (
            <>
                 <NavItem
                    icon={<ShieldCheckIcon className="h-6 w-6" />}
                    label={t('adminPanel')}
                    isActive={activeView === 'admin'}
                    onClick={() => setActiveView('admin')}
                />
            </>
        )}
      </nav>
      <div className="p-4 mt-auto border-t">
        <div className="flex justify-center mb-4">
            <div className="inline-flex rounded-md shadow-sm" role="group">
                <button type="button" onClick={() => setLanguage('en')} className={`px-4 py-2 text-sm font-medium border rounded-s-lg ${language === 'en' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-900 border-gray-200 hover:bg-gray-100'}`}>
                English
                </button>
                <button type="button" onClick={() => setLanguage('ar')} className={`px-4 py-2 text-sm font-medium border rounded-e-lg ${language === 'ar' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-900 border-gray-200 hover:bg-gray-100'}`}>
                العربية
                </button>
            </div>
        </div>
        <button
            onClick={onChangePasswordClick}
            className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium rounded-lg text-gray-600 hover:bg-gray-200 hover:text-gray-800 transition-colors duration-200 mb-2"
        >
            <KeyIcon className="h-6 w-6" />
            <span className="ms-3 font-bold">{t('changePassword')}</span>
        </button>
        <button
            onClick={logout}
            className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium rounded-lg text-red-600 hover:bg-red-100 hover:text-red-800 transition-colors duration-200"
        >
            <ArrowRightOnRectangleIcon className="h-6 w-6" />
            <span className="ms-3 font-bold">{t('logout')}</span>
        </button>
      </div>
    </aside>
    </>
  );
};
