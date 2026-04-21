
import React, { useState } from 'react';
import { 
  Search, 
  Lock, 
  Clock, 
  ChevronRight, 
  ChevronDown, 
  Plus, 
  Minus, 
  Edit3, 
  AlertCircle,
  History,
  CheckCircle2,
  Filter,
  Settings,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../LanguageContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { INITIAL_CLIENTS } from '../mockData';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Version {
  id: string;
  version: string;
  status: 'editing' | 'locked';
  date: string;
  remarks: string;
}

interface Meter {
  id: string;
  meterId: string;
  name: string;
  type: 'consumer' | 'generator';
  checked: boolean;
  disabled?: boolean;
}

interface Contract {
  id: string;
  name: string;
  contractId: string;
  type: 'consumer' | 'generator';
  meters: Meter[];
  expanded?: boolean;
}

interface Company {
  id: string;
  name: string;
  contracts: Contract[];
  expanded?: boolean;
}

const WheelingVersions: React.FC = () => {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVersion, setSelectedVersion] = useState('v3');
  const [meterSearch, setMeterSearch] = useState('');

  // Default Scheduled Application Date: 2 months from today (2026-04-07 -> 2026-06-07)
  const defaultDate = new Date('2026-04-07');
  defaultDate.setMonth(defaultDate.getMonth() + 2);
  const formattedDefaultDate = defaultDate.toISOString().split('T')[0].replace(/-/g, '/');
  
  const [scheduledDate, setScheduledDate] = useState(formattedDefaultDate);

  // Mock Versions
  const versions: Version[] = [
    { id: 'v3', version: 'v3', status: 'editing', date: '2026/03/25', remarks: 'KIWI-1234' },
    { id: 'v2', version: 'v2', status: 'locked', date: '2026/02/01', remarks: 'KIWI-1234' },
    { id: 'v1', version: 'v1', status: 'locked', date: '2026/01/01', remarks: 'KIWI-1234' },
  ];

  const [companies, setCompanies] = useState<Company[]>(() => {
    return INITIAL_CLIENTS.map((client) => ({
      id: client.vatNumber,
      name: client.name,
      expanded: true,
      contracts: client.contracts.map((contract) => ({
        id: contract.id,
        name: contract.name || `電力合約 ${contract.id}`,
        contractId: contract.id,
        type: client.type,
        expanded: false,
        meters: contract.meters.map((meter, index) => ({
          id: `${contract.id}-m-${index}`,
          meterId: meter.taipowerId,
          name: meter.displayName,
          type: client.type,
          checked: true,
          disabled: false,
        }))
      }))
    }));
  });

  const toggleCompany = (id: string) => {
    setCompanies(prev => prev.map(c => c.id === id ? { ...c, expanded: !c.expanded } : c));
  };

  const toggleContract = (companyId: string, contractId: string) => {
    setCompanies(prev => prev.map(c => {
      if (c.id === companyId) {
        return {
          ...c,
          contracts: c.contracts.map(con => con.id === contractId ? { ...con, expanded: !con.expanded } : con)
        };
      }
      return c;
    }));
  };

  return (
    <div className="flex flex-col h-full -mt-4">
      <div className="flex items-center gap-2 mb-6">
        <History className="text-[#9CB13A]" size={24} />
        <h2 className="text-xl font-bold text-[#54585a]">{t.wheelingVersions.title}</h2>
        <span className="text-gray-400 text-sm">— {t.wheelingVersions.subtitle}</span>
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        {/* Left Column: Version History */}
        <aside className="w-72 flex flex-col bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-bold text-[#54585a] mb-3 flex items-center gap-2">
              {t.wheelingVersions.versionHistory}
            </h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder={t.wheelingVersions.searchPlaceholder}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#9CB13A]/20 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {versions.map((v) => (
              <button
                key={v.id}
                onClick={() => setSelectedVersion(v.id)}
                className={cn(
                  "w-full text-left p-4 rounded-xl transition-all group relative",
                  selectedVersion === v.id 
                    ? "bg-[#9CB13A]/5 border border-[#9CB13A]/20" 
                    : "hover:bg-gray-50 border border-transparent"
                )}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={cn(
                    "font-bold text-sm",
                    selectedVersion === v.id ? "text-[#9CB13A]" : "text-[#54585a]"
                  )}>
                    {v.remarks}
                  </span>
                  <div className="flex items-center gap-1">
                    {v.status === 'locked' ? (
                      <Lock size={14} className="text-gray-400" />
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded-md font-bold">
                        {t.wheelingVersions.editing}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-black text-[#54585a]">{v.version}</span>
                  <span className="text-xs text-gray-400">{v.date}</span>
                </div>
                {selectedVersion === v.id && (
                  <motion.div 
                    layoutId="active-indicator"
                    className="absolute left-0 top-4 bottom-4 w-1 bg-[#9CB13A] rounded-r-full"
                  />
                )}
              </button>
            ))}
          </div>

          <div className="p-4 border-t border-gray-100 bg-gray-50/50">
            <button className="w-full py-3 bg-[#54585a] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#404345] transition-all shadow-lg shadow-gray-200">
              <Lock size={18} />
              {t.wheelingVersions.lockActivate}
            </button>
          </div>
        </aside>

        {/* Middle Column: Settings & Source Tree */}
        <section className="flex-1 flex flex-col gap-6 min-w-0">
          {/* Settings Card */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-[#9CB13A]/10 rounded-lg flex items-center justify-center">
                <Settings className="text-[#9CB13A]" size={18} />
              </div>
              <h3 className="font-bold text-[#54585a]">{t.wheelingVersions.settings}</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-6 mb-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  {t.wheelingVersions.scheduledApplicationDate}
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input 
                    type="text" 
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#9CB13A]/20"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  {t.wheelingVersions.effectiveDate}
                </label>
                <div className="relative">
                  <CheckCircle2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input 
                    type="text" 
                    defaultValue="2026/04/01"
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#9CB13A]/20"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                {t.wheelingVersions.remarks}
              </label>
              <textarea 
                placeholder="..."
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#9CB13A]/20 h-20 resize-none"
              />
            </div>
          </div>

          {/* Tree Selection Card */}
          <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Filter className="text-blue-500" size={18} />
                </div>
                <h3 className="font-bold text-[#54585a]">{t.wheelingVersions.sourceSelection}</h3>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder={t.wheelingVersions.searchMeters}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none"
                  value={meterSearch}
                  onChange={(e) => setMeterSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                {companies.map((company) => (
                  <div key={company.id} className="space-y-2">
                    <button 
                      onClick={() => toggleCompany(company.id)}
                      className="flex items-center gap-2 w-full text-left group"
                    >
                      {company.expanded ? <ChevronDown size={18} className="text-gray-400" /> : <ChevronRight size={18} className="text-gray-400" />}
                      <span className="font-bold text-[#9CB13A]">{company.name}</span>
                    </button>

                    {company.expanded && (
                      <div className="ml-6 space-y-3">
                        {company.contracts.map((contract) => (
                          <div key={contract.id} className="space-y-2">
                            <div className="flex items-center justify-between group">
                              <button 
                                onClick={() => toggleContract(company.id, contract.id)}
                                className="flex items-center gap-2 text-left"
                              >
                                {contract.expanded ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
                                <span className="text-sm font-bold text-[#54585a]">{contract.name}</span>
                              </button>
                              <div className="flex items-center gap-3">
                                <span className="text-[10px] text-gray-400 font-mono">{contract.contractId}</span>
                                <span className={cn(
                                  "text-[10px] px-1.5 py-0.5 rounded font-bold uppercase",
                                  contract.type === 'consumer' ? "bg-blue-50 text-blue-600" : "bg-green-50 text-green-600"
                                )}>
                                  {contract.type === 'consumer' ? t.common.consumer : t.common.generator}
                                </span>
                              </div>
                            </div>

                            {contract.expanded && (
                              <div className="ml-6 space-y-1">
                                {contract.meters.map((meter) => (
                                  <div 
                                    key={meter.id} 
                                    className={cn(
                                      "flex items-center justify-between p-2 rounded-lg transition-all",
                                      meter.disabled ? "opacity-40 bg-gray-50" : "hover:bg-gray-50"
                                    )}
                                  >
                                    <div className="flex items-center gap-3">
                                      <input 
                                        type="checkbox" 
                                        checked={meter.checked}
                                        disabled={meter.disabled}
                                        className="w-4 h-4 rounded border-gray-300 text-[#9CB13A] focus:ring-[#9CB13A]"
                                        readOnly
                                      />
                                      <div className="flex flex-col">
                                        <span className="text-sm font-medium text-[#54585a]">{meter.meterId}</span>
                                        <span className="text-[10px] text-gray-400">{meter.name}</span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] text-gray-400 font-bold uppercase">
                                        {meter.type === 'consumer' ? "用電" : "供電"}
                                      </span>
                                      {meter.disabled && (
                                        <div className="w-5 h-5 bg-red-50 rounded flex items-center justify-center" title="已停用">
                                          <AlertCircle className="text-red-500" size={12} />
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 bg-gray-50 border-t border-gray-100 flex justify-between items-center px-6">
              <span className="text-xs font-bold text-gray-500">
                {t.wheelingVersions.selectedMeters.replace('{count}', '2')}
              </span>
            </div>
          </div>
        </section>

        {/* Right Column: Version Diff Viewer */}
        <aside className="w-96 flex flex-col bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-bold text-[#54585a] flex items-center gap-2">
              <RefreshCw className="text-[#9CB13A]" size={18} />
              {t.wheelingVersions.diffTitle}
            </h3>
            <p className="text-[10px] text-gray-400 mt-1 font-bold uppercase tracking-wider">
              {t.wheelingVersions.v3vsV2}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {/* Added Card */}
            <div className="bg-green-50/50 border border-green-100 rounded-xl p-4 relative overflow-hidden group">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500" />
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-500 text-white rounded-lg flex items-center justify-center flex-shrink-0">
                  <Plus size={14} strokeWidth={3} />
                </div>
                <div>
                  <p className="text-xs font-bold text-green-700 mb-1">{t.wheelingVersions.added}</p>
                  <p className="text-sm font-bold text-[#54585a]">台北信義門市</p>
                  <p className="text-[10px] text-gray-400 font-mono mt-0.5">00-12-3456-78-9</p>
                </div>
              </div>
            </div>

            {/* Removed Card */}
            <div className="bg-red-50/50 border border-red-100 rounded-xl p-4 relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500" />
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-red-500 text-white rounded-lg flex items-center justify-center flex-shrink-0">
                  <Minus size={14} strokeWidth={3} />
                </div>
                <div>
                  <p className="text-xs font-bold text-red-700 mb-1">{t.wheelingVersions.removed}</p>
                  <p className="text-sm font-bold text-[#54585a]">台中高鐵門市</p>
                  <p className="text-[10px] text-gray-400 font-mono mt-0.5">00-98-7654-32-1</p>
                </div>
              </div>
            </div>

            {/* Modified Card */}
            <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-4 relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500" />
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-amber-500 text-white rounded-lg flex items-center justify-center flex-shrink-0">
                  <Edit3 size={14} strokeWidth={2.5} />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-amber-700 mb-1">{t.wheelingVersions.dateChanged}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-400 line-through">2026/03/01</span>
                    <ChevronRight size={12} className="text-gray-400" />
                    <span className="text-xs font-bold text-[#54585a]">2026/04/01</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Empty State / Info */}
            <div className="mt-8 p-6 border-2 border-dashed border-gray-100 rounded-2xl flex flex-col items-center text-center">
              <RefreshCw className="text-gray-200 mb-3" size={48} />
              <p className="text-xs text-gray-400 font-bold leading-relaxed">
                {t.wheelingVersions.noDiff}
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default WheelingVersions;
