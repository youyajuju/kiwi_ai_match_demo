
import { Seller, Buyer, EnergyType, IndustryType, Contract, AIStrategy, MeterMonitoringData, MeterStatus, EnergyNode, EnergyLink, NodeType, MeterConfig, Client, ContractStatus, User, AccountStatus } from './types';

// Helper to generate random date in 2024
const randomDate = (start: Date, end: Date) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString().split('T')[0];
};

// --- 1. Generate Raw Contracts & Clients ---
const generateGlobalData = () => {
  const contracts: Contract[] = [];
  const monitoringMeters: MeterMonitoringData[] = [];
  const clients: Client[] = [];

  // 1.1 Generate 1 Energy Generator (Seller)
  const generatorName = '屏東大武太陽能案場';
  const genVat = '20000001';
  const genCapacity = 14000; // Adjusted for 6:4 ratio (Total Supply 24MW)
  
  const genMeter: MeterConfig = {
    taipowerId: '99011234567',
    displayName: `${generatorName} #1 饋線`,
    rate: 4.5,
    basePrice: 4.5,
    wheelingChargeType: 'perUnit',
    wheelingChargeValue: 0.5,
    recFee: 0.1,
    serviceFeeType: 'perUnit',
    serviceFeeValue: 900,
    pmi: 100,
    annualTargetKwh: genCapacity * 1000, // 14,000,000 kWh
    estimatedGeneration: genCapacity * 1000 // Adjusted to 1000h to match 6:4 ratio volume
  };

  const genContract: Contract = {
    id: 'KiWi_GE_2025_001',
    name: `${generatorName} 購電合約`,
    type: 'purchase', // From platform perspective, we buy from generator
    companyName: generatorName,
    vatNumber: genVat,
    startDate: '2025-01-01',
    endDate: '2035-12-31',
    supplyStartDate: '2025-01-01',
    contactName: '張案場',
    contactPhone: '0912345678',
    contactEmail: 'gen@energy.com',
    agreedCapacity: genCapacity, // kW
    status: ContractStatus.VALID,
    meters: [genMeter],
    totalCapacity: genCapacity,
    purchaseSaleCapacity: genCapacity,
    renewableType: 'solar',
    equipmentType: 'type1',
    pmi: 100,
    annualTransferLimit: genCapacity * 1000,
    annualAgreedSupplyDemand: genCapacity * 1000 // 14,000,000 kWh
  };

  contracts.push(genContract);
  clients.push({
    vatNumber: genVat,
    name: generatorName,
    type: 'generator',
    address: '屏東縣大武路 100 號',
    contact: { name: '張負責', phone: '08-765-4321', email: 'gen@energy.com' },
    status: 'normal',
    contracts: [genContract]
  });

  // Add generator meter to monitoring
  monitoringMeters.push({
    id: `m-gen-0`,
    taipowerId: genMeter.taipowerId,
    displayName: genMeter.displayName,
    category: '售電', // It's a generator, so it sells to us
    customerName: generatorName,
    contractId: genContract.id,
    status: MeterStatus.ACTIVE,
    actualKwh: Math.floor(genMeter.estimatedGeneration! * 0.85),
    targetKwh: genMeter.estimatedGeneration!,
    cumulativeActualKwh: Math.floor(genMeter.estimatedGeneration! * 0.85 * 2.5),
    cumulativeTargetKwh: genMeter.estimatedGeneration! * 3,
    lastUpdate: '2026-03-12 10:00:00',
    hasActiveContract: true,
    hasFutureContract: false,
    hadPastContract: false,
    isManuallyPaused: false
  });

  // 1.1.2 Generate 2nd Energy Generator (Wind)
  const generatorName2 = '苗栗通霄風力發電廠';
  const genVat2 = '20000002';
  const genCapacity2 = 10000; // Total Supply = 14000 + 10000 = 24000
  
  const genMeter2: MeterConfig = {
    taipowerId: '99022334455',
    displayName: `${generatorName2} #1 饋線`,
    rate: 4.2,
    basePrice: 4.2,
    wheelingChargeType: 'perUnit',
    wheelingChargeValue: 0.5,
    recFee: 0.1,
    serviceFeeType: 'perUnit',
    serviceFeeValue: 1200,
    pmi: 100,
    annualTargetKwh: 10000000, // 10,000,000 kWh
    estimatedGeneration: 10000000
  };

  const genContract2: Contract = {
    id: 'KiWi_GE_2025_002',
    name: `${generatorName2} 購電合約`,
    type: 'purchase',
    companyName: generatorName2,
    vatNumber: genVat2,
    startDate: '2025-01-01',
    endDate: '2035-12-31',
    supplyStartDate: '2025-01-01',
    contactName: '林負責',
    contactPhone: '0933123456',
    contactEmail: 'wind@energy.com',
    agreedCapacity: genCapacity2,
    status: ContractStatus.VALID,
    meters: [genMeter2],
    totalCapacity: genCapacity2,
    purchaseSaleCapacity: genCapacity2,
    renewableType: 'wind',
    equipmentType: 'type1',
    pmi: 100,
    annualTransferLimit: 10000000,
    annualAgreedSupplyDemand: 10000000 // 10,000,000 kWh
  };

  contracts.push(genContract2);
  clients.push({
    vatNumber: genVat2,
    name: generatorName2,
    type: 'generator',
    address: '苗栗縣通霄鎮濱海路 1 號',
    contact: { name: '林負責', phone: '037-123-456', email: 'wind@energy.com' },
    status: 'normal',
    contracts: [genContract2]
  });

  monitoringMeters.push({
    id: `m-gen-1`,
    taipowerId: genMeter2.taipowerId,
    displayName: genMeter2.displayName,
    category: '售電',
    customerName: generatorName2,
    contractId: genContract2.id,
    status: MeterStatus.ACTIVE,
    actualKwh: Math.floor(genMeter2.estimatedGeneration! * 0.8),
    targetKwh: genMeter2.estimatedGeneration!,
    cumulativeActualKwh: Math.floor(genMeter2.estimatedGeneration! * 0.8 * 2.4),
    cumulativeTargetKwh: genMeter2.estimatedGeneration! * 3,
    lastUpdate: '2026-03-12 10:30:00',
    hasActiveContract: true,
    hasFutureContract: false,
    hadPastContract: false,
    isManuallyPaused: false
  });

  // 1.2 Generate 1 Retail Consumer (Buyer)
  const consumerName = '全家便利商店 (股)公司';
  const conVat = '50000001';
  const conCapacity = 8000; // Adjusted for 6:4 ratio (Total Demand 16MW)
  
  const conMeters: MeterConfig[] = Array.from({ length: 15 }, (_, i) => ({
    taipowerId: `001122334${Math.floor(i/10)}${i%10}`,
    displayName: `${consumerName} 門市 #${i + 1}`,
    rate: 5.5,
    basePrice: 5.5,
    wheelingChargeType: 'perUnit',
    wheelingChargeValue: 0.32,
    recFee: 0.1,
    serviceFeeType: 'fixed',
    serviceFeeValue: 3000,
    annualTargetKwh: 800000, // 800,000 kWh per store
    strategy: AIStrategy.RE_PRIORITY,
    agreedPurchaseAmount: 800000,
    taipowerContractId: `1-11402-08-${1000 + i}`,
    contractCapacity: 80,
    peakDemand: 75,
    powerFactor: 98,
    electricityType: '3段時間',
    adjustmentFactor: 1,
    isSummer: true
  }));

  const conContract: Contract = {
    id: 'KiWi_CU_2025_001',
    name: `${consumerName} 售電合約`,
    type: 'sale', // From platform perspective, we sell to consumer
    companyName: consumerName,
    vatNumber: conVat,
    startDate: '2025-01-01',
    endDate: '2026-12-31',
    supplyStartDate: '2025-02-01',
    contactName: '王經理',
    contactPhone: '0987654321',
    contactEmail: 'con@retail.com',
    agreedCapacity: 12000, // kW
    purchaseSaleCapacity: 12000,
    status: ContractStatus.VALID,
    meters: conMeters,
    annualTransferLimit: 12000000, // 12,000,000 kWh total (Sum of 15 meters * 800,000)
    annualAgreedSupplyDemand: 12000000,
    aiStrategy: AIStrategy.COST_OPTIMIZED
  };

  contracts.push(conContract);
  clients.push({
    vatNumber: conVat,
    name: consumerName,
    type: 'consumer',
    address: '台北市信義區忠孝東路五段 1 號',
    contact: { name: '王經理', phone: '02-8888-1111', email: 'con@retail.com' },
    status: 'normal',
    contracts: [conContract]
  });

  // Add consumer meters to monitoring
  conMeters.forEach((m, i) => {
    monitoringMeters.push({
      id: `m-con-${i}`,
      taipowerId: m.taipowerId,
      displayName: m.displayName,
      category: '購電', // It's a consumer, so it buys from us
      customerName: consumerName,
      contractId: conContract.id,
      status: i === 3 ? MeterStatus.PAUSED : i === 7 ? MeterStatus.PENDING_APPLICATION : MeterStatus.ACTIVE,
      actualKwh: Math.floor(m.agreedPurchaseAmount! * (0.7 + Math.random() * 0.3)),
      targetKwh: m.agreedPurchaseAmount!,
      cumulativeActualKwh: Math.floor(m.agreedPurchaseAmount! * (0.7 + Math.random() * 0.3) * 2.2),
      cumulativeTargetKwh: m.agreedPurchaseAmount! * 3,
      lastUpdate: '2026-03-12 11:30:00',
      isManuallyPaused: i === 3,
      isAbnormal: i === 1,
      hasActiveContract: i !== 7,
      hasFutureContract: i === 7 || i === 5,
      hadPastContract: i === 3 || i === 0
    });
  });

  // 1.3 Generate Nitori Consumer (Buyer)
  const ikeaName = '宜得利家居 (Nitori) 台灣';
  const ikeaVat = '50000002';
  const ikeaStores = ['敦北店', '新莊店', '桃園店', '台中店', '高雄店'];
  
  const ikeaMeters: MeterConfig[] = ikeaStores.map((store, i) => ({
    taipowerId: `0022334455${i}`,
    displayName: `${ikeaName} ${store}`,
    rate: 5.2,
    basePrice: 5.2,
    wheelingChargeType: 'perUnit',
    wheelingChargeValue: 0.32,
    recFee: 0.1,
    serviceFeeType: 'fixed',
    serviceFeeValue: 5000,
    annualTargetKwh: 1600000, // 1.6 GWh per store
    strategy: AIStrategy.RE_PRIORITY,
    agreedPurchaseAmount: 1600000,
    taipowerContractId: `2-22503-09-${2000 + i}`,
    contractCapacity: 200,
    peakDemand: 180,
    powerFactor: 99,
    electricityType: '2段時間',
    adjustmentFactor: 1,
    isSummer: true
  }));

  const ikeaContract: Contract = {
    id: 'KiWi_CU_2025_002',
    name: `${ikeaName} 綠電採購合約`,
    type: 'sale',
    companyName: ikeaName,
    vatNumber: ikeaVat,
    startDate: '2025-02-01',
    endDate: '2030-01-31',
    supplyStartDate: '2025-03-01',
    contactName: '李經理',
    contactPhone: '0933445566',
    contactEmail: 'energy@ikea.tw',
    agreedCapacity: 8000, // kW
    purchaseSaleCapacity: 8000,
    status: ContractStatus.VALID,
    meters: ikeaMeters,
    annualTransferLimit: 8000000, // 8,000,000 kWh total (Sum of 5 meters * 1,600,000)
    annualAgreedSupplyDemand: 8000000,
    aiStrategy: AIStrategy.RE_PRIORITY
  };

  contracts.push(ikeaContract);
  clients.push({
    vatNumber: ikeaVat,
    name: ikeaName,
    type: 'consumer',
    address: '新北市新莊區中正路 1 號',
    contact: { name: '李經理', phone: '02-2276-5388', email: 'energy@ikea.tw' },
    status: 'normal',
    contracts: [ikeaContract]
  });

  ikeaMeters.forEach((m, i) => {
    monitoringMeters.push({
      id: `m-ikea-${i}`,
      taipowerId: m.taipowerId,
      displayName: m.displayName,
      category: '購電',
      customerName: ikeaName,
      contractId: ikeaContract.id,
      status: MeterStatus.ACTIVE,
      actualKwh: Math.floor(m.agreedPurchaseAmount! * (0.8 + Math.random() * 0.2)),
      targetKwh: m.agreedPurchaseAmount!,
      cumulativeActualKwh: Math.floor(m.agreedPurchaseAmount! * (0.8 + Math.random() * 0.2) * 2.8),
      cumulativeTargetKwh: m.agreedPurchaseAmount! * 3,
      lastUpdate: '2026-03-12 11:45:00',
      hasActiveContract: true,
      hasFutureContract: false,
      hadPastContract: true,
      isManuallyPaused: false
    });
  });

  return { contracts, monitoringMeters, clients };
};

const { contracts, monitoringMeters, clients } = generateGlobalData();

// Add special cases for status demonstration
if (clients.length > 2) {
  // Pending Contract for FamilyMart
  const pendingMeters: MeterConfig[] = Array.from({ length: 5 }, (_, i) => ({
    taipowerId: `0011223355${i}`,
    displayName: `全家 2026 預計增購門市 #${i + 1}`,
    rate: 5.8,
    basePrice: 5.8,
    annualTargetKwh: 1000000, // 1 GWh per store
    agreedPurchaseAmount: 1000000,
    strategy: AIStrategy.RE_PRIORITY
  }));

  clients[2].contracts.push({
    id: 'C-2026-PENDING',
    name: '全家 2026 綠電增購合約',
    type: 'sale',
    companyName: clients[2].name,
    vatNumber: clients[2].vatNumber,
    startDate: '2026-06-01',
    endDate: '2036-06-01',
    supplyStartDate: '2026-07-01',
    contactName: '王經理',
    contactPhone: '0912345678',
    contactEmail: 'con@retail.com',
    agreedCapacity: 5000, // kW
    purchaseSaleCapacity: 5000,
    status: ContractStatus.VALID,
    annualTransferLimit: 5000000, // 5 GWh total
    annualAgreedSupplyDemand: 5000000,
    meters: pendingMeters
  });

  // Expiring Soon Contract for FamilyMart
  const soonMeters: MeterConfig[] = Array.from({ length: 2 }, (_, i) => ({
    taipowerId: `0011223366${i}`,
    displayName: `全家 2024 續約門市 #${i + 1}`,
    rate: 5.4,
    basePrice: 5.4,
    annualTargetKwh: 1000000, // 1 GWh per store
    agreedPurchaseAmount: 1000000,
    strategy: AIStrategy.RE_PRIORITY
  }));

  clients[2].contracts.push({
    id: 'C-2026-SOON',
    name: '全家 2024 舊案續約合約',
    type: 'sale',
    companyName: clients[2].name,
    vatNumber: clients[2].vatNumber,
    startDate: '2024-01-01',
    endDate: '2026-05-01',
    supplyStartDate: '2024-02-01',
    contactName: '王經理',
    contactPhone: '0987654321',
    contactEmail: 'con@retail.com',
    agreedCapacity: 2000, // kW
    purchaseSaleCapacity: 2000,
    status: ContractStatus.VALID,
    annualTransferLimit: 2000000, // 2 GWh total
    annualAgreedSupplyDemand: 2000000,
    meters: soonMeters
  });

  // Expired Contract for FamilyMart
  clients[2].contracts.push({
    id: 'C-2025-EXPIRED',
    name: '全家 2023 歷史測試案',
    type: 'sale',
    companyName: clients[2].name,
    vatNumber: clients[2].vatNumber,
    startDate: '2023-01-01',
    endDate: '2025-12-31',
    supplyStartDate: '2023-02-01',
    contactName: '王經理',
    contactPhone: '0900111222',
    contactEmail: 'con@retail.com',
    agreedCapacity: 1500, // kW
    purchaseSaleCapacity: 1500,
    status: ContractStatus.EXPIRED,
    meters: []
  });

  // Terminated Contract for IKEA
  clients[3].contracts.push({
    id: 'C-2026-TERMINATED',
    name: '宜家 2024 提前終止模擬案',
    type: 'sale',
    companyName: clients[3].name,
    vatNumber: clients[3].vatNumber,
    startDate: '2024-01-01',
    endDate: '2026-04-15',
    supplyStartDate: '2024-02-01',
    contactName: '李經理',
    contactPhone: '0933445566',
    contactEmail: 'energy@ikea.tw',
    agreedCapacity: 3000,
    purchaseSaleCapacity: 3000,
    status: ContractStatus.TERMINATED,
    terminationReason: '客戶倒閉',
    meters: []
  });
}

export const INITIAL_CONTRACTS = contracts;
export const MONITORED_METERS = monitoringMeters;
export const INITIAL_CLIENTS = clients;

// --- Derived Data ---
export const SELLERS: Seller[] = INITIAL_CONTRACTS
  .filter(c => c.type === 'purchase')
  .map(c => ({
    id: c.id,
    name: c.companyName,
    type: c.renewableType === '風力發電' ? EnergyType.GENERAL : EnergyType.SOLAR,
    capacity: c.agreedCapacity,
    currentGeneration: c.agreedCapacity * 0.85
  }));

export const BUYERS: Buyer[] = INITIAL_CONTRACTS
  .filter(c => c.type === 'sale')
  .map(c => ({
    id: c.id,
    name: c.companyName,
    industry: (c.companyName.includes('全家') || c.companyName.includes('IKEA')) ? IndustryType.RETAIL : IndustryType.MANUFACTURING,
    contractCapacity: c.agreedCapacity,
    re100Target: c.companyName.includes('IKEA') ? 100 : 80,
    status: 'normal'
  }));

// --- Sankey Data (Using top 4 sellers and top 4 buyers for visual clarity) ---
export const SANKEY_NODES: EnergyNode[] = [
  ...SELLERS.slice(0, 4).map(s => ({ id: s.id, label: s.name, type: NodeType.GENERATOR })),
  ...BUYERS.slice(0, 4).map(b => ({ id: b.id, label: b.name, type: NodeType.CONSUMER })),
  { id: 'GRID', label: '台電電網 (備援)', type: NodeType.GRID },
];

export const SANKEY_LINKS: EnergyLink[] = [];

if (SELLERS.length > 0 && BUYERS.length > 0) {
  // Total Supply: 24,000 (14,000 + 10,000)
  // Total Demand: 16,000 (8,000 + 8,000)
  
  // FamilyMart (BUYERS[0]) - 8,000 Demand
  SANKEY_LINKS.push({ source: SELLERS[0].id, target: BUYERS[0].id, value: 5000, strategy: AIStrategy.COST_OPTIMIZED });
  SANKEY_LINKS.push({ source: SELLERS[1].id, target: BUYERS[0].id, value: 3000, strategy: AIStrategy.COST_OPTIMIZED });
  
  // IKEA (BUYERS[1]) - 8,000 Demand
  if (BUYERS.length > 1) {
    SANKEY_LINKS.push({ source: SELLERS[0].id, target: BUYERS[1].id, value: 5000, strategy: AIStrategy.RE_PRIORITY });
    if (SELLERS.length > 1) {
      SANKEY_LINKS.push({ source: SELLERS[1].id, target: BUYERS[1].id, value: 3000, strategy: AIStrategy.RE_PRIORITY });
    }
  }
  
  // Surplus Supply (24,000 total supply - 16,000 total demand = 8,000 surplus)
  // The remaining 4,000 from Seller 0 and 4,000 from Seller 1 are surplus (not shown in links to buyers)
}

if (BUYERS.length > 0) {
  // In a 6:4 surplus scenario, Grid backup is 0 or minimal
  SANKEY_LINKS.push({ source: 'GRID', target: BUYERS[0].id, value: 0, strategy: AIStrategy.COST_OPTIMIZED });
}

// --- Historical Data ---
export const HISTORICAL_EXECUTION_DATA = Array.from({ length: 30 }, (_, i) => {
  const day = i + 1;
  // 2026/04/01 is Wednesday (3)
  const dayOfWeek = (3 + i) % 7; 
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // 0: Sun, 6: Sat
  
  // Base demand varies by day of week
  const baseDemand = isWeekend ? (dayOfWeek === 0 ? 8000 : 11000) : 16000;
  const scheduled = baseDemand + (Math.random() - 0.5) * 2000;
  
  // Actual demand has some noise
  const actual = scheduled + (Math.random() - 0.5) * 1500;
  
  // Supply (Solar/Wind) - 6:4 ratio on average, but with weather variation
  // Every 4-5 days we have a "cloudy" or "low wind" day
  const weatherFactor = (Math.sin(i * 0.8) > 0.7) ? 0.6 : (0.9 + Math.random() * 0.2);
  const supply = 24000 * weatherFactor + (Math.random() - 0.5) * 2000;
  
  return {
    date: `04/${day.toString().padStart(2, '0')}`,
    buyerActual: Math.max(2000, actual),
    buyerScheduled: scheduled,
    sellerActual: -Math.max(2000, supply),
    sellerPredicted: -24000,
    buyerBias: ((actual - scheduled) / scheduled * 100).toFixed(1),
    sellerBias: (Math.random() * 5).toFixed(1)
  };
});

export const HISTORICAL_PROFIT_DATA = Array.from({ length: 30 }, (_, i) => ({
  date: `04/${i + 1}`,
  rePriority: 20000 + Math.random() * 10000,
  costOptimized: 15000 + Math.random() * 15000,
}));

export const INITIAL_USERS: User[] = [
  {
    id: 'U001',
    username: '系統管理員',
    email: 'admin@kiwi.com',
    status: AccountStatus.ENABLED,
    department: '能源開發部',
    lastLogin: '2026-03-13 08:00:00'
  },
  {
    id: 'U002',
    username: '張小明',
    email: 'ming@kiwi.com',
    status: AccountStatus.ENABLED,
    department: '維運部',
    lastLogin: '2026-03-12 15:30:00'
  },
  {
    id: 'U003',
    username: '李大華',
    email: 'hua@kiwi.com',
    status: AccountStatus.DISABLED,
    department: '業務部',
    lastLogin: '2026-03-10 10:20:00'
  },
  {
    id: 'U004',
    username: '王小美',
    email: 'mei@kiwi.com',
    status: AccountStatus.LOCKED,
    department: '財務部',
    lastLogin: '2026-03-11 09:45:00'
  }
];
