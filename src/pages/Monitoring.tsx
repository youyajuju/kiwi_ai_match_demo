
import React, { useState, useMemo } from 'react';
import { 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Search, 
  Filter, 
  Info,
  Activity,
  Zap,
  Building2,
  Database,
  Pause,
  Play,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { MONITORED_METERS } from '../mockData';
import { MeterStatus } from '../types';
import { useLanguage } from '../LanguageContext';
import { formatEnergy } from '../utils/contractUtils';

const Monitoring: React.FC = () => {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'purchase' | 'sale'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('2026-02');
  const [pauseModalOpen, setPauseModalOpen] = useState(false);
  const [resumeModalOpen, setResumeModalOpen] = useState(false);
  const [selectedMeter, setSelectedMeter] = useState<any>(null);
  const [pauseReason, setPauseReason] = useState('');
  const [customReason, setCustomReason] = useState('');

  const getMeterStatus = (meter: any): MeterStatus => {
    if (meter.isAbnormal) return MeterStatus.ABNORMAL;
    if (meter.isManuallyPaused && meter.hasActiveContract) return MeterStatus.PAUSED;
    if (meter.hasActiveContract) return MeterStatus.ACTIVE;
    if (meter.hasFutureContract) return MeterStatus.PENDING_ACTIVE;
    if (meter.hadPastContract) return MeterStatus.HISTORICAL_UNLOAD;
    return MeterStatus.PENDING_APPLICATION;
  };

  // KPI Calculations
  const totalMeters = MONITORED_METERS.length;
  const buyerCount = MONITORED_METERS.filter(m => m.category === '購電').length;
  const sellerCount = MONITORED_METERS.filter(m => m.category === '售電').length;
  const activeWheelingCount = MONITORED_METERS.filter(m => getMeterStatus(m) === MeterStatus.ACTIVE).length;
  const adminTodoCount = MONITORED_METERS.filter(m => {
    const status = getMeterStatus(m);
    return status === MeterStatus.PENDING_APPLICATION || status === MeterStatus.PENDING_ACTIVE;
  }).length;
  const detectedAnomalyCount = MONITORED_METERS.filter(m => getMeterStatus(m) === MeterStatus.ABNORMAL).length;
  const manualPauseCount = MONITORED_METERS.filter(m => getMeterStatus(m) === MeterStatus.PAUSED).length;
  const totalAnomalyCount = detectedAnomalyCount + manualPauseCount;

  const filteredMeters = useMemo(() => {
    return MONITORED_METERS.filter(m => {
      const status = getMeterStatus(m);
      const matchesTab = activeTab === 'all' || status === activeTab;
      
      const matchesCategory = 
        categoryFilter === 'all' || 
        (categoryFilter === 'purchase' && m.category === '購電') || 
        (categoryFilter === 'sale' && m.category === '售電');

      const getStatusLabel = (s: MeterStatus) => {
        switch (s) {
          case MeterStatus.ACTIVE: return t.monitoring.active;
          case MeterStatus.PENDING_APPLICATION: return t.monitoring.pendingApplication;
          case MeterStatus.PENDING_ACTIVE: return t.monitoring.pendingActive;
          case MeterStatus.PAUSED: return t.monitoring.paused;
          case MeterStatus.HISTORICAL_UNLOAD: return t.monitoring.historicalUnload;
          case MeterStatus.ABNORMAL: return t.monitoring.abnormal;
          default: return '';
        }
      };

      const matchesSearch = 
        m.taipowerId.includes(searchQuery) || 
        m.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || 
        m.contractId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        getStatusLabel(status).toLowerCase().includes(searchQuery.toLowerCase());
        
      return matchesTab && matchesCategory && matchesSearch;
    });
  }, [activeTab, categoryFilter, searchQuery]);

  return (
    <div className="space-y-6 pb-20">
      {/* Header with Month Selector and Last Update */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <select 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="appearance-none pl-6 pr-12 py-3 bg-white border-2 border-gray-100 rounded-2xl font-black text-gray-900 shadow-sm hover:border-[#9CB13A] transition-all outline-none cursor-pointer"
            >
              <option value="2026-03">2026 年 3 月</option>
              <option value="2026-02">2026 年 2 月</option>
              <option value="2026-01">2026 年 1 月</option>
              <option value="2025-12">2025 年 12 月</option>
            </select>
            <Filter size={16} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl border border-gray-100">
            <Clock size={14} className="text-gray-400" />
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
              {t.monitoring.lastCheckTime}：2026-03-05 14:30
            </span>
          </div>
        </div>
      </div>

      {/* KPI Header Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Consolidated Total Card */}
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gray-50 rounded-xl text-gray-400 group-hover:bg-gray-900 group-hover:text-white transition-all">
                <Database size={20} />
              </div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">{t.monitoring.totalMonitoredMeters}</p>
            </div>
            <h3 className="text-3xl font-black text-gray-900">{totalMeters}</h3>
          </div>
          <div className="flex items-center gap-6 pt-4 border-t border-gray-50">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.common.consumer} {buyerCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500"></div>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.common.generator} {sellerCount}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-all group flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all">
              <CheckCircle2 size={20} />
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">{t.monitoring.activeWheeling}</p>
          </div>
          <h3 className="text-3xl font-black text-gray-900">{activeWheelingCount}</h3>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-all group flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white transition-all">
              <Clock size={20} />
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">{t.monitoring.adminTodo}</p>
          </div>
          <h3 className="text-3xl font-black text-gray-900">{adminTodoCount}</h3>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-50 rounded-xl text-rose-500 group-hover:bg-rose-500 group-hover:text-white transition-all">
                <AlertCircle size={20} />
              </div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">{t.monitoring.awaitingRepair}</p>
            </div>
            <h3 className="text-3xl font-black text-rose-600">{totalAnomalyCount}</h3>
          </div>
          <div className="flex items-center gap-6 pt-4 border-t border-gray-50">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-rose-500"></div>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.monitoring.detectedAnomaly} {detectedAnomalyCount}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gray-400"></div>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.monitoring.manualPause} {manualPauseCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm">
        <div className="flex gap-2 p-1.5 bg-gray-100 rounded-2xl w-full md:w-auto overflow-x-auto no-scrollbar">
          {[
            { id: 'all', label: t.monitoring.all },
            { id: MeterStatus.ACTIVE, label: t.monitoring.active },
            { id: MeterStatus.PENDING_APPLICATION, label: t.monitoring.pendingApplication },
            { id: MeterStatus.PENDING_ACTIVE, label: t.monitoring.pendingActive },
            { id: MeterStatus.PAUSED, label: t.monitoring.paused },
            { id: MeterStatus.ABNORMAL, label: t.monitoring.abnormal },
            { id: MeterStatus.HISTORICAL_UNLOAD, label: t.monitoring.historicalUnload }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap uppercase tracking-widest ${
                activeTab === tab.id 
                  ? 'bg-white text-[#9CB13A] shadow-sm' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder={t.monitoring.searchPlaceholder} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-6 py-3 bg-gray-50 border-2 border-transparent focus:border-[#9CB13A] rounded-2xl text-sm font-bold outline-none transition-all"
            />
          </div>
          <select 
            className="px-6 py-3 bg-gray-50 border-2 border-transparent focus:border-[#9CB13A] rounded-2xl text-sm font-black outline-none transition-all text-gray-900 cursor-pointer"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as any)}
          >
            <option value="all">{language === 'zh' ? '所有資產類型' : 'All Categories'}</option>
            <option value="purchase">{t.common.consumer}</option>
            <option value="sale">{t.common.generator}</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left min-w-[1000px]">
            <thead>
              <tr className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">
                <th className="px-8 py-6">{t.monitoring.meterStatus}</th>
                <th className="px-8 py-6">{t.monitoring.assetCategory}</th>
                <th className="px-8 py-6">{t.monitoring.meterUser}</th>
                <th className="px-8 py-6">{t.monitoring.contract}</th>
                <th className="px-8 py-6">{t.monitoring.monthlyAchievementRate}</th>
                <th className="px-8 py-6">
                  <div className="flex items-center gap-2">
                    {t.monitoring.performance}
                    <div className="group relative">
                      <Info size={14} className="text-gray-300 cursor-help" />
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 p-4 bg-gray-900 text-white text-[10px] font-bold rounded-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 shadow-2xl leading-relaxed">
                        <p className="mb-2 text-blue-400 uppercase tracking-widest">{t.monitoring.annualAchievementRate}</p>
                        {t.monitoring.annualAchievementRateDesc}
                      </div>
                    </div>
                  </div>
                </th>
                <th className="px-8 py-6 text-right">{t.common.operation}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredMeters.length > 0 ? filteredMeters.map((meter) => {
                const status = getMeterStatus(meter);
                const monthlyAchievement = ((meter.actualKwh / meter.targetKwh) * 100).toFixed(1);
                const cumulativeAchievement = meter.cumulativeActualKwh && meter.cumulativeTargetKwh 
                  ? ((meter.cumulativeActualKwh / meter.cumulativeTargetKwh) * 100).toFixed(1)
                  : '0.0';
                const isBuyer = meter.category === '購電';
                
                const getStatusBadge = (s: MeterStatus) => {
                  switch (s) {
                    case MeterStatus.ACTIVE:
                      return (
                        <span className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-wider">
                          <CheckCircle2 size={12} /> {t.monitoring.active}
                        </span>
                      );
                    case MeterStatus.PENDING_APPLICATION:
                      return (
                        <span className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider" style={{ backgroundColor: '#FEE9E4', color: '#FF7A2C' }}>
                          <Clock size={12} /> {t.monitoring.pendingApplication}
                        </span>
                      );
                    case MeterStatus.PENDING_ACTIVE:
                      return (
                        <span className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider" style={{ backgroundColor: '#DACFF0', color: '#8950FA' }}>
                          <Clock size={12} /> {t.monitoring.pendingActive}
                        </span>
                      );
                    case MeterStatus.PAUSED:
                      return (
                        <span className="flex items-center gap-1.5 px-4 py-1.5 bg-rose-50 text-rose-600 rounded-full text-[10px] font-black uppercase tracking-wider">
                          <AlertCircle size={12} /> {t.monitoring.paused}
                        </span>
                      );
                    case MeterStatus.HISTORICAL_UNLOAD:
                      return (
                        <span className="flex items-center gap-1.5 px-4 py-1.5 bg-gray-100 text-gray-500 rounded-full text-[10px] font-black uppercase tracking-wider">
                          <Database size={12} /> {t.monitoring.historicalUnload}
                        </span>
                      );
                    case MeterStatus.ABNORMAL:
                      return (
                        <span className="flex items-center gap-1.5 px-4 py-1.5 bg-rose-100 text-rose-700 rounded-full text-[10px] font-black uppercase tracking-wider">
                          <AlertCircle size={12} /> {t.monitoring.abnormal}
                        </span>
                      );
                    default:
                      return null;
                  }
                };

                return (
                  <tr key={meter.id} className="hover:bg-gray-50/30 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(status)}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      {isBuyer ? (
                        <span className="px-3 py-1 bg-[#3B82F6]/10 text-[#3B82F6] text-[10px] font-black rounded-lg uppercase tracking-wider border border-[#3B82F6]/20">{t.common.consumer}</span>
                      ) : (
                        <span className="px-3 py-1 bg-[#F59E0B]/10 text-[#F59E0B] text-[10px] font-black rounded-lg uppercase tracking-wider border border-[#F59E0B]/20">{t.common.generator}</span>
                      )}
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-gray-900 font-mono tracking-tighter">{meter.taipowerId}</span>
                        <span className="text-xs font-bold text-gray-400">{meter.displayName}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col group/link">
                        <span className="text-sm font-black text-gray-900">{meter.customerName}</span>
                        <Link 
                          to="/assets" 
                          state={{ customerName: meter.customerName, contractId: meter.contractId }}
                          className="text-[10px] text-gray-400 font-bold hover:text-[#9CB13A] flex items-center gap-1 transition-all mt-1"
                        >
                          {meter.contractId} <ExternalLink size={10} />
                        </Link>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col items-center">
                        <span className={`text-sm font-black ${isBuyer ? 'text-[#3B82F6]' : 'text-[#F59E0B]'}`}>
                          {monthlyAchievement}%
                        </span>
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">
                          {formatEnergy(meter.actualKwh)} / {formatEnergy(meter.targetKwh)}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-2 min-w-[180px]">
                        <div className="flex justify-between items-end">
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            {t.monitoring.performance}
                          </span>
                          <span className={`text-xs font-black ${parseFloat(cumulativeAchievement) > 80 ? (isBuyer ? 'text-[#3B82F6]' : 'text-[#F59E0B]') : 'text-gray-400'}`}>
                            {cumulativeAchievement}%
                          </span>
                        </div>
                        <div 
                          className="h-2 w-full bg-gray-100 rounded-full overflow-hidden shadow-inner"
                          title={isBuyer 
                            ? `累計履約進度：累計已獲配 ${formatEnergy(meter.cumulativeActualKwh || 0)} / 累計目標 ${formatEnergy(meter.cumulativeTargetKwh || 0)}`
                            : `累計履約進度：累計實際發電 ${formatEnergy(meter.cumulativeActualKwh || 0)} / 累計發電目標 ${formatEnergy(meter.cumulativeTargetKwh || 0)}`
                          }
                        >
                          <div 
                            className={`h-full rounded-full transition-all duration-1000 ${
                              isBuyer ? 'bg-blue-600' : 'bg-amber-500'
                            }`}
                            style={{ width: `${cumulativeAchievement}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      {status !== MeterStatus.HISTORICAL_UNLOAD && (status === MeterStatus.ACTIVE || status === MeterStatus.PAUSED) && (
                        <button 
                          className={`p-3 rounded-2xl transition-all flex items-center gap-2 group/btn ml-auto ${
                            status === MeterStatus.PAUSED
                              ? 'bg-emerald-50 text-emerald-400 hover:text-emerald-600 hover:bg-emerald-100'
                              : 'bg-rose-50 text-gray-400 hover:text-rose-600 hover:bg-rose-100'
                          }`}
                          onClick={() => {
                            setSelectedMeter(meter);
                            if (status === MeterStatus.PAUSED) {
                              setResumeModalOpen(true);
                            } else {
                              setPauseModalOpen(true);
                            }
                          }}
                        >
                          {status === MeterStatus.PAUSED ? <Play size={20} /> : <Pause size={20} />}
                          <span className="text-[10px] font-black uppercase tracking-widest hidden group-hover/btn:block">
                            {status === MeterStatus.PAUSED ? (language === 'zh' ? '恢復' : 'Resume') : (language === 'zh' ? '暫停' : 'Pause')}
                          </span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={6} className="px-8 py-32 text-center text-gray-400">
                    <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Database size={40} className="opacity-20" />
                    </div>
                    <p className="text-lg font-black text-gray-300 uppercase tracking-widest">{t.monitoring.noDataFound}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Status Legend Section */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
              <Info size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-900 tracking-tight">{t.monitoring.statusLegend}</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Status Logic Definitions</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { status: MeterStatus.ACTIVE, label: t.monitoring.active, logic: t.monitoring.statusLogic.active, color: '#10B981' },
            { status: MeterStatus.PENDING_APPLICATION, label: t.monitoring.pendingApplication, logic: t.monitoring.statusLogic.pendingApplication, color: '#FF7A2C' },
            { status: MeterStatus.PENDING_ACTIVE, label: t.monitoring.pendingActive, logic: t.monitoring.statusLogic.pendingActive, color: '#8950FA' },
            { status: MeterStatus.PAUSED, label: t.monitoring.paused, logic: t.monitoring.statusLogic.paused, color: '#E11D48' },
            { status: MeterStatus.ABNORMAL, label: t.monitoring.abnormal, logic: t.monitoring.statusLogic.abnormal, color: '#F43F5E' },
            { status: MeterStatus.HISTORICAL_UNLOAD, label: t.monitoring.historicalUnload, logic: t.monitoring.statusLogic.historicalUnload, color: '#6B7280' }
          ].map((item, idx) => (
            <div key={idx} className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100 hover:bg-white hover:shadow-lg hover:shadow-gray-200/50 transition-all group">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-[11px] font-black text-gray-900 uppercase tracking-widest">{item.label}</span>
              </div>
              <p className="text-[10px] font-bold text-gray-500 leading-tight opacity-80">
                {item.logic}
              </p>
            </div>
          ))}
        </div>
      </div>
      {/* Pause Modal */}
      {pauseModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500">
                  <Pause size={24} />
                </div>
                <h3 className="text-xl font-black text-gray-900 tracking-tight">確認暫停此電號？</h3>
              </div>
              
              <div className="bg-rose-50/50 border border-rose-100 p-4 rounded-2xl mb-6">
                <p className="text-sm font-bold text-rose-600 leading-relaxed">
                  暫停期間，此電號將強制退出下一次 AI 電力匹配，不參與任何綠電匹配與計費。
                </p>
              </div>

              <div className="space-y-4">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">請選擇暫停原因 (必填)</label>
                <select 
                  className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-[#9CB13A] rounded-2xl text-sm font-bold outline-none transition-all appearance-none cursor-pointer"
                  value={pauseReason}
                  onChange={(e) => {
                    setPauseReason(e.target.value);
                    if (e.target.value !== '其他') {
                      setCustomReason('');
                    }
                  }}
                >
                  <option value="">請選擇原因...</option>
                  <option value="設備維修">設備維修</option>
                  <option value="台電換錶">台電換錶</option>
                  <option value="欠費停權">欠費停權</option>
                  <option value="其他">其他</option>
                </select>

                {pauseReason === '其他' && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <textarea
                      placeholder="請輸入其他暫停原因..."
                      className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-[#9CB13A] rounded-2xl text-sm font-bold outline-none transition-all resize-none h-24"
                      value={customReason}
                      onChange={(e) => setCustomReason(e.target.value)}
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-8">
                <button 
                  onClick={() => {
                    setPauseModalOpen(false);
                    setPauseReason('');
                    setCustomReason('');
                  }}
                  className="flex-1 px-6 py-4 bg-[#E7E6E6] text-gray-500 rounded-2xl font-black text-sm hover:bg-gray-200 transition-all active:scale-95"
                >
                  取消
                </button>
                <button 
                  disabled={!pauseReason || (pauseReason === '其他' && !customReason.trim())}
                  onClick={() => {
                    const finalReason = pauseReason === '其他' ? customReason : pauseReason;
                    alert(`已暫停電號 ${selectedMeter?.taipowerId}，原因：${finalReason}`);
                    setPauseModalOpen(false);
                    setPauseReason('');
                    setCustomReason('');
                  }}
                  className={`flex-1 px-6 py-4 rounded-2xl font-black text-sm transition-all active:scale-95 ${
                    (pauseReason && (pauseReason !== '其他' || customReason.trim())) 
                      ? 'bg-[#54585A] text-white shadow-lg shadow-gray-900/20 hover:bg-[#444749]' 
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  確定暫停
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resume Modal */}
      {resumeModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500">
                  <Play size={24} />
                </div>
                <h3 className="text-xl font-black text-gray-900 tracking-tight">確認恢復正常轉供？</h3>
              </div>
              
              <div className="space-y-6">
                <p className="text-sm font-bold text-gray-600 leading-relaxed">
                  恢復後，此電號將解除暫停鎖定，並重新依照其設定的「生效日」判定狀態。
                </p>

                <div className="bg-amber-50 border border-amber-100 p-6 rounded-2xl">
                  <h4 className="text-amber-700 font-black text-sm mb-2 flex items-center gap-2">
                    <AlertCircle size={16} /> 【重要提醒】
                  </h4>
                  <p className="text-xs font-bold text-amber-600 leading-relaxed">
                    若此次維修有重新向台電送件並取得「新的生效日」，請不要在此直接點擊恢復！請先至「轉供合約版本管理」更新該電號的生效日期，系統將自動為您調整狀態。
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button 
                  onClick={() => setResumeModalOpen(false)}
                  className="flex-1 px-6 py-4 bg-[#E7E6E6] text-gray-500 rounded-2xl font-black text-sm hover:bg-gray-200 transition-all active:scale-95"
                >
                  取消
                </button>
                <button 
                  onClick={() => {
                    alert(`已恢復電號 ${selectedMeter?.taipowerId} 正常轉供`);
                    setResumeModalOpen(false);
                  }}
                  className="flex-[1.5] px-6 py-4 bg-[#9CB13A] text-white rounded-2xl font-black text-sm shadow-lg shadow-[#9CB13A]/20 hover:bg-[#8A9D33] transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  我了解，確定恢復
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Monitoring;
