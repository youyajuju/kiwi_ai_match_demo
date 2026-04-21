
import React, { useState, useMemo, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { sankey as d3Sankey, sankeyLinkHorizontal, sankeyCenter } from 'd3-sankey';
import { 
  Zap, 
  Clock, 
  Activity, 
  TrendingUp, 
  Calendar,
  Sun,
  Moon,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Info,
  ArrowUpRight,
  TrendingDown,
  BarChart3,
  X,
  ArrowRight,
  Cpu,
  Target,
  Layers,
  History,
  Download,
  Maximize2,
  RefreshCw,
  Settings,
  Search
} from 'lucide-react';
import { 
  ComposedChart,
  Line,
  BarChart, 
  Bar, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  Legend,
  ReferenceLine
} from 'recharts';
import { 
  INITIAL_CONTRACTS,
  MONITORED_METERS, 
  HISTORICAL_EXECUTION_DATA,
  HISTORICAL_PROFIT_DATA
} from '../mockData';
import { NodeType, AIStrategy, MeterStatus } from '../types';
import { useLanguage } from '../LanguageContext';
import { formatEnergy } from '../utils/contractUtils';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utility for Tailwind classes ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Sankey Component with Interaction ---
interface SankeyProps {
  nodes: any[];
  links: any[];
  onLinkClick: (link: any) => void;
  formattedTime: string;
}

const SankeyDiagram: React.FC<SankeyProps> = ({ nodes, links, onLinkClick, formattedTime }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [hoveredLink, setHoveredLink] = useState<any | null>(null);

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;
    const margin = { top: 40, right: 260, bottom: 40, left: 260 };

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const sankey = d3Sankey()
      .nodeId((d: any) => d.id)
      .nodeWidth(16)
      .nodePadding(60)
      .nodeAlign(sankeyCenter)
      .nodeSort((a: any, b: any) => {
         // Ensure B-OTHER is strictly placed at the bottom
         if (a.id === 'B-OTHER') return 1;
         if (b.id === 'B-OTHER') return -1;
         // For all other nodes in the same column, sort by matching value descending
         return (b.value || 0) - (a.value || 0);
      })
      .extent([[0, 0], [innerWidth, innerHeight]]);

    const sellerColor = "#F59E0B";
    const consumerColor = "#3B82F6";
    const gridColor = "#94a3b8";

    const data = {
      nodes: nodes.map(d => ({ ...d })),
      links: links.map(l => ({ ...l }))
    };

    try {
      const { nodes: sNodes, links: sLinks } = sankey(data as any);

      // Fix links targeting B-OTHER so they converge exactly to its center
      const otherNode = sNodes.find((n: any) => n.id === 'B-OTHER');
      if (otherNode) {
          const otherCenterY = (otherNode.y0 + otherNode.y1) / 2;
          sLinks.forEach((link: any) => {
              if (link.target.id === 'B-OTHER') {
                  link.y1 = otherCenterY;
              }
          });
      }

      const defs = svg.append("defs");
      sLinks.forEach((link: any, i: number) => {
        const gradientId = `grad-${i}`;
        const gradient = defs.append("linearGradient")
          .attr("id", gradientId)
          .attr("gradientUnits", "userSpaceOnUse")
          .attr("x1", link.source.x1)
          .attr("x2", link.target.x0);

        const color = link.source?.id === 'GRID' ? gridColor : sellerColor;
        let targetColor = consumerColor;
        if (link.target?.id === 'B-OTHER') targetColor = "#94a3b8";
        else if (link.target?.isSearched) targetColor = "#8B5CF6";

        gradient.append("stop").attr("offset", "0%").attr("stop-color", color).attr("stop-opacity", 0.15);
        gradient.append("stop").attr("offset", "100%").attr("stop-color", targetColor).attr("stop-opacity", 0.4);
      });

      const link = g.append("g")
        .attr("fill", "none")
        .selectAll("path")
        .data(sLinks)
        .join("path")
        .attr("d", sankeyLinkHorizontal())
        .attr("stroke", (d: any, i: number) => `url(#grad-${i})`)
        .attr("stroke-width", (d: any) => {
           if (d.target?.id === 'B-OTHER') return Math.max(1.5, Math.min(8, d.width * 0.15));
           return Math.max(2, d.width);
        })
        .attr("class", "cursor-pointer transition-all duration-300")
        .attr("stroke-dasharray", (d: any) => d.target?.id === 'B-OTHER' ? "4 4" : "none")
        .attr("stroke-opacity", (d: any) => d.target?.id === 'B-OTHER' ? 0.3 : 0.5)
        .on("mouseenter", (e, d: any) => {
          setHoveredLink(d);
          link.style("stroke-opacity", (l: any) => {
            if (l === d) return 0.9;
            return l.target?.id === 'B-OTHER' ? 0.05 : 0.15;
          });
        })
        .on("mouseleave", () => {
          setHoveredLink(null);
          link.style("stroke-opacity", (l: any) => l.target?.id === 'B-OTHER' ? 0.3 : 0.5);
        })
        .on("click", (e, d) => onLinkClick(d));

      const node = g.append("g")
        .selectAll("g")
        .data(sNodes)
        .join("g")
        .attr("class", "cursor-pointer")
        .on("mouseenter", (e, d: any) => {
          setHoveredNode(d.id);
          link.style("stroke-opacity", (l: any) => 
            (l.source?.id === d.id || l.target?.id === d.id) ? 1 : 0.1
          );
        })
        .on("mouseleave", () => {
          setHoveredNode(null);
          link.style("stroke-opacity", 0.6);
        });

      node.filter((d: any) => d.id !== 'B-OTHER')
        .append("rect")
        .attr("x", (d: any) => d.x0)
        .attr("y", (d: any) => d.y0)
        .attr("height", (d: any) => Math.max(6, d.y1 - d.y0))
        .attr("width", (d: any) => d.x1 - d.x0)
        .attr("fill", (d: any) => {
          if (d.id === 'GRID') return gridColor;
          if (d.isSearched) return "#8B5CF6";
          if (d.type === NodeType.GENERATOR) return sellerColor;
          return consumerColor;
        })
        .attr("rx", 4);

      node.filter((d: any) => d.id === 'B-OTHER')
        .append("circle")
        .attr("cx", (d: any) => d.x0 + (d.x1 - d.x0) / 2)
        .attr("cy", (d: any) => (d.y0 + d.y1) / 2)
        .attr("r", 5)
        .attr("fill", "#94a3b8");

      node.append("text")
        .attr("x", (d: any) => d.x0 < innerWidth / 2 ? -15 : d.x1 + 15)
        .attr("y", (d: any) => (d.y1 + d.y0) / 2 - 12)
        .attr("text-anchor", (d: any) => d.x0 < innerWidth / 2 ? "end" : "start")
        .attr("fill", (d: any) => d.isSearched ? "#8B5CF6" : "#54585a")
        .attr("class", "text-[10px] font-black pointer-events-none")
        .text((d: any) => d.displayName || d.companyName || d.label);

      node.append("text")
        .attr("x", (d: any) => d.x0 < innerWidth / 2 ? -15 : d.x1 + 15)
        .attr("y", (d: any) => (d.y1 + d.y0) / 2 + 2)
        .attr("text-anchor", (d: any) => d.x0 < innerWidth / 2 ? "end" : "start")
        .attr("fill", (d: any) => d.id === 'B-OTHER' ? "transparent" : (d.isSearched ? "#A78BFA" : "#94a3b8"))
        .attr("class", "text-[9px] font-mono font-bold pointer-events-none")
        .text((d: any) => d.label);

      node.append("text")
        .attr("x", (d: any) => d.x0 < innerWidth / 2 ? -15 : d.x1 + 15)
        .attr("y", (d: any) => (d.y1 + d.y0) / 2 + 16)
        .attr("text-anchor", (d: any) => d.x0 < innerWidth / 2 ? "end" : "start")
        .attr("fill", (d: any) => {
           if (d.id === 'GRID') return gridColor;
           if (d.id === 'B-OTHER') return "#94a3b8";
           if (d.isSearched) return "#8B5CF6";
           return d.type === NodeType.GENERATOR ? sellerColor : consumerColor;
        })
        .attr("class", "text-[10px] font-mono font-bold pointer-events-none")
        .text((d: any) => formatEnergy(Math.round(d.value)));

    } catch (err) {
      console.warn("Sankey render error:", err);
    }
  }, [nodes, links]);

  return <svg ref={svgRef} className="w-full h-full" />;
};

// --- Main Matching Component ---
const LoadingOverlay = ({ message }: { message: string }) => (
  <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-[50] flex flex-col items-center justify-center animate-in fade-in duration-300 rounded-[inherit]">
    <div className="w-10 h-10 border-4 border-[#9CB13A]/20 border-t-[#9CB13A] rounded-full animate-spin mb-4"></div>
    <p className="text-xs font-black text-gray-400 uppercase tracking-widest animate-pulse">{message}</p>
  </div>
);

const Matching: React.FC = () => {
  const { t, language } = useLanguage();
  const [timeStep, setTimeStep] = useState(48);

  const taiwanTime = useMemo(() => {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    return new Date(utc + (3600000 * 8));
  }, []);

  const currentMonthStr = useMemo(() => {
    return `${taiwanTime.getFullYear()}-${(taiwanTime.getMonth() + 1).toString().padStart(2, '0')}`;
  }, [taiwanTime]);

  const nextMonthStr = useMemo(() => {
    const d = new Date(taiwanTime);
    d.setMonth(d.getMonth() + 1);
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
  }, [taiwanTime]);

  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const analysisMonthOptions = useMemo(() => {
    const options = [];
    const d = new Date(taiwanTime);
    // Start from previous month (since current month is not settled)
    d.setMonth(d.getMonth() - 1);
    
    // For now, based on user request, we only show the most recent settled month
    // if they want to see older ones, we can increase this, but they said "only have 2026/02"
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    options.push(`${year}/${month}`);
    
    // Optionally keep one more for variety, or just one as requested.
    // Let's stick to one if they were very specific, but usually 2-3 is better.
    // The user said "只會有 2026/02 這樣" which might mean they only expect the latest.
    return options;
  }, [taiwanTime]);

  const [selectedAnalysisMonth, setSelectedAnalysisMonth] = useState(analysisMonthOptions[0]);

  const comparisonMonth = useMemo(() => {
    const [year, month] = selectedAnalysisMonth.split('/').map(Number);
    const d = new Date(year, month - 2, 1); // month is 1-indexed, so month-1 is current, month-2 is previous
    return `${d.getFullYear()}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
  }, [selectedAnalysisMonth]);

  const isHistorical = useMemo(() => {
    return selectedMonth < currentMonthStr;
  }, [selectedMonth, currentMonthStr]);

  const lastSyncTime = useMemo(() => {
    if (selectedMonth > currentMonthStr) return '2026/02/05 03:00';
    if (selectedMonth === currentMonthStr) {
      return `${taiwanTime.getFullYear()}/${(taiwanTime.getMonth() + 1).toString().padStart(2, '0')}/${taiwanTime.getDate().toString().padStart(2, '0')} 03:00`;
    }
    const [year, month] = selectedMonth.split('-');
    return `${year}/${month}/05 03:00`;
  }, [selectedMonth, currentMonthStr, taiwanTime]);

  const nextMatchingDate = useMemo(() => {
    const next = new Date(taiwanTime);
    next.setMonth(next.getMonth() + 1);
    next.setDate(1);
    return `${next.getFullYear()}/${(next.getMonth() + 1).toString().padStart(2, '0')}/01`;
  }, [taiwanTime]);

  const [selectedDate, setSelectedDate] = useState(`${taiwanTime.getFullYear()}-${(taiwanTime.getMonth() + 1).toString().padStart(2, '0')}-${taiwanTime.getDate().toString().padStart(2, '0')}`);

  // Sync analysis month and date with global selector
  useEffect(() => {
    // Only sync analysis month if the selected month is strictly in the past (already settled)
    if (selectedMonth < currentMonthStr) {
      setSelectedAnalysisMonth(selectedMonth.replace('-', '/'));
    }
    
    // Update selectedDate to the first day of the selected month if it's not the current month
    if (selectedMonth !== currentMonthStr) {
      setSelectedDate(`${selectedMonth}-01`);
    } else {
      // If it is current month, reset to today
      setSelectedDate(`${taiwanTime.getFullYear()}-${(taiwanTime.getMonth() + 1).toString().padStart(2, '0')}-${taiwanTime.getDate().toString().padStart(2, '0')}`);
    }
  }, [selectedMonth, currentMonthStr, taiwanTime]);

  const daysInMonth = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    return new Date(year, month, 0).getDate();
  }, [selectedMonth]);

  const selectedDay = useMemo(() => {
    return selectedDate.split('-')[2];
  }, [selectedDate]);

  const handleDayChange = (day: string) => {
    setSelectedDate(`${selectedMonth}-${day.padStart(2, '0')}`);
  };

  // Simulate data loading when month changes
  useEffect(() => {
    setIsPageLoading(true);
    const timer = setTimeout(() => {
      setIsPageLoading(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, [selectedMonth]);

  const isDataMissing = useMemo(() => selectedMonth === '2025-12', [selectedMonth]);

  const timeContext = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const currentYear = taiwanTime.getFullYear();
    const currentMonth = taiwanTime.getMonth() + 1;
    
    if (year === currentYear && month === currentMonth) {
      return { type: 'realtime', label: t.matching.realTimeMonitoring, color: 'bg-emerald-500' };
    }
    
    if (selectedMonth > currentMonthStr) {
      return { type: 'future', label: t.matching.statusWaiting, color: 'bg-emerald-500' };
    }
    
    const diffMonths = (currentYear - year) * 12 + (currentMonth - month);
    if (diffMonths >= 5) {
      return { type: 'historical', label: t.matching.fiveMonthsAgo, color: 'bg-blue-500' };
    }
    
    return { type: 'archive', label: t.matching.historicalArchive, color: 'bg-blue-500' };
  }, [selectedMonth, taiwanTime, t, currentMonthStr]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeAnalysisTab, setActiveAnalysisTab] = useState<'execution' | 'profit'>('execution');
  const [searchMeterId, setSearchMeterId] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedPath, setSelectedPath] = useState<any>(null);
  const [isDataAbnormal, setIsDataAbnormal] = useState(false);
  const [ignoreAbnormal, setIgnoreAbnormal] = useState(false);
  const [isMatchingRunning, setIsMatchingRunning] = useState(false);

  const searchResults = useMemo(() => {
    if (!searchMeterId.trim()) return [];
    const query = searchMeterId.toLowerCase().trim();
    return MONITORED_METERS.filter(m => 
      m.taipowerId.toLowerCase().includes(query) || 
      m.customerName.toLowerCase().includes(query)
    ).slice(0, 5); // 顯示前5筆建議
  }, [searchMeterId]);

  const coverageRate = useMemo(() => {
    const normalMeters = MONITORED_METERS.filter(m => m.status === MeterStatus.ACTIVE).length;
    return ((normalMeters / MONITORED_METERS.length) * 100).toFixed(1);
  }, []);

  const hour = useMemo(() => timeStep / 4, [timeStep]);
  const formattedTime = useMemo(() => {
    const totalMinutes = timeStep * 15;
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }, [timeStep]);

  const solarEfficiency = useMemo(() => {
    if (hour < 6.5 || hour > 17.5) return 0;
    return Math.max(0, Math.exp(-Math.pow(hour - 12.5, 2) / 8));
  }, [hour]);

  const sankeyData = useMemo(() => {
    const rawSellerMeters = MONITORED_METERS.filter(m => m.category === '售電');
    const rawBuyerMeters = MONITORED_METERS.filter(m => m.category === '購電');
    
    // Default matching logic incorporates all sellers and buyers realistically
    const topSellers = rawSellerMeters;
    const topBuyers = rawBuyerMeters;
    
    let rawNodes: any[] = [];
    let rawLinks: any[] = [];

    topSellers.forEach(m => rawNodes.push({ id: `S-${m.taipowerId}`, label: `${m.taipowerId}`, companyName: m.customerName, displayName: m.displayName, type: NodeType.GENERATOR }));
    topBuyers.forEach(m => rawNodes.push({ id: `B-${m.taipowerId}`, label: `${m.taipowerId}`, companyName: m.customerName, displayName: m.displayName, type: NodeType.CONSUMER }));

    topBuyers.forEach(buyer => {
      const historicalFactor = isHistorical ? 1.05 : 1;
      const baseDemand = (buyer.targetKwh / 96) * historicalFactor;
      const demandFactor = 0.8 + Math.sin((hour / 24) * Math.PI) * 0.4;
      let remainingDemand = baseDemand * demandFactor;
      
      if (solarEfficiency > 0) {
        topSellers.forEach(seller => {
          if (remainingDemand <= 0) return;
          const availableSolar = (seller.targetKwh / 96) * solarEfficiency * 1.6;
          const matchAmount = Math.min(remainingDemand, availableSolar / 2.5);
          if (matchAmount > 10) {
            rawLinks.push({ source: `S-${seller.taipowerId}`, target: `B-${buyer.taipowerId}`, value: matchAmount, strategy: AIStrategy.RE_PRIORITY });
            remainingDemand -= matchAmount;
          }
        });
      }
    });

    const exactSearchId = searchMeterId.trim();
    let searchedNodeId: string | null = null;
    
    if (exactSearchId) {
        const found = rawNodes.find(n => n.label.includes(exactSearchId));
        if (found) searchedNodeId = found.id;
    }

    const MAX_NODES = 15;
    let displayNodes = [...rawNodes];
    let displayLinks = [...rawLinks];
    
    const buyerNodes = displayNodes.filter(n => n.type === NodeType.CONSUMER);
    
    const buyerAmounts = new Map<string, number>();
    displayLinks.forEach(l => {
        const current = buyerAmounts.get(l.target) || 0;
        buyerAmounts.set(l.target, current + l.value);
    });
    
    const sortedBuyers = [...buyerNodes].sort((a, b) => {
        const amountA = buyerAmounts.get(a.id) || 0;
        const amountB = buyerAmounts.get(b.id) || 0;
        return amountB - amountA;
    });

    let displayedTopBuyers = sortedBuyers.slice(0, MAX_NODES);
    let otherBuyers = sortedBuyers.slice(MAX_NODES);

    if (searchedNodeId) {
        let nodeInTop = displayedTopBuyers.find(b => b.id === searchedNodeId);
        if (nodeInTop) {
            nodeInTop.isSearched = true;
        } else {
            const searchIndexInOther = otherBuyers.findIndex(b => b.id === searchedNodeId);
            if (searchIndexInOther !== -1) {
                const [searchedNode] = otherBuyers.splice(searchIndexInOther, 1);
                searchedNode.isSearched = true;
                displayedTopBuyers.push(searchedNode);
            }
        }
        
        const sellerInList = displayNodes.find(n => n.id === searchedNodeId && n.type === NodeType.GENERATOR);
        if (sellerInList) sellerInList.isSearched = true;
    }

    const otherBuyerIds = new Set(otherBuyers.map(b => b.id));
    let otherBuyersCount = otherBuyers.length;
    let otherBuyersAmount = 0;

    displayNodes = [
        ...displayNodes.filter(n => n.type !== NodeType.CONSUMER),
        ...displayedTopBuyers
    ];
    
    const newLinks: any[] = [];
    const otherLinksMap = new Map<string, number>();
    
    displayLinks.forEach(l => {
        if (otherBuyerIds.has(l.target)) {
            otherBuyersAmount += l.value;
            const current = otherLinksMap.get(l.source) || 0;
            otherLinksMap.set(l.source, current + l.value);
        } else {
            newLinks.push(l);
        }
    });

    if (otherBuyersCount > 0 && otherBuyersAmount > 0) {
        displayNodes.push({
            id: 'B-OTHER',
            label: '其他未顯示',
            companyName: `其他 ${otherBuyersCount} 個用電戶`,
            displayName: '其他用電戶',
            type: NodeType.CONSUMER
        });

        otherLinksMap.forEach((val, source) => {
            if (val > 0) {
                newLinks.push({ source, target: 'B-OTHER', value: val, strategy: AIStrategy.RE_PRIORITY });
            }
        });
    }

    displayLinks = newLinks;

    const activeNodeIds = new Set<string>();
    displayLinks.forEach(l => {
        activeNodeIds.add(l.source);
        activeNodeIds.add(l.target);
    });
    
    displayNodes = displayNodes.filter(n => n.type === NodeType.CONSUMER || activeNodeIds.has(n.id) || n.id === searchedNodeId || n.isSearched);

    return { nodes: displayNodes, links: displayLinks, otherBuyersCount, otherBuyersAmount };
  }, [searchMeterId, solarEfficiency, hour, isHistorical, t]);

  // --- New Execution Summary Logic ---
  const executionSummary = useMemo(() => {
    const aiTotal = HISTORICAL_EXECUTION_DATA.reduce((acc, d) => acc + d.buyerScheduled, 0);
    const actualTotal = HISTORICAL_EXECUTION_DATA.reduce((acc, d) => acc + d.buyerActual, 0);
    const diff = actualTotal - aiTotal;
    return {
      aiTotal: Math.round(aiTotal),
      actualTotal: Math.round(actualTotal),
      diff: Math.round(diff),
      status: diff >= 0 ? 'surplus' : 'gap'
    };
  }, []);

  const strategyWeights = useMemo(() => {
    const total = INITIAL_CONTRACTS.length;
    if (total === 0) return { re: 50, cost: 50 };
    const reCount = INITIAL_CONTRACTS.filter(c => c.aiStrategy === AIStrategy.RE_PRIORITY).length;
    const rePercent = Math.round((reCount / total) * 100);
    return { re: rePercent, cost: 100 - rePercent };
  }, []);

  const totalProfit = useMemo(() => {
    return HISTORICAL_PROFIT_DATA.reduce((acc, d) => acc + d.rePriority + d.costOptimized, 0);
  }, []);

  const totalMonthlyPoints = useMemo(() => {
    // 96 points/day * 30 days = 2880 points/month per meter
    const points = MONITORED_METERS.length * 2880;
    if (points >= 1000000) return `${(points / 1000000).toFixed(1)}M+`;
    if (points >= 1000) return `${(points / 1000).toFixed(0)}K+`;
    return points.toString();
  }, []);

  const [visibleSeries, setVisibleSeries] = useState({
    demand: true,
    supply: true,
    gap: true
  });

  const handleLegendClick = (o: any) => {
    const { dataKey } = o;
    setVisibleSeries(prev => ({
      ...prev,
      [dataKey]: !prev[dataKey as keyof typeof prev]
    }));
  };

  const [showGrid, setShowGrid] = useState(true);

  const CustomMatchingTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const [year, month] = selectedAnalysisMonth.split('/');
      
      return (
        <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-gray-100 shadow-2xl min-w-[240px] space-y-3">
          <div className="border-b border-gray-50 pb-2">
            <p className="text-[11px] font-black text-gray-400 uppercase tracking-wider">
              {year}年 {month}月 {data.day}日
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]" />
                <span className="text-[10px] font-bold text-gray-500">實際達成總轉供量</span>
              </div>
              <span className="text-[11px] font-black font-mono text-gray-900">{formatEnergy(data.demand)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
                <span className="text-[10px] font-bold text-gray-500">實際發電量</span>
              </div>
              <span className="text-[11px] font-black font-mono text-gray-900">{formatEnergy(data.supply)}</span>
            </div>

            <div className="pt-2 border-t border-gray-50 flex justify-between items-center">
              <span className="text-[10px] font-black text-gray-400 uppercase">匹配分析</span>
              <span className={`text-[11px] font-black font-mono ${data.gap >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {data.gap >= 0 ? '匹配餘電' : '匹配缺口'} {data.gap > 0 ? '+' : ''}{formatEnergy(data.gap)}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const matchingTrendData = useMemo(() => {
    const [, month] = selectedAnalysisMonth.split('/');
    // Create more realistic data: demand follows a pattern, supply follows weather
    return Array.from({ length: 30 }, (_, i) => {
      const day = i + 1;
      const dayOfWeek = (3 + i) % 7; // 2026/02/01 is Sunday (0)
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      
      // Demand pattern: higher on weekdays, lower on weekends
      const baseDemand = isWeekend ? 6000 : 12000;
      const demand = baseDemand + Math.sin(i * 0.5) * 2000 + Math.random() * 1000;
      
      // Supply pattern: solar peaks mid-month, wind varies
      const supply = 10000 + Math.cos(i * 0.3) * 4000 + Math.random() * 2000;
      
      return {
        day,
        date: `${month}/${day.toString().padStart(2, '0')}`,
        demand: Math.round(demand),
        supply: Math.round(supply),
        gap: Math.round(supply - demand)
      };
    });
  }, [selectedAnalysisMonth]);

  const mirrorChartData = useMemo(() => {
    const [, month] = selectedAnalysisMonth.split('/');
    return HISTORICAL_EXECUTION_DATA.map(d => {
      const day = d.date.split('/')[1];
      return {
        ...d,
        date: `${month}/${day}`,
        buyerActual: Math.round(d.buyerActual),
        buyerScheduled: Math.round(d.buyerScheduled),
        sellerActualNeg: -Math.round(Math.abs(d.sellerActual)),
        sellerPredictedNeg: -Math.round(Math.abs(d.sellerPredicted))
      };
    });
  }, [selectedAnalysisMonth]);

  const profitChartData = useMemo(() => {
    const [, month] = selectedAnalysisMonth.split('/');
    return HISTORICAL_PROFIT_DATA.map(d => {
      const day = d.date.split('/')[1];
      return {
        ...d,
        date: `${month}/${day}`
      };
    });
  }, [selectedAnalysisMonth]);

  const diagnostic = useMemo(() => {
    const bias = parseFloat(HISTORICAL_EXECUTION_DATA[Math.floor(timeStep/4) % 30].buyerBias);
    if (bias < -5) return {
      type: 'gap',
      status: t.matching.diagnosticGapStatus.replace('{amount}', formatEnergy(Math.abs(Math.round(bias * 150)))),
      desc: t.matching.diagnosticGapDesc
    };
    if (bias > 2) return {
      type: 'surplus',
      status: t.matching.diagnosticSurplusStatus.replace('{amount}', formatEnergy(Math.round(bias * 80))),
      desc: t.matching.diagnosticSurplusDesc
    };
    return {
      type: 'normal',
      status: t.matching.diagnosticNormalStatus,
      desc: t.matching.diagnosticNormalDesc
    };
  }, [timeStep, t]);

  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setTimeStep(prev => (prev >= 95 ? 0 : prev + 1));
      }, 400);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <div className="space-y-8 pb-24 relative">
      {/* Top Selector Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4 bg-white px-6 py-3 rounded-2xl border border-gray-100 shadow-sm w-full sm:w-auto">
          <div className="flex items-center gap-2 text-[#9CB13A]">
            <Calendar size={18} />
            <span className="text-xs font-black uppercase tracking-widest">{t.matching.settlementMonth}</span>
          </div>
          <div className="h-6 w-px bg-gray-200"></div>
          <div className="relative flex-1 sm:flex-none">
            <select 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="appearance-none bg-gray-50/50 px-4 py-1.5 rounded-xl font-black text-gray-900 outline-none cursor-pointer text-sm pr-10 border border-gray-100 focus:border-[#9CB13A] transition-all w-full"
            >
              <option value={nextMonthStr}>{nextMonthStr.replace('-', ' / ')}</option>
              <option value={currentMonthStr}>{currentMonthStr.replace('-', ' / ')}</option>
              <option value="2026-02">2026 / 02</option>
              <option value="2026-01">2026 / 01</option>
              <option value="2025-12">2025 / 12</option>
              <option value="2025-11">2025 / 11</option>
              <option value="2025-10">2025 / 10</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#9CB13A]">
              <ArrowRight size={14} className="rotate-90" />
            </div>
          </div>
        </div>
      </div>

      {/* System Status Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/50 backdrop-blur-md px-6 py-3 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-2 h-2 rounded-full animate-pulse",
              timeContext.type === 'future' ? "bg-emerald-500" : 
              timeContext.type === 'realtime' ? "bg-emerald-500" : "bg-blue-500"
            )}></div>
            <span className="text-xs font-black text-gray-700">{timeContext.label}</span>
          </div>
          <div className="h-4 w-px bg-gray-200"></div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400">
            <Clock size={12} />
            <span>{t.matching.lastSync}：{lastSyncTime}</span>
          </div>
          <div className="h-4 w-px bg-gray-200"></div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400">
            <Calendar size={12} />
            <span>{t.matching.nextMatching}：{nextMatchingDate}</span>
          </div>
        </div>
        <button 
          onClick={() => setIsDataAbnormal(!isDataAbnormal)}
          className="text-[10px] font-black text-[#9CB13A] hover:underline"
        >
          [ 模擬{isDataAbnormal ? '正常' : '異常'}數據 ]
        </button>
      </div>

      {/* KPI Header Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
        {isPageLoading && <LoadingOverlay message={t.matching.loadingData} />}
        
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t.matching.totalContractScale}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-black text-[#54585a]">{INITIAL_CONTRACTS.length} <span className="text-sm font-bold text-gray-400">{t.matching.contractsUnit}</span></h3>
            <div className="px-2 py-0.5 bg-indigo-50 rounded-md border border-indigo-100">
              <span className="text-[9px] font-black text-indigo-600">{t.matching.dataPointsPerMonth.replace('{count}', totalMonthlyPoints.toString())}</span>
            </div>
          </div>
          <div className="flex gap-4 mt-2 text-[10px] font-bold">
            <span className="text-blue-500">{t.common.consumer} {INITIAL_CONTRACTS.filter(c => c.type === 'sale').length}</span>
            <span className="text-[#F59E0B]">{t.common.generator} {INITIAL_CONTRACTS.filter(c => c.type === 'purchase').length}</span>
          </div>
        </div>

        {/* Data Check Board (Replaces AI Coverage) */}
        <div className={`p-6 rounded-3xl border transition-all relative overflow-hidden ${isDataMissing ? 'bg-rose-50 border-rose-100 shadow-[0_0_20px_rgba(239,68,68,0.1)]' : isDataAbnormal ? 'bg-rose-50 border-rose-100' : 'bg-[#9CB13A]/5 border-[#9CB13A]/10'}`}>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{t.matching.aiCoverage}</p>
          
          {isDataMissing ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-rose-500">
                <AlertTriangle size={16} className="animate-pulse" />
                <span className="text-xs font-black uppercase tracking-widest">{t.matching.dataMissing}</span>
              </div>
              <div className="bg-white/80 rounded-xl p-3 border border-rose-100">
                <p className="text-[10px] font-bold text-rose-700 leading-relaxed">
                  {language === 'zh' 
                    ? '該月份尚未匯入台電結算數據，無法進行匹配模擬。請先至數據中心上傳結算報表。' 
                    : 'Settlement data for this month has not been imported. Simulation is unavailable. Please upload reports in Data Center.'}
                </p>
              </div>
            </div>
          ) : !isDataAbnormal ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[#10B981]">
                <CheckCircle2 size={16} />
                <span className="text-xs font-black">{t.matching.dataSynced}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black text-gray-700">{coverageRate}%</span>
                <div className="group relative">
                  <Info size={14} className="text-gray-300 cursor-help" />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-800 text-white text-[9px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                    {t.matching.calculationBase}
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-gray-400 font-bold">{t.matching.effectiveMeters.replace('{count}', MONITORED_METERS.filter(m => m.status === MeterStatus.ACTIVE).length.toString())}</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-rose-500">
                <AlertTriangle size={16} />
                <span className="text-xs font-black">{t.matching.dataAbnormal.replace('{count}', '1')}</span>
              </div>
              <div className="bg-white/50 rounded-xl p-2 border border-rose-100">
                <p className="text-[10px] font-mono font-bold text-rose-600">Meter ID: 00112233443</p>
                <button className="text-[9px] font-black text-blue-500 hover:underline flex items-center gap-1 mt-1">
                  <ArrowUpRight size={10} /> {t.matching.gotoMonitoring}
                </button>
              </div>
              
              <div className="pt-2 border-t border-rose-100">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${ignoreAbnormal ? 'bg-rose-500 border-rose-500' : 'bg-white border-rose-200 group-hover:border-rose-400'}`}>
                    <input 
                      type="checkbox" 
                      className="hidden" 
                      checked={ignoreAbnormal}
                      onChange={(e) => setIgnoreAbnormal(e.target.checked)}
                    />
                    {ignoreAbnormal && <CheckCircle2 size={10} className="text-white" />}
                  </div>
                  <span className="text-[9px] font-black text-rose-700 leading-tight">{t.matching.ignoreAbnormal}</span>
                </label>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t.matching.strategyWeight}</p>
          <div className="flex items-center gap-2 mt-3">
            <div className="h-3 bg-[#10B981] rounded-l-full" style={{flex: strategyWeights.re}}></div>
            <div className="h-3 bg-[#06B6D4] rounded-r-full" style={{flex: strategyWeights.cost}}></div>
          </div>
          <div className="flex justify-between text-[10px] font-black mt-1">
             <span className="text-[#10B981] flex items-center gap-1"><Zap size={10} /> {t.matching.rePriority} {strategyWeights.re}%</span>
             <span className="text-[#06B6D4] flex items-center gap-1"><TrendingDown size={10} /> {t.matching.costOptimization} {strategyWeights.cost}%</span>
          </div>
        </div>
      </div>

      {/* Main Allocation Diagram */}
      <div className="bg-white p-4 md:p-10 rounded-[2rem] md:rounded-[2.5rem] border border-gray-100 shadow-xl relative min-h-[600px] md:min-h-[720px]">
        {isPageLoading && <LoadingOverlay message={t.matching.loadingData} />}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 md:mb-12 gap-6">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-[#54585a] tracking-tight">{t.matching.allocationChart}</h2>
            <p className="text-xs md:text-sm text-gray-500 font-medium mt-1">{t.matching.subtitle}</p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 md:gap-6 bg-gray-50/50 p-4 rounded-2xl md:rounded-3xl border border-gray-100 w-full lg:w-auto">
            <div className="flex flex-col gap-1 w-full sm:w-auto">
              <label className="text-[9px] font-black text-gray-400 uppercase ml-1">{t.matching.selectDate}</label>
              <div className="relative flex items-center gap-2">
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CB13A]" size={14} />
                  <div className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-black text-[#54585a] flex items-center gap-2">
                    <span>{selectedMonth.replace('-', ' / ')} / </span>
                    <select 
                      value={selectedDay} 
                      onChange={(e) => handleDayChange(e.target.value)}
                      className="bg-transparent outline-none cursor-pointer hover:text-[#9CB13A] transition-colors"
                    >
                      {Array.from({ length: daysInMonth }, (_, i) => {
                        const day = (i + 1).toString().padStart(2, '0');
                        return <option key={day} value={day}>{day}</option>;
                      })}
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div className="hidden sm:block h-8 w-px bg-gray-200"></div>
            <div className="flex flex-col gap-1 w-full sm:w-auto">
              <label className="text-[9px] font-black text-gray-400 uppercase ml-1">搜尋電號</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <input 
                  type="text" 
                  value={searchMeterId}
                  onChange={(e) => {
                    setSearchMeterId(e.target.value);
                    setIsDropdownOpen(true);
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                  placeholder="輸入電號..."
                  className="w-full sm:w-48 pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-black text-[#54585a] outline-none hover:border-[#9CB13A] focus:border-[#9CB13A] transition-colors"
                />
                {isDropdownOpen && searchResults.length > 0 && (
                  <div className="absolute top-full mt-2 w-full bg-white border border-gray-100 shadow-2xl rounded-xl overflow-hidden z-[100]">
                    {searchResults.map(m => (
                      <button
                        key={m.taipowerId}
                        onClick={() => {
                          setSearchMeterId(m.taipowerId);
                          setIsDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 flex flex-col gap-1 border-b border-gray-50 last:border-0"
                      >
                        <span className="text-[11px] font-black text-gray-800 font-mono">{m.taipowerId}</span>
                        <span className="text-[10px] text-gray-400 font-bold">{m.customerName}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div 
          style={{ height: `${Math.max(460, Math.max(sankeyData.nodes.filter(n => n.type === NodeType.GENERATOR).length, sankeyData.nodes.filter(n => n.type === NodeType.CONSUMER).length) * 85)}px` }}
          className="w-full mb-8 relative overflow-x-auto no-scrollbar flex flex-col"
        >
          <div className="min-w-[800px] flex-1 pb-4">
            <SankeyDiagram nodes={sankeyData.nodes} links={sankeyData.links} onLinkClick={setSelectedPath} formattedTime={formattedTime} />
          </div>
          {selectedPath && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 bg-white/90 backdrop-blur-2xl p-4 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-gray-100 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] animate-in zoom-in-95 duration-200 z-[100]">
              <button onClick={() => setSelectedPath(null)} className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full"><X size={18} className="text-gray-400" /></button>
              <div className="flex items-center gap-3 mb-6"><div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Clock size={20} /></div><div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.matching.simulationDataPoint}</p><p className="text-sm font-black text-gray-900">{selectedDate} <span className="text-blue-600 ml-1">{formattedTime}</span></p></div></div>
              <div className="space-y-6">
                <div className="relative">
                  <div className="absolute left-3 top-0 bottom-0 w-px border-l border-dashed border-gray-200"></div>
                  <div className="relative flex items-start gap-6 mb-6"><div className="w-6 h-6 rounded-full bg-[#F59E0B] z-10 border-4 border-white shadow-sm"></div><div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.matching.generatorMeterId}</p><p className="text-xs font-black text-gray-800">{selectedPath.source.displayName || selectedPath.source.companyName}</p><p className="text-[10px] text-gray-400 font-mono">{selectedPath.source.label}</p></div></div>
                  <div className="relative flex items-start gap-6"><div className="w-6 h-6 rounded-full bg-[#3B82F6] z-10 border-4 border-white shadow-sm"></div><div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.matching.consumerMeterId}</p><p className="text-xs font-black text-gray-800">{selectedPath.target.displayName || selectedPath.target.companyName}</p><p className="text-[10px] text-gray-400 font-mono">{selectedPath.target.label}</p></div></div>
                </div>
                <div className="pt-6 border-t border-gray-100">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">分配量</p>
                  <p className="text-3xl font-black text-gray-900 tracking-tighter">
                    {formatEnergy(Math.round(selectedPath.value))}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-gray-900 p-4 md:p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-2xl relative overflow-hidden">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-6 md:gap-8 relative z-10">
            <div className="flex items-center gap-4 md:gap-8 w-full lg:w-auto">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl flex items-center gap-4 flex-1 lg:min-w-[180px]">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-xl flex items-center justify-center text-gray-900 shrink-0">
                  {solarEfficiency > 0 ? <Sun size={20} className="md:w-6 md:h-6" /> : <Moon size={20} className="md:w-6 md:h-6" />}
                </div>
                <div>
                  <p className="text-[9px] md:text-[10px] font-black text-white/50 uppercase tracking-widest">{t.matching.simulationPoint}</p>
                  <p className="text-xl md:text-2xl font-black text-white font-mono leading-none">{formattedTime}</p>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
              <button 
                onClick={() => setIsPlaying(!isPlaying)} 
                className={`w-full sm:w-auto px-8 md:px-10 py-3 md:py-4 rounded-2xl font-black text-sm transition-all ${isPlaying ? 'bg-red-500 text-white' : 'bg-[#9CB13A] text-white hover:scale-105'}`}
              >
                {isPlaying ? '暫停' : '播放'}
              </button>
              <div className="w-full sm:w-64">
                <input type="range" min="0" max="95" value={timeStep} onChange={(e) => setTimeStep(parseInt(e.target.value))} className="w-full h-2 bg-white/20 rounded-full appearance-none accent-[#9CB13A]" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Divider Section - AI Matching Historical Performance */}
      <div className="flex items-center gap-6 my-12">
        <div className="h-px bg-gray-200 flex-1"></div>
        <div className="flex items-center gap-3 px-6 py-2 bg-gray-50 rounded-full border border-gray-100">
          <History size={16} className="text-[#9CB13A]" />
          <span className="text-xs font-black text-[#54585a] uppercase tracking-widest">{t.matching.historicalPerformance}</span>
        </div>
        <div className="h-px bg-gray-200 flex-1"></div>
      </div>

      {/* Analytics Reference - Visualized Section */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden relative">
        {isPageLoading && <LoadingOverlay message={t.matching.loadingData} />}
        <div className="p-8 bg-gray-50/50 border-b border-gray-100 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white rounded-2xl shadow-sm"><BarChart3 size={24} className="text-[#9CB13A]" /></div>
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-black text-[#54585a]">{t.matching.analysisReport}</h3>
              </div>
              <p className="text-sm text-gray-500 font-medium">{t.matching.analysisReportDesc}</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex bg-white p-1 rounded-2xl border border-gray-100 shadow-sm mr-4">
              <button 
                onClick={() => setActiveAnalysisTab('execution')}
                className={cn(
                  "px-6 py-2 rounded-xl text-[11px] font-black transition-all uppercase tracking-wider",
                  activeAnalysisTab === 'execution' 
                    ? "bg-gray-900 text-white shadow-lg" 
                    : "text-gray-400 hover:text-gray-600"
                )}
              >
                {t.matching.executionAnalysis}
              </button>
              <button 
                onClick={() => setActiveAnalysisTab('profit')}
                className={cn(
                  "px-6 py-2 rounded-xl text-[11px] font-black transition-all uppercase tracking-wider",
                  activeAnalysisTab === 'profit' 
                    ? "bg-gray-900 text-white shadow-lg" 
                    : "text-gray-400 hover:text-gray-600"
                )}
              >
                {t.matching.profitAnalysis}
              </button>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-black text-gray-400 uppercase ml-1">{t.matching.reportMonth}</label>
              <select 
                value={selectedAnalysisMonth} 
                onChange={(e) => setSelectedAnalysisMonth(e.target.value)}
                className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-black text-[#54585a] outline-none shadow-sm"
              >
                {analysisMonthOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="p-10">
          {activeAnalysisTab === 'execution' ? (
            <div className="space-y-10 animate-in fade-in duration-500">
              {/* New KPI Row for Execution Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50/50 border border-blue-100 p-8 rounded-[2rem] flex flex-col justify-between">
                   <div className="flex items-center gap-3 text-blue-600 mb-4">
                      <Cpu size={20} />
                      <span className="text-[10px] font-black uppercase tracking-widest">{t.matching.scheduledUsage}</span>
                   </div>
                   <h3 className="text-3xl font-black text-blue-900 font-mono tracking-tighter">
                     {formatEnergy(executionSummary.aiTotal)}
                   </h3>
                </div>
                <div className="bg-[#9CB13A]/5 border border-[#9CB13A]/10 p-8 rounded-[2rem] flex flex-col justify-between">
                   <div className="flex items-center gap-3 text-[#9CB13A] mb-4">
                      <Target size={20} />
                      <span className="text-[10px] font-black uppercase tracking-widest">{t.matching.actualUsage}</span>
                   </div>
                   <h3 className="text-3xl font-black text-[#54585a] font-mono tracking-tighter">
                     {formatEnergy(executionSummary.actualTotal)}
                   </h3>
                </div>
                <div className={`p-8 rounded-[2rem] border flex flex-col justify-between ${executionSummary.status === 'surplus' ? 'bg-[#9CB13A]/10 border-[#9CB13A]/20' : 'bg-red-50 border-red-100'}`}>
                   <div className={`flex items-center gap-3 mb-4 ${executionSummary.status === 'surplus' ? 'text-[#9CB13A]' : 'text-red-500'}`}>
                      <Layers size={20} />
                      <span className="text-[10px] font-black uppercase tracking-widest">
                        {executionSummary.status === 'surplus' ? t.matching.resultSurplus : t.matching.resultGap}
                      </span>
                   </div>
                   <div className="flex items-end gap-2">
                     <h3 className={`text-3xl font-black font-mono tracking-tighter ${executionSummary.status === 'surplus' ? 'text-[#54585a]' : 'text-red-900'}`}>
                       {formatEnergy(Math.abs(executionSummary.diff))}
                     </h3>
                     {executionSummary.status === 'surplus' ? <ArrowUpRight className="text-[#9CB13A] mb-1" /> : <TrendingDown className="text-red-500 mb-1" />}
                   </div>
                </div>
              </div>

              {/* Supply-Demand Matching Trend Chart */}
              <div className="bg-white rounded-[2rem] border border-gray-50 p-6">
                <div className="flex justify-between items-center mb-6">
                  <h4 className="text-sm font-black text-gray-700 uppercase tracking-wider">
                    {t.matching.supplyDemandMatchingTrend}
                  </h4>
                </div>
                <div className="h-[440px] relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart 
                      data={matchingTrendData} 
                      margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" hide={!showGrid} />
                      <XAxis 
                        dataKey="day" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fontSize: 10, fontWeight: 'bold'}}
                        label={{ value: t.common.date, position: 'insideBottomRight', offset: -10, style: { fontSize: '10px', fontWeight: 'bold', fill: '#94a3b8' } }}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fontSize: 10}}
                        label={{ value: 'kWh', angle: -90, position: 'insideLeft', style: { fontSize: '10px', fontWeight: 'bold', fill: '#94a3b8' } }}
                      />
                      <Legend 
                        verticalAlign="top" 
                        align="right" 
                        iconType="circle" 
                        onClick={handleLegendClick}
                        wrapperStyle={{paddingBottom: '30px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', cursor: 'pointer'}} 
                      />
                      
                      <RechartsTooltip 
                        content={<CustomMatchingTooltip />} 
                        cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '5 5' }}
                      />

                      <Line 
                        type="monotone" 
                        dataKey="demand" 
                        name={t.matching.actualUsage} 
                        stroke="#3B82F6" 
                        strokeWidth={3} 
                        dot={false}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                        hide={!visibleSeries.demand}
                      />
                      
                      <Line 
                        type="monotone" 
                        dataKey="supply" 
                        name={t.matching.actualGeneration} 
                        stroke="#F59E0B" 
                        strokeWidth={3} 
                        dot={false}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                        hide={!visibleSeries.supply}
                      />
                      
                      <ReferenceLine y={0} stroke="#cbd5e1" strokeWidth={1} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-10 animate-in fade-in duration-500">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm relative group">
                     <div className="flex items-center gap-2 mb-1">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.matching.estTotalProfit}</p>
                        <div className="relative">
                          <Info size={12} className="text-gray-300 cursor-help" />
                          <div className="absolute left-0 bottom-full mb-2 w-64 p-3 bg-gray-900 text-white text-[10px] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl leading-relaxed whitespace-pre-line">
                            {t.matching.estTotalProfitInfo}
                          </div>
                        </div>
                     </div>
                     <h3 className="text-3xl font-black text-[#54585a] tracking-tight">NT$ {(totalProfit || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</h3>
                     <p className="text-[10px] text-[#9CB13A] font-bold mt-2">{t.matching.profitGrowth}</p>
                  </div>
                  <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-center">
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">{t.matching.profitContribution}</p>
                     <div className="flex items-center gap-1">
                        <div className="h-6 bg-[#10B981] rounded-l-lg" style={{flex: strategyWeights.re}}></div>
                        <div className="h-6 bg-[#06B6D4] rounded-r-lg" style={{flex: strategyWeights.cost}}></div>
                     </div>
                     <div className="flex justify-between text-[10px] font-black mt-2"><span className="text-[#10B981]">{t.matching.rePriority} ({strategyWeights.re}%)</span><span className="text-[#06B6D4]">{t.matching.costOptimization} ({strategyWeights.cost}%)</span></div>
                  </div>
               </div>
               <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={profitChartData}>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                       <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                       <YAxis 
                         axisLine={false} 
                         tickLine={false} 
                         tick={{fontSize: 10}} 
                         label={{ value: t.matching.profitUnit, angle: -90, position: 'insideLeft', style: { fontSize: '10px', fontWeight: 'bold', fill: '#94a3b8' } }}
                       />
                       <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'}} formatter={(val: number) => 'NT$ ' + (Math.round(val || 0)).toLocaleString()} />
                       <Legend iconType="circle" wrapperStyle={{paddingTop: '20px', fontSize: '10px', fontWeight: 'bold'}} />
                       <Bar dataKey="rePriority" name={t.matching.rePriority} stackId="profit" fill="#10B981" />
                       <Bar dataKey="costOptimized" name={t.matching.costOptimization} stackId="profit" fill="#06B6D4" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
               </div>
               <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-gray-50/50 rounded-3xl border border-gray-100">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#10B981]" />
                      <span className="text-[11px] font-black text-gray-900 uppercase tracking-wider">{t.matching.rePriority}</span>
                    </div>
                    <p className="text-[10px] text-gray-500 leading-relaxed font-medium">
                      {t.matching.rePriorityFormula}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#06B6D4]" />
                      <span className="text-[11px] font-black text-gray-900 uppercase tracking-wider">{t.matching.costOptimization}</span>
                    </div>
                    <p className="text-[10px] text-gray-500 leading-relaxed font-medium">
                      {t.matching.costOptimizationFormula}
                    </p>
                  </div>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Matching;
