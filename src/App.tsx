
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BarChart3, 
  Activity, 
  Settings, 
  FileText, 
  Zap, 
  LogOut,
  Menu,
  X,
  Globe,
  RefreshCw
} from 'lucide-react';
import { useLanguage } from './LanguageContext';
import Login from './pages/Login';
import Assets from './pages/Assets';
import Monitoring from './pages/Monitoring';
import Matching from './pages/Matching';
import Billing from './pages/Billing';
import Users from './pages/Users';
import WheelingVersions from './pages/WheelingVersions';

const SidebarItem: React.FC<{ 
  to: string; 
  icon: React.ReactNode; 
  label: string; 
  isActive: boolean;
  isCollapsed: boolean;
}> = ({ to, icon, label, isActive, isCollapsed }) => (
  <Link
    to={to}
    title={isCollapsed ? label : ""}
    className={`flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-4'} py-3 rounded-lg transition-all duration-200 ${
      isActive 
        ? 'bg-[#9CB13A] text-white shadow-md' 
        : 'text-[#54585a] hover:bg-[#E7E6E6] hover:text-[#9CB13A]'
    }`}
  >
    <div className="flex items-center justify-center w-10 h-10 flex-shrink-0">
      {icon}
    </div>
    {!isCollapsed && <span className="font-medium whitespace-nowrap">{label}</span>}
  </Link>
);

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { t, language, setLanguage } = useLanguage();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8F9FA]">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[60] lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`${
          isSidebarOpen ? 'w-64' : 'w-20'
        } ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } fixed lg:relative flex-shrink-0 bg-white border-r border-[#E5E7EB] h-full flex flex-col transition-all duration-300 z-[70]`}
      >
        <div className={`p-5 flex items-center ${isSidebarOpen ? 'justify-between' : 'justify-center'}`}>
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-10 h-10 bg-[#9CB13A] rounded-lg flex items-center justify-center flex-shrink-0">
              <Zap className="text-white" size={24} fill="currentColor" />
            </div>
            {isSidebarOpen && (
              <span className={`${language === 'zh' ? 'text-xl' : 'text-sm'} font-bold text-[#54585a] tracking-tight leading-tight`}>
                {t.sidebar.ems}
              </span>
            )}
          </div>
          {isSidebarOpen && (
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden p-2 text-gray-400 hover:bg-gray-100 rounded-lg"
            >
              <X size={20} />
            </button>
          )}
        </div>

        <nav className={`flex-1 ${isSidebarOpen ? 'px-4' : 'px-2'} space-y-2 mt-4`}>
          <SidebarItem 
            to="/assets" 
            icon={<FileText size={20} />} 
            label={t.sidebar.assets} 
            isActive={location.pathname === '/assets'} 
            isCollapsed={!isSidebarOpen}
          />
          <SidebarItem 
            to="/monitoring" 
            icon={<Activity size={20} />} 
            label={t.sidebar.monitoring} 
            isActive={location.pathname === '/monitoring'} 
            isCollapsed={!isSidebarOpen}
          />
          <SidebarItem 
            to="/wheeling-versions" 
            icon={<RefreshCw size={20} />} 
            label={t.sidebar.wheelingVersionManagement} 
            isActive={location.pathname === '/wheeling-versions'} 
            isCollapsed={!isSidebarOpen}
          />
          <SidebarItem 
            to="/matching" 
            icon={<Zap size={20} />} 
            label={t.sidebar.matching} 
            isActive={location.pathname === '/matching'} 
            isCollapsed={!isSidebarOpen}
          />
          <SidebarItem 
            to="/billing" 
            icon={<BarChart3 size={20} />} 
            label={t.sidebar.billing} 
            isActive={location.pathname === '/billing'} 
            isCollapsed={!isSidebarOpen}
          />
          <SidebarItem 
            to="/users" 
            icon={<Settings size={20} />} 
            label={t.sidebar.users} 
            isActive={location.pathname === '/users'} 
            isCollapsed={!isSidebarOpen}
          />
        </nav>

        <div className={`p-4 border-t border-[#E5E7EB] ${!isSidebarOpen ? 'flex justify-center' : ''}`}>
          <Link to="/" className={`flex items-center ${isSidebarOpen ? 'gap-3 px-4' : 'justify-center w-10 h-10'} py-3 text-red-500 hover:bg-red-50 rounded-lg transition-all`}>
            <LogOut size={20} />
            {isSidebarOpen && <span className="font-medium">{t.sidebar.logout}</span>}
          </Link>
        </div>
        
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-3 top-24 bg-white border border-[#E5E7EB] rounded-full p-1 shadow-sm hover:bg-gray-50 md:flex hidden"
        >
          {isSidebarOpen ? <X size={14} /> : <Menu size={14} />}
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative p-4 md:p-8">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 bg-white border border-gray-200 rounded-lg text-gray-600 shadow-sm"
            >
              <Menu size={20} />
            </button>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-[#54585a]">
                {location.pathname === '/assets' && t.assets.title}
                {location.pathname === '/monitoring' && t.monitoring.title}
                {location.pathname === '/matching' && t.matching.title}
                {location.pathname === '/billing' && t.billing.title}
                {location.pathname === '/users' && t.sidebar.users}
              </h1>
              <p className="text-[#666666] text-xs md:text-sm mt-1 hidden sm:block">
                {location.pathname === '/assets' && (language === 'zh' ? '管理全台發電案場與企業綠電採購資產' : 'Manage power plants and corporate green energy procurement assets')}
                {location.pathname === '/monitoring' && (language === 'zh' ? '檢視各場域電號數據缺漏與履約進度' : 'View meter data gaps and contract performance progress')}
                {location.pathname === '/matching' && t.matching.subtitle}
                {location.pathname === '/billing' && (language === 'zh' ? '檢視詳細的電力成本與節能效益報告' : 'View detailed power cost and energy saving benefit reports')}
                {location.pathname === '/users' && (language === 'zh' ? '管理系統後台使用者帳號與權限狀態' : 'Manage system backend user accounts and permission status')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 ml-auto md:ml-0">
            {/* Language Switcher */}
            <div className="flex items-center bg-white border border-gray-200 rounded-xl p-1 shadow-sm mr-2">
              <button 
                onClick={() => setLanguage('zh')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${language === 'zh' ? 'bg-[#9CB13A] text-white' : 'text-gray-400 hover:text-gray-600'}`}
              >
                中文
              </button>
              <button 
                onClick={() => setLanguage('en')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${language === 'en' ? 'bg-[#9CB13A] text-white' : 'text-gray-400 hover:text-gray-600'}`}
              >
                EN
              </button>
            </div>
            
            <div className="flex -space-x-2">
              <img src="https://picsum.photos/32/32?random=1" className="w-8 h-8 rounded-full border-2 border-white" />
              <img src="https://picsum.photos/32/32?random=2" className="w-8 h-8 rounded-full border-2 border-white" />
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-[#54585a]">系統管理員</p>
              <p className="text-xs text-[#54585a]">能源開發部</p>
            </div>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/assets" element={<MainLayout><Assets /></MainLayout>} />
        <Route path="/monitoring" element={<MainLayout><Monitoring /></MainLayout>} />
        <Route path="/wheeling-versions" element={<MainLayout><WheelingVersions /></MainLayout>} />
        <Route path="/matching" element={<MainLayout><Matching /></MainLayout>} />
        <Route path="/billing" element={<MainLayout><Billing /></MainLayout>} />
        <Route path="/users" element={<MainLayout><Users /></MainLayout>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
