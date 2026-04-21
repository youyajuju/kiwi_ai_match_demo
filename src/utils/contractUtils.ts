import { Contract, ContractStatus } from '../types';

/**
 * 判定合約狀態邏輯 (Contract Status Logic)
 * 1. 🟢 生效中 (Valid): 當下日期介於合約起訖日之間
 * 2. 🟡 即將到期 (Expiring): 當下日期距離到期日 90 天內
 * 3. ⚫ 已到期 (Expired): 當下日期 > 合約到期日
 * 4. 🔴 提前終止 (Terminated): 人工手動標記
 */
export const calculateContractStatus = (contract: Contract, systemDateStr: string): ContractStatus => {
  // 提前終止 (Terminated) > 【人工手動】
  if (contract.status === ContractStatus.TERMINATED) {
    return ContractStatus.TERMINATED;
  }

  const today = new Date(systemDateStr);
  const start = new Date(contract.startDate);
  const end = new Date(contract.endDate);

  // 已到期 (Expired)
  if (today > end) {
    return ContractStatus.EXPIRED;
  }

  // 即將到期 (Expiring)
  const diffTime = end.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 90 && diffDays >= 0) {
    return ContractStatus.EXPIRING;
  }

  // 生效中 (Valid)
  return ContractStatus.VALID;
};

export const getStatusColor = (status: ContractStatus) => {
  switch (status) {
    case ContractStatus.VALID: return 'bg-[#1DD793]/10 text-[#1DD793]';
    case ContractStatus.EXPIRING: return 'bg-red-50 text-red-600';
    case ContractStatus.EXPIRED: return 'bg-gray-100 text-gray-500';
    case ContractStatus.TERMINATED: return 'bg-orange-50 text-orange-600';
    default: return 'bg-gray-100 text-gray-500';
  }
};

export const getStatusDotColor = (status: ContractStatus) => {
  switch (status) {
    case ContractStatus.VALID: return 'bg-[#1DD793]';
    case ContractStatus.EXPIRING: return 'bg-red-500';
    case ContractStatus.EXPIRED: return 'bg-gray-400';
    case ContractStatus.TERMINATED: return 'bg-orange-500';
    default: return 'bg-gray-300';
  }
};

/**
 * 格式化電量單位 (kWh -> MWh)
 * 當數值超過 1,000 時自動進位
 */
export const formatEnergy = (kwh: number, precision: number = 1): string => {
  const absKwh = Math.abs(kwh);
  if (absKwh >= 1000000) {
    return `${(kwh / 1000000).toLocaleString(undefined, { minimumFractionDigits: precision, maximumFractionDigits: precision })} GWh`;
  }
  if (absKwh >= 1000) {
    return `${(kwh / 1000).toLocaleString(undefined, { minimumFractionDigits: precision, maximumFractionDigits: precision })} MWh`;
  }
  return `${kwh.toLocaleString()} kWh`;
};

/**
 * 格式化功率單位 (kW -> MW)
 * 當數值超過 1,000 時自動進位
 */
export const formatPower = (kw: number, precision: number = 1): string => {
  const absKw = Math.abs(kw);
  if (absKw >= 1000) {
    return `${(kw / 1000).toLocaleString(undefined, { minimumFractionDigits: precision, maximumFractionDigits: precision })} MW`;
  }
  return `${kw.toLocaleString()} kW`;
};
