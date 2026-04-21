
export enum EnergyType {
  SOLAR = '光電',
  GENERAL = '綠電',
  LOW_CARBON = '低碳電力'
}

export enum IndustryType {
  SEMICONDUCTOR = '半導體',
  IC_DESIGN = 'IC 設計',
  REAL_ESTATE = '房地產',
  TESTING = '封測',
  MANUFACTURING = '製造業',
  RETAIL = '零售業'
}

export enum AIStrategy {
  RE_PRIORITY = 'RE 最優先',
  COST_OPTIMIZED = '成本最優化'
}

export enum MeterStatus {
  PENDING_APPLICATION = '待申請轉供',
  PENDING_ACTIVE = '待生效',
  ACTIVE = '正常轉供中',
  PAUSED = '人工暫停',
  HISTORICAL_UNLOAD = '已失效',
  ABNORMAL = '電號異常'
}

export enum NodeType {
  GENERATOR = 'GENERATOR',
  CONSUMER = 'CONSUMER',
  GRID = 'GRID'
}

export interface EnergyNode {
  id: string;
  label: string;
  type: NodeType;
}

export interface EnergyLink {
  source: string;
  target: string;
  value: number;
  strategy: AIStrategy;
}

export interface MeterMonitoringData {
  id: string;
  taipowerId: string;
  displayName: string;
  category: '購電' | '售電';
  customerName: string;
  contractId: string;
  status: MeterStatus;
  actualKwh: number;
  targetKwh: number;
  cumulativeActualKwh?: number;
  cumulativeTargetKwh?: number;
  lastUpdate: string;
  isManuallyPaused?: boolean;
  hasActiveContract?: boolean;
  hasFutureContract?: boolean;
  hadPastContract?: boolean;
  isAbnormal?: boolean;
}

export interface MonthlyTarget {
  month: number; // 1-12
  value: number;
}

export interface MeterConfig {
  taipowerId: string;
  meterNumber?: string; // 表號
  displayName: string;
  address?: string; // 用電地址
  rate: number; // NTD/kWh (Legacy/Base)
  
  // Flexible Rate Fields
  basePrice?: number; // 綠電本體電價
  wheelingChargeType?: 'perUnit' | 'fixed'; // 台電轉供費類型
  wheelingChargeValue?: number; // 台電轉供費數值
  recFee?: number; // 再生能源憑證費 (per unit)
  serviceFeeType?: 'perUnit' | 'fixed'; // 設備與系統服務費類型
  serviceFeeValue?: number; // 設備與系統服務費數值

  // Taipower Parameters (Section 3)
  taipowerContractId?: string; // 台電契約編號
  contractCapacity?: number; // 契約容量 (kW)
  peakDemand?: number; // 最高需量 (kW)
  powerFactor?: number; // 功率因數 (%)
  electricityType?: string; // 用電種類 (e.g., 3段時間)
  adjustmentFactor?: number; // 調整係數
  isSummer?: boolean; // 夏月/非夏月

  // Purchase specific
  annualTransferLimit?: number; 
  strategy?: AIStrategy;
  agreedPurchaseAmount?: number;
  // Sale specific
  pmi?: number;
  estimatedGeneration?: number;

  // New fields for Step 2 & 3
  annualTargetKwh?: number; // 年度約定目標量 (kWh)
  monthlyTargets?: MonthlyTarget[]; // 月度目標拆分
  renewableType?: string; // 再生能源類型
  equipmentType?: 'type1' | 'type2' | 'type3'; // 發電設備類型
}

export interface Seller {
  id: string;
  name: string;
  type: EnergyType;
  capacity: number; // kW
  currentGeneration: number; // kW
}

export interface Buyer {
  id: string;
  name: string;
  industry: IndustryType;
  contractCapacity: number; // kW
  re100Target: number; // percentage
  status: 'normal' | 'error' | 'warning';
}

export interface Client {
  vatNumber: string;
  name: string;
  type: 'generator' | 'consumer';
  address: string;
  contact: {
    name: string;
    phone: string;
    email: string;
  };
  status: 'normal' | 'abnormal';
  contracts: Contract[];
}

export enum ContractStatus {
  VALID = '生效中',
  EXPIRING = '即將到期',
  EXPIRED = '已到期',
  TERMINATED = '提前終止'
}

export interface Contract {
  id: string;
  name: string;
  type: 'purchase' | 'sale'; // 購電 (進貨/發電端) vs 售電 (銷貨/用電端)
  companyName: string;
  vatNumber: string;
  address?: string; // 登記地址
  startDate: string;
  endDate: string;
  supplyStartDate?: string; // 電能供應起始日
  autoRenewalReminder?: boolean; // 90日前續約警示
  
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  contactDept?: string; // 聯絡部門/職稱
  
  // Generation Parameters (Section 2)
  generationSite?: string; // 發電場址
  generationMeterId?: string; // 發電電號
  approvalId?: string; // 同意備案字號
  totalCapacity?: number; // 總裝置容量 (kW)
  renewableType?: string; // 再生能源類型
  compensationBase?: number; // 價差補償基準 (元/度)
  
  // Transaction Parameters
  equipmentType?: 'type1' | 'type2' | 'type3'; // 發電設備類型
  purchaseSaleCapacity?: number; // 購售電容量 (kW)
  pmi?: number; // 轉供比例 (%)
  annualTransferLimit?: number; // 年度約定轉供電量 (度)
  annualAgreedSupplyDemand?: number; // 年度約定供需量 (度)
  guaranteedPurchaseRatio?: number; // 保證收購比例 (%)
  aiStrategy?: AIStrategy;
  baseRate?: number; // 費率 (NTD/度)
  recFeeEnabled?: boolean; // 再生能源憑證規費
  wheelingFeeEnabled?: boolean; // 台電轉供規費
  recFee?: number; // 再生能源憑證費
  wheelingChargeType?: 'perUnit' | 'fixed' | 'actual'; // 台電轉供費類型
  wheelingChargeValue?: number; // 台電轉供費數值
  
  // Billing
  billingCycle?: string;
  paymentDeadline?: string;
  performanceBond?: number; // 履約保證金 (萬元)
  
  // Attachments (Storage paths or filenames)
  attachments?: {
    required1?: string; // 發電設備證明/用電計畫書
    required2?: string; // 設備說明/用電場所範圍圖
    required3?: string; // 供電計畫書 (購電必填)
    optional?: string; // 實體合約掃描檔
  };
  
  agreedCapacity: number; // kW (Calculated or main capacity)
  meters: MeterConfig[];
  status: ContractStatus;
  terminationReason?: string;
}

export enum AccountStatus {
  ENABLED = '啟用',
  DISABLED = '停用',
  LOCKED = '鎖定'
}

export interface User {
  id: string;
  username: string;
  email: string;
  status: AccountStatus;
  department?: string;
  lastLogin?: string;
  password?: string;
}
