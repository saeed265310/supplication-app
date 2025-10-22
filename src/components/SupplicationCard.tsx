import React from 'react';
import type { Supplication } from '../types';
import { EditIcon, TrashIcon, ResetIcon } from './icons';

interface SupplicationCardProps {
  supplication: Supplication;
  onIncrement: () => void;
  onReset: () => void;
  onDelete: () => void;
  onEdit: () => void;
}

const SupplicationCard: React.FC<SupplicationCardProps> = ({ supplication, onIncrement, onReset, onDelete, onEdit }) => {
  const progress = supplication.target > 0 ? (supplication.currentCount / supplication.target) * 100 : 0;
  const isCompleted = supplication.currentCount >= supplication.target;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 flex flex-col justify-between transition-transform transform hover:scale-105">
      <div>
        <div className="flex justify-between items-start mb-2">
          <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed min-h-[56px]">{supplication.text}</p>
          <div className="flex flex-col gap-2 flex-shrink-0 ms-2">
            <button onClick={onEdit} className="text-gray-400 hover:text-blue-500 dark:hover:text-blue-400"><EditIcon /></button>
            <button onClick={onDelete} className="text-gray-400 hover:text-red-500 dark:hover:text-red-400"><TrashIcon /></button>
          </div>
        </div>
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-2">
          <span>الهدف: {supplication.target}</span>
          <button onClick={onReset} className="flex items-center gap-1 hover:text-yellow-500">
            <ResetIcon />
            إعادة
          </button>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-4">
          <div
            className={`h-2.5 rounded-full transition-all duration-500 ${isCompleted ? 'bg-green-500' : 'bg-teal-500'}`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          ></div>
        </div>
      </div>
      <button
        onClick={onIncrement}
        className={`w-full py-6 text-3xl font-bold rounded-md transition-colors text-white ${isCompleted ? 'bg-green-600 hover:bg-green-700' : 'bg-teal-600 hover:bg-teal-700'}`}
      >
        {supplication.currentCount}
      </button>
    </div>
  );
};

export default SupplicationCard;
