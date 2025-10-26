
import React from 'react';
import type { Supplication } from '../types';
import { EditIcon, TrashIcon } from './icons';

interface SupplicationCardProps {
  supplication: Supplication;
  onClick: () => void;
  onEdit?: (e: React.MouseEvent) => void;
  onDelete?: (e: React.MouseEvent) => void;
  onMoveUp?: (e: React.MouseEvent) => void;
  onMoveDown?: (e: React.MouseEvent) => void;
  isFirst?: boolean;
  isLast?: boolean;
}

const SupplicationCard: React.FC<SupplicationCardProps> = ({ supplication, onClick, onEdit, onDelete, onMoveUp, onMoveDown, isFirst, isLast }) => {
  const progress = supplication.target > 0 ? (supplication.currentCount / supplication.target) * 100 : 0;
  const isCompleted = supplication.currentCount >= supplication.target;

  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5 cursor-pointer transition-all duration-200 hover:shadow-xl hover:scale-102 active:scale-98 relative">
      {/* Action buttons */}
      {(onEdit || onDelete || onMoveUp || onMoveDown) && (
        <div className="absolute top-3 left-3 flex gap-1">
          {onEdit && (
            <button
              onClick={onEdit}
              className="p-1.5 bg-white dark:bg-gray-700 rounded-md shadow-sm text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 transition-colors z-10"
              aria-label="تعديل">
              <EditIcon />
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="p-1.5 bg-white dark:bg-gray-700 rounded-md shadow-sm text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition-colors z-10"
              aria-label="حذف">
              <TrashIcon />
            </button>
          )}
        </div>
      )}

      {/* Move up/down buttons */}
      {(onMoveUp || onMoveDown) && (
        <div className="absolute top-3 right-3 flex flex-col gap-1">
          {onMoveUp && !isFirst && (
            <button
              onClick={onMoveUp}
              className="p-1.5 bg-white dark:bg-gray-700 rounded-md shadow-sm text-gray-500 hover:text-teal-600 dark:text-gray-400 dark:hover:text-teal-400 transition-colors z-10"
              aria-label="تحريك لأعلى">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
          )}
          {onMoveDown && !isLast && (
            <button
              onClick={onMoveDown}
              className="p-1.5 bg-white dark:bg-gray-700 rounded-md shadow-sm text-gray-500 hover:text-teal-600 dark:text-gray-400 dark:hover:text-teal-400 transition-colors z-10"
              aria-label="تحريك لأسفل">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
        </div>
      )}

      <div className="space-y-3">
        {/* Title */}
        {supplication.title && (
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 line-clamp-2 pr-16">
            {supplication.title}
          </h3>
        )}

        {/* Text preview */}
        <p className="text-base text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
          {supplication.text}
        </p>

        {/* Progress bar */}
        <div className="pt-2">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-2">
            <div
              className={`h-2.5 rounded-full transition-all duration-500 ${
                isCompleted ? 'bg-green-500' : 'bg-teal-500'
              }`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            ></div>
          </div>

          {/* Count and status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-bold ${
                isCompleted ? 'text-green-600 dark:text-green-400' : 'text-teal-600 dark:text-teal-400'
              }`}>
                {supplication.currentCount}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">/ {supplication.target}</span>
            </div>
            {isCompleted && (
              <div className="flex items-center gap-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 px-2 py-1 rounded-full text-xs font-semibold">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>مكتمل</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupplicationCard;
