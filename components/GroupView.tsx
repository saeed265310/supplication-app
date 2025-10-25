
import React, { useState } from 'react';
import type { Supplication, SupplicationGroup } from '../types';
import SupplicationCard from './SupplicationCard';
import SupplicationView from './SupplicationView';
import Modal from './Modal';
import { PlusIcon, TrashIcon, ResetIcon } from './icons';

interface GroupViewProps {
  group: SupplicationGroup;
  deleteGroup: (groupId: string) => void;
  resetGroupSupplications: (groupId: string) => void;
  onDeleteGroup?: () => void;
  dataActions: {
    addSupplication: (groupId: string, title: string, text: string, target: number) => void;
    updateSupplication: (groupId: string, supplicationId: string, updatedTitle: string, updatedText: string, updatedTarget: number) => void;
    deleteSupplication: (groupId: string, supplicationId: string) => void;
    incrementCount: (groupId: string, supplicationId: string) => void;
    resetCount: (groupId: string, supplicationId: string) => void;
  };
}

const GroupView: React.FC<GroupViewProps> = ({ group, dataActions, deleteGroup, resetGroupSupplications, onDeleteGroup }) => {
  const [selectedSupplicationId, setSelectedSupplicationId] = useState<string | null>(null);
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

  const handleSelectSupplication = (supplicationId: string) => {
    setSelectedSupplicationId(supplicationId);
  };

  const handleBackToGroup = () => {
    setSelectedSupplicationId(null);
  };

  const handleIncrementWithAutoAdvance = (supplicationId: string) => {
    const supplication = group.supplications.find(s => s.id === supplicationId);
    if (!supplication) return;

    // Increment the count
    dataActions.incrementCount(group.id, supplicationId);

    // Check if this increment will reach the target
    if (supplication.currentCount + 1 >= supplication.target) {
      // Find current index
      const currentIndex = group.supplications.findIndex(s => s.id === supplicationId);

      // Check if there's a next supplication
      if (currentIndex < group.supplications.length - 1) {
        // Move to next supplication after a brief delay
        setTimeout(() => {
          setSelectedSupplicationId(group.supplications[currentIndex + 1].id);
        }, 800);
      } else {
        // This was the last supplication - check if all are complete
        const allComplete = group.supplications.every((s, idx) => {
          if (idx === currentIndex) {
            // For the current one, check if it will be complete after this increment
            return s.currentCount + 1 >= s.target;
          }
          return s.currentCount >= s.target;
        });

        if (allComplete) {
          // Show completion state after brief delay
          setTimeout(() => {
            setSelectedSupplicationId(null);
          }, 1000);
        }
      }
    }
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
        if (onDeleteGroup) {
          onDeleteGroup();
        }
    }
  };

  const handleResetGroup = () => {
    if (window.confirm(`هل أنت متأكد من إعادة تعيين جميع عدادات الأذكار في "${group.name}"؟`)) {
        resetGroupSupplications(group.id);
    }
  };

  const selectedSupplication = group.supplications.find(s => s.id === selectedSupplicationId);

  // Show supplication detail view if one is selected
  if (selectedSupplication) {
    return (
      <>
        <SupplicationView
          supplication={selectedSupplication}
          groupName={group.name}
          onBack={handleBackToGroup}
          onIncrement={() => handleIncrementWithAutoAdvance(selectedSupplication.id)}
          onReset={() => dataActions.resetCount(group.id, selectedSupplication.id)}
          onDelete={() => dataActions.deleteSupplication(group.id, selectedSupplication.id)}
          onEdit={() => openEditModal(selectedSupplication)}
          isLastInGroup={group.supplications[group.supplications.length - 1]?.id === selectedSupplication.id}
          totalSupplications={group.supplications.length}
          currentPosition={group.supplications.findIndex(s => s.id === selectedSupplication.id) + 1}
        />

        {/* Edit modal */}
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="تعديل الذكر">
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
      </>
    );
  }

  // Show group list view
  return (
    <div>
      {/* Desktop: Show title and buttons in header */}
      {/* Mobile: Title is in Dashboard header, only show buttons */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
        <h2 className="hidden md:block text-3xl font-bold text-gray-800 dark:text-gray-100">{group.name}</h2>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <button onClick={openAddModal} className="flex items-center justify-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-md hover:bg-teal-700 transition-colors">
                <PlusIcon />
                <span>إضافة ذكر</span>
            </button>
            <button onClick={handleResetGroup} className="flex items-center justify-center gap-2 bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 transition-colors">
                <ResetIcon />
                <span>إعادة تعيين الكل</span>
            </button>
            <button onClick={handleDeleteGroup} className="flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors">
                <TrashIcon />
                <span>حذف المجموعة</span>
            </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {group.supplications.map(supplication => (
          <SupplicationCard
            key={supplication.id}
            supplication={supplication}
            onClick={() => handleSelectSupplication(supplication.id)}
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
