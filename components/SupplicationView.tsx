import React, { useState } from 'react';
import type { Supplication } from '../types';
import Modal from './Modal';
import { ArrowRightIcon, EditIcon, TrashIcon, ResetIcon } from './icons';

interface SupplicationViewProps {
  supplication: Supplication;
  groupName: string;
  onBack: () => void;
  onIncrement: () => void;
  onReset: () => void;
  onDelete: () => void;
  onEdit: () => void;
  isLastInGroup: boolean;
  totalSupplications: number;
  currentPosition: number;
}

const SupplicationView: React.FC<SupplicationViewProps> = ({
  supplication,
  groupName,
  onBack,
  onIncrement,
  onReset,
  onDelete,
  onEdit,
  isLastInGroup,
  totalSupplications,
  currentPosition,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showTransition, setShowTransition] = useState(false);
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg' | 'xl' | '2xl'>('lg');
  const progress = supplication.target > 0 ? (supplication.currentCount / supplication.target) * 100 : 0;
  const isCompleted = supplication.currentCount >= supplication.target;
  const remaining = Math.max(0, supplication.target - supplication.currentCount);

  const fontSizeClasses = {
    'sm': 'text-xl md:text-2xl',
    'md': 'text-2xl md:text-3xl',
    'lg': 'text-3xl md:text-4xl',
    'xl': 'text-4xl md:text-5xl',
    '2xl': 'text-5xl md:text-6xl',
  };

  const handleIncrement = () => {
    // Prevent counting beyond target
    if (supplication.currentCount >= supplication.target) {
      return;
    }

    onIncrement();

    // Check if this will complete the supplication
    if (supplication.currentCount + 1 >= supplication.target) {
      // Show transition message
      setShowTransition(true);
      setTimeout(() => {
        setShowTransition(false);
      }, 1500);
    }
  };

  const handleDelete = () => {
    onDelete();
    onBack();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with back button */}
      <div className="bg-white dark:bg-gray-800 shadow-md p-4 flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button
            onClick={onBack}
            className="text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 flex-shrink-0"
            aria-label="العودة للمجموعة">
            <ArrowRightIcon />
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-sm text-gray-500 dark:text-gray-400">{groupName}</h2>
              <span className="text-xs bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-200 px-2 py-0.5 rounded-full">
                {currentPosition} من {totalSupplications}
              </span>
            </div>
            {supplication.title && (
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 truncate">{supplication.title}</h3>
            )}
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={onEdit}
            className="p-2 text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400"
            aria-label="تعديل">
            <EditIcon />
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-2 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
            aria-label="حذف">
            <TrashIcon />
          </button>
        </div>
      </div>

      {/* Main content - Supplication text */}
      <div className="flex-1 flex flex-col p-6 bg-gray-50 dark:bg-gray-900 relative overflow-hidden">
        {/* Font size controls */}
        <div className="flex justify-center gap-2 mb-4">
          <button
            onClick={() => setFontSize('sm')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              fontSize === 'sm'
                ? 'bg-teal-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}>
            أ
          </button>
          <button
            onClick={() => setFontSize('md')}
            className={`px-3 py-1 rounded-md text-base font-medium transition-colors ${
              fontSize === 'md'
                ? 'bg-teal-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}>
            أ
          </button>
          <button
            onClick={() => setFontSize('lg')}
            className={`px-3 py-1 rounded-md text-lg font-medium transition-colors ${
              fontSize === 'lg'
                ? 'bg-teal-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}>
            أ
          </button>
          <button
            onClick={() => setFontSize('xl')}
            className={`px-3 py-1 rounded-md text-xl font-medium transition-colors ${
              fontSize === 'xl'
                ? 'bg-teal-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}>
            أ
          </button>
          <button
            onClick={() => setFontSize('2xl')}
            className={`px-3 py-1 rounded-md text-2xl font-medium transition-colors ${
              fontSize === '2xl'
                ? 'bg-teal-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}>
            أ
          </button>
        </div>

        {/* Scrollable text area */}
        <div className="flex-1 overflow-y-auto px-4">
          <div className="w-full text-center">
            <p className={`${fontSizeClasses[fontSize]} font-bold text-gray-800 dark:text-gray-100 leading-relaxed mb-8 whitespace-pre-line`}>
              {supplication.text}
            </p>

            {/* Status badge */}
            {isCompleted && !showTransition && (
              <div className="inline-flex items-center gap-2 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 px-4 py-2 rounded-full mb-4">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-semibold">اكتمل الهدف!</span>
              </div>
            )}
          </div>
        </div>

        {/* Transition overlay */}
        {showTransition && (
          <div className="absolute inset-0 flex items-center justify-center bg-green-500 bg-opacity-95 z-10">
            <div className="text-center text-white">
              <div className="mb-4">
                <svg className="h-20 w-20 mx-auto animate-bounce" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold mb-2">أحسنت!</h2>
              {!isLastInGroup && (
                <p className="text-xl">الانتقال للذكر التالي...</p>
              )}
              {isLastInGroup && (
                <p className="text-xl">تم إكمال جميع الأذكار!</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom section - Progress and counter */}
      <div className="bg-white dark:bg-gray-800 shadow-lg p-6 space-y-4">
        {/* Progress bar */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {remaining > 0 ? `متبقي ${remaining}` : 'مكتمل'}
            </span>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {supplication.currentCount} / {supplication.target}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${
                isCompleted ? 'bg-green-500' : 'bg-teal-500'
              }`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Counter button */}
        <button
          onClick={handleIncrement}
          disabled={isCompleted}
          className={`w-full py-8 text-5xl md:text-6xl font-bold rounded-xl transition-all duration-200 text-white shadow-lg ${
            isCompleted
              ? 'bg-green-600 cursor-not-allowed opacity-90'
              : 'bg-teal-600 hover:bg-teal-700 active:bg-teal-800 active:scale-95'
          }`}>
          {supplication.currentCount}
        </button>

        {/* Reset button */}
        <button
          onClick={onReset}
          className="w-full flex items-center justify-center gap-2 py-3 text-gray-600 dark:text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400 transition-colors">
          <ResetIcon />
          <span className="font-medium">إعادة تعيين العداد</span>
        </button>
      </div>

      {/* Delete confirmation modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="تأكيد الحذف">
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            هل أنت متأكد من حذف هذا الذكر؟ لا يمكن التراجع عن هذا الإجراء.
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">
              إلغاء
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
              حذف
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SupplicationView;
