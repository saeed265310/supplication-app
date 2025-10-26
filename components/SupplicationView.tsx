import React, { useState } from 'react';
import type { Supplication } from '../types';
import { ArrowRightIcon, ResetIcon } from './icons';

interface SupplicationViewProps {
  supplication: Supplication;
  groupName: string;
  onBack: () => void;
  onIncrement: () => void;
  onReset: () => void;
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
  isLastInGroup,
  totalSupplications,
  currentPosition,
}) => {
  const [showTransition, setShowTransition] = useState(false);
  const [fontSize, setFontSize] = useState<'3xs' | '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'>('2xs');
  const [fontWeight, setFontWeight] = useState<'normal' | 'medium' | 'semibold' | 'bold'>('bold');
  const progress = supplication.target > 0 ? (supplication.currentCount / supplication.target) * 100 : 0;
  const isCompleted = supplication.currentCount >= supplication.target;
  const remaining = Math.max(0, supplication.target - supplication.currentCount);

  const fontSizeClasses = {
    '3xs': 'text-sm md:text-base',
    '2xs': 'text-base md:text-lg',
    'xs': 'text-lg md:text-xl',
    'sm': 'text-xl md:text-2xl',
    'md': 'text-2xl md:text-3xl',
    'lg': 'text-3xl md:text-4xl',
    'xl': 'text-4xl md:text-5xl',
    '2xl': 'text-5xl md:text-6xl',
  };

  const fontWeightClasses = {
    'normal': 'font-normal',
    'medium': 'font-medium',
    'semibold': 'font-semibold',
    'bold': 'font-bold',
  };

  const fontSizeOrder: ('3xs' | '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl')[] = ['3xs', '2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl'];
  const fontWeightOrder: ('normal' | 'medium' | 'semibold' | 'bold')[] = ['normal', 'medium', 'semibold', 'bold'];

  const cycleFontSize = () => {
    const currentIndex = fontSizeOrder.indexOf(fontSize);
    const nextIndex = (currentIndex + 1) % fontSizeOrder.length;
    setFontSize(fontSizeOrder[nextIndex]);
  };

  const cycleFontWeight = () => {
    const currentIndex = fontWeightOrder.indexOf(fontWeight);
    const nextIndex = (currentIndex + 1) % fontWeightOrder.length;
    setFontWeight(fontWeightOrder[nextIndex]);
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

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 relative">
      {/* Floating controls - Top */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between">
        <button
          onClick={onBack}
          className="p-3 bg-white dark:bg-gray-800 rounded-full shadow-lg text-teal-600 dark:text-teal-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label="العودة للمجموعة">
          <ArrowRightIcon />
        </button>
        <div className="flex gap-2">
          <button
            onClick={cycleFontSize}
            className="p-3 bg-white dark:bg-gray-800 rounded-full shadow-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="تغيير حجم الخط">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h8" />
            </svg>
          </button>
          <button
            onClick={cycleFontWeight}
            className="p-3 bg-white dark:bg-gray-800 rounded-full shadow-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="تغيير سمك الخط">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12h12M6 6h12M6 18h12" />
            </svg>
          </button>
          <button
            onClick={onReset}
            className="p-3 bg-white dark:bg-gray-800 rounded-full shadow-lg text-yellow-600 dark:text-yellow-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="إعادة تعيين">
            <ResetIcon />
          </button>
        </div>
      </div>

      {/* Main content - Supplication text */}
      <div className="flex-1 flex flex-col p-6 pt-24 relative overflow-hidden">
        {/* Scrollable text area */}
        <div className="flex-1 overflow-y-auto px-4">
          <div className="w-full text-center">
            <p className={`${fontSizeClasses[fontSize]} ${fontWeightClasses[fontWeight]} text-gray-800 dark:text-gray-100 leading-relaxed mb-8 whitespace-pre-line`}>
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
      </div>
    </div>
  );
};

export default SupplicationView;
