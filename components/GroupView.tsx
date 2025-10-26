
import React, { useState } from 'react';
import type { Supplication, SupplicationGroup } from '../types';
import SupplicationCard from './SupplicationCard';
import SupplicationView from './SupplicationView';
import Modal from './Modal';
import { PlusIcon, TrashIcon, ResetIcon } from './icons';

interface GroupViewProps {
  group: SupplicationGroup;
  allGroups: SupplicationGroup[];
  deleteGroup: (groupId: string) => void;
  resetGroupSupplications: (groupId: string) => void;
  reorderSupplications: (groupId: string, supplicationIds: string[]) => void;
  onDeleteGroup?: () => void;
  dataActions: {
    addSupplication: (groupId: string, title: string, text: string, target: number) => void;
    updateSupplication: (groupId: string, supplicationId: string, updatedTitle: string, updatedText: string, updatedTarget: number) => void;
    deleteSupplication: (groupId: string, supplicationId: string) => void;
    incrementCount: (groupId: string, supplicationId: string) => void;
    resetCount: (groupId: string, supplicationId: string) => void;
  };
}

const GroupView: React.FC<GroupViewProps> = ({ group, allGroups, dataActions, deleteGroup, resetGroupSupplications, reorderSupplications, onDeleteGroup }) => {
  const [selectedSupplicationId, setSelectedSupplicationId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplication, setEditingSupplication] = useState<Supplication | null>(null);
  const [deletingSupplication, setDeletingSupplication] = useState<Supplication | null>(null);
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [supplicationTitle, setSupplicationTitle] = useState('');
  const [supplicationText, setSupplicationText] = useState('');
  const [supplicationTarget, setSupplicationTarget] = useState(100);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportingSupplication, setExportingSupplication] = useState<Supplication | null>(null);
  const [selectedExportGroups, setSelectedExportGroups] = useState<string[]>([]);

  const openAddModal = () => {
    setEditingSupplication(null);
    setSupplicationTitle('');
    setSupplicationText('');
    setSupplicationTarget(100);
    setIsModalOpen(true);
  };

  const openEditModal = (supplication: Supplication, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setEditingSupplication(supplication);
    setSupplicationTitle(supplication.title || '');
    setSupplicationText(supplication.text);
    setSupplicationTarget(supplication.target);
    setIsModalOpen(true);
  };

  const openDeleteConfirm = (supplication: Supplication, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingSupplication(supplication);
  };

  const handleDeleteSupplication = () => {
    if (deletingSupplication) {
      dataActions.deleteSupplication(group.id, deletingSupplication.id);
      setDeletingSupplication(null);
    }
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

  const handleOpenExportModal = () => {
    if (editingSupplication) {
      setExportingSupplication(editingSupplication);
      setSelectedExportGroups([]);
      setIsExportModalOpen(true);
    }
  };

  const handleExportSupplication = () => {
    if (exportingSupplication && selectedExportGroups.length > 0) {
      // Copy the supplication to all selected groups
      selectedExportGroups.forEach(targetGroupId => {
        dataActions.addSupplication(
          targetGroupId,
          exportingSupplication.title || '',
          exportingSupplication.text,
          exportingSupplication.target
        );
      });

      setIsExportModalOpen(false);
      setExportingSupplication(null);
      setSelectedExportGroups([]);
      alert('تم نسخ الذكر بنجاح!');
    }
  };

  const toggleGroupSelection = (groupId: string) => {
    setSelectedExportGroups(prev => {
      if (prev.includes(groupId)) {
        return prev.filter(id => id !== groupId);
      } else {
        return [...prev, groupId];
      }
    });
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

  const handleMoveUp = (supplication: Supplication, e: React.MouseEvent) => {
    e.stopPropagation();
    const currentIndex = group.supplications.findIndex(s => s.id === supplication.id);
    if (currentIndex > 0) {
      const newOrder = [...group.supplications];
      [newOrder[currentIndex - 1], newOrder[currentIndex]] = [newOrder[currentIndex], newOrder[currentIndex - 1]];
      reorderSupplications(group.id, newOrder.map(s => s.id));
    }
  };

  const handleMoveDown = (supplication: Supplication, e: React.MouseEvent) => {
    e.stopPropagation();
    const currentIndex = group.supplications.findIndex(s => s.id === supplication.id);
    if (currentIndex < group.supplications.length - 1) {
      const newOrder = [...group.supplications];
      [newOrder[currentIndex], newOrder[currentIndex + 1]] = [newOrder[currentIndex + 1], newOrder[currentIndex]];
      reorderSupplications(group.id, newOrder.map(s => s.id));
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
        <div className="flex flex-row flex-wrap gap-2 w-full sm:w-auto">
            <button onClick={openAddModal} className="flex items-center justify-center gap-2 bg-teal-600 text-white px-3 py-2 rounded-md hover:bg-teal-700 transition-colors text-sm">
                <PlusIcon />
                <span className="hidden sm:inline">إضافة ذكر</span>
                <span className="sm:hidden">إضافة</span>
            </button>
            <button
              onClick={() => setIsReorderMode(!isReorderMode)}
              className={`flex items-center justify-center gap-2 text-white px-3 py-2 rounded-md transition-colors text-sm ${
                isReorderMode ? 'bg-purple-700 hover:bg-purple-800' : 'bg-purple-600 hover:bg-purple-700'
              }`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
                <span className="hidden sm:inline">ترتيب</span>
            </button>
            <button onClick={handleResetGroup} className="flex items-center justify-center gap-2 bg-yellow-600 text-white px-3 py-2 rounded-md hover:bg-yellow-700 transition-colors text-sm">
                <ResetIcon />
                <span className="hidden sm:inline">إعادة تعيين</span>
                <span className="sm:hidden">إعادة</span>
            </button>
            <button onClick={handleDeleteGroup} className="flex items-center justify-center gap-2 bg-red-600 text-white px-3 py-2 rounded-md hover:bg-red-700 transition-colors text-sm">
                <TrashIcon />
                <span className="hidden sm:inline">حذف المجموعة</span>
                <span className="sm:hidden">حذف</span>
            </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {group.supplications.map((supplication, index) => (
          <SupplicationCard
            key={supplication.id}
            supplication={supplication}
            onClick={() => handleSelectSupplication(supplication.id)}
            onEdit={!isReorderMode ? (e) => openEditModal(supplication, e) : undefined}
            onDelete={!isReorderMode ? (e) => openDeleteConfirm(supplication, e) : undefined}
            onMoveUp={isReorderMode ? (e) => handleMoveUp(supplication, e) : undefined}
            onMoveDown={isReorderMode ? (e) => handleMoveDown(supplication, e) : undefined}
            isFirst={index === 0}
            isLast={index === group.supplications.length - 1}
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
          <div className="flex justify-between items-center gap-2">
            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">
              إلغاء
            </button>
            <div className="flex gap-2">
              {editingSupplication && (
                <button onClick={handleOpenExportModal} className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700">
                  نسخ لمجموعة
                </button>
              )}
              <button onClick={handleSave} className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700">
                حفظ
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Delete confirmation modal */}
      <Modal isOpen={!!deletingSupplication} onClose={() => setDeletingSupplication(null)} title="تأكيد الحذف">
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            هل أنت متأكد من حذف هذا الذكر؟ لا يمكن التراجع عن هذا الإجراء.
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setDeletingSupplication(null)}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">
              إلغاء
            </button>
            <button
              onClick={handleDeleteSupplication}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
              حذف
            </button>
          </div>
        </div>
      </Modal>

      {/* Export modal */}
      <Modal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} title="نسخ الذكر لمجموعات أخرى">
        <div className="space-y-4">
          {exportingSupplication && (
            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">الذكر المراد نسخه:</p>
              <p className="font-bold text-gray-800 dark:text-gray-200">{exportingSupplication.title || exportingSupplication.text.substring(0, 50) + '...'}</p>
            </div>
          )}

          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">اختر المجموعات:</p>
            {allGroups.filter(g => g.id !== group.id).length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-4">لا توجد مجموعات أخرى متاحة</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {allGroups
                  .filter(g => g.id !== group.id)
                  .map(targetGroup => (
                    <label
                      key={targetGroup.id}
                      className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedExportGroups.includes(targetGroup.id)}
                        onChange={() => toggleGroupSelection(targetGroup.id)}
                        className="w-5 h-5 text-teal-600 rounded focus:ring-teal-500"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-800 dark:text-gray-200">{targetGroup.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {targetGroup.supplications.length} {targetGroup.supplications.length === 1 ? 'ذكر' : 'أذكار'}
                        </p>
                      </div>
                    </label>
                  ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setIsExportModalOpen(false)}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">
              إلغاء
            </button>
            <button
              onClick={handleExportSupplication}
              disabled={selectedExportGroups.length === 0}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed">
              نسخ ({selectedExportGroups.length})
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default GroupView;
