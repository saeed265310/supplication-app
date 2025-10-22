
import React, { useState } from 'react';

interface AuthProps {
  onLogin: (username: string, password: string) => boolean;
  onSignup: (username: string, password: string) => boolean;
}

const Auth: React.FC<AuthProps> = ({ onLogin, onSignup }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username || !password) {
      setError('الرجاء إدخال اسم المستخدم وكلمة المرور.');
      return;
    }

    let success;
    if (isLogin) {
      success = onLogin(username, password);
      if (!success) {
        setError('اسم المستخدم أو كلمة المرور غير صحيحة.');
      }
    } else {
      success = onSignup(username, password);
      if (!success) {
        setError('اسم المستخدم موجود بالفعل.');
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            {isLogin ? 'تسجيل الدخول' : 'إنشاء حساب'}
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {isLogin ? 'مرحباً بعودتك!' : 'أنشئ حساباً جديداً لتبدأ.'}
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label htmlFor="username" className="sr-only">اسم المستخدم</label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                className="relative block w-full px-3 py-2 text-gray-900 placeholder-gray-500 bg-gray-50 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-teal-500 focus:border-teal-500 focus:z-10 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                placeholder="اسم المستخدم"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password"className="sr-only">كلمة المرور</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="relative block w-full px-3 py-2 text-gray-900 placeholder-gray-500 bg-gray-50 border border-gray-300 rounded-md appearance-none focus:outline-none focus:ring-teal-500 focus:border-teal-500 focus:z-10 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                placeholder="كلمة المرور"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div>
            <button
              type="submit"
              className="relative flex justify-center w-full px-4 py-2 text-sm font-medium text-white bg-teal-600 border border-transparent rounded-md group hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
            >
              {isLogin ? 'دخول' : 'إنشاء حساب'}
            </button>
          </div>
        </form>
        <div className="text-sm text-center">
          <button
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            className="font-medium text-teal-600 hover:text-teal-500"
          >
            {isLogin ? 'ليس لديك حساب؟ أنشئ واحداً' : 'لديك حساب بالفعل؟ سجل الدخول'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
