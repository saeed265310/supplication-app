import React, { useState, useEffect } from 'react';
import type { StatisticsSummary, DailyCount, TopSupplication } from '../types';
import { apiGetStatisticsSummary, apiGetDailyCounts, apiGetTopSupplications } from '../utils/api';

const Statistics: React.FC = () => {
  const [summary, setSummary] = useState<StatisticsSummary | null>(null);
  const [dailyCounts, setDailyCounts] = useState<DailyCount[]>([]);
  const [topSupplications, setTopSupplications] = useState<TopSupplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<7 | 30>(7);

  useEffect(() => {
    loadStatistics();
  }, [period]);

  const loadStatistics = async () => {
    setLoading(true);
    try {
      const [summaryData, dailyData, topData] = await Promise.all([
        apiGetStatisticsSummary(),
        apiGetDailyCounts(period),
        apiGetTopSupplications(5)
      ]);

      setSummary(summaryData);
      setDailyCounts(dailyData);
      setTopSupplications(topData);
    } catch (error) {
      console.error('Failed to load statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-600 dark:text-gray-300">جار تحميل الإحصائيات...</p>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-600 dark:text-gray-300">لا توجد إحصائيات متاحة</p>
      </div>
    );
  }

  const maxCount = Math.max(...dailyCounts.map(d => d.total), 1);
  const completionRate = summary.totalSupplications > 0
    ? Math.round((summary.completedSupplications / summary.totalSupplications) * 100)
    : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">الإحصائيات</h1>
        <p className="text-gray-600 dark:text-gray-400">تتبع تقدمك في الأذكار</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white shadow-lg">
          <div className="text-sm opacity-90 mb-1">اليوم</div>
          <div className="text-3xl font-bold">{summary.today}</div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 text-white shadow-lg">
          <div className="text-sm opacity-90 mb-1">هذا الأسبوع</div>
          <div className="text-3xl font-bold">{summary.week}</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white shadow-lg">
          <div className="text-sm opacity-90 mb-1">هذا الشهر</div>
          <div className="text-3xl font-bold">{summary.month}</div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-5 text-white shadow-lg">
          <div className="text-sm opacity-90 mb-1">الإجمالي</div>
          <div className="text-3xl font-bold">{summary.allTime}</div>
        </div>
      </div>

      {/* Completion Rate */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">معدل الإنجاز</h2>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
              <div
                className="bg-teal-500 h-4 rounded-full transition-all duration-500"
                style={{ width: `${completionRate}%` }}
              ></div>
            </div>
          </div>
          <div className="text-3xl font-bold text-teal-600 dark:text-teal-400">
            {completionRate}%
          </div>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          {summary.completedSupplications} من {summary.totalSupplications} أذكار مكتملة
        </p>
      </div>

      {/* Daily Activity Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">النشاط اليومي</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setPeriod(7)}
              className={`px-3 py-1 rounded-md text-sm transition-colors ${
                period === 7
                  ? 'bg-teal-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}>
              7 أيام
            </button>
            <button
              onClick={() => setPeriod(30)}
              className={`px-3 py-1 rounded-md text-sm transition-colors ${
                period === 30
                  ? 'bg-teal-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}>
              30 يوم
            </button>
          </div>
        </div>

        {dailyCounts.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">
            لا توجد بيانات لعرضها
          </p>
        ) : (
          <div className="space-y-3">
            {dailyCounts.map((day) => (
              <div key={day.date} className="flex items-center gap-3">
                <div className="w-24 text-sm text-gray-600 dark:text-gray-400 text-right">
                  {new Date(day.date).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })}
                </div>
                <div className="flex-1">
                  <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-8 overflow-hidden">
                    <div
                      className="bg-teal-500 h-8 rounded-full flex items-center justify-end px-3 transition-all duration-500"
                      style={{ width: `${(day.total / maxCount) * 100}%` }}>
                      <span className="text-white text-sm font-semibold">{day.total}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top Supplications */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">الأذكار الأكثر تكراراً</h2>

        {topSupplications.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">
            لا توجد بيانات لعرضها
          </p>
        ) : (
          <div className="space-y-4">
            {topSupplications.map((sup, index) => (
              <div key={sup.id} className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 bg-teal-600 text-white rounded-full flex items-center justify-center font-bold">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  {sup.title && (
                    <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-1">{sup.title}</h3>
                  )}
                  <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2 mb-2">{sup.text}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                    <span className="bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">{sup.groupName}</span>
                    <span className="font-semibold text-teal-600 dark:text-teal-400">
                      {sup.totalCounted || 0} مرة
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Statistics;
