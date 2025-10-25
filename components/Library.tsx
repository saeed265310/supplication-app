import React, { useState, useEffect } from 'react';
import type { LibraryData, LibraryCategory, LibrarySupplication, SupplicationGroup } from '../types';
import { apiGetLibrary } from '../utils/api';
import Modal from './Modal';

interface LibraryProps {
  userGroups: SupplicationGroup[];
  onImportSupplication: (groupId: string, title: string, text: string, target: number) => Promise<void>;
}

const Library: React.FC<LibraryProps> = ({ userGroups, onImportSupplication }) => {
  const [libraryData, setLibraryData] = useState<LibraryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [importingSupplication, setImportingSupplication] = useState<LibrarySupplication | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    loadLibrary();
  }, []);

  const loadLibrary = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiGetLibrary();
      setLibraryData(data);
    } catch (err) {
      console.error('Failed to load library:', err);
      setError('فشل تحميل مكتبة حصن المسلم');
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  };

  const handleImportClick = (supplication: LibrarySupplication) => {
    setImportingSupplication(supplication);
    setSelectedGroupId('');
  };

  const handleImportConfirm = async () => {
    if (!importingSupplication || !selectedGroupId) return;

    try {
      setImporting(true);
      await onImportSupplication(
        selectedGroupId,
        importingSupplication.title || '',
        importingSupplication.text,
        importingSupplication.target
      );
      setImportingSupplication(null);
      setSelectedGroupId('');
    } catch (err) {
      console.error('Failed to import supplication:', err);
      alert('فشل استيراد الذكر');
    } finally {
      setImporting(false);
    }
  };

  const handleImportCancel = () => {
    setImportingSupplication(null);
    setSelectedGroupId('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل المكتبة...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadLibrary}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  if (!libraryData) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-600">لا توجد بيانات متاحة</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">مكتبة حصن المسلم</h2>
        <p className="text-gray-600">أذكار وأدعية من الكتاب والسنة</p>
      </div>

      <div className="space-y-3">
        {libraryData.categories.map((category) => (
          <div key={category.id} className="bg-white rounded-xl shadow-md overflow-hidden">
            {/* Category Header */}
            <button
              onClick={() => toggleCategory(category.id)}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="text-right flex-1">
                <h3 className="text-xl font-bold text-gray-800">{category.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                <span className="text-xs text-teal-600 mt-1 inline-block">
                  {category.supplications.length} ذكر
                </span>
              </div>
              <svg
                className={`w-6 h-6 text-gray-600 transition-transform ${
                  expandedCategory === category.id ? 'transform rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Category Content */}
            {expandedCategory === category.id && (
              <div className="border-t border-gray-200 p-4 space-y-3 bg-gray-50">
                {category.supplications.map((supplication, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                  >
                    {supplication.title && (
                      <h4 className="text-lg font-bold text-gray-800 mb-2">{supplication.title}</h4>
                    )}
                    <p className="text-xl text-gray-700 mb-3 leading-relaxed text-right">
                      {supplication.text}
                    </p>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        {supplication.reference && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                            {supplication.reference}
                          </span>
                        )}
                        <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full">
                          العدد: {supplication.target}
                        </span>
                      </div>
                      <button
                        onClick={() => handleImportClick(supplication)}
                        className="px-4 py-2 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        استيراد
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Import Modal */}
      {importingSupplication && (
        <Modal onClose={handleImportCancel}>
          <div className="p-6">
            <h3 className="text-2xl font-bold mb-4 text-gray-800">استيراد الذكر</h3>

            {importingSupplication.title && (
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-1">الذكر:</p>
                <p className="text-lg font-bold text-gray-800">{importingSupplication.title}</p>
              </div>
            )}

            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-1">النص:</p>
              <p className="text-base text-gray-700 bg-gray-50 p-3 rounded-lg max-h-32 overflow-y-auto">
                {importingSupplication.text}
              </p>
            </div>

            {userGroups.length === 0 ? (
              <div className="mb-6">
                <p className="text-red-600 text-center">لا توجد مجموعات. يرجى إنشاء مجموعة أولاً.</p>
              </div>
            ) : (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  اختر المجموعة:
                </label>
                <select
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  disabled={importing}
                >
                  <option value="">-- اختر مجموعة --</option>
                  {userGroups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleImportCancel}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                disabled={importing}
              >
                إلغاء
              </button>
              <button
                onClick={handleImportConfirm}
                className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!selectedGroupId || importing || userGroups.length === 0}
              >
                {importing ? 'جاري الاستيراد...' : 'استيراد'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Library;
