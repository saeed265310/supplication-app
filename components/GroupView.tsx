
import React, { useState } from 'react';
import type { Supplication, SupplicationGroup } from '../types';
import SupplicationCard from './SupplicationCard';
import Modal from './Modal';
import { PlusIcon, TrashIcon } from './icons';

interface GroupViewProps {
  group: SupplicationGroup;
  deleteGroup: (groupId: string) => void;
  dataActions: {
    addSupplication: (groupId: string, title: string, text: string, target: number) => void;
    updateSupplication: (groupId: string, supplicationId: string, updatedTitle: string, updatedText: string, updatedTarget: number) => void;
    deleteSupplication: (groupId: string, supplicationId: string) => void;
    incrementCount: (groupId: string, supplicationId: string) => void;
    resetCount: (groupId: string, supplicationId: string) => void;
  };
}

const GroupView: React.FC<GroupViewProps> = ({ group, dataActions, deleteGroup }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplication, setEditingSupplication] = useState<Supplication | null>(null);
  const [supplicationTitle, setSupplicationTitle] = useState('');
  const [supplicationText, setSupplicationText] = useState('');
  const [supplicationTarget, setSupplicationTarget] = useState(100);

  const openAddModal = () => {
    setEditingSupplication(null);
    setSupplicationTitle('');
    setSupplicationText('');
    setSupplicationTarget(100);
    setIsModalOpen(true);
  };

  const openEditModal = (supplication: Supplication) => {
    setEditingSupplication(supplication);
    setSupplicationTitle(supplication.title || '');
    setSupplicationText(supplication.text);
    setSupplicationTarget(supplication.target);
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (supplicationText.trim() && supplicationTarget > 0) {
      if (editingSupplication) {
        dataActions.updateSupplication(group.id, editingSupplication.id, supplicationTitle, supplicationText, supplicationTarget);
      } else {
        dataActions.addSupplication(group.id, supplicationTitle, supplicationText, supplicationTarget);
      }
      setIsModalOpen(false);
    }
  };

  const handleDeleteGroup = () => {
    if (window.confirm(`هل أنت متأكد من حذف مجموعة "${group.name}"؟ سيتم حذف جميع الأذكار بداخلها.`)) {
        deleteGroup(group.id);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">{group.name}</h2>
        <div className="flex gap-2">
            <button onClick={openAddModal} className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 transition-colors">
                <PlusIcon />
                إضافة ذكر
            </button>
            <button onClick={handleDeleteGroup} className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors">
                <TrashIcon />
                حذف المجموعة
            </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {group.supplications.map(supplication => (
          <SupplicationCard
            key={supplication.id}
            supplication={supplication}
            onIncrement={() => dataActions.incrementCount(group.id, supplication.id)}
            onReset={() => dataActions.resetCount(group.id, supplication.id)}
            onDelete={() => dataActions.deleteSupplication(group.id, supplication.id)}
            onEdit={() => openEditModal(supplication)}
          />
        ))}
         {group.supplications.length === 0 && (
             <p className="col-span-full text-center text-gray-500 dark:text-gray-400 mt-8">
                لا توجد أذكار في هذه المجموعة. قم بإضافة ذكر جديد.
             </p>
         )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingSupplication ? "تعديل الذكر" : "إضافة ذكر جديد"}>
        <div className="space-y-4">
          <div>
            <label htmlFor="supplicationTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              عنوان الذكر
            </label>
            <input
              type="text"
              id="supplicationTitle"
              value={supplicationTitle}
              onChange={(e) => setSupplicationTitle(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="مثال: التسبيح"
            />
          </div>
          <div>
            <label htmlFor="supplicationText" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              نص الذكر
            </label>
            <textarea
              id="supplicationText"
              value={supplicationText}
              onChange={(e) => setSupplicationText(e.target.value)}
              rows={4}
              className="w-full p-2 border border-gray-300 rounded-md mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="مثال: سبحان الله"
            />
          </div>
          <div>
            <label htmlFor="supplicationTarget" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              الهدف
            </label>
            <input
              type="number"
              id="supplicationTarget"
              value={supplicationTarget}
              onChange={(e) => setSupplicationTarget(parseInt(e.target.value, 10) || 0)}
              className="w-full p-2 border border-gray-300 rounded-md mt-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">
              إلغاء
            </button>
            <button onClick={handleSave} className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700">
              حفظ
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default GroupView;
