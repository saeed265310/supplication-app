import React, { useState } from 'react';
import type { User } from '../types';
import { useUserData } from '../hooks/useUserData';
import GroupView from './GroupView';
import Statistics from './Statistics';
import Library from './Library';
import Modal from './Modal';
import { PlusIcon, LogoutIcon, ArrowRightIcon } from './icons';

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const { userData, loading, addGroup, deleteGroup, resetGroupSupplications, ...dataActions } = useUserData(!!user);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [view, setView] = useState<'groups' | 'statistics' | 'library'>('groups');
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

        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setView('groups')}
            className={`flex-1 py-2 px-2 rounded-md text-xs font-medium transition-colors ${
              view === 'groups'
                ? 'bg-teal-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}>
            المجموعات
          </button>
          <button
            onClick={() => setView('statistics')}
            className={`flex-1 py-2 px-2 rounded-md text-xs font-medium transition-colors ${
              view === 'statistics'
                ? 'bg-teal-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}>
            الإحصائيات
          </button>
          <button
            onClick={() => setView('library')}
            className={`flex-1 py-2 px-2 rounded-md text-xs font-medium transition-colors ${
              view === 'library'
                ? 'bg-teal-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}>
            المكتبة
          </button>
        </div>

        {view === 'groups' && <h2 className="text-lg font-semibold mb-3 text-gray-700 dark:text-gray-200">مجموعات الأذكار</h2>}

        {view === 'statistics' && (
          <div className="text-center py-8">
            <div className="mb-3">
              <svg className="h-12 w-12 mx-auto text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">عرض تفصيلي للإحصائيات</p>
          </div>
        )}

        {view === 'library' && (
          <div className="text-center py-8">
            <div className="mb-3">
              <svg className="h-12 w-12 mx-auto text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">استعراض حصن المسلم</p>
          </div>
        )}

        <div className="flex-grow overflow-y-auto">
          {view === 'groups' && loading ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-4">جار التحميل...</p>
          ) : view === 'groups' && userData.groups.length === 0 ? (
            <div className="text-center py-8">
              <div className="mb-4">
                <svg className="h-16 w-16 mx-auto text-gray-400 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <p className="text-gray-500 dark:text-gray-400 mb-2">لا توجد مجموعات</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">قم بإضافة مجموعة جديدة للبدء</p>
            </div>
          ) : view === 'groups' && userData.groups.length > 0 ? (
            <div className="space-y-4">
              {userData.groups.map(group => {
                const totalSupplications = group.supplications.length;
                const completedSupplications = group.supplications.filter(s => s.currentCount >= s.target).length;
                const progress = totalSupplications > 0 ? (completedSupplications / totalSupplications) * 100 : 0;

                return (
                  <div
                    key={group.id}
                    className={`p-6 rounded-xl cursor-pointer transition-all duration-200 ${
                      selectedGroupId === group.id
                        ? 'bg-gradient-to-br from-teal-500 to-teal-600 dark:from-teal-600 dark:to-teal-700 text-white shadow-xl transform scale-105'
                        : 'bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 shadow-lg hover:shadow-xl'
                    }`}
                    onClick={() => handleSelectGroup(group.id)}>
                    <div className="space-y-3">
                      {/* Header with title and arrow */}
                      <div className="flex items-center justify-between">
                        <h3 className={`text-2xl font-bold ${
                          selectedGroupId === group.id
                            ? 'text-white'
                            : 'text-gray-800 dark:text-gray-100'
                        }`}>
                          {group.name}
                        </h3>
                        <svg
                          className={`h-6 w-6 ${
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

                      {/* Stats */}
                      {totalSupplications > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className={selectedGroupId === group.id ? 'text-teal-50' : 'text-gray-600 dark:text-gray-300'}>
                              {totalSupplications} {totalSupplications === 1 ? 'ذكر' : 'أذكار'}
                            </span>
                            <span className={selectedGroupId === group.id ? 'text-teal-50 font-semibold' : 'text-gray-600 dark:text-gray-300 font-semibold'}>
                              {completedSupplications} / {totalSupplications} مكتمل
                            </span>
                          </div>

                          {/* Progress bar */}
                          <div className={`w-full rounded-full h-2.5 ${
                            selectedGroupId === group.id ? 'bg-teal-400 bg-opacity-30' : 'bg-gray-200 dark:bg-gray-600'
                          }`}>
                            <div
                              className={`h-2.5 rounded-full transition-all duration-500 ${
                                selectedGroupId === group.id ? 'bg-white' : 'bg-teal-500'
                              }`}
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                        </div>
                      )}

                      {totalSupplications === 0 && (
                        <p className={`text-sm ${
                          selectedGroupId === group.id ? 'text-teal-50' : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          مجموعة فارغة
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>

        {view === 'groups' && (
          <button onClick={() => setIsAddGroupModalOpen(true)} className="mt-4 w-full flex items-center justify-center gap-2 bg-teal-600 text-white p-3 rounded-md hover:bg-teal-700 transition-colors">
            <PlusIcon />
            إضافة مجموعة
          </button>
        )}
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
          {view === 'statistics' ? (
            <Statistics />
          ) : view === 'library' ? (
            <Library
              userGroups={userData.groups}
              onImportSupplication={dataActions.addSupplication}
            />
          ) : loading ? (
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
