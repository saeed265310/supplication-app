import React, { useState, useEffect } from 'react';
import type { UserSettings, ReminderTime, User } from '../types';
import {
  apiGetSettings,
  apiUpdateSettings,
  apiGetReminders,
  apiAddReminder,
  apiUpdateReminder,
  apiDeleteReminder,
} from '../utils/api';
import { useTheme } from '../hooks/useTheme';
import Modal from './Modal';
import { PlusIcon, TrashIcon } from './icons';

interface SettingsProps {
  user: User;
  onLogout: () => void;
}

const Settings: React.FC<SettingsProps> = ({ user, onLogout }) => {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [reminders, setReminders] = useState<ReminderTime[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddReminderModalOpen, setIsAddReminderModalOpen] = useState(false);
  const [newReminderTime, setNewReminderTime] = useState('09:00');
  const [newReminderMessage, setNewReminderMessage] = useState('');
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const { theme, updateTheme } = useTheme();

  useEffect(() => {
    loadSettings();
    loadReminders();
    checkNotificationPermission();
  }, []);

  const checkNotificationPermission = () => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  };

  const loadSettings = async () => {
    try {
      const data = await apiGetSettings();
      setSettings(data);
      // Apply theme from loaded settings
      updateTheme(data.theme);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadReminders = async () => {
    try {
      const data = await apiGetReminders();
      setReminders(data);
    } catch (error) {
      console.error('Failed to load reminders:', error);
    }
  };

  const handleUpdateSetting = async (key: keyof UserSettings, value: any) => {
    if (!settings) return;

    try {
      const updated = await apiUpdateSettings({ [key]: value });
      setSettings(updated);

      // Apply theme immediately when changed
      if (key === 'theme') {
        updateTheme(value);
      }
    } catch (error) {
      console.error('Failed to update setting:', error);
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);

      if (permission === 'granted') {
        handleUpdateSetting('notificationsEnabled', true);
      }
    }
  };

  const testNotification = () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('عداد الأذكار', {
        body: 'هذا تنبيه تجريبي! ستصلك التنبيهات في الأوقات المحددة.',
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
      });
    }
  };

  const handleAddReminder = async () => {
    if (!newReminderTime) return;

    try {
      const reminder = await apiAddReminder(newReminderTime, newReminderMessage || undefined);
      setReminders([...reminders, reminder]);
      setNewReminderTime('09:00');
      setNewReminderMessage('');
      setIsAddReminderModalOpen(false);
      scheduleNotifications();
    } catch (error) {
      console.error('Failed to add reminder:', error);
    }
  };

  const handleToggleReminder = async (reminder: ReminderTime) => {
    try {
      const updated = await apiUpdateReminder(reminder.id, { enabled: !reminder.enabled });
      setReminders(reminders.map(r => r.id === reminder.id ? updated : r));
      scheduleNotifications();
    } catch (error) {
      console.error('Failed to toggle reminder:', error);
    }
  };

  const handleDeleteReminder = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا التنبيه؟')) return;

    try {
      await apiDeleteReminder(id);
      setReminders(reminders.filter(r => r.id !== id));
      scheduleNotifications();
    } catch (error) {
      console.error('Failed to delete reminder:', error);
    }
  };

  const scheduleNotifications = () => {
    // Store reminders in localStorage for service worker to access
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      localStorage.setItem('dhikr_reminders', JSON.stringify(reminders.filter(r => r.enabled)));
    }
  };

  const checkAndShowNotifications = () => {
    if (!settings?.notificationsEnabled || Notification.permission !== 'granted') return;

    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // Get last notification time from localStorage to prevent duplicates
    const lastNotificationKey = 'dhikr_last_notification_time';
    const lastNotificationTime = localStorage.getItem(lastNotificationKey);

    // If we already notified for this minute, skip
    if (lastNotificationTime === currentTime) {
      return;
    }

    console.log('Checking notifications at:', currentTime);

    let notificationShown = false;
    reminders.forEach(reminder => {
      if (reminder.enabled && reminder.time === currentTime) {
        console.log('Showing notification for:', reminder.time);
        new Notification('عداد الأذكار - تذكير', {
          body: reminder.message || 'حان وقت الأذكار!',
          icon: '/icon-192x192.png',
          badge: '/icon-192x192.png',
          tag: 'dhikr-reminder-' + currentTime, // Prevents duplicate notifications
        });
        notificationShown = true;
      }
    });

    // Store current time if we showed a notification
    if (notificationShown) {
      localStorage.setItem(lastNotificationKey, currentTime);
    }
  };

  // Check notifications every minute at the start of each minute
  useEffect(() => {
    if (!settings?.notificationsEnabled || Notification.permission !== 'granted') return;

    // Check immediately
    checkAndShowNotifications();

    // Calculate milliseconds until next minute
    const now = new Date();
    const msUntilNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();

    let interval: NodeJS.Timeout;

    // Wait until the next minute, then check every minute
    const initialTimeout = setTimeout(() => {
      checkAndShowNotifications();

      // Now set up interval to check every minute
      interval = setInterval(checkAndShowNotifications, 60000);
    }, msUntilNextMinute);

    return () => {
      clearTimeout(initialTimeout);
      if (interval) clearInterval(interval);
    };
  }, [reminders, settings]);

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-600 dark:text-gray-300">جار التحميل...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">الإعدادات</h2>

      {/* Notifications & Reminders Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">الإشعارات والتذكيرات</h3>

        {/* Notification Permission Status */}
        <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-800 dark:text-gray-100">حالة الإشعارات</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {notificationPermission === 'granted' ? 'مفعّلة ✓' :
                 notificationPermission === 'denied' ? 'محظورة ✗' : 'غير مفعّلة'}
              </p>
            </div>
            {notificationPermission !== 'granted' && (
              <button
                onClick={requestNotificationPermission}
                className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700">
                تفعيل الإشعارات
              </button>
            )}
          </div>
        </div>

        {/* Enable/Disable Notifications */}
        <div className="flex items-center justify-between mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div>
            <p className="font-medium text-gray-800 dark:text-gray-100">تفعيل التنبيهات اليومية</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">تلقي تذكيرات في الأوقات المحددة</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.notificationsEnabled}
              onChange={(e) => handleUpdateSetting('notificationsEnabled', e.target.checked)}
              className="sr-only peer"
              disabled={notificationPermission !== 'granted'}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 dark:peer-focus:ring-teal-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-teal-600"></div>
          </label>
        </div>

        {/* Test Notification Button */}
        {notificationPermission === 'granted' && (
          <button
            onClick={testNotification}
            className="mb-4 w-full py-2 px-4 bg-purple-600 text-white rounded-md hover:bg-purple-700">
            اختبار الإشعار
          </button>
        )}

        {/* Reminders List */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-800 dark:text-gray-100">أوقات التذكير</h4>
            <button
              onClick={() => setIsAddReminderModalOpen(true)}
              className="flex items-center gap-1 px-3 py-1 bg-teal-600 text-white rounded-md hover:bg-teal-700 text-sm">
              <PlusIcon />
              إضافة
            </button>
          </div>

          {reminders.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-4">لا توجد تذكيرات. أضف تذكيرًا جديدًا!</p>
          ) : (
            <div className="space-y-2">
              {reminders.map(reminder => (
                <div
                  key={reminder.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={reminder.enabled}
                      onChange={() => handleToggleReminder(reminder)}
                      className="w-5 h-5 text-teal-600 rounded focus:ring-teal-500"
                    />
                    <div>
                      <p className="font-medium text-gray-800 dark:text-gray-100">{reminder.time}</p>
                      {reminder.message && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">{reminder.message}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteReminder(reminder.id)}
                    className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900 rounded-md transition-colors">
                    <TrashIcon />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Display Preferences Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">تفضيلات العرض</h3>

        {/* Theme Toggle */}
        <div className="mb-4">
          <label className="block font-medium text-gray-800 dark:text-gray-100 mb-2">المظهر</label>
          <div className="grid grid-cols-3 gap-2">
            {(['light', 'dark', 'auto'] as const).map(theme => (
              <button
                key={theme}
                onClick={() => handleUpdateSetting('theme', theme)}
                className={`py-2 px-4 rounded-md transition-colors ${
                  settings.theme === theme
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}>
                {theme === 'light' ? 'فاتح' : theme === 'dark' ? 'داكن' : 'تلقائي'}
              </button>
            ))}
          </div>
        </div>

        {/* Default Font Size */}
        <div className="mb-4">
          <label className="block font-medium text-gray-800 dark:text-gray-100 mb-2">حجم الخط الافتراضي</label>
          <select
            value={settings.defaultFontSize}
            onChange={(e) => handleUpdateSetting('defaultFontSize', e.target.value)}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100">
            <option value="3xs">صغير جدًا جدًا (3xs)</option>
            <option value="2xs">صغير جدًا (2xs)</option>
            <option value="xs">صغير (xs)</option>
            <option value="sm">صغير متوسط (sm)</option>
            <option value="md">متوسط (md)</option>
            <option value="lg">كبير (lg)</option>
            <option value="xl">كبير جدًا (xl)</option>
            <option value="2xl">كبير جدًا جدًا (2xl)</option>
          </select>
        </div>

        {/* Default Font Weight */}
        <div className="mb-4">
          <label className="block font-medium text-gray-800 dark:text-gray-100 mb-2">سُمك الخط الافتراضي</label>
          <select
            value={settings.defaultFontWeight}
            onChange={(e) => handleUpdateSetting('defaultFontWeight', e.target.value)}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100">
            <option value="normal">عادي (Normal)</option>
            <option value="medium">متوسط (Medium)</option>
            <option value="semibold">ثقيل (Semibold)</option>
            <option value="bold">عريض (Bold)</option>
          </select>
        </div>
      </div>

      {/* Account Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">الحساب</h3>

        <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">اسم المستخدم</p>
          <p className="font-medium text-gray-800 dark:text-gray-100">{user.username}</p>
        </div>

        <button
          onClick={onLogout}
          className="w-full py-2 px-4 bg-red-600 text-white rounded-md hover:bg-red-700">
          تسجيل الخروج
        </button>
      </div>

      {/* Add Reminder Modal */}
      <Modal
        isOpen={isAddReminderModalOpen}
        onClose={() => setIsAddReminderModalOpen(false)}
        title="إضافة تذكير جديد">
        <div className="space-y-4">
          <div>
            <label htmlFor="reminderTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              الوقت
            </label>
            <input
              type="time"
              id="reminderTime"
              value={newReminderTime}
              onChange={(e) => setNewReminderTime(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
            />
          </div>

          <div>
            <label htmlFor="reminderMessage" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              الرسالة (اختياري)
            </label>
            <input
              type="text"
              id="reminderMessage"
              value={newReminderMessage}
              onChange={(e) => setNewReminderMessage(e.target.value)}
              placeholder="مثال: وقت أذكار الصباح"
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              onClick={() => setIsAddReminderModalOpen(false)}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">
              إلغاء
            </button>
            <button
              onClick={handleAddReminder}
              className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700">
              إضافة
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Settings;
