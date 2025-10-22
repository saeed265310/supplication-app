import React, { useState } from 'react';
import type { User } from '../types';
import { useUserData } from '../hooks/useUserData';
import GroupView from './GroupView';
import Modal from './Modal';
import { PlusIcon, LogoutIcon } from './icons';

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const { userData, loading, addGroup, deleteGroup, ...dataActions } = useUserData(user.username);
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

  const selectedGroup = userData.groups.find(g => g.id === selectedGroupId) || null;

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <aside className="w-64 bg-white dark:bg-gray-800 shadow-lg p-4 flex flex-col">
        <div className="flex items-center justify-between mb-6">
           <h1 className="text-2xl font-bold text-teal-600 dark:text-teal-400">عداد الأذكار</h1>
           <button onClick={onLogout} className="text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition-colors">
              <LogoutIcon />
           </button>
        </div>
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">مرحباً, {user.username}</p>
        
        <h2 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-200">مجموعات الأذكار</h2>
        <div className="flex-grow overflow-y-auto">
          <ul>
            {userData.groups.map(group => (
              <li key={group.id} 
                  className={`p-2 my-1 rounded-md cursor-pointer transition-colors ${selectedGroupId === group.id ? 'bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-200' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                  onClick={() => setSelectedGroupId(group.id)}>
                {group.name}
              </li>
            ))}
          </ul>
        </div>
        <button onClick={() => setIsAddGroupModalOpen(true)} className="mt-4 w-full flex items-center justify-center gap-2 bg-teal-600 text-white p-2 rounded-md hover:bg-teal-700 transition-colors">
          <PlusIcon />
          إضافة مجموعة
        </button>
      </aside>

      <main className="flex-1 p-6 overflow-y-auto">
        {loading ? (
          <p>جار التحميل...</p>
        ) : selectedGroup ? (
          <GroupView group={selectedGroup} dataActions={dataActions} deleteGroup={deleteGroup} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <h2 className="text-2xl">اختر مجموعة للبدء</h2>
              <p>أو قم بإنشاء مجموعة جديدة من القائمة الجانبية.</p>
            </div>
          </div>
        )}
      </main>

      <Modal isOpen={isAddGroupModalOpen} onClose={() => setIsAddGroupModalOpen(false)} title="إضافة مجموعة جديدة">
        <div className="space-y-4">
          <label htmlFor="groupName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">اسم المجموعة</label>
          <input
            type="text"
            id="groupName"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="مثال: أذكار الصباح"
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
