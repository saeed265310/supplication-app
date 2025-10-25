import React, { useState } from 'react';
import type { User } from '../types';
import { useUserData } from '../hooks/useUserData';
import GroupView from './GroupView';
import Modal from './Modal';
import { PlusIcon, LogoutIcon, ArrowRightIcon } from './icons';

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const { userData, loading, addGroup, deleteGroup, resetGroupSupplications, ...dataActions } = useUserData(!!user);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [isAddGroupModalOpen, setIsAddGroupModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  const handleAddGroup = () => {
    if (newGroupName.trim()) {
      addGroup(newGroupName.trim());
      setNewGroupName('');
      setIsAddGroupModalOpen(false);
    }
  };

  const handleSelectGroup = (groupId: string) => {
    setSelectedGroupId(groupId);
  };

  const handleBackToGroups = () => {
    setSelectedGroupId(null);
  };

  const selectedGroup = userData.groups.find(g => g.id === selectedGroupId) || null;

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-100 dark:bg-gray-900">
      {/* Mobile: Conditional rendering based on selectedGroup */}
      {/* Desktop: Always show sidebar */}
      <aside className={`
        ${selectedGroup ? 'hidden md:flex' : 'flex'}
        w-full md:w-64 bg-white dark:bg-gray-800 shadow-lg p-4 flex-col
      `}>
        <div className="flex items-center justify-between mb-6">
           <h1 className="text-2xl font-bold text-teal-600 dark:text-teal-400">عداد الأذكار</h1>
           <button onClick={onLogout} className="text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition-colors" aria-label="تسجيل الخروج">
              <LogoutIcon />
           </button>
        </div>
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">مرحباً, {user.username}</p>

        <h2 className="text-lg font-semibold mb-3 text-gray-700 dark:text-gray-200">مجموعات الأذكار</h2>
        <div className="flex-grow overflow-y-auto">
          {loading ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-4">جار التحميل...</p>
          ) : userData.groups.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-4">لا توجد مجموعات. قم بإضافة مجموعة جديدة.</p>
          ) : (
            <div className="space-y-3">
              {userData.groups.map(group => (
                <div
                  key={group.id}
                  className={`p-4 rounded-lg cursor-pointer transition-all duration-200 ${
                    selectedGroupId === group.id
                      ? 'bg-teal-600 dark:bg-teal-700 text-white shadow-lg transform scale-105'
                      : 'bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 shadow-md hover:shadow-lg'
                  }`}
                  onClick={() => handleSelectGroup(group.id)}>
                  <div className="flex items-center justify-between">
                    <h3 className={`text-lg font-bold ${
                      selectedGroupId === group.id
                        ? 'text-white'
                        : 'text-gray-800 dark:text-gray-100'
                    }`}>
                      {group.name}
                    </h3>
                    <svg
                      className={`h-5 w-5 ${
                        selectedGroupId === group.id
                          ? 'text-white'
                          : 'text-gray-400 dark:text-gray-500'
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <button onClick={() => setIsAddGroupModalOpen(true)} className="mt-4 w-full flex items-center justify-center gap-2 bg-teal-600 text-white p-3 rounded-md hover:bg-teal-700 transition-colors">
          <PlusIcon />
          إضافة مجموعة
        </button>
      </aside>

      {/* Main content area */}
      <main className={`
        ${selectedGroup ? 'flex' : 'hidden md:flex'}
        flex-1 flex-col h-screen md:h-auto overflow-hidden
      `}>
        {/* Mobile header with back button */}
        {selectedGroup && (
          <div className="md:hidden bg-white dark:bg-gray-800 shadow-md p-4 flex items-center gap-3">
            <button
              onClick={handleBackToGroups}
              className="text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300"
              aria-label="العودة للمجموعات">
              <ArrowRightIcon />
            </button>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{selectedGroup.name}</h2>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-600 dark:text-gray-300">جار التحميل...</p>
            </div>
          ) : selectedGroup ? (
            <GroupView
              group={selectedGroup}
              dataActions={dataActions}
              deleteGroup={deleteGroup}
              resetGroupSupplications={resetGroupSupplications}
              onDeleteGroup={handleBackToGroups}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500 dark:text-gray-400">
                <h2 className="text-2xl mb-2">اختر مجموعة للبدء</h2>
                <p>أو قم بإنشاء مجموعة جديدة من القائمة الجانبية.</p>
              </div>
            </div>
          )}
        </div>
      </main>

      <Modal isOpen={isAddGroupModalOpen} onClose={() => setIsAddGroupModalOpen(false)} title="إضافة مجموعة جديدة">
        <div className="space-y-4">
          <label htmlFor="groupName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">اسم المجموعة</label>
          <input
            type="text"
            id="groupName"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddGroup()}
            className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="مثال: أذكار الصباح"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <button onClick={() => setIsAddGroupModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">
              إلغاء
            </button>
            <button onClick={handleAddGroup} className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700">
              إضافة
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Dashboard;
