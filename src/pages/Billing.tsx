
import React, { useState, useMemo } from 'react';
import { 
  Search, 
  ChevronDown, 
  ChevronRight, 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  Building2, 
  Factory, 
  Calendar,
  Download,
  Info,
  CheckCircle2,
  Filter,
  ArrowLeft,
  ArrowUpRight,
  Receipt,
  ExternalLink,
  MoreHorizontal
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ComposedChart,
  Line,
  ReferenceArea,
  AreaChart,
  Area,
  Legend
} from 'recharts';
import { 
  INITIAL_CLIENTS,
  INITIAL_CONTRACTS
} from '../mockData';
import { AIStrategy } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useLanguage } from '../LanguageContext';
import { formatEnergy, formatPower } from '../utils/contractUtils';

// --- Utility for Tailwind classes ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
type CustomerType = 'consumer' | 'producer';

interface Customer {
  id: string;
  vatNumber: string;
  name: string;
  type: CustomerType;
}

// --- Mock Data Generators ---

const pseudoRandom = (seed: number) => {
  let x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
};

const generateDailyConsumerData = (seedBase: number, targetMonthly: number) => {
  return Array.from({ length: 31 }, (_, i) => {
    const day = i + 1;
    const dailyTarget = targetMonthly / 31;
    // Add noise based on day
    const actual = dailyTarget * (0.8 + pseudoRandom(seedBase + day) * 0.4);
    const green = actual * (0.5 + pseudoRandom(seedBase + day + 100) * 0.4);
    const gap = actual - green;
    const reRate = (green / actual) * 100;
    return {
      day,
      date: `2026-02-${day.toString().padStart(2, '0')}`,
      actual: Math.round(actual),
      green: Math.round(green),
      gap: Math.round(gap),
      reRate: parseFloat(reRate.toFixed(1))
    };
  });
};

const generateDailyProducerData = (t: any, seedBase: number, targetMonthly: number) => {
  return Array.from({ length: 31 }, (_, i) => {
    const day = i + 1;
    const dailyTarget = targetMonthly / 31;
    const actual = dailyTarget * (0.85 + pseudoRandom(seedBase + day) * 0.25);
    const matched = actual * (0.7 + pseudoRandom(seedBase + day + 200) * 0.25);
    const diff = actual - matched; 
    const achievement = (actual / dailyTarget) * 100;
    return {
      day,
      date: `2026-02-${day.toString().padStart(2, '0')}`,
      target: Math.round(dailyTarget),
      actual: Math.round(actual),
      matched: Math.round(matched),
      diff: Math.round(diff),
      achievement: parseFloat(achievement.toFixed(1)),
      status: achievement < 90 ? (t ? t.billing.abnormal : '異常') : (t ? t.billing.normal : '正常')
    };
  });
};

const MOCK_CUSTOMERS: Customer[] = INITIAL_CLIENTS.map((c, i) => ({
  id: `CUST-00${i+1}`,
  vatNumber: c.vatNumber,
  name: c.name,
  type: c.type === 'consumer' ? 'consumer' : 'producer'
}));


// --- Components ---

const KPICard = ({ title, value, unit, trend, trendValue, icon: Icon, colorClass, info }: any) => (
  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative group">
    <div className="flex justify-between items-start mb-4">
      <div className={cn("p-3 rounded-xl", colorClass)}>
        <Icon size={20} className="text-white" />
      </div>
      <div className="flex flex-col items-end gap-2">
        {trend && (
          <div className={cn("flex items-center gap-1 text-xs font-bold", trend === 'up' ? 'text-[#1DD793]' : 'text-rose-500')}>
            {trend === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {trendValue}
          </div>
        )}
        {info && (
          <div className="relative group/info">
            <Info size={14} className="text-gray-300 hover:text-[#9CB13A] cursor-help transition-colors" />
            <div className="absolute bottom-full right-0 mb-2 w-64 p-3 bg-slate-800 text-white text-[10px] rounded-xl shadow-xl opacity-0 invisible group-hover/info:opacity-100 group-hover/info:visible transition-all z-50 leading-relaxed font-medium whitespace-pre-line">
              {info}
            </div>
          </div>
        )}
      </div>
    </div>
    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{title}</p>
    <div className="flex items-baseline gap-1">
      <h3 className="text-2xl font-black text-gray-900">{value}</h3>
      {unit && <span className="text-xs font-bold text-gray-500">{unit}</span>}
    </div>
  </div>
);

const ConsumerHourlyChart = ({ item, globalSelectedDate, setGlobalSelectedDate, t }: any) => {
  const [localDate, setLocalDate] = useState(globalSelectedDate);
  
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalDate(e.target.value);
    setGlobalSelectedDate(e.target.value);
  };

  const hourlyData = useMemo(() => {
    const dailyTarget = item.dailyDetails.find((d: any) => d.date === localDate) || item.dailyDetails[0];
    if (!dailyTarget) return [];
    
    // Create a stable random seed based on meter ID and chosen date
    const seed = item.id.charCodeAt(0) + (parseInt(localDate.slice(-2)) || 1);
    
    return Array.from({ length: 96 }, (_, i) => {
      const hour = Math.floor(i / 4);
      const minute = (i % 4) * 15;
      
      let loadFactor = 0.4;
      if (hour >= 9 && hour < 17) loadFactor = 1.2; // Peak load
      
      let greenFactor = 0.0;
      if (hour > 6 && hour < 18) {
        greenFactor = Math.max(0, Math.sin((((hour + minute/60) - 6) / 11) * Math.PI));
      }
      
      const actual = (dailyTarget.actual / 96) * loadFactor * (0.8 + pseudoRandom(seed + i) * 0.4);
      const maxGreen = (dailyTarget.green / 32) * greenFactor * (0.8 + pseudoRandom(seed + i + 100) * 0.4);
      const green = Math.min(actual, maxGreen);
      
      return {
        time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
        hourInt: hour,
        actual: Math.round(actual),
        green: Math.round(green),
        gray: Math.max(0, Math.round(actual - green))
      };
    });
  }, [localDate, item]);

  return (
    <div className="flex flex-col gap-2 p-4">
      <div className="flex justify-between items-center px-4">
        <span className="text-sm font-black text-[#54585a]">{t.billing.dailyAnalysis}</span>
        <input 
          type="date" 
          value={localDate}
          onChange={handleDateChange}
          className="px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-gray-600 focus:ring-2 focus:ring-[#9CB13A] outline-none"
        />
      </div>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} interval={3} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8' }} tickFormatter={(val) => formatPower(val)} />
            <Tooltip 
              cursor={{ fill: '#f8fafc' }}
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px -3px rgba(0,0,0,0.1)', padding: '12px' }}
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  const isPeak = data.hourInt >= 9 && data.hourInt < 17;
                  return (
                    <div className="bg-white p-3 rounded-xl shadow-lg border border-gray-50">
                      <p className="text-[10px] font-black text-gray-400 mb-2">
                        {label} {isPeak ? t.billing.peakHoursLabel : ''}
                      </p>
                      <div className="space-y-1">
                        <div className="flex justify-between gap-6">
                          <span className="text-[10px] font-bold text-[#54585a]">{t.billing.allocatedGreen}</span>
                          <span className="text-[10px] font-black text-[#6EE7B7]">{formatPower(data.green)}</span>
                        </div>
                        <div className="flex justify-between gap-6">
                          <span className="text-[10px] font-bold text-[#54585a]">{t.billing.grayPower}</span>
                          <span className="text-[10px] font-black text-gray-400">{formatPower(data.gray)}</span>
                        </div>
                        <div className="flex justify-between gap-6 pt-1 mt-1 border-t border-gray-50">
                          <span className="text-[10px] font-bold text-[#54585a]">{t.billing.usage15min}</span>
                          <span className="text-[10px] font-black text-gray-600">{formatPower(data.actual)}</span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend verticalAlign="top" align="right" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
            {/* @ts-ignore */}
            <ReferenceArea x1="09:00" x2="16:45" fill="#FFFBEB" fillOpacity={0.8} />
            <Bar dataKey="green" name={t.billing.allocatedGreen} stackId="a" fill="#6EE7B7" radius={[0, 0, 0, 0]} maxBarSize={15} />
            <Bar dataKey="gray" name={`${t.billing.grayPower} (${t.matching.gridCompany})`} stackId="a" fill="#e2e8f0" radius={[4, 4, 0, 0]} maxBarSize={15} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const Billing: React.FC = () => {
  const { t, language } = useLanguage();

  const MOCK_DETAILS: Record<string, any> = useMemo(() => ({
    'CUST-003': { // FamilyMart (Index 2 in INITIAL_CLIENTS)
      contracts: INITIAL_CLIENTS[2].contracts.map((con, conIdx) => {
        const meters = con.meters.map((m, mIdx) => {
          const annualTarget = m.annualTargetKwh || 800000;
          const monthlyTarget = annualTarget / 12;
          const dailyDetails = generateDailyConsumerData(conIdx * 100 + mIdx, monthlyTarget);
          const actualUsage = dailyDetails.reduce((acc, d) => acc + d.actual, 0);
          const allocatedGreen = dailyDetails.reduce((acc, d) => acc + d.green, 0);
          return {
            id: m.taipowerId,
            name: m.displayName,
            weight: t.billing.high,
            actualUsage,
            allocatedGreen,
            estGeneration: monthlyTarget,
            dailyDetails
          };
        });
        
        const totalAllocated = meters.reduce((a, m) => a + m.allocatedGreen, 0);
        const totalUsage = meters.reduce((a, m) => a + m.actualUsage, 0);
        const estGeneration = meters.reduce((a, m) => a + m.estGeneration, 0);
        const reRate = (totalAllocated / totalUsage) * 100;
        
        return {
          id: con.id,
          name: con.name,
          strategy: con.aiStrategy === AIStrategy.COST_OPTIMIZED ? t.billing.costOptimized : t.billing.rePriority,
          totalAllocated,
          estGeneration,
          reRate: parseFloat(reRate.toFixed(1)),
          meters
        };
      })
    },
    'CUST-001': { // 屏東大武 (Index 0 in INITIAL_CLIENTS)
      contracts: INITIAL_CLIENTS[0].contracts.map((con, conIdx) => {
        const plants = con.meters.map((m, mIdx) => {
          const annualTarget = m.estimatedGeneration || m.annualTargetKwh || 14000000;
          const targetMonthly = annualTarget / 12;
          const dailyDetails = generateDailyProducerData(t, conIdx * 100 + mIdx, targetMonthly);
          const monthlyTarget = dailyDetails.reduce((acc: number, d: any) => acc + d.target, 0);
          const actualGeneration = dailyDetails.reduce((acc: number, d: any) => acc + d.actual, 0);
          const achievement = (actualGeneration / monthlyTarget) * 100;
          return {
            id: m.taipowerId,
            name: m.displayName,
            type: t.billing.type1,
            monthlyTarget,
            actualGeneration,
            achievement: parseFloat(achievement.toFixed(1)),
            dailyDetails
          };
        });

        const estGeneration = plants.reduce((a, p) => a + p.monthlyTarget, 0);
        const actualGeneration = plants.reduce((a, p) => a + p.actualGeneration, 0);
        const matchedTransfer = plants.reduce((a, p) => a + p.dailyDetails.reduce((acc: number, d: any) => acc + d.matched, 0), 0);

        return {
          id: con.id,
          name: con.name,
          capacity: con.agreedCapacity * 1000,
          estGeneration,
          actualGeneration,
          matchedTransfer,
          plants
        };
      })
    }
  }), [t]);

  const [view, setView] = useState<'list' | 'detail'>('list');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [selectedDate, setSelectedDate] = useState('2026-02-15');
  const [chartView, setChartView] = useState<'trend' | 'diff'>('trend');
  
  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [typeFilter, setTypeFilter] = useState<'all' | CustomerType>('all');

  const details = selectedCustomer ? (MOCK_DETAILS[selectedCustomer.id] || (selectedCustomer.type === 'consumer' ? MOCK_DETAILS['CUST-003'] : MOCK_DETAILS['CUST-001'])) : null;
  const isConsumer = selectedCustomer?.type === 'consumer';

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const filteredCustomers = useMemo(() => {
    return MOCK_CUSTOMERS.filter(c => {
      const matchesSearch = c.name.includes(searchQuery) || c.vatNumber.includes(searchQuery);
      const matchesType = typeFilter === 'all' || c.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [searchQuery, typeFilter]);

  const handleCustomerClick = (customer: Customer) => {
    setSelectedCustomer(customer);
    setView('detail');
    setExpandedRows(new Set());
  };

  // Mocked Chart Data for Detail View
  const consumerChartData = useMemo(() => {
    // Seed random with selectedDate to make it look consistent for the same date
    const seed = selectedDate.split('-').reduce((acc, val) => acc + parseInt(val), 0);
    return Array.from({ length: 24 }, (_, i) => {
      const hour = i;
      const isPeak = (hour >= 9 && hour <= 12) || (hour >= 13 && hour <= 17);
      const base = 200 + Math.sin((hour / 24) * Math.PI) * 150;
      const random = ((seed + hour) % 10) * 5;
      const actual = base + random;
      const green = isPeak ? actual * 0.9 : actual * 0.4;
      return {
        time: `${hour.toString().padStart(2, '0')}:00`,
        green: Math.round(green),
        gray: Math.round(actual - green),
        isPeak
      };
    });
  }, [selectedDate]);

  const producerChartData = useMemo(() => {
    if (details && !isConsumer && details.contracts.length > 0 && details.contracts[0].plants.length > 0) {
      return details.contracts[0].plants[0].dailyDetails;
    }
    return generateDailyProducerData(t, 0, 1000000);
  }, [t, details, isConsumer]);

  const handleExportCSV = () => {
    if (!selectedCustomer || !details) return;
    
    const isConsumer = selectedCustomer.type === 'consumer';
    let csvContent = "\uFEFF"; // UTF-8 BOM
    
    if (isConsumer) {
      csvContent += `${t.billing.date},${t.billing.contractName},${t.billing.meterId},${t.billing.actualUsage}(${t.common.kwh}),${t.billing.allocatedGreen}(${t.common.kwh}),${t.billing.reAchievement}(%)\n`;
      details.contracts.forEach((contract: any) => {
        contract.meters?.forEach((meter: any) => {
          meter.dailyDetails.forEach((day: any) => {
            csvContent += `${day.date},${contract.name},${meter.name}(${meter.id}),${day.actual},${day.green},${day.reRate}%\n`;
          });
        });
      });
    } else {
      csvContent += `${t.billing.date},${t.billing.contractName},${t.billing.plantName},${t.billing.estGeneration}(${t.common.kwh}),${t.billing.actualGeneration}(${t.common.kwh}),${t.billing.capacityAchievement}(%)\n`;
      details.contracts.forEach((contract: any) => {
        contract.plants?.forEach((plant: any) => {
          plant.dailyDetails.forEach((day: any) => {
            csvContent += `${day.date},${contract.name},${plant.name}(${plant.id}),${day.baseline},${day.actual},${day.achievement}%\n`;
          });
        });
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${t.billing.settlementReport}_${selectedCustomer.name}_2026-02.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (view === 'list') {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex justify-end items-end">
          <div className="flex gap-3">
            <div className="bg-white px-4 py-2 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-2">
              <Calendar size={18} className="text-[#9CB13A]" />
              <span className="text-sm font-black text-gray-700">{t.billing.currentMonth}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder={t.billing.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-2xl text-sm font-bold text-gray-700 focus:ring-2 focus:ring-[#9CB13A] outline-none"
              />
            </div>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "px-6 py-3 rounded-2xl text-sm font-bold transition-all flex items-center gap-2 border",
                showFilters ? "bg-[#9CB13A]/10 border-[#9CB13A]/20 text-[#9CB13A]" : "bg-[#54585A] text-white border-transparent hover:bg-[#444749]"
              )}
            >
              <Filter size={18} /> {showFilters ? t.common.hideFilters : t.common.showFilters}
            </button>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-4 border-t border-gray-50 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t.common.customerType}</label>
                    <div className="flex p-1 bg-gray-100 rounded-xl">
                      {(['all', 'consumer', 'producer'] as const).map((t_type) => (
                        <button
                          key={t_type}
                          onClick={() => setTypeFilter(t_type)}
                          className={cn(
                            "flex-1 py-2 rounded-lg text-xs font-black transition-all",
                            typeFilter === t_type ? "bg-white text-[#9CB13A] shadow-sm" : "text-gray-400 hover:text-gray-600"
                          )}
                        >
                          {t_type === 'all' ? t.billing.all : t_type === 'consumer' ? t.common.consumer : t.common.generator}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-end pb-1">
                    <button 
                      onClick={() => {
                        setTypeFilter('all');
                        setSearchQuery('');
                      }}
                      className="text-xs font-bold text-gray-400 hover:text-rose-500 transition-colors flex items-center gap-1 ml-auto"
                    >
                      {t.common.resetFilters}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left min-w-[600px]">
              <thead>
                <tr className={`bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase ${language === 'en' ? 'tracking-wider' : 'tracking-[0.2em]'} border-b border-gray-100`}>
                  <th className="px-4 md:px-8 py-4 md:py-5">{t.common.vatNumber}</th>
                  <th className="px-4 md:px-8 py-4 md:py-5">{t.common.customerName}</th>
                  <th className="px-4 md:px-8 py-4 md:py-5">{t.common.customerType}</th>
                  <th className="px-4 md:px-8 py-4 md:py-5 text-right">{t.common.operation}</th>
                </tr>
              </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredCustomers.map(customer => (
                <tr 
                  key={customer.id} 
                  onClick={() => handleCustomerClick(customer)}
                  className="group cursor-pointer hover:bg-gray-50/50 transition-all"
                >
                  <td className="px-4 md:px-8 py-4 md:py-6 text-sm font-mono font-bold text-gray-500">{customer.vatNumber}</td>
                  <td className="px-4 md:px-8 py-4 md:py-6 text-sm font-black text-gray-900">{customer.name}</td>
                  <td className="px-4 md:px-8 py-4 md:py-6">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border",
                      customer.type === 'consumer' 
                        ? "bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/20" 
                        : "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20"
                    )}>
                      {customer.type === 'consumer' ? t.billing.consumerType : t.billing.generatorType}
                    </span>
                  </td>
                  <td className="px-4 md:px-8 py-4 md:py-6 text-right">
                    <div className="flex justify-end">
                      <div className="p-2 rounded-xl bg-gray-50 text-gray-400 group-hover:bg-[#9CB13A] group-hover:text-white transition-all">
                        <ChevronRight size={18} />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Detail View Logic
if (!selectedCustomer || !details) return null;

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
      {/* Detail Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setView('list')}
            className="p-3 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-gray-900 shadow-sm transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl md:text-2xl font-black text-gray-900">{selectedCustomer?.name}</h2>
            </div>
            <p className="text-xs md:text-sm text-gray-400 font-bold mt-1">
              {t.common.vatNumber}: {selectedCustomer?.vatNumber} | 
              {t.billing.customerType}: {isConsumer ? t.billing.consumerType : t.billing.generatorType} |
              {t.billing.contractStatus}: <span className="text-[#1DD793]">{t.billing.active}</span> |
              {t.billing.settlementMonth}: 2026-02
            </p>
          </div>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button 
            onClick={handleExportCSV}
            className="flex-1 md:flex-none px-6 py-3 bg-[#9CB13A] text-white rounded-2xl text-sm font-bold shadow-lg shadow-[#9CB13A]/20 hover:bg-[#9CB13A]/80 transition-all flex items-center justify-center gap-2"
          >
            <Download size={18} /> {t.billing.exportReport}
          </button>
        </div>
      </div>

      {/* Dynamic KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isConsumer ? (
          <>
            <KPICard 
              title={t.billing.monthlyTargetTransfer} 
              value={formatEnergy(details.contracts.reduce((acc: number, c: any) => acc + (c.estGeneration || 0), 0)).split(' ')[0]} 
              unit={formatEnergy(details.contracts.reduce((acc: number, c: any) => acc + (c.estGeneration || 0), 0)).split(' ')[1]} 
              icon={Zap} 
              colorClass="bg-sky-400" 
              info={t.billing.monthlyTargetTransferInfo}
            />
            <KPICard 
              title={t.billing.actualGreen} 
              value={formatEnergy(details.contracts.reduce((acc: number, c: any) => acc + (c.totalAllocated || 0), 0)).split(' ')[0]} 
              unit={formatEnergy(details.contracts.reduce((acc: number, c: any) => acc + (c.totalAllocated || 0), 0)).split(' ')[1]} 
              icon={CheckCircle2} 
              colorClass="bg-[#1DD793]" 
              info={t.billing.actualGreenInfo}
            />
            <KPICard 
              title={t.billing.reAchievement} 
              value={(details.contracts.reduce((acc: number, c: any) => acc + (c.reRate || 0), 0) / details.contracts.length).toFixed(1)} 
              unit="%" 
              icon={TrendingUp} 
              colorClass="bg-indigo-500" 
              info={t.billing.reAchievementInfo}
            />
            <KPICard 
              title={t.billing.totalDue} 
              value={Math.round(details.contracts.reduce((acc: number, c: any) => acc + (c.totalAllocated || 0), 0) * 5.5).toLocaleString()} 
              unit={t.common.twd} 
              icon={Receipt} 
              colorClass="bg-slate-800" 
              info={t.billing.totalDueInfo}
            />
          </>
        ) : (
          <>
            <KPICard 
              title={t.billing.monthlyTargetGeneration} 
              value={formatEnergy(details.contracts.reduce((acc: number, c: any) => acc + (c.estGeneration || 0), 0)).split(' ')[0]} 
              unit={formatEnergy(details.contracts.reduce((acc: number, c: any) => acc + (c.estGeneration || 0), 0)).split(' ')[1]} 
              icon={Zap} 
              colorClass="bg-[#F59E0B]" 
              info={language === 'zh' ? "合約建檔時，該電號所設定的「該月份拆分目標」。" : "The monthly split target set for this meter during contract creation."}
            />
            <KPICard 
              title={t.billing.actualMonthlyGeneration} 
              value={formatEnergy(details.contracts.reduce((acc: number, c: any) => acc + (c.actualGeneration || 0), 0)).split(' ')[0]} 
              unit={formatEnergy(details.contracts.reduce((acc: number, c: any) => acc + (c.actualGeneration || 0), 0)).split(' ')[1]} 
              icon={TrendingUp} 
              colorClass="bg-[#1DD793]" 
              info={language === 'zh' ? "台電回傳檔案中，該發電設備當月真實過表的總度數。" : "The total actual generation for the month as reported by Taipower."}
            />
            <KPICard 
              title={t.billing.actualMatchedTransfer} 
              value={formatEnergy(details.contracts.reduce((acc: number, c: any) => acc + (c.matchedTransfer || 0), 0)).split(' ')[0]} 
              unit={formatEnergy(details.contracts.reduce((acc: number, c: any) => acc + (c.matchedTransfer || 0), 0)).split(' ')[1]} 
              icon={CheckCircle2} 
              colorClass="bg-sky-400" 
              info={t.billing.actualMatchedTransferInfo}
            />
            <KPICard 
              title={t.billing.purchaseCost} 
              value={Math.round(details.contracts.reduce((acc: number, c: any) => acc + (c.actualGeneration || 0), 0) * 4.5).toLocaleString()} 
              unit={t.common.twd} 
              icon={Receipt} 
              colorClass="bg-slate-800" 
              info={language === 'zh' ? "本月實際發電總量 × 合約約定購售電費率。" : "Total actual generation × Agreed purchase rate."}
            />
          </>
        )}
      </div>

      {/* Dynamic Chart Section */}
      <div className="bg-white p-4 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-gray-100 shadow-sm">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="text-xl font-black text-gray-900">{isConsumer ? t.billing.dailyUsageAllocationAnalysis : t.billing.wheelingTrend}</h3>
            {isConsumer && (
              <p className="text-xs font-bold text-gray-400 mt-1">
                {t.billing.peakBenefit}
              </p>
            )}
          </div>
          <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest">
            {isConsumer ? (
              <>
                <div className="flex items-center gap-4 mr-4">
                  <input 
                    type="date" 
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-gray-600 focus:ring-2 focus:ring-[#9CB13A] outline-none"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-[#1DD793] rounded-sm"></div>
                  <span>{t.billing.aiMatchedGreen}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-200 rounded-sm"></div>
                  <span>{t.billing.grayPower}</span>
                </div>
                <div className="flex items-center gap-2 text-[#F59E0B]">
                  <div className="w-3 h-3 bg-[#F59E0B]/10 border border-[#F59E0B]/20 rounded-sm"></div>
                  <span>{t.billing.peakHours}</span>
                </div>
              </>
            ) : (
              <div className="flex items-center">
                {!isConsumer ? null : (
                  <div className="flex bg-gray-50 p-1 rounded-xl mr-6 border border-gray-100">
                    <button 
                      onClick={() => setChartView('trend')} 
                      className={cn("px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all", chartView === 'trend' ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-700")}
                    >
                      轉供趨勢
                    </button>
                    <button 
                      onClick={() => setChartView('diff')} 
                      className={cn("px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all", chartView === 'diff' ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-700")}
                    >
                      匹配差異分析
                    </button>
                  </div>
                )}
                {chartView === 'trend' ? (
                  <>
                    <div className="flex items-center gap-2 text-[#F59E0B] mr-4">
                      <div className="w-3 h-3 bg-[#F59E0B] rounded-sm"></div>
                      <span>{t.billing.actualMonthlyGeneration}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sky-400">
                      <div className="w-3 h-3 bg-sky-400 rounded-sm"></div>
                      <span>{t.billing.actualMatchedTransfer}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-2 text-[#1DD793]">
                    <div className="w-3 h-3 bg-[#1DD793] rounded-sm"></div>
                    <span>{t.billing.matchingDifference} ({t.billing.surplus})</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {isConsumer ? (
              <BarChart data={consumerChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: '#94a3b8' }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', padding: '12px' }}
                />
                {/* @ts-ignore */}
                <ReferenceArea x1="09:00" x2="12:00" fill="#FFFBEB" fillOpacity={0.8} />
                {/* @ts-ignore */}
                <ReferenceArea x1="13:00" x2="17:00" fill="#FFFBEB" fillOpacity={0.8} />
                <Bar dataKey="green" name={t.billing.aiMatchedGreen} stackId="a" fill="#1DD793" radius={[0, 0, 0, 0]} barSize={30} />
                <Bar dataKey="gray" name={t.billing.grayPower} stackId="a" fill="#e2e8f0" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            ) : (
              <ComposedChart data={producerChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: '#94a3b8' }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', padding: '12px' }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const isSurplus = data.diff >= 0;
                      return (
                        <div className="bg-white p-4 rounded-2xl shadow-xl border border-gray-50">
                          <p className="text-xs font-black text-gray-400 mb-2 uppercase tracking-widest">{label} {t.billing.date}</p>
                          <div className="space-y-1.5">
                            <div className="flex justify-between gap-8">
                              <span className="text-xs font-bold text-gray-500">{t.billing.actualMonthlyGeneration}</span>
                              <span className="text-xs font-black text-gray-900">{formatEnergy(data.actual)}</span>
                            </div>
                            <div className="flex justify-between gap-8">
                              <span className="text-xs font-bold text-gray-500">{t.billing.actualMatchedTransfer}</span>
                              <span className="text-xs font-black text-sky-400">{formatEnergy(data.matched)}</span>
                            </div>
                            <div className="pt-1.5 mt-1.5 border-t border-gray-50 flex justify-between gap-8">
                              <span className="text-xs font-bold text-gray-500">{t.billing.matchingDifference}</span>
                              <span className={cn("text-xs font-black", isSurplus ? "text-[#1DD793]" : "text-rose-500")}>
                                {isSurplus ? t.billing.surplus : t.billing.gap} ({formatEnergy(Math.abs(data.diff))})
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="matched" name={t.billing.actualMatchedTransfer} fill="#38bdf8" radius={[4, 4, 0, 0]} barSize={20} />
                <Line type="monotone" dataKey="actual" name={t.billing.actualMonthlyGeneration} stroke="#F59E0B" strokeWidth={3} dot={{ r: 3, fill: '#F59E0B', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
              </ComposedChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Dynamic Tree Grid Table */}
      <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 md:p-8 border-b border-gray-50 flex justify-between items-center">
          <h3 className="text-lg font-black text-gray-900">{t.billing.settlementDetail}</h3>
          <div className="flex gap-3">
            <button 
              onClick={handleExportCSV}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors"
              title={t.billing.exportReport}
            >
              <Download size={20} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                <th className="px-8 py-4 w-12"></th>
                {isConsumer ? (
                  <>
                    <th className="px-6 py-4">{t.billing.contractMeter}</th>
                    <th className="px-6 py-4">{t.billing.strategyWeight}</th>
                    <th className="px-6 py-4">{t.billing.actualUsage}</th>
                    <th className="px-6 py-4 text-right">{t.billing.monthlyTargetTransfer} / {t.billing.allocatedGreen}</th>
                    <th className="px-6 py-4 text-right">{t.billing.reAchievementRate}</th>
                  </>
                ) : (
                  <>
                    <th className="px-6 py-4">{t.billing.contractPlant}</th>
                    <th className="px-6 py-4">{t.billing.totalCapacityType}</th>
                    <th className="px-6 py-4 text-right">{t.billing.estActualGen}</th>
                    <th className="px-6 py-4 text-right">{t.billing.capacityAchievementRate}</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {details.contracts.map((contract: any) => (
                <React.Fragment key={contract.id}>
                  {/* Level 1: Contract */}
                  <tr 
                    onClick={() => toggleRow(contract.id)}
                    className="group cursor-pointer hover:bg-gray-50/80 transition-colors"
                  >
                    <td className="px-8 py-5">
                      <div className={cn("transition-transform duration-300", expandedRows.has(contract.id) ? "rotate-90" : "")}>
                        <ChevronRight size={18} className="text-gray-400 group-hover:text-[#9CB13A]" />
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-gray-900">{contract.name}</span>
                        <span className="text-[10px] text-gray-400 font-bold font-mono uppercase tracking-tighter">{contract.id}</span>
                      </div>
                    </td>
                    {isConsumer && (
                      <td className="px-6 py-5">
                        <span className={cn(
                          "px-3 py-1 text-[10px] font-black rounded-full border tracking-widest",
                          contract.strategy === t.billing.costOptimized ? "bg-[#06B6D4]/10 text-[#06B6D4] border-[#06B6D4]/20" : "bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20"
                        )}>
                          {contract.strategy}
                        </span>
                      </td>
                    )}
                    <td className="px-6 py-5">
                      {isConsumer ? (
                        <span className="text-sm font-black text-gray-900">{formatEnergy(contract.meters.reduce((a:any,m:any)=>a+m.actualUsage,0))}</span>
                      ) : (
                        <span className="px-3 py-1 text-[10px] font-black rounded-full border bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20">
                          {t.billing.totalCapacityLabel.replace('{count}', formatPower(contract.capacity || 0))}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex flex-col items-end">
                        {isConsumer ? (
                          <>
                            <span className="text-sm font-black text-gray-700">
                              {formatEnergy(contract.estGeneration || 0)} / {formatEnergy(contract.totalAllocated || 0)}
                            </span>
                            <span className={cn(
                              "text-[10px] font-black mt-1",
                              ((contract.totalAllocated || 0) / (contract.estGeneration || 1) * 100) >= 100 ? "text-[#1DD793]" : "text-rose-500"
                            )}>
                              {t.billing.capacityAchievement}: {((contract.totalAllocated || 0) / (contract.estGeneration || 1) * 100).toFixed(1)}%
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="text-sm font-black text-gray-700">
                              {formatEnergy(contract.actualGeneration || 0)}
                            </span>
                            <span className="text-[10px] text-gray-400 font-bold">{t.billing.est}{formatEnergy(contract.estGeneration || 0)}</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <span className={cn("text-sm font-black", (isConsumer ? contract.reRate : (contract.actualGeneration/contract.estGeneration*100)) < 80 ? "text-rose-500" : "text-[#1DD793]")}>
                        {isConsumer ? contract.reRate : (contract.actualGeneration/contract.estGeneration*100).toFixed(1)}%
                      </span>
                    </td>
                  </tr>

                  {/* Level 2: Meters/Plants */}
                  <AnimatePresence>
                    {expandedRows.has(contract.id) && (isConsumer ? (contract.meters || []) : (contract.plants || [])).map((item: any) => (
                      <React.Fragment key={item.id}>
                        <motion.tr 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          onClick={() => toggleRow(item.id)}
                          className={cn(
                            "bg-gray-50/30 cursor-pointer hover:bg-gray-100/50 transition-colors border-l-4",
                            isConsumer ? "border-[#3B82F6]/20" : "border-[#F59E0B]/20"
                          )}
                        >
                          <td className="px-8 py-4 pl-12">
                            <div className={cn("transition-transform duration-300", expandedRows.has(item.id) ? "rotate-90" : "")}>
                              <ChevronRight size={16} className="text-gray-400" />
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-gray-700">{item.name}</span>
                              <span className="text-[9px] text-gray-400 font-mono">{item.id}</span>
                            </div>
                          </td>
                          {isConsumer && (
                            <td className="px-6 py-4">
                              <span className="text-gray-300 ml-2">-</span>
                            </td>
                          )}
                          <td className="px-6 py-4">
                            <span className="text-[10px] font-bold text-gray-500">
                              {isConsumer ? formatEnergy(item.actualUsage || 0) : `${t.billing.equipmentType}: ${item.type}`}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex flex-col items-end">
                              <span className="text-xs font-bold text-gray-600">
                                {isConsumer 
                                  ? `${formatEnergy(item.estGeneration || 0)} / ${formatEnergy(item.allocatedGreen || 0)}` 
                                  : `${formatEnergy(item.actualGeneration || 0)} / ${formatEnergy(item.monthlyTarget || 0)}`}
                              </span>
                              {isConsumer && (
                                <span className={cn(
                                  "text-[10px] font-black",
                                  ((item.allocatedGreen || 0) / (item.estGeneration || 1) * 100) >= 100 ? "text-[#1DD793]" : "text-rose-500"
                                )}>
                                  {t.billing.capacityAchievement}: {((item.allocatedGreen || 0) / (item.estGeneration || 1) * 100).toFixed(1)}%
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className={cn(
                              "text-xs font-black", 
                              isConsumer ? "text-gray-700" : (item.achievement < 80 ? "text-rose-500" : "text-[#1DD793]")
                            )}>
                              {isConsumer ? (item.allocatedGreen/item.actualUsage*100).toFixed(1) : item.achievement}%
                            </span>
                          </td>
                        </motion.tr>

                        {/* Level 3: Daily Details */}
                        <AnimatePresence>
                          {expandedRows.has(item.id) && (
                            <motion.tr
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                            >
                              <td colSpan={isConsumer ? 6 : 5} className="p-0">
                                <div className="px-20 py-2 bg-white border-y border-gray-50">
                                  <div className="overflow-hidden rounded-2xl border border-gray-100 shadow-inner bg-gray-50/10">
                                    {isConsumer ? (
                                      <ConsumerHourlyChart 
                                        item={item} 
                                        globalSelectedDate={selectedDate} 
                                        setGlobalSelectedDate={setSelectedDate} 
                                        t={t} 
                                      />
                                    ) : (
                                      <table className="w-full text-left">
                                        <thead className="sticky top-0 bg-gray-50 z-10">
                                          <tr className="text-[9px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                                            <th className="px-6 py-3">{t.billing.date}</th>
                                            <th className="px-6 py-3 text-right">{t.billing.actualMonthlyGeneration}</th>
                                            <th className="px-6 py-3 text-right">{t.billing.actualMatchedTransfer}</th>
                                            <th className="px-6 py-3 text-right">{t.billing.matchingDifference}</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                          {item.dailyDetails.map((day: any) => {
                                            const isSurplus = day.diff >= 0;
                                            return (
                                              <tr key={day.day} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-6 py-3 text-[10px] font-bold text-gray-500">{day.date}</td>
                                                <td className="px-6 py-3 text-[10px] font-bold text-gray-700 text-right">{formatEnergy(day.actual || 0)}</td>
                                                <td className="px-6 py-3 text-[10px] font-black text-sky-400 text-right">{formatEnergy(day.matched || 0)}</td>
                                                <td className={cn("px-6 py-3 text-[10px] font-black text-right", isSurplus ? "text-[#1DD793]" : "text-rose-500")}>
                                                  {isSurplus ? `+${formatEnergy(Math.abs(day.diff))}` : `-${formatEnergy(Math.abs(day.diff))}`}
                                                </td>
                                              </tr>
                                            );
                                          })}
                                        </tbody>
                                      </table>
                                    )}
                                  </div>
                                </div>
                              </td>
                            </motion.tr>
                          )}
                        </AnimatePresence>
                      </React.Fragment>
                    ))}
                  </AnimatePresence>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Billing;
