
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Eye, EyeOff, Lock, User } from 'lucide-react';
import { useLanguage } from '../LanguageContext';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      navigate('/assets');
    }, 1200);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] font-sans">
      <div className="w-full max-w-md px-8 py-12 bg-white rounded-[2.5rem] shadow-xl border border-gray-100">
        <div className="mb-10 text-center">
          <div className="w-16 h-16 bg-[#9CB13A] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Zap className="text-white" size={32} fill="currentColor" />
          </div>
          <h2 className="text-3xl font-bold text-[#54585a] mb-3">{t.login.welcomeBack}</h2>
          <p className="text-[#54585a] opacity-70">{t.login.loginSubtitle}</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#54585a] ml-1">{t.login.emailLabel}</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User size={18} className="text-[#9CA3AF] group-focus-within:text-[#9CB13A] transition-colors" />
              </div>
              <input
                type="text"
                required
                placeholder="admin@energy-platform.com"
                className="block w-full pl-11 pr-4 py-3 bg-gray-50 border border-[#E5E7EB] rounded-xl text-[#54585a] placeholder-[#9CA3AF] focus:ring-2 focus:ring-[#9CB13A] focus:border-transparent outline-none transition-all shadow-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center ml-1">
              <label className="text-sm font-medium text-[#54585a]">{t.login.passwordLabel}</label>
              <a href="#" className="text-xs text-[#9CB13A] hover:underline">{t.login.forgotPassword}</a>
            </div>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock size={18} className="text-[#9CA3AF] group-focus-within:text-[#9CB13A] transition-colors" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                className="block w-full pl-11 pr-12 py-3 bg-gray-50 border border-[#E5E7EB] rounded-xl text-[#54585a] placeholder-[#9CA3AF] focus:ring-2 focus:ring-[#9CB13A] focus:border-transparent outline-none transition-all shadow-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#9CA3AF] hover:text-[#54585a]"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="flex items-center">
            <input
              id="remember"
              type="checkbox"
              className="w-4 h-4 text-[#9CB13A] border-[#E5E7EB] rounded focus:ring-[#9CB13A]"
            />
            <label htmlFor="remember" className="ml-2 text-sm text-[#54585a] opacity-70">{t.login.rememberMe}</label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#9CB13A] hover:bg-[#8A9D33] text-white font-bold py-3.5 rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center gap-2 transform active:scale-[0.98]"
          >
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              t.login.loginButton
            )}
          </button>
        </form>

        <div className="mt-12 text-center">
          <p className="text-[#54585a] opacity-70 text-sm">
            {t.login.noAccount} <a href="#" className="text-[#9CB13A] font-semibold hover:underline">{t.login.contactSales}</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
