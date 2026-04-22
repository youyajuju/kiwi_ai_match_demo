
import React, { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  X, 
  Building2, 
  Factory, 
  ChevronRight, 
  ChevronDown,
  Hash, 
  Calendar, 
  Zap, 
  TrendingDown,
  Trash2, 
  Info, 
  Percent,
  Check,
  FileText,
  ShieldCheck,
  AlertCircle,
  TrendingUp,
  Upload,
  ToggleRight,
  FileUp,
  Download,
  Users,
  Briefcase,
  MapPin,
  Phone,
  Mail,
  MoreVertical,
  ExternalLink,
  ArrowLeft,
  FileCode,
  Image as ImageIcon,
  Paperclip,
  PowerOff,
  AlertTriangle,
  Database,
  Pause,
  Play,
  Pencil,
  PlusCircle,
  Settings,
  Activity,
  Divide,
  Sparkles,
  CheckCircle
} from 'lucide-react';
import { INITIAL_CLIENTS, INITIAL_CONTRACTS } from '../mockData';
import { Client, Contract, AIStrategy, MeterConfig, MeterStatus, ContractStatus } from '../types';
import { calculateContractStatus, formatEnergy, formatPower, getStatusColor, getStatusDotColor } from '../utils/contractUtils';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useLanguage } from '../LanguageContext';

const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

const Assets: React.FC = () => {
  const { t, language } = useLanguage();
  const location = useLocation();
  const [clients, setClients] = useState<Client[]>(INITIAL_CLIENTS);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Handle navigation from Monitoring page
  useEffect(() => {
    const state = location.state as { customerName?: string; contractId?: string } | null;
    if (state?.customerName) {
      const client = clients.find(c => c.name === state.customerName);
      if (client) {
        setSelectedClient(client);
        // If there's a contractId, we could potentially scroll to it or highlight it
        // For now, selecting the client is the main requirement
      }
    }
  }, [location.state, clients]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'generator' | 'consumer'>('all');
  const [showExpiringOnly, setShowExpiringOnly] = useState(false);
  const [showExpiringModal, setShowExpiringModal] = useState(false);
  // Modal states
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [isEditingContract, setIsEditingContract] = useState(false);
  const [contractStep, setContractStep] = useState(1);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isEditingClient, setIsEditingClient] = useState(false);
  const [isViewingContract, setIsViewingContract] = useState(false);
  
  const [isTerminateModalOpen, setIsTerminateModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isDeleteClientModalOpen, setIsDeleteClientModalOpen] = useState(false);
  const [clientVatToDelete, setClientVatToDelete] = useState<string | null>(null);
  const [importPreviewData, setImportPreviewData] = useState<MeterConfig[]>([]);
  const [isParsingImport, setIsParsingImport] = useState(false);
  const [importTargetContractId, setImportTargetContractId] = useState<string | null>(null);

  const [terminatingContract, setTerminatingContract] = useState<Contract | null>(null);
  const [terminationForm, setTerminationForm] = useState({
    effectiveDate: '',
    reason: '',
    check1: false,
    check2: false
  });

  // Meter management state
  const [expandedContractId, setExpandedContractId] = useState<string | null>(null);
  const [isMeterModalOpen, setIsMeterModalOpen] = useState(false);
  const [editingMeter, setEditingMeter] = useState<Partial<MeterConfig> | null>(null);
  const [editingMeterIndex, setEditingMeterIndex] = useState<number | null>(null);
  const [currentContractForMeter, setCurrentContractForMeter] = useState<Contract | null>(null);
  const [isMonthlyBreakdownOpen, setIsMonthlyBreakdownOpen] = useState(false);
  const [breakdownMeterIndex, setBreakdownMeterIndex] = useState<number | null>(null);
  const [tempAnnualTarget, setTempAnnualTarget] = useState<number>(0);
  const [breakdownData, setBreakdownData] = useState<number[]>(new Array(12).fill(0));
  const [allocationMode, setAllocationMode] = useState<'manual' | 'average'>('manual');

  const [clientForm, setClientForm] = useState<Partial<Client>>({
    vatNumber: '',
    name: '',
    type: 'consumer',
    address: '',
    contact: { name: '', phone: '', email: '' },
    status: 'normal',
    contracts: []
  });

  const resetClientForm = () => {
    setClientForm({
      vatNumber: '',
      name: '',
      type: 'consumer',
      address: '',
      contact: { name: '', phone: '', email: '' },
      status: 'normal',
      contracts: []
    });
    setIsEditingClient(false);
    setIsClientModalOpen(false);
  };

  const handleOpenEditClient = (client: Client) => {
    setClientForm({ ...client });
    setIsEditingClient(true);
    setIsClientModalOpen(true);
  };

  const handleDeleteClient = (vatNumber: string) => {
    setClientVatToDelete(vatNumber);
    setIsDeleteClientModalOpen(true);
  };

  const confirmDeleteClient = () => {
    if (clientVatToDelete) {
      setClients(prev => prev.filter(c => c.vatNumber !== clientVatToDelete));
      if (selectedClient?.vatNumber === clientVatToDelete) {
        setSelectedClient(null);
      }
      setIsDeleteClientModalOpen(false);
      setClientVatToDelete(null);
    }
  };
  const handleSaveClient = () => {
    if (isEditingClient) {
      setClients(prev => prev.map(c => c.vatNumber === clientForm.vatNumber ? (clientForm as Client) : c));
      if (selectedClient?.vatNumber === clientForm.vatNumber) {
        setSelectedClient(clientForm as Client);
      }
    } else {
      setClients(prev => [...prev, { ...clientForm, contracts: [] } as Client]);
    }
    resetClientForm();
  };

  // New Contract Form State
  const [newContract, setNewContract] = useState<Partial<Contract>>({
    name: '',
    type: 'purchase',
    meters: [],
    renewableType: 'solar',
    equipmentType: 'type1'
  });

  const handleTerminateContract = () => {
    if (!terminatingContract) return;
    
    setClients(prev => prev.map(client => ({
      ...client,
      contracts: client.contracts.map(contract => 
        contract.id === terminatingContract.id 
          ? { 
              ...contract, 
              status: ContractStatus.TERMINATED, 
              endDate: terminationForm.effectiveDate || contract.endDate,
              terminationReason: terminationForm.reason 
            } 
          : contract
      )
    })));

    if (selectedClient) {
      setSelectedClient(prev => prev ? ({
        ...prev,
        contracts: prev.contracts.map(contract => 
          contract.id === terminatingContract.id 
            ? { 
                ...contract, 
                status: ContractStatus.TERMINATED, 
                endDate: terminationForm.effectiveDate || contract.endDate,
                terminationReason: terminationForm.reason 
              } 
            : contract
        )
      }) : null);
    }

    setIsTerminateModalOpen(false);
    setTerminatingContract(null);
    setTerminationForm({ effectiveDate: '', reason: '', check1: false, check2: false });
  };

  const resetContractForm = () => {
    setNewContract({ 
      name: '',
      type: 'purchase', 
      meters: [],
      baseRate: 5.5,
      recFee: 0.003,
      wheelingChargeValue: 0
    });
    setContractStep(1);
    setIsEditingContract(false);
    setIsViewingContract(false);
    setIsContractModalOpen(false);
  };

  const handleOpenViewContract = (contract: Contract) => {
    setNewContract({ ...contract });
    setIsViewingContract(true);
    setIsEditingContract(false);
    setContractStep(1);
    setIsContractModalOpen(true);
  };

  const handleOpenEditContract = (contract: Contract) => {
    setNewContract({ ...contract });
    setIsViewingContract(false);
    setIsEditingContract(true);
    setContractStep(1);
    setIsContractModalOpen(true);
  };

  const generateContractId = () => {
    const prefix = newContract.type === 'purchase' ? 'KiWi_GE' : 'KiWi_CU';
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    setNewContract(prev => ({ ...prev, id: `${prefix}${random}` }));
  };

  const handleAddMeterToNewContract = () => {
    const newMeter: MeterConfig = {
      taipowerId: '',
      displayName: '',
      rate: 0,
      basePrice: 0,
      wheelingChargeType: 'perUnit',
      wheelingChargeValue: 0,
      recFee: 0,
      serviceFeeType: 'perUnit',
      serviceFeeValue: 0
    };
    setNewContract(prev => ({
      ...prev,
      meters: [...(prev.meters || []), newMeter]
    }));
  };

  const updateMeterInNewContract = (index: number, field: keyof MeterConfig, value: any) => {
    const updatedMeters = [...(newContract.meters || [])];
    updatedMeters[index] = { ...updatedMeters[index], [field]: value };
    setNewContract(prev => ({ ...prev, meters: updatedMeters }));
  };

  const removeMeterFromNewContract = (index: number) => {
    setNewContract(prev => ({
      ...prev,
      meters: (prev.meters || []).filter((_, i) => i !== index)
    }));
  };

  // Meter CRUD for existing contracts
  const handleOpenAddMeter = (contract?: Contract) => {
    const targetType = contract ? contract.type : newContract.type;
    setCurrentContractForMeter(contract || null);
    setEditingMeter({
      taipowerId: '',
      displayName: '',
      rate: targetType === 'sale' ? 5.5 : 4.5,
      basePrice: targetType === 'sale' ? 5.5 : 4.5,
      wheelingChargeType: 'perUnit',
      wheelingChargeValue: 0.32,
      recFee: 0.1,
      serviceFeeType: 'fixed',
      serviceFeeValue: 3000
    });
    setEditingMeterIndex(null);
    setIsMeterModalOpen(true);
  };

  const handleOpenEditMeter = (contract: Contract | null, meter: MeterConfig, index: number) => {
    setCurrentContractForMeter(contract);
    setEditingMeter({ ...meter });
    setEditingMeterIndex(index);
    setIsMeterModalOpen(true);
  };

  const handleDeleteMeter = (contractId: string | null, meterIndex: number) => {
    if (window.confirm(t.assets.deleteMeterConfirm)) {
      if (isContractModalOpen) {
        setNewContract(prev => ({
          ...prev,
          meters: (prev.meters || []).filter((_, i) => i !== meterIndex)
        }));
        return;
      }

      if (!contractId) return;

      setClients(prev => prev.map(client => ({
        ...client,
        contracts: client.contracts.map(contract => {
          if (contract.id === contractId) {
            const updatedMeters = [...contract.meters];
            updatedMeters.splice(meterIndex, 1);
            return { 
              ...contract, 
              meters: updatedMeters
            };
          }
          return contract;
        })
      })));

      if (selectedClient) {
        setSelectedClient(prev => {
          if (!prev) return null;
          return {
            ...prev,
            contracts: prev.contracts.map(contract => {
              if (contract.id === contractId) {
                const updatedMeters = [...contract.meters];
                updatedMeters.splice(meterIndex, 1);
                return { 
                  ...contract, 
                  meters: updatedMeters
                };
              }
              return contract;
            })
          };
        });
      }
    }
  };

  const handleOpenMonthlyBreakdown = (index: number, source: 'newContract' | 'editingMeter' = 'newContract') => {
    const meter = source === 'newContract' ? newContract.meters?.[index] : editingMeter;
    if (!meter) return;
    
    setBreakdownMeterIndex(index);
    const initialData = meter.monthlyTargets?.map(t => t.value) || new Array(12).fill(0);
    setBreakdownData(initialData);
    setTempAnnualTarget(meter.annualTargetKwh || 0);
    setIsMonthlyBreakdownOpen(true);
  };

  const handleApplyAverage = () => {
    if (breakdownMeterIndex === null) return;
    const total = tempAnnualTarget;
    
    const avg = Math.floor(total / 12);
    const newBreakdown = new Array(12).fill(avg);
    
    // Adjust last month to match total exactly
    const sum = newBreakdown.reduce((a, b) => a + b, 0);
    newBreakdown[11] += (total - sum);
    
    setBreakdownData(newBreakdown);
  };

  const handleSaveBreakdown = () => {
    if (breakdownMeterIndex === null) return;
    
    const totalAllocated = breakdownData.reduce((a, b) => a + b, 0);
    
    // Ensure annual target matches sum of months
    const finalAnnualTarget = totalAllocated;

    const monthlyTargets = breakdownData.map((val, i) => ({ month: i + 1, value: val }));

    if (isMeterModalOpen && editingMeter) {
      setEditingMeter({
        ...editingMeter,
        annualTargetKwh: finalAnnualTarget,
        monthlyTargets
      });
    } else {
      const updatedMeters = [...(newContract.meters || [])];
      updatedMeters[breakdownMeterIndex] = {
        ...updatedMeters[breakdownMeterIndex],
        annualTargetKwh: finalAnnualTarget,
        monthlyTargets
      };
      setNewContract(prev => ({ ...prev, meters: updatedMeters }));
    }
    
    setIsMonthlyBreakdownOpen(false);
  };

  const handleSaveMeter = () => {
    if (!editingMeter) return;

    const meterToSave = editingMeter as MeterConfig;

    if (!meterToSave.annualTargetKwh || meterToSave.annualTargetKwh <= 0) {
      if (!window.confirm(language === 'zh' ? '此電號尚未分配年度目標量，是否確認儲存？' : 'This meter has no annual target allocated. Confirm save?')) {
        return;
      }
    }

    if (isContractModalOpen) {
      const updatedMeters = [...(newContract.meters || [])];
      if (editingMeterIndex !== null) {
        updatedMeters[editingMeterIndex] = meterToSave;
      } else {
        updatedMeters.push(meterToSave);
      }
      
      setNewContract(prev => ({ 
        ...prev, 
        meters: updatedMeters
      }));
      setIsMeterModalOpen(false);
      setEditingMeter(null);
      setEditingMeterIndex(null);
      return;
    }

    if (!currentContractForMeter) return;

    setClients(prev => prev.map(client => ({
      ...client,
      contracts: client.contracts.map(contract => {
        if (contract.id === currentContractForMeter.id) {
          const updatedMeters = [...contract.meters];
          if (editingMeterIndex !== null) {
            updatedMeters[editingMeterIndex] = meterToSave;
          } else {
            updatedMeters.push(meterToSave);
          }
          return { 
            ...contract, 
            meters: updatedMeters
          };
        }
        return contract;
      })
    })));

    if (selectedClient) {
      setSelectedClient(prev => {
        if (!prev) return null;
        return {
          ...prev,
          contracts: prev.contracts.map(contract => {
            if (contract.id === currentContractForMeter.id) {
              const updatedMeters = [...contract.meters];
              if (editingMeterIndex !== null) {
                updatedMeters[editingMeterIndex] = meterToSave;
              } else {
                updatedMeters.push(meterToSave);
              }
              return { 
                ...contract, 
                meters: updatedMeters
              };
            }
            return contract;
          })
        };
      });
    }

    setIsMeterModalOpen(false);
    setEditingMeter(null);
    setEditingMeterIndex(null);
    setCurrentContractForMeter(null);
  };

  const handleDownloadMeterTemplate = () => {
    const headers = [
      t.assets.siteNameLabel,
      t.assets.meterIdLabel,
      t.assets.retailRateLabel,
      t.assets.purchaseRate,
      t.assets.wheelingCharge,
      t.assets.recFeeLabel,
      t.assets.serviceFeeValue || 'Service Fee'
    ];
    const sampleData = [
      [t.assets.exampleSite1, '00112233445', '5.5', '5.5', '0.32', '0.1', '3000'],
      [t.assets.exampleSite2, '00112233446', '5.5', '5.5', '0.32', '0.1', '3000']
    ];
    
    const csvContent = [
      headers.join(','),
      ...sampleData.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = t.assets.templateFilename || 'meter_template.csv';
    link.click();
  };

  const handleImportMeters = (contractId: string | null) => {
    setImportTargetContractId(contractId);
    setIsImportModalOpen(true);
    setIsParsingImport(true);
    
    // Simulate parsing delay
    setTimeout(() => {
      const mockMeters: MeterConfig[] = Array.from({ length: 5 }, (_, i) => ({
        taipowerId: `0099887766${i}`,
        displayName: t.assets.batchImportedSite.replace('{index}', (i + 1).toString()),
        rate: 5.5,
        basePrice: 5.5,
        wheelingChargeType: 'perUnit',
        wheelingChargeValue: 0.32,
        recFee: 0.1,
        serviceFeeType: 'fixed',
        serviceFeeValue: 3000
      }));
      setImportPreviewData(mockMeters);
      setIsParsingImport(false);
    }, 1500);
  };

  const confirmImportMeters = () => {
    if (importPreviewData.length === 0) return;

    if (isContractModalOpen) {
      setNewContract(prev => ({
        ...prev,
        meters: [...(prev.meters || []), ...importPreviewData]
      }));
    } else if (importTargetContractId) {
      setClients(prev => prev.map(client => ({
        ...client,
        contracts: client.contracts.map(contract => {
          if (contract.id === importTargetContractId) {
            return { ...contract, meters: [...contract.meters, ...importPreviewData] };
          }
          return contract;
        })
      })));

      if (selectedClient) {
        setSelectedClient(prev => {
          if (!prev) return null;
          return {
            ...prev,
            contracts: prev.contracts.map(contract => {
              if (contract.id === importTargetContractId) {
                const updatedMeters = [...contract.meters, ...importPreviewData];
                return { ...contract, meters: updatedMeters };
              }
              return contract;
            })
          };
        });
      }
    }
    
    setIsImportModalOpen(false);
    setImportPreviewData([]);
    setImportTargetContractId(null);
  };

  const handleSaveContract = () => {
    if (!selectedClient) return;
    if (!newContract.name) {
      alert(language === 'zh' ? '請輸入合約名稱' : 'Please enter contract name');
      return;
    }

    const totalAllocated = (newContract.meters || []).reduce((sum, m) => sum + (m.annualTargetKwh || 0), 0);
    const contractTarget = newContract.type === 'purchase' ? (newContract.annualAgreedSupplyDemand || 0) : (newContract.annualTransferLimit || 0);

    if (totalAllocated > contractTarget) {
      alert(language === 'zh' 
        ? `電號分配總計 (${totalAllocated.toLocaleString()} kWh) 超過合約年度約定供需量 (${contractTarget.toLocaleString()} kWh)`
        : `Total allocated (${totalAllocated.toLocaleString()} kWh) exceeds contract annual target (${contractTarget.toLocaleString()} kWh)`
      );
      return;
    }

    const contractData = {
      ...newContract,
      // Inherit client info if not provided in wizard
      companyName: newContract.companyName || selectedClient.name,
      vatNumber: newContract.vatNumber || selectedClient.vatNumber,
      address: newContract.address || selectedClient.address,
      contactName: newContract.contactName || selectedClient.contact.name,
      contactPhone: newContract.contactPhone || selectedClient.contact.phone,
      contactEmail: newContract.contactEmail || selectedClient.contact.email,
      id: newContract.id || `KiWi_${Math.random().toString(36).substr(2, 9)}`,
      status: newContract.status || calculateContractStatus(newContract as Contract, systemDate),
      agreedCapacity: newContract.agreedCapacity || (newContract.purchaseSaleCapacity || 0),
      meters: newContract.meters || []
    } as Contract;

    setClients(prev => prev.map(client => {
      if (client.vatNumber === selectedClient.vatNumber) {
        let updatedContracts;
        if (isEditingContract) {
          updatedContracts = client.contracts.map(c => c.id === contractData.id ? contractData : c);
        } else {
          updatedContracts = [...client.contracts, contractData];
        }
        const updatedClient = { ...client, contracts: updatedContracts };
        // Update selected client view if it's the one being edited
        if (selectedClient.vatNumber === client.vatNumber) {
          setSelectedClient(updatedClient);
        }
        return updatedClient;
      }
      return client;
    }));

    resetContractForm();
  };

  const systemDate = '2026-03-09'; // Simulated current system date

  // Filter Logic for Clients
  const filteredClients = useMemo(() => {
    return clients.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           c.vatNumber.includes(searchQuery);
      const matchesType = filterType === 'all' || 
                         (filterType === 'generator' && c.type === 'generator') ||
                         (filterType === 'consumer' && c.type === 'consumer');
      
      const hasExpiringContract = c.contracts.some(con => calculateContractStatus(con, systemDate) === ContractStatus.EXPIRING);
      const matchesExpiring = !showExpiringOnly || hasExpiringContract;

      return matchesSearch && matchesType && matchesExpiring;
    });
  }, [clients, searchQuery, filterType, showExpiringOnly, systemDate]);

  const handleSelectClient = (client: Client) => {
    setSelectedClient(client);
    window.scrollTo(0, 0);
  };

  const handleBackToList = () => {
    setSelectedClient(null);
  };

  // Layer 1: Client Directory
  const ClientDirectory = () => {
    const totalPartners = clients.length;
    const generatorCount = clients.filter(c => c.type === 'generator').length;
    const consumerCount = clients.filter(c => c.type === 'consumer').length;
    const totalContracts = clients.reduce((acc, c) => acc + c.contracts.length, 0);
    const expiringSoonCount = clients.reduce((acc, c) => 
      acc + c.contracts.filter(con => calculateContractStatus(con, systemDate) === ContractStatus.EXPIRING).length
    , 0);

    const totalSupply = clients.reduce((acc, c) => 
      acc + c.contracts
        .filter(con => con.type === 'purchase')
        .reduce((sum, con) => sum + (con.annualAgreedSupplyDemand || 0), 0)
    , 0);
    
    const totalDemand = clients.reduce((acc, c) => 
      acc + c.contracts
        .filter(con => con.type === 'sale')
        .reduce((sum, con) => sum + (con.annualTransferLimit || 0), 0)
    , 0);

    const surplus = totalSupply - totalDemand;
    const supplyCoveragePercentage = totalDemand > 0 ? (totalSupply / totalDemand) * 100 : 0;

    const expiringContracts = clients.flatMap(c => 
      c.contracts
        .filter(con => calculateContractStatus(con, systemDate) === ContractStatus.EXPIRING)
        .map(con => ({ ...con, clientName: c.name, clientVat: c.vatNumber, client: c }))
    );

    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Expiring Contracts Modal */}
        <AnimatePresence>
          {showExpiringModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowExpiringModal(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden"
              >
                <div className="p-8 border-b border-gray-100 flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-black text-gray-900">{t.assets.expiringSoon}</h3>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">{t.assets.totalContracts}: {expiringSoonCount}</p>
                  </div>
                  <button onClick={() => setShowExpiringModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <X size={24} className="text-gray-400" />
                  </button>
                </div>
                <div className="p-8 max-h-[60vh] overflow-y-auto no-scrollbar space-y-4">
                  {expiringContracts.map((contract) => (
                    <div 
                      key={contract.id}
                      onClick={() => {
                        setSelectedClient(contract.client);
                        setExpandedContractId(contract.id);
                        setShowExpiringModal(false);
                        window.scrollTo(0, 0);
                      }}
                      className="group bg-gray-50 hover:bg-white hover:shadow-xl hover:shadow-gray-100 border border-transparent hover:border-gray-100 p-6 rounded-3xl transition-all flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${contract.type === 'purchase' ? 'bg-[#F59E0B]/10 text-[#F59E0B]' : 'bg-[#3B82F6]/10 text-[#3B82F6]'}`}>
                          {contract.type === 'purchase' ? <Download size={20} /> : <Upload size={20} />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-black text-gray-900">{contract.name}</h4>
                            <span className="text-[10px] font-mono font-bold text-gray-400">{contract.id}</span>
                          </div>
                          <p className="text-xs font-bold text-gray-400 mt-0.5">{contract.clientName}</p>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1.5">
                        <div className="flex items-center gap-1.5 text-xs text-rose-500 font-black uppercase tracking-widest">
                          <Calendar size={14} /> {contract.endDate}
                        </div>
                        <div className={cn(
                          "flex items-center gap-1 px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest",
                          getStatusColor(ContractStatus.EXPIRING)
                        )}>
                          <div className={cn("w-1 h-1 rounded-full", getStatusDotColor(ContractStatus.EXPIRING))} />
                          {t.assets.statusExpiring}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        {/* Top Actions */}
        <div className="flex justify-end items-center gap-6">
          <div className="flex gap-3 w-full md:w-auto">
            <button 
              onClick={() => {
                resetClientForm();
                setIsClientModalOpen(true);
              }}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-[#54585A] text-white px-6 py-3 rounded-2xl font-black text-sm hover:bg-[#444749] transition-all shadow-lg active:scale-95"
            >
              <Plus size={18} /> {t.assets.addClient}
            </button>
          </div>
        </div>

        {/* New Dashboard Section: Global Metrics & Supply/Demand Balance */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Section 1: Global Metrics (40%) */}
          <div className="w-full lg:w-[40%] grid grid-cols-1 gap-4">
            <div className="bg-white p-4 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col justify-center relative overflow-hidden">
              <div className="space-y-6 relative z-10">
                <div>
                  <p className={`text-[10px] font-black text-gray-400 uppercase ${language === 'en' ? 'tracking-wider' : 'tracking-[0.2em]'} mb-2`}>{t.assets.totalPartners}</p>
                  <div className="flex items-end gap-2">
                    <h2 className="text-5xl font-black text-gray-900">{totalPartners}</h2>
                    <span className="text-lg font-bold text-gray-400 mb-1">{t.assets.units}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 py-3 px-5 bg-gray-50 rounded-2xl w-fit">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#F59E0B]"></div>
                    <span className="text-xs font-black text-gray-500">{t.common.generator} {generatorCount} {t.assets.units}</span>
                  </div>
                  <div className="w-px h-3 bg-gray-200"></div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#3B82F6]"></div>
                    <span className="text-xs font-black text-gray-500">{t.common.consumer} {consumerCount} {t.assets.units}</span>
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                  <button 
                    onClick={() => {
                      setFilterType('all');
                      setSearchQuery('');
                      setShowExpiringOnly(false);
                      document.getElementById('client-table')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="flex items-center gap-3 hover:bg-gray-50 p-2 rounded-xl transition-all text-left"
                  >
                    <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center text-[#9CB13A]">
                      <FileText size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.assets.totalContracts}</p>
                      <p className="text-lg font-black text-gray-900">{totalContracts} <span className="text-xs font-bold text-gray-400">{t.assets.contractsUnit}</span></p>
                    </div>
                  </button>
                  
                  {expiringSoonCount > 0 && (
                    <button 
                      onClick={() => {
                        setShowExpiringModal(true);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-rose-50 rounded-xl border border-rose-100 animate-pulse hover:bg-rose-100 transition-all text-left"
                    >
                      <AlertCircle size={16} className="text-rose-500" />
                      <div>
                        <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest leading-none">{t.assets.expiringSoon}</p>
                        <p className="text-sm font-black text-rose-600 leading-none mt-1">{expiringSoonCount}</p>
                      </div>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Supply & Demand Balance (60%) */}
          <div className="w-full lg:w-[60%]">
            <div className="bg-white p-4 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-gray-100 shadow-sm h-full flex flex-col justify-between">
              <div className="flex justify-between items-start mb-6 md:mb-8">
                <div>
                  <h3 className="text-lg font-black text-gray-900 tracking-tight">{t.assets.supplyDemand}</h3>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">{t.assets.inventoryLevel}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#3B82F6]"></div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.assets.totalDemand}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#F59E0B]"></div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.assets.totalSupply}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-10">
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="flex-1 w-full space-y-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-end px-1">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-[#3B82F6] uppercase tracking-widest">{t.assets.totalDemand}</span>
                          <span className="text-lg font-black text-gray-900">{formatEnergy(totalDemand)}</span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] font-black text-[#F59E0B] uppercase tracking-widest">{t.assets.totalSupply}</span>
                          <span className="text-lg font-black text-gray-900">{formatEnergy(totalSupply)}</span>
                        </div>
                      </div>
                      
                      <div className="h-6 bg-gray-100 rounded-2xl overflow-hidden border border-gray-200 flex p-1 gap-1">
                        <div 
                          className="h-full bg-[#3B82F6] rounded-xl transition-all duration-1000 flex items-center justify-center min-w-[20px]"
                          style={{ width: `${(totalDemand / (totalSupply + totalDemand)) * 100}%` }}
                        >
                          {totalDemand > (totalSupply + totalDemand) * 0.1 && (
                            <span className="text-[10px] font-black text-white">{( (totalDemand / (totalSupply + totalDemand)) * 100 ).toFixed(0)}%</span>
                          )}
                        </div>
                        <div 
                          className="h-full bg-[#F59E0B] rounded-xl transition-all duration-1000 flex items-center justify-center min-w-[20px]"
                          style={{ width: `${(totalSupply / (totalSupply + totalDemand)) * 100}%` }}
                        >
                          {totalSupply > (totalSupply + totalDemand) * 0.1 && (
                            <span className="text-[10px] font-black text-white">{( (totalSupply / (totalSupply + totalDemand)) * 100 ).toFixed(0)}%</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {surplus >= 0 ? (
                      <div className="bg-[#1DD793]/5 border border-[#1DD793]/10 p-6 rounded-[2rem] flex flex-col items-center justify-center min-w-[200px] animate-in zoom-in duration-500">
                        <div className="w-12 h-12 bg-[#1DD793] text-white rounded-2xl flex items-center justify-center mb-3 shadow-lg shadow-[#1DD793]/20">
                          <Zap size={24} fill="currentColor" />
                        </div>
                        <p className="text-[10px] font-black text-[#1DD793] uppercase tracking-widest mb-1">⚡ {t.assets.estSurplus}</p>
                        <h4 className="text-2xl font-black text-[#1DD793]">{formatEnergy(surplus)}</h4>
                        <p className="text-[10px] font-bold text-[#1DD793]/60 uppercase mt-1">{t.assets.surplusAvailable}</p>
                      </div>
                    ) : (
                      <div className="bg-red-50 border border-red-100 p-6 rounded-[2rem] flex flex-col items-center justify-center min-w-[200px] animate-in zoom-in duration-500">
                        <div className="w-12 h-12 bg-red-500 text-white rounded-2xl flex items-center justify-center mb-3 shadow-lg shadow-red-100">
                          <AlertCircle size={24} />
                        </div>
                        <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-1">⚠️ {t.assets.estGap}</p>
                        <h4 className="text-2xl font-black text-red-700">{formatEnergy(Math.abs(surplus))}</h4>
                        <p className="text-[10px] font-bold text-red-600/60 uppercase mt-1">{t.assets.gapDeficit}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filters */}
      <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col md:flex-row gap-6 items-center">
        <div className="relative flex-1 w-full">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder={t.assets.searchPlaceholder} 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 border-transparent rounded-2xl text-sm font-bold outline-none focus:border-[#9CB13A] focus:bg-white transition-all"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto no-scrollbar">
          {showExpiringOnly && (
            <button
              onClick={() => setShowExpiringOnly(false)}
              className="px-6 py-2.5 rounded-xl text-xs font-black whitespace-nowrap bg-[#54585A] text-white shadow-md flex items-center gap-2 animate-in zoom-in duration-200"
            >
              {t.assets.expiringSoon} <X size={14} />
            </button>
          )}
          {[
            { id: 'all', label: t.assets.all },
            { id: 'generator', label: t.common.generator },
            { id: 'consumer', label: t.common.consumer }
          ].map(tag => (
            <button
              key={tag.id}
              onClick={() => setFilterType(tag.id as any)}
              className={`px-6 py-2.5 rounded-xl text-xs font-black whitespace-nowrap transition-all ${filterType === tag.id ? 'bg-[#9CB13A] text-white shadow-md' : 'bg-[#E7E6E6] text-gray-500 hover:bg-gray-200'}`}
            >
              {tag.label}
            </button>
          ))}
        </div>
      </div>

      {/* Data Table */}
      <div id="client-table" tabIndex={0} className="bg-white rounded-[2.5rem] border-2 border-gray-100 focus:border-[#9CB13A] focus:outline-none shadow-xl overflow-hidden transition-colors">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left min-w-[800px]">
            <thead>
              <tr className={`bg-gray-50 text-[10px] font-black text-gray-400 uppercase ${language === 'en' ? 'tracking-wider' : 'tracking-[0.2em]'} border-b border-gray-100`}>
                <th className="px-4 md:px-8 py-4 md:py-6">{t.common.vatNumber}</th>
                <th className="px-4 md:px-8 py-4 md:py-6">{t.common.companyName}</th>
                <th className="px-4 md:px-8 py-4 md:py-6">{t.common.customerType}</th>
                <th className="px-4 md:px-8 py-4 md:py-6">{t.assets.activeContracts}</th>
                <th className="px-4 md:px-8 py-4 md:py-6">{t.assets.agreedCapacity}</th>
                <th className="px-4 md:px-8 py-4 md:py-6 text-right">{t.common.operation}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredClients.map(client => (
                <tr key={client.vatNumber} className="hover:bg-gray-50/50 transition-colors group cursor-pointer" onClick={() => handleSelectClient(client)}>
                  <td className="px-4 md:px-8 py-4 md:py-6">
                    <span className="text-sm font-mono font-bold text-gray-500">{client.vatNumber}</span>
                  </td>
                  <td className="px-4 md:px-8 py-4 md:py-6">
                    <span className="text-sm font-black text-gray-900 group-hover:text-blue-600 transition-colors">{client.name}</span>
                  </td>
                  <td className="px-4 md:px-8 py-4 md:py-6">
                    <div className="flex gap-2">
                      {client.type === 'generator' ? (
                        <span className="px-3 py-1 bg-[#F59E0B]/10 text-[#F59E0B] rounded-lg text-[10px] font-black border border-[#F59E0B]/20">{t.common.generator}</span>
                      ) : (
                        <span className="px-3 py-1 bg-[#3B82F6]/10 text-[#3B82F6] rounded-lg text-[10px] font-black border border-[#3B82F6]/20">{t.common.consumer}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 md:px-8 py-4 md:py-6">
                    <span className="text-sm font-black text-gray-900">{client.contracts.length} <span className="text-xs text-gray-400">{t.assets.contractsUnit}</span></span>
                  </td>
                  <td className="px-4 md:px-8 py-4 md:py-6">
                    <span className="text-sm font-black text-gray-900">
                      {formatEnergy(client.contracts.reduce((acc, c) => acc + (c.type === 'purchase' ? (c.annualAgreedSupplyDemand || 0) : (c.annualTransferLimit || 0)), 0))}
                    </span>
                  </td>
                  <td className="px-4 md:px-8 py-4 md:py-6 text-right">
                    <button className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 transition-all">
                      <ChevronRight size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

  // Layer 2: Client 360 Dashboard
  const ClientDashboard = ({ client }: { client: Client }) => (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      {/* Top Navigation & Title */}
      <div className="flex flex-col gap-6">
        <button 
          onClick={handleBackToList}
          className="flex items-center gap-2 text-gray-400 hover:text-gray-900 font-black text-xs uppercase tracking-widest transition-all group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> {t.assets.backToList}
        </button>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl md:text-4xl font-black text-gray-900 tracking-tight">{client.name}</h1>
              <div className="shrink-0">
                {client.type === 'generator' ? (
                  <span className="px-3 py-1 bg-[#F59E0B]/10 text-[#F59E0B] rounded-lg text-[10px] font-black border border-[#F59E0B]/20">{t.common.generator}</span>
                ) : (
                  <span className="px-3 py-1 bg-[#3B82F6]/10 text-[#3B82F6] rounded-lg text-[10px] font-black border border-[#3B82F6]/20">{t.common.consumer}</span>
                )}
              </div>
            </div>
            <p className="text-sm md:text-lg font-bold text-gray-400">{t.common.vatNumber}：{client.vatNumber}</p>
          </div>
          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            <button 
              onClick={() => handleOpenEditClient(client)}
              className="flex-1 md:flex-none px-6 py-3 bg-[#54585A] text-white rounded-2xl font-black text-sm hover:bg-[#444749] transition-all shadow-lg active:scale-95"
            >
              {t.assets.editClient}
            </button>
            <button 
              onClick={() => handleDeleteClient(client.vatNumber)}
              className="flex-1 md:flex-none px-6 py-3 bg-red-50 text-red-600 rounded-2xl font-black text-sm hover:bg-red-100 transition-all"
            >
              {t.assets.deleteClient}
            </button>
          </div>
        </div>
      </div>

      {/* Asymmetric Layout */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Left Sidebar (30%) */}
        <div className="w-full lg:w-[30%] lg:sticky lg:top-8 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl space-y-8">
            <div className="space-y-6">
              <h3 className={`text-xs font-black text-gray-400 uppercase ${language === 'en' ? 'tracking-wider' : 'tracking-[0.2em]'} border-b border-gray-50 pb-4`}>{t.assets.basicInfo}</h3>
              
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 shrink-0">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t.assets.address}</p>
                    <p className="text-sm font-bold text-gray-700 leading-relaxed">{client.address}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-50 pb-4">{t.assets.contactPerson}</h3>
              
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-gray-900">{client.contact.name}</span>
                  </div>
                  <div className="space-y-2 pl-2 border-l-2 border-gray-100">
                    <div className="flex items-center gap-2 text-xs text-gray-500 font-bold">
                      <Phone size={12} /> {client.contact.phone}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 font-bold">
                      <Mail size={12} /> {client.contact.email}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Main Content (70%) */}
        <div className="w-full lg:w-[70%] space-y-8">
          {/* KPI Widgets */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm relative overflow-hidden">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t.assets.activeContractsCount}</p>
              <h3 className="text-3xl font-black text-gray-900">{client.contracts.length} <span className="text-sm font-bold text-gray-400">{t.assets.contractsUnit}</span></h3>
            </div>
            <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm relative overflow-hidden">
              <div className="absolute right-[-10px] top-[-10px] opacity-[0.03] text-[#1DD793]">
                <Zap size={100} />
              </div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t.assets.totalAgreedGreen}</p>
              <h3 className="text-3xl font-black text-[#1DD793]">
                {formatEnergy(client.contracts.reduce((acc, c) => acc + (c.type === 'purchase' ? (c.annualAgreedSupplyDemand || 0) : (c.annualTransferLimit || 0)), 0))}
              </h3>
            </div>
          </div>

          {/* Tabbed Content Card */}
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden">
            <div className="px-10 pt-10 border-b border-gray-50 flex justify-between items-end">
              <div className="flex gap-10">
                <div className="pb-6 text-sm font-black uppercase tracking-widest text-gray-900 relative">
                  {t.assets.contractList}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-900 rounded-full"></div>
                </div>
              </div>
              <div className="pb-6">
                <button 
                  onClick={() => {
                    setNewContract(prev => ({
                      ...prev,
                      type: client.type === 'generator' ? 'purchase' : 'sale'
                    }));
                    setIsContractModalOpen(true);
                  }}
                  className="flex items-center gap-2 bg-[#54585A] text-white px-6 py-2.5 rounded-xl font-black text-xs hover:bg-[#444749] transition-all shadow-lg active:scale-95"
                >
                  <Plus size={16} /> {t.assets.createNewContract}
                </button>
              </div>
            </div>

            <div className="p-10">
              <div className="space-y-4">
                {client.contracts.length > 0 ? (
                  client.contracts.map(contract => (
                    <div key={contract.id} className="space-y-2">
                      <div className={cn(
                        "group bg-gray-50 hover:bg-white hover:shadow-xl hover:shadow-gray-100 border border-transparent hover:border-gray-100 p-6 rounded-3xl transition-all flex items-center justify-between cursor-pointer",
                        expandedContractId === contract.id && "bg-white shadow-xl border-gray-100"
                      )}
                      onClick={() => setExpandedContractId(expandedContractId === contract.id ? null : contract.id)}
                      >
                        <div className="flex items-center gap-6">
                          {(() => {
                            const status = calculateContractStatus(contract, systemDate);
                            const statusColor = getStatusColor(status);
                            const dotColor = getStatusDotColor(status);
                            const statusLabel = status === ContractStatus.VALID ? t.assets.statusValid :
                                              status === ContractStatus.EXPIRING ? t.assets.statusExpiring :
                                              status === ContractStatus.EXPIRED ? t.assets.statusExpired :
                                              status === ContractStatus.TERMINATED ? t.assets.statusTerminated : status;

                            return (
                              <div className={cn(
                                "px-3 py-1 rounded-full border shadow-sm transition-all shrink-0 flex items-center gap-2",
                                statusColor,
                                status === ContractStatus.EXPIRING && "animate-pulse"
                              )}>
                                <div className={cn("w-1.5 h-1.5 rounded-full", dotColor)} />
                                <span className="text-[11px] font-black uppercase tracking-widest whitespace-nowrap">{statusLabel}</span>
                              </div>
                            );
                          })()}
                          <div>
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest",
                                contract.type === 'purchase' ? "bg-[#F59E0B]/10 text-[#F59E0B]" : "bg-[#3B82F6]/10 text-[#3B82F6]"
                              )}>
                                {contract.type === 'purchase' ? t.assets.purchaseContract : t.assets.saleContract}
                              </div>
                              <h4 className="text-lg font-black text-gray-900">{contract.name}</h4>
                              <span className="text-xs font-mono font-bold text-gray-400 tracking-tighter">{contract.id}</span>
                            </div>
                            <div className="flex items-center gap-4 mt-1">
                              <div className="flex items-center gap-1.5 text-xs text-gray-400 font-bold">
                                <Calendar size={14} /> {contract.startDate} ~ {contract.endDate}
                              </div>
                              <div className="flex items-center gap-1.5 text-xs font-black text-[#9CB13A] bg-[#9CB13A]/5 px-2 py-0.5 rounded-lg">
                                <Zap size={14} /> {contract.type === 'purchase' ? formatEnergy(contract.annualAgreedSupplyDemand || 0) : formatEnergy(contract.annualTransferLimit || 0)}
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-gray-400 font-bold">
                                <MapPin size={14} /> {t.assets.metersCount.replace('{count}', contract.meters.length.toString())}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                          {calculateContractStatus(contract, systemDate) !== ContractStatus.TERMINATED && 
                           calculateContractStatus(contract, systemDate) !== ContractStatus.EXPIRED && (
                            <button 
                              onClick={() => {
                                setTerminatingContract(contract);
                                setTerminationForm({
                                  effectiveDate: '',
                                  reason: '',
                                  check1: false,
                                  check2: false
                                });
                                setIsTerminateModalOpen(true);
                              }}
                              className="p-3 hover:bg-red-50 rounded-2xl text-gray-400 hover:text-red-600 transition-all flex items-center gap-2 group/btn"
                              title={t.assets.forceTerminateContract}
                            >
                              <PowerOff size={20} />
                              <span className="text-[10px] font-black uppercase tracking-widest hidden group-hover/btn:block">{t.assets.forceTerminateContract}</span>
                            </button>
                          )}

                          <button 
                            onClick={() => handleOpenViewContract(contract)}
                            className="p-3 hover:bg-gray-100 rounded-2xl text-gray-400 hover:text-blue-600 transition-all flex items-center gap-2 group/btn"
                            title={t.assets.contractDetails}
                          >
                            <FileText size={20} />
                            <span className="text-[10px] font-black uppercase tracking-widest hidden group-hover/btn:block">{t.assets.contractDetails}</span>
                          </button>
                        </div>
                      </div>

                      {/* Meter List Expansion */}
                      {expandedContractId === contract.id && (
                        <div className="mx-6 p-6 bg-white border border-gray-100 rounded-b-[2rem] border-t-0 -mt-2 animate-in slide-in-from-top-2 duration-300">
                          <div className="flex justify-between items-center mb-4">
                            <h5 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                              <Hash size={16} className="text-[#9CB13A]" />
                              {t.assets.meterList} ({contract.meters.length})
                            </h5>
                            <div className="flex gap-4">
                              <button 
                                onClick={() => handleOpenAddMeter(contract)}
                                className="flex items-center gap-1.5 text-[#9CB13A] font-black text-[10px] uppercase tracking-widest hover:text-[#8A9D33] transition-colors"
                              >
                                <PlusCircle size={14} /> {t.assets.addMeter}
                              </button>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 gap-3">
                            {contract.meters.map((meter, mIdx) => (
                              <div key={meter.taipowerId} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between group/meter">
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-gray-400 font-mono text-xs font-bold shadow-sm">
                                    {mIdx + 1}
                                  </div>
                                  <div>
                                    <div className="text-sm font-black text-gray-900">{meter.displayName || t.assets.unnamedMeter}</div>
                                    <div className="flex items-center gap-4 mt-1">
                                      <div className="text-[10px] font-bold text-gray-400">
                                        <span className="font-black">電號：</span>
                                        <span className="font-mono">{meter.taipowerId}</span>
                                      </div>
                                      <div className="text-[10px] font-bold text-[#9CB13A]">
                                        <span className="font-black">年度約定目標量：</span>
                                        <span>{formatEnergy(meter.annualTargetKwh || 0)}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover/meter:opacity-100 transition-opacity">
                                  <button 
                                    onClick={() => handleOpenEditMeter(contract, meter, mIdx)}
                                    className="p-2 hover:bg-white rounded-lg text-gray-400 hover:text-blue-600 transition-all"
                                    title={t.assets.editMeter}
                                  >
                                    <Pencil size={14} />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteMeter(contract.id, mIdx)}
                                    className="p-2 hover:bg-white rounded-lg text-gray-400 hover:text-rose-600 transition-all"
                                    title={t.assets.deleteMeter}
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                            ))}
                            {contract.meters.length === 0 && (
                              <div className="col-span-full py-8 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
                                <p className="text-xs font-bold text-gray-400">{t.assets.noMeters}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="py-20 text-center space-y-4">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
                      <FileText size={40} />
                    </div>
                    <p className="text-gray-400 font-bold">{t.assets.noContracts}</p>
                  </div>
                )}

                {/* Contract Status Explanation */}
                <div className="mt-12 pt-10 border-t border-gray-50">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-1 h-4 bg-gray-900 rounded-full"></div>
                    <h5 className="text-sm font-black text-gray-900 uppercase tracking-widest">{t.assets.statusExplanation}</h5>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex gap-4 p-4 rounded-2xl hover:bg-gray-50 transition-colors">
                      <div className="shrink-0 w-2 h-2 rounded-full bg-[#1DD793] mt-1.5 shadow-[0_0_8px_rgba(29,215,147,0.4)]"></div>
                      <div>
                        <div className="text-xs font-black text-gray-900 mb-1">{t.assets.statusValid}</div>
                        <p className="text-[10px] font-bold text-gray-400 leading-relaxed">{t.assets.statusValidDesc}</p>
                      </div>
                    </div>
                    <div className="flex gap-4 p-4 rounded-2xl hover:bg-gray-50 transition-colors">
                      <div className="shrink-0 w-2 h-2 rounded-full bg-[#F59E0B] mt-1.5 shadow-[0_0_8px_rgba(245,158,11,0.4)] animate-pulse"></div>
                      <div>
                        <div className="text-xs font-black text-gray-900 mb-1">{t.assets.statusExpiring}</div>
                        <p className="text-[10px] font-bold text-gray-400 leading-relaxed">{t.assets.statusExpiringDesc}</p>
                      </div>
                    </div>
                    <div className="flex gap-4 p-4 rounded-2xl hover:bg-gray-50 transition-colors">
                      <div className="shrink-0 w-2 h-2 rounded-full bg-gray-300 mt-1.5"></div>
                      <div>
                        <div className="text-xs font-black text-gray-900 mb-1">{t.assets.statusExpired}</div>
                        <p className="text-[10px] font-bold text-gray-400 leading-relaxed">{t.assets.statusExpiredDesc}</p>
                      </div>
                    </div>
                    <div className="flex gap-4 p-4 rounded-2xl hover:bg-gray-50 transition-colors">
                      <div className="shrink-0 w-2 h-2 rounded-full bg-rose-500 mt-1.5 shadow-[0_0_8px_rgba(244,63,94,0.4)]"></div>
                      <div>
                        <div className="text-xs font-black text-gray-900 mb-1">{t.assets.statusTerminated}</div>
                        <p className="text-[10px] font-bold text-gray-400 leading-relaxed">{t.assets.statusTerminatedDesc}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-24">
      {selectedClient ? (
        <ClientDashboard client={selectedClient} />
      ) : (
        <ClientDirectory />
      )}

      {/* Placeholder Modals */}
      {isClientModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-300" onClick={resetClientForm}></div>
          <div className="relative bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl p-12 animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-3xl font-black text-gray-900">{isEditingClient ? t.assets.editClient : t.assets.createNewClient}</h2>
                <p className="text-gray-400 font-bold mt-1">{t.assets.clientInfoDesc}</p>
              </div>
              <button onClick={resetClientForm} className="p-2 hover:bg-gray-100 rounded-full transition-all">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-10">
              {/* Section 1: Basic Info */}
              <div className="space-y-6">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 pb-2">{t.assets.basicEnterpriseInfo}</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">{t.assets.vatNumberLabel} <span className="text-rose-500">*</span></label>
                    <input 
                      type="text" 
                      className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-lg font-bold outline-none focus:ring-2 focus:ring-gray-900" 
                      placeholder={t.assets.vatNumberPlaceholder}
                      value={clientForm.vatNumber}
                      onChange={e => setClientForm(prev => ({ ...prev, vatNumber: e.target.value }))}
                      disabled={isEditingClient}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">{t.assets.clientTypeLabel} <span className="text-rose-500">*</span></label>
                    <select 
                      className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-lg font-bold outline-none focus:ring-2 focus:ring-gray-900"
                      value={clientForm.type}
                      onChange={e => setClientForm(prev => ({ ...prev, type: e.target.value as any }))}
                    >
                      <option value="generator">{t.assets.generatorClient}</option>
                      <option value="consumer">{t.assets.consumerClient}</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">{t.assets.companyNameLabel} <span className="text-rose-500">*</span></label>
                  <input 
                    type="text" 
                    className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-lg font-bold outline-none focus:ring-2 focus:ring-gray-900" 
                    placeholder={t.assets.companyNamePlaceholder}
                    value={clientForm.name}
                    onChange={e => setClientForm(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">{t.assets.addressLabel}</label>
                  <input 
                    type="text" 
                    className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-lg font-bold outline-none focus:ring-2 focus:ring-gray-900" 
                    placeholder={t.assets.addressPlaceholder}
                    value={clientForm.address}
                    onChange={e => setClientForm(prev => ({ ...prev, address: e.target.value }))}
                  />
                </div>
              </div>

              {/* Section 2: Contact */}
              <div className="space-y-6">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100 pb-2">{t.assets.contactWindowInfo}</h3>
                <div className="grid grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">{t.assets.contactNameLabel}</label>
                    <input 
                      type="text" 
                      className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-lg font-bold outline-none focus:ring-2 focus:ring-gray-900" 
                      placeholder={t.assets.contactNamePlaceholder}
                      value={clientForm.contact?.name}
                      onChange={e => setClientForm(prev => ({ ...prev, contact: { ...prev.contact!, name: e.target.value } }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">{t.assets.contactPhoneLabel}</label>
                    <input 
                      type="text" 
                      className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-lg font-bold outline-none focus:ring-2 focus:ring-gray-900" 
                      placeholder={t.assets.contactPhonePlaceholder}
                      value={clientForm.contact?.phone}
                      onChange={e => setClientForm(prev => ({ ...prev, contact: { ...prev.contact!, phone: e.target.value } }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">{t.assets.contactEmailLabel}</label>
                    <input 
                      type="email" 
                      className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-lg font-bold outline-none focus:ring-2 focus:ring-gray-900" 
                      placeholder={t.assets.contactEmailPlaceholder}
                      value={clientForm.contact?.email}
                      onChange={e => setClientForm(prev => ({ ...prev, contact: { ...prev.contact!, email: e.target.value } }))}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-6 flex gap-4">
                <button onClick={resetClientForm} className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-black text-sm hover:bg-gray-200 transition-all">{t.assets.cancel}</button>
                <button 
                  onClick={handleSaveClient}
                  className="flex-[2] py-4 bg-[#54585A] text-white rounded-2xl font-black text-sm hover:bg-[#444749] transition-all shadow-lg active:scale-95"
                >
                  {isEditingClient ? t.assets.saveChanges : t.assets.confirmAdd}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isContractModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 md:p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-300" onClick={resetContractForm}></div>
          <div className="relative bg-white w-full max-w-5xl rounded-[2rem] md:rounded-[3rem] shadow-2xl p-6 md:p-12 animate-in zoom-in-95 duration-300 max-h-[95vh] overflow-y-auto no-scrollbar">
            <div className="flex justify-between items-start mb-6 md:mb-8">
              <div>
                <h2 className="text-xl md:text-3xl font-black text-gray-900">
                  {isViewingContract 
                    ? t.assets.contractDetails 
                    : (contractStep === 3 
                        ? t.assets.bindMeterTitle 
                        : (isEditingContract ? t.assets.editContractTitle : t.assets.addContractTitle)
                      )
                  }
                </h2>
                <p className="text-gray-400 font-bold mt-1 text-xs md:text-base">
                  {isViewingContract ? t.assets.viewingContract : t.assets.contractStepDesc
                    .replace('{name}', selectedClient?.name || '')
                    .replace('{action}', isEditingContract ? t.assets.modifying : t.assets.creating)
                    .replace('{step}', contractStep.toString())}
                </p>
              </div>
              <div className="flex items-center gap-4">
                {isViewingContract && (
                  <button 
                    onClick={() => {
                      setIsViewingContract(false);
                      setIsEditingContract(true);
                    }}
                    className="flex items-center gap-2 bg-[#54585A] text-white px-6 py-2.5 rounded-xl font-black text-xs hover:bg-[#444749] transition-all shadow-lg active:scale-95"
                  >
                    <Pencil size={16} /> {t.assets.editContract}
                  </button>
                )}
                <button onClick={resetContractForm} className="p-2 hover:bg-gray-100 rounded-full transition-all">
                  <X size={20} className="md:w-6 md:h-6" />
                </button>
              </div>
            </div>

            {/* Step Indicator */}
            <div className="flex gap-4 mb-10">
              {[1, 2, 3, 4].map(s => (
                <div key={s} className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div className={`h-full transition-all duration-500 ${s <= contractStep ? 'bg-gray-900' : 'bg-transparent'}`}></div>
                </div>
              ))}
            </div>
            
            {contractStep === 1 && (
              <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-right-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center ml-1">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">{t.assets.contractType}</label>
                        {selectedClient && (
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${selectedClient.type === 'generator' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                            {selectedClient.type === 'generator' ? t.assets.generatorClient : t.assets.consumerClient}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col sm:flex-row gap-4">
                        <button 
                          onClick={() => !isEditingContract && !isViewingContract && setNewContract(prev => ({ ...prev, type: 'purchase' }))}
                          className={`flex-1 p-4 md:p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 ${newContract.type === 'purchase' ? 'border-gray-900 bg-gray-50' : 'border-gray-100 hover:border-gray-200'} ${(isEditingContract || isViewingContract) ? 'opacity-50 cursor-not-allowed' : ''}`}
                          disabled={isEditingContract || isViewingContract}
                        >
                          <Download size={28} className={newContract.type === 'purchase' ? 'text-gray-900' : 'text-gray-300'} />
                          <span className="font-black text-sm md:text-base">{t.assets.purchaseContract}</span>
                        </button>
                        <button 
                          onClick={() => !isEditingContract && !isViewingContract && setNewContract(prev => ({ ...prev, type: 'sale' }))}
                          className={`flex-1 p-4 md:p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 ${newContract.type === 'sale' ? 'border-gray-900 bg-gray-50' : 'border-gray-100 hover:border-gray-200'} ${(isEditingContract || isViewingContract) ? 'opacity-50 cursor-not-allowed' : ''}`}
                          disabled={isEditingContract || isViewingContract}
                        >
                          <Upload size={28} className={newContract.type === 'sale' ? 'text-gray-900' : 'text-gray-300'} />
                          <span className="font-black text-sm md:text-base">{t.assets.saleContract}</span>
                        </button>
                      </div>
                      
                      {selectedClient && (
                        ((selectedClient.type === 'generator' && newContract.type === 'sale') ||
                         (selectedClient.type === 'consumer' && newContract.type === 'purchase')) && (
                          <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 animate-in shake duration-300">
                            <AlertCircle size={20} />
                            <p className="text-xs font-black">
                              {t.assets.typeMismatch
                                .replace('{clientType}', selectedClient.type === 'generator' ? t.assets.generatorClient : t.assets.consumerClient)
                                .replace('{contractType}', selectedClient.type === 'generator' ? t.assets.purchaseContract : t.assets.saleContract)}
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">{t.assets.contractName} <span className="text-rose-500">*</span></label>
                      <input 
                        type="text" 
                        className={`w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-lg font-bold outline-none focus:ring-2 focus:ring-gray-900 ${isViewingContract ? 'cursor-default' : ''}`} 
                        placeholder={t.assets.contractNamePlaceholder}
                        value={newContract.name || ''}
                        onChange={e => setNewContract(prev => ({ ...prev, name: e.target.value }))}
                        readOnly={isViewingContract}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">{t.assets.contractIdLabel} <span className="text-rose-500">*</span></label>
                      <input 
                        type="text" 
                        className={`w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-lg font-bold outline-none focus:ring-2 focus:ring-gray-900 ${isViewingContract ? 'cursor-default' : ''}`} 
                        placeholder={t.assets.contractIdPlaceholder}
                        value={newContract.id || ''}
                        onChange={e => setNewContract(prev => ({ ...prev, id: e.target.value }))}
                        readOnly={isViewingContract}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">{t.assets.supplyPeriod} <span className="text-rose-500">*</span></label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-gray-400 ml-1">{t.assets.startDate}</p>
                      <input 
                        type="date" 
                        className={`w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-gray-900 ${isViewingContract ? 'cursor-default' : ''}`}
                        value={newContract.startDate || ''}
                        onChange={e => setNewContract(prev => ({ ...prev, startDate: e.target.value }))}
                        readOnly={isViewingContract}
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-gray-400 ml-1">{t.assets.endDate}</p>
                      <input 
                        type="date" 
                        className={`w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-gray-900 ${isViewingContract ? 'cursor-default' : ''}`}
                        value={newContract.endDate || ''}
                        onChange={e => setNewContract(prev => ({ ...prev, endDate: e.target.value }))}
                        readOnly={isViewingContract}
                      />
                    </div>
                  </div>
                </div>

                {isViewingContract && newContract.status === ContractStatus.TERMINATED && (
                  <div className="p-6 bg-red-50 border border-red-100 rounded-[2rem] space-y-4 animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex items-center gap-3 text-red-600">
                      <PowerOff size={24} />
                      <h4 className="text-lg font-black uppercase tracking-widest">{t.assets.terminationDetails}</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-red-400 uppercase tracking-widest ml-1">{t.assets.terminationDate}</p>
                        <div className="px-6 py-4 bg-white/60 rounded-2xl text-sm font-bold text-red-900 border border-red-100">
                          {newContract.endDate}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-red-400 uppercase tracking-widest ml-1">{t.assets.terminationReason}</p>
                        <div className="px-6 py-4 bg-white/60 rounded-2xl text-sm font-bold text-red-900 border border-red-100">
                          {newContract.terminationReason || '-'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {contractStep === 2 && (
              <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-right-4">
                <div className="max-w-3xl mx-auto space-y-8">
                  <div className="space-y-6">
                    {/* Rate Settings */}
                    <div className="p-4 md:p-6 bg-white rounded-3xl border border-gray-100 space-y-6 shadow-sm">
                      <h4 className="text-sm font-black text-gray-900 flex items-center gap-2">
                        <div className="w-1.5 h-4 bg-blue-600 rounded-full" />
                        {t.assets.rateSetting}
                      </h4>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">
                          {newContract.type === 'purchase' ? t.assets.purchaseRate : t.assets.saleRate} <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <input 
                            type="number" 
                            step="0.001"
                            className={`w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-lg font-bold outline-none focus:ring-2 focus:ring-gray-900 pr-24 ${isViewingContract ? 'cursor-default' : ''}`} 
                            placeholder="0.000"
                            value={newContract.baseRate ?? ''}
                            onChange={e => setNewContract(prev => ({ ...prev, baseRate: parseFloat(e.target.value) }))}
                            readOnly={isViewingContract}
                          />
                          <span className="absolute right-6 top-1/2 -translate-y-1/2 text-sm font-black text-gray-400">
                            {newContract.type === 'purchase' ? t.assets.unitPriceExclTax : t.assets.unitPrice}
                          </span>
                        </div>
                      </div>

                      {newContract.type === 'sale' && (
                        <>
                          <div className="space-y-2">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">
                              {t.assets.recFeeLabel} <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                              <input 
                                type="number" 
                                step="0.001"
                                className={`w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-lg font-bold outline-none focus:ring-2 focus:ring-gray-900 pr-24 ${isViewingContract ? 'cursor-default' : ''}`} 
                                placeholder="0.003"
                                value={newContract.recFee ?? ''}
                                onChange={e => setNewContract(prev => ({ ...prev, recFee: parseFloat(e.target.value) }))}
                                readOnly={isViewingContract}
                              />
                              <span className="absolute right-6 top-1/2 -translate-y-1/2 text-sm font-black text-gray-400">
                                {t.assets.unitPrice}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">
                              {t.assets.wheelingCharge} <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                              <input 
                                type="number" 
                                step="0.0001"
                                className={`w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-lg font-bold outline-none focus:ring-2 focus:ring-gray-900 pr-24 ${isViewingContract ? 'cursor-default' : ''}`} 
                                placeholder="0.0000"
                                value={newContract.wheelingChargeValue ?? ''}
                                onChange={e => setNewContract(prev => ({ ...prev, wheelingChargeValue: parseFloat(e.target.value) }))}
                                readOnly={isViewingContract}
                              />
                              <span className="absolute right-6 top-1/2 -translate-y-1/2 text-sm font-black text-gray-400">
                                {t.assets.unitPrice}
                              </span>
                            </div>
                            <p className="text-[10px] font-bold text-gray-400 ml-1">
                              {t.assets.wheelingChargeNote}
                            </p>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Annual Target Setting Section */}
                    <div className="p-8 bg-white rounded-[2.5rem] border border-gray-100 space-y-8 shadow-sm">
                      <div className="flex items-center justify-between">
                        <h4 className="text-base font-black text-gray-900 flex items-center gap-3">
                          <div className="w-2 h-6 bg-[#9CB13A] rounded-full" />
                          {t.assets.annualTargetSetting}
                        </h4>
                        <div className="px-4 py-1.5 bg-gray-50 rounded-full border border-gray-100">
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            {newContract.type === 'purchase' ? t.assets.generatorClient : t.assets.consumerClient}
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                          <label className="text-xs font-black text-gray-500 uppercase tracking-widest">
                            {newContract.type === 'purchase' ? t.assets.annualAgreedSupplyDemand : t.assets.annualTransferLimit}
                            <span className="text-rose-500 ml-1">*</span>
                          </label>
                          <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400">
                            <Info size={12} />
                            {language === 'zh' ? '此數值將作為電號分配的總上限' : 'This value serves as the total cap for meter allocation'}
                          </div>
                        </div>
                        <div className="relative group">
                          <input 
                            type="number" 
                            className={`w-full px-8 py-6 bg-gray-50 border-2 border-transparent rounded-3xl text-3xl font-black outline-none focus:border-[#9CB13A] focus:bg-white transition-all pr-24 ${isViewingContract ? 'cursor-default' : ''}`}
                            value={newContract.type === 'purchase' ? (newContract.annualAgreedSupplyDemand || '') : (newContract.annualTransferLimit || '')}
                            onChange={e => {
                              const val = parseFloat(e.target.value) || 0;
                              setNewContract(prev => ({ 
                                ...prev, 
                                [prev.type === 'purchase' ? 'annualAgreedSupplyDemand' : 'annualTransferLimit']: val 
                              }));
                            }}
                            placeholder="0"
                            readOnly={isViewingContract}
                          />
                          <span className="absolute right-8 top-1/2 -translate-y-1/2 text-sm font-black text-gray-400">{t.common.kwh}</span>
                        </div>
                      </div>
                    </div>

                    {/* Energy and Capacity Information */}
                    <div className="p-8 bg-white rounded-[2.5rem] border border-gray-100 space-y-8 shadow-sm">
                      <h4 className="text-base font-black text-gray-900 flex items-center gap-3">
                        <div className="w-2 h-6 bg-emerald-500 rounded-full" />
                        {newContract.type === 'purchase' ? t.assets.energyCapacityInfo : t.assets.matchingStrategy}
                      </h4>
                      
                      {newContract.type === 'purchase' ? (
                        <div className="space-y-6">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">{t.assets.energyType} <span className="text-rose-500">*</span></label>
                              <select 
                                className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-gray-900"
                                value={newContract.renewableType || ''}
                                onChange={e => setNewContract(prev => ({ ...prev, renewableType: e.target.value }))}
                              >
                                <option value="solar">{t.assets.solar}</option>
                                <option value="wind">{t.assets.wind}</option>
                                <option value="lowCarbon">{t.assets.lowCarbon}</option>
                              </select>
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">{t.assets.equipmentType} <span className="text-rose-500">*</span></label>
                              <select 
                                className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-gray-900"
                                value={newContract.equipmentType || ''}
                                onChange={e => setNewContract(prev => ({ ...prev, equipmentType: e.target.value as any }))}
                              >
                                <option value="type1">{t.assets.type1}</option>
                                <option value="type2">{t.assets.type2}</option>
                                <option value="type3">{t.assets.type3}</option>
                              </select>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">{t.assets.totalCapacity} <span className="text-rose-500">*</span></label>
                              <div className="relative">
                                <input 
                                  type="number" 
                                  className={`w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-gray-900 pr-16 ${isViewingContract ? 'cursor-default' : ''}`}
                                  value={newContract.totalCapacity || ''}
                                  onChange={e => setNewContract(prev => ({ ...prev, totalCapacity: parseFloat(e.target.value) }))}
                                  readOnly={isViewingContract}
                                />
                                <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400">{t.common.kw}</span>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">{t.assets.purchaseSaleCapacity} <span className="text-rose-500">*</span></label>
                              <div className="relative">
                                <input 
                                  type="number" 
                                  className={`w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-gray-900 pr-12 ${isViewingContract ? 'cursor-default' : ''}`}
                                  value={newContract.purchaseSaleCapacity || ''}
                                  onChange={e => setNewContract(prev => ({ ...prev, purchaseSaleCapacity: parseFloat(e.target.value) }))}
                                  readOnly={isViewingContract}
                                />
                                <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400">{t.common.kw}</span>
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">{t.assets.wheelingRatio} <span className="text-rose-500">*</span></label>
                              <div className="relative">
                                <input 
                                  type="number" 
                                  className={`w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-gray-900 pr-12 ${isViewingContract ? 'cursor-default' : ''}`}
                                  value={newContract.pmi || ''}
                                  onChange={e => setNewContract(prev => ({ ...prev, pmi: parseFloat(e.target.value) }))}
                                  readOnly={isViewingContract}
                                />
                                <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400">%</span>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">{t.assets.guaranteedPurchaseRatio}</label>
                              <div className="relative">
                                <input 
                                  type="number" 
                                  className={`w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-gray-900 pr-12 ${isViewingContract ? 'cursor-default' : ''}`}
                                  placeholder="0"
                                  value={newContract.guaranteedPurchaseRatio || ''}
                                  onChange={e => setNewContract(prev => ({ ...prev, guaranteedPurchaseRatio: parseFloat(e.target.value) }))}
                                  readOnly={isViewingContract}
                                />
                                <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400">%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          <div className="space-y-2">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">{t.assets.matchingStrategy} <span className="text-rose-500">*</span></label>
                            <div className="grid grid-cols-2 gap-4">
                              <button 
                                onClick={() => !isViewingContract && setNewContract(prev => ({ ...prev, aiStrategy: AIStrategy.RE_PRIORITY }))}
                                className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${newContract.aiStrategy === AIStrategy.RE_PRIORITY ? 'border-[#10B981] bg-[#10B981]/5' : 'border-gray-100 hover:border-gray-200'} ${isViewingContract ? 'opacity-50 cursor-not-allowed' : ''}`}
                                disabled={isViewingContract}
                              >
                                <Zap size={24} className={newContract.aiStrategy === AIStrategy.RE_PRIORITY ? 'text-[#10B981]' : 'text-gray-300'} />
                                <span className={`text-xs font-black ${newContract.aiStrategy === AIStrategy.RE_PRIORITY ? 'text-[#10B981]' : 'text-gray-500'}`}>{t.assets.rePriority}</span>
                              </button>
                              <button 
                                onClick={() => !isViewingContract && setNewContract(prev => ({ ...prev, aiStrategy: AIStrategy.COST_OPTIMIZED }))}
                                className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${newContract.aiStrategy === AIStrategy.COST_OPTIMIZED ? 'border-[#06B6D4] bg-[#06B6D4]/5' : 'border-gray-100 hover:border-gray-200'} ${isViewingContract ? 'opacity-50 cursor-not-allowed' : ''}`}
                                disabled={isViewingContract}
                              >
                                <TrendingDown size={24} className={newContract.aiStrategy === AIStrategy.COST_OPTIMIZED ? 'text-[#06B6D4]' : 'text-gray-300'} />
                                <span className={`text-xs font-black ${newContract.aiStrategy === AIStrategy.COST_OPTIMIZED ? 'text-[#06B6D4]' : 'text-gray-500'}`}>{t.assets.costOptimization}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                      <div className="flex items-center gap-3 mb-4">
                        <Calendar size={18} className="text-gray-400" />
                        <h4 className="text-sm font-black text-gray-900">{t.assets.billingDesc}</h4>
                      </div>
                      <p className="text-xs font-bold text-gray-500 leading-relaxed">
                        {newContract.type === 'purchase' 
                          ? t.assets.generatorBillingNote
                          : t.assets.consumerBillingNote}
                      </p>
                    </div>

                    {newContract.type === 'sale' && (
                      <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100">
                        <div className="flex items-center gap-3 mb-4">
                          <Info size={18} className="text-blue-500" />
                          <h4 className="text-sm font-black text-blue-900">{t.assets.systemTrialTip}</h4>
                        </div>
                        <p className="text-xs font-bold text-blue-700 leading-relaxed">
                          {t.assets.trialCalculation.replace('{rate}', ( (newContract.baseRate || 0) + (newContract.recFee || 0) ).toFixed(3))}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {contractStep === 3 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                <div className="max-w-3xl mx-auto">
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-black text-gray-900">
                        {t.assets.meterConfigTitle}
                      </h4>
                      {!isViewingContract && (
                        <div className="flex gap-3">
                          <button 
                            onClick={() => handleOpenAddMeter()}
                            className="flex items-center gap-1.5 text-[#9CB13A] font-black text-[10px] uppercase tracking-widest hover:text-[#8A9D33]"
                          >
                            <PlusCircle size={14} /> {t.assets.addMeter}
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
                      {(newContract.meters || []).map((meter, idx) => (
                        <div key={meter.taipowerId || `new-${idx}`} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between group/meter">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-gray-400 font-mono text-xs font-bold shadow-sm">
                              {idx + 1}
                            </div>
                            <div>
                              <div className="text-sm font-black text-gray-900">{meter.displayName || t.assets.unnamedMeter}</div>
                              <div className="text-[10px] font-mono font-bold text-gray-400">{meter.taipowerId}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {!isViewingContract && (
                              <div className="flex items-center gap-1">
                                <button 
                                  onClick={() => handleOpenEditMeter(null, meter, idx)}
                                  className="p-2 hover:bg-white rounded-lg text-gray-400 hover:text-blue-600 transition-all"
                                  title={t.assets.editMeter}
                                >
                                  <Pencil size={14} />
                                </button>
                                <button 
                                  onClick={() => handleDeleteMeter(null, idx)}
                                  className="p-2 hover:bg-white rounded-lg text-gray-400 hover:text-rose-600 transition-all"
                                  title={t.assets.deleteMeter}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      {(newContract.meters || []).length === 0 && (
                        <div className="py-10 text-center border-2 border-dashed border-gray-100 rounded-2xl">
                          <p className="text-[10px] text-gray-400 font-bold">{t.assets.noMeters}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {contractStep === 4 && (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                <div className="max-w-4xl mx-auto">
                  <div className="space-y-8">
                    {/* Header with Actions */}
                    <div className="flex justify-between items-end">
                      <div>
                        <h2 className="text-2xl font-black text-gray-900">
                          {language === 'zh' ? '目標分配' : 'Target Allocation'}
                        </h2>
                      </div>
                      {!isViewingContract && (
                        <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
                          <div className="flex p-1 bg-gray-100 rounded-xl">
                            <button 
                              onClick={() => {
                                setAllocationMode('average');
                                const contractTarget = newContract.type === 'purchase' ? (newContract.annualAgreedSupplyDemand || 0) : (newContract.annualTransferLimit || 0);
                                if (contractTarget <= 0) {
                                  alert(language === 'zh' ? '請先設定合約年度目標量' : 'Please set contract annual target first');
                                  return;
                                }
                                const meters = newContract.meters || [];
                                if (meters.length === 0) return;

                                const perMeterTarget = Math.floor(contractTarget / meters.length);
                                const remainder = contractTarget % meters.length;

                                const updatedMeters = meters.map((m, idx) => {
                                  const target = idx === 0 ? perMeterTarget + remainder : perMeterTarget;
                                  const perMonth = Math.floor(target / 12);
                                  const monthRemainder = target % 12;
                                  const monthlyTargets = Array.from({ length: 12 }, (_, i) => ({
                                    month: i + 1,
                                    value: i === 0 ? perMonth + monthRemainder : perMonth
                                  }));
                                  return {
                                    ...m,
                                    annualTargetKwh: target,
                                    monthlyTargets
                                  };
                                });

                                setNewContract(prev => ({ ...prev, meters: updatedMeters }));
                              }}
                              className={cn(
                                "px-4 py-2 rounded-lg text-xs font-black transition-all",
                                "bg-[#9CB13A] text-white shadow-sm"
                              )}
                            >
                              {language === 'zh' ? '平均分配' : 'Average'}
                            </button>
                            <button 
                              onClick={() => {
                                const updatedMeters = (newContract.meters || []).map(m => ({
                                  ...m,
                                  annualTargetKwh: 0,
                                  monthlyTargets: Array.from({ length: 12 }, (_, i) => ({ month: i + 1, value: 0 }))
                                }));
                                setNewContract(prev => ({ ...prev, meters: updatedMeters }));
                              }}
                              className={cn(
                                "px-4 py-2 rounded-lg text-xs font-black transition-all",
                                "text-gray-400 hover:text-rose-600"
                              )}
                            >
                              {language === 'zh' ? '清除重置' : 'Clear All'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Statistics Cards */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{language === 'zh' ? '合約年度總量' : 'Contract Annual Total'}</p>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-black text-gray-900">
                            {(newContract.type === 'purchase' ? (newContract.annualAgreedSupplyDemand || 0) : (newContract.annualTransferLimit || 0)).toLocaleString()}
                          </span>
                          <span className="text-[10px] font-bold text-gray-400">{t.common.kwh}</span>
                        </div>
                      </div>
                      <div className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{language === 'zh' ? '已分配總計' : 'Total Allocated'}</p>
                        <div className="flex items-baseline gap-1">
                          <span className={cn(
                            "text-2xl font-black",
                            (newContract.meters || []).reduce((sum, m) => sum + (m.annualTargetKwh || 0), 0) > (newContract.type === 'purchase' ? (newContract.annualAgreedSupplyDemand || 0) : (newContract.annualTransferLimit || 0))
                              ? "text-rose-600"
                              : "text-[#9CB13A]"
                          )}>
                            {(newContract.meters || []).reduce((sum, m) => sum + (m.annualTargetKwh || 0), 0).toLocaleString()}
                          </span>
                          <span className="text-[10px] font-bold text-gray-400">{t.common.kwh}</span>
                        </div>
                      </div>
                      <div className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{language === 'zh' ? '已綁定電號' : 'Bound Meters'}</p>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-black text-gray-900">{(newContract.meters || []).length}</span>
                          <span className="text-[10px] font-bold text-gray-400">{language === 'zh' ? '個' : 'Units'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Meter List with Monthly Breakdown */}
                    <div className="space-y-4">
                      {(newContract.meters || []).map((meter, idx) => (
                        <div key={meter.taipowerId || `new-${idx}`} className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden group/meter">
                          <div className="p-6 flex items-center justify-between bg-gray-50/50">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-gray-900 rounded-2xl flex items-center justify-center text-white font-mono text-sm font-black shadow-lg">
                                {idx + 1}
                              </div>
                              <div>
                                <div className="text-base font-black text-gray-900">{meter.displayName || t.assets.unnamedMeter}</div>
                                <div className="text-xs font-mono font-bold text-gray-400">{meter.taipowerId}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-8">
                              <div className="text-right">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t.assets.annualTargetKwh}</p>
                                <div className="text-xl font-black text-[#9CB13A]">{meter.annualTargetKwh?.toLocaleString()} <span className="text-[10px] text-gray-400 ml-1">{t.common.kwh}</span></div>
                              </div>
                            </div>
                          </div>
                          
                          {/* 12-Month Editable Grid */}
                          <div className="p-8 space-y-6 bg-white">
                            <div className="flex justify-between items-center">
                              <h5 className="text-xs font-black text-gray-400 uppercase tracking-widest">{language === 'zh' ? '月度分配明細' : 'Monthly Breakdown'}</h5>
                            </div>
                            <div className="grid grid-cols-4 md:grid-cols-6 gap-6">
                              {Array.from({ length: 12 }).map((_, mIdx) => {
                                const monthData = (meter.monthlyTargets || []).find(mt => mt.month === mIdx + 1);
                                return (
                                  <div key={mIdx} className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex justify-between">
                                      <span>{mIdx + 1}{language === 'zh' ? '月' : 'M'}</span>
                                    </label>
                                    <div className="relative">
                                      <input 
                                        type="number"
                                        readOnly={isViewingContract}
                                        className={cn(
                                          "w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-2xl text-sm font-black outline-none transition-all focus:bg-white focus:border-[#9CB13A]",
                                          isViewingContract ? "cursor-default" : "cursor-text"
                                        )}
                                        value={monthData?.value || 0}
                                        onChange={e => {
                                          const newVal = parseFloat(e.target.value) || 0;
                                          setNewContract(prev => {
                                            const updatedMeters = [...(prev.meters || [])];
                                            const m = { ...updatedMeters[idx] };
                                            const targets = [...(m.monthlyTargets || [])];
                                            const tIdx = targets.findIndex(t => t.month === mIdx + 1);
                                            if (tIdx >= 0) {
                                              targets[tIdx] = { ...targets[tIdx], value: newVal };
                                            } else {
                                              targets.push({ month: mIdx + 1, value: newVal });
                                            }
                                            m.monthlyTargets = targets;
                                            m.annualTargetKwh = targets.reduce((sum, t) => sum + (t.value || 0), 0);
                                            updatedMeters[idx] = m;
                                            return { ...prev, meters: updatedMeters };
                                          });
                                          setAllocationMode('manual');
                                        }}
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Validation Status */}
                          <div className="px-6 py-3 bg-gray-50/30 border-t border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {(!meter.annualTargetKwh || meter.annualTargetKwh === 0) ? (
                                <div className="flex items-center gap-1.5 text-[10px] font-black text-rose-500 uppercase tracking-widest">
                                  <AlertCircle size={12} />
                                  {language === 'zh' ? '尚未分配目標' : 'Unallocated'}
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                                  <CheckCircle size={12} />
                                  {language === 'zh' ? '已完成分配' : 'Allocated'}
                                </div>
                              )}
                            </div>
                            <div className="text-[10px] font-bold text-gray-400 italic">
                              {language === 'zh' ? '點擊右上方齒輪進行詳細調整' : 'Click settings icon to adjust'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Summary Banner */}
                    {(() => {
                      const totalAllocated = (newContract.meters || []).reduce((sum, m) => sum + (m.annualTargetKwh || 0), 0);
                      const contractTarget = newContract.type === 'purchase' ? (newContract.annualAgreedSupplyDemand || 0) : (newContract.annualTransferLimit || 0);
                      const isOver = totalAllocated > contractTarget;
                      const isMatching = Math.abs(totalAllocated - contractTarget) < 0.1;

                      return (
                        <div className={cn(
                          "p-10 rounded-[3rem] flex justify-between items-center shadow-2xl transition-all duration-500",
                          isOver ? "bg-rose-50 border-2 border-rose-100 text-rose-700" : (isMatching ? "bg-emerald-50 border-2 border-emerald-100 text-emerald-700" : "bg-gray-900 text-white")
                        )}>
                          <div className="flex items-center gap-8">
                            <div className={cn(
                              "w-20 h-20 rounded-[2rem] flex items-center justify-center shadow-xl",
                              isOver ? "bg-white text-rose-500" : (isMatching ? "bg-white text-emerald-500" : "bg-white/10 text-[#9CB13A]")
                            )}>
                              {isOver ? <AlertCircle size={40} /> : (isMatching ? <CheckCircle size={40} /> : <Activity size={40} />)}
                            </div>
                            <div>
                              <p className="text-xs font-black uppercase tracking-widest opacity-60 mb-1">
                                {newContract.type === 'purchase' ? t.assets.annualAgreedSupplyDemand : t.assets.annualTransferLimit}
                              </p>
                              <h5 className="text-4xl font-black">
                                {contractTarget.toLocaleString()}
                                <span className="text-sm ml-2 opacity-60">{t.common.kwh}</span>
                              </h5>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-black uppercase tracking-widest opacity-60 mb-1">
                              {language === 'zh' ? '已分配總計' : 'Total Allocated'}
                            </p>
                            <h5 className={cn(
                              "text-4xl font-black",
                              isOver ? "text-rose-600" : (isMatching ? "text-emerald-600" : "text-[#9CB13A]")
                            )}>
                              {totalAllocated.toLocaleString()}
                              <span className="text-sm ml-2 opacity-60">{t.common.kwh}</span>
                            </h5>
                            {isOver && (
                              <p className="text-xs font-black uppercase tracking-widest mt-2 animate-bounce">
                                {language === 'zh' ? `⚠️ 超出 ${ (totalAllocated - contractTarget).toLocaleString() } kWh` : `⚠️ Exceeds by ${ (totalAllocated - contractTarget).toLocaleString() } kWh`}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}

            <div className="pt-10 flex gap-4">
              {contractStep > 1 && (
                <button 
                  onClick={() => setContractStep(s => s - 1)} 
                  className="flex-1 py-4 bg-[#E7E6E6] text-gray-600 rounded-2xl font-black text-sm hover:bg-gray-200 transition-all"
                >
                  {t.assets.prevStep}
                </button>
              )}
              {contractStep < 4 ? (
                <button 
                  onClick={() => {
                    if (contractStep === 1) {
                      if (!newContract.name) {
                        alert(language === 'zh' ? '請輸入合約名稱' : 'Please enter contract name');
                        return;
                      }
                      if (!newContract.id) {
                        alert(language === 'zh' ? '請輸入合約編號' : 'Please enter contract ID');
                        return;
                      }
                      if (selectedClient) {
                        const isMismatch = (selectedClient.type === 'generator' && newContract.type === 'sale') ||
                                         (selectedClient.type === 'consumer' && newContract.type === 'purchase');
                        if (isMismatch) {
                          alert(
                            t.assets.typeMismatch
                              .replace('{clientType}', selectedClient.type === 'generator' ? t.assets.generatorClient : t.assets.consumerClient)
                              .replace('{contractType}', selectedClient.type === 'generator' ? t.assets.purchaseContract : t.assets.saleContract)
                          );
                          return;
                        }
                      }
                    }
                    if (contractStep === 2) {
                      const target = newContract.type === 'purchase' ? newContract.annualAgreedSupplyDemand : newContract.annualTransferLimit;
                      if (!target || target <= 0) {
                        alert(language === 'zh' ? '請輸入年度約定總量' : 'Please enter annual agreed target');
                        return;
                      }
                      if (newContract.type === 'sale' && !newContract.aiStrategy) {
                        alert(language === 'zh' ? '請選擇 AI 電力匹配策略' : 'Please select AI power matching strategy');
                        return;
                      }
                    }
                    if (contractStep === 3) {
                      if ((newContract.meters || []).length === 0) {
                        alert(language === 'zh' ? '請至少綁定一個電號' : 'Please bind at least one meter');
                        return;
                      }
                    }
                    setContractStep(s => s + 1);
                  }} 
                  className="flex-[2] py-4 bg-[#54585A] text-white rounded-2xl font-black text-sm hover:bg-[#444749] transition-all shadow-lg active:scale-95"
                >
                  {t.assets.nextStep}
                </button>
              ) : (
                !isViewingContract ? (
                  <button 
                    onClick={handleSaveContract}
                    className="flex-[2] py-4 bg-[#54585A] text-white rounded-2xl font-black text-sm hover:bg-[#444749] transition-all shadow-lg active:scale-95"
                  >
                    {isEditingContract ? t.assets.saveContractChanges : t.assets.confirmCreateContract}
                  </button>
                ) : (
                  <button 
                    onClick={resetContractForm}
                    className="flex-[2] py-4 bg-[#54585A] text-white rounded-2xl font-black text-sm hover:bg-[#444749] transition-all shadow-lg active:scale-95"
                  >
                    {t.common.close}
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* Redundant Modal Removed */}
      {/* Meter Modal */}
      {isMeterModalOpen && editingMeter && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-10 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="text-2xl font-black text-gray-900 tracking-tight">
                  {editingMeterIndex !== null ? t.assets.editMeterTitle : t.assets.addMeterTitle}
                </h3>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
                  {t.assets.contractLabel}：{currentContractForMeter?.name}
                </p>
              </div>
              <button 
                onClick={() => setIsMeterModalOpen(false)}
                className="w-12 h-12 flex items-center justify-center rounded-2xl hover:bg-white hover:shadow-lg transition-all text-gray-400 hover:text-gray-900"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-10 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">{t.assets.siteNameLabel} <span className="text-rose-500">*</span></label>
                <input 
                  type="text" 
                  className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-lg font-bold outline-none focus:ring-2 focus:ring-gray-900"
                  placeholder={t.assets.siteNamePlaceholder}
                  value={editingMeter.displayName || ''}
                  onChange={e => setEditingMeter({ ...editingMeter, displayName: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">{t.assets.meterIdLabel} <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <input 
                    type="text" 
                    maxLength={11}
                    className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-lg font-mono font-bold outline-none focus:ring-2 focus:ring-gray-900 tracking-widest"
                    placeholder="00-1111-22-3"
                    value={editingMeter.taipowerId || ''}
                    onChange={e => setEditingMeter({ ...editingMeter, taipowerId: e.target.value })}
                  />
                  <Hash size={20} className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300" />
                </div>
              </div>
            </div>

            <div className="p-10 bg-gray-50/50 flex gap-4">
              <button 
                onClick={() => setIsMeterModalOpen(false)}
                className="flex-1 py-4 bg-[#E7E6E6] text-gray-600 rounded-2xl font-black text-sm hover:bg-gray-200 transition-all border border-gray-100"
              >
                {t.assets.cancel}
              </button>
              <button 
                onClick={handleSaveMeter}
                className="flex-[2] py-4 bg-[#54585A] text-white rounded-2xl font-black text-sm hover:bg-[#444749] transition-all shadow-lg active:scale-95"
              >
                {t.assets.confirmSave}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Monthly Breakdown Modal */}
      {isMonthlyBreakdownOpen && breakdownMeterIndex !== null && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-10 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-white rounded-[1.5rem] flex items-center justify-center text-gray-900 font-black text-xl shadow-sm border border-gray-100">
                  {breakdownMeterIndex + 1}
                </div>
                <div>
                  <h3 className="text-2xl font-black text-gray-900 tracking-tight">
                    {t.assets.monthlyBreakdown}
                  </h3>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
                    {newContract.meters?.[breakdownMeterIndex]?.displayName} ({newContract.meters?.[breakdownMeterIndex]?.taipowerId})
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsMonthlyBreakdownOpen(false)}
                className="w-12 h-12 flex items-center justify-center rounded-2xl hover:bg-white hover:shadow-lg transition-all text-gray-400 hover:text-gray-900"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-10 space-y-8">
              {/* Unified Header: Annual Target Input */}
              <div className="p-8 bg-gray-900 rounded-[2.5rem] text-white flex items-center justify-between shadow-xl">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{t.assets.annualTargetKwh}</p>
                  <div className="flex items-baseline gap-2">
                    <input 
                      type="number"
                      className="bg-transparent border-none p-0 text-4xl font-black outline-none w-48 focus:ring-0 text-[#9CB13A]"
                      value={tempAnnualTarget}
                      onChange={e => setTempAnnualTarget(parseFloat(e.target.value) || 0)}
                    />
                    <span className="text-sm font-bold text-gray-500">{t.common.kwh}</span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={handleApplyAverage}
                    className="px-6 py-3 bg-white/10 text-white rounded-2xl font-black text-xs hover:bg-white/20 transition-all flex items-center gap-2 border border-white/10"
                  >
                    <Divide size={16} />
                    {t.assets.averageFill}
                  </button>
                </div>
              </div>

              {/* Monthly Inputs */}
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {t.assets.monthNames.map((month, i) => {
                  const totalAllocated = breakdownData.reduce((a, b) => a + b, 0);
                  const isMismatch = Math.abs(totalAllocated - tempAnnualTarget) >= 0.1;
                  
                  return (
                    <div key={month} className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{month}</label>
                      <div className="relative">
                        <input 
                          type="number" 
                          className={clsx(
                            "w-full px-4 py-3 border-none rounded-xl text-sm font-bold outline-none transition-all",
                            isMismatch ? "bg-amber-50 text-amber-700 focus:ring-amber-500" : "bg-gray-50 text-gray-900 focus:ring-gray-900"
                          )}
                          value={breakdownData[i] || 0}
                          onChange={e => {
                            const val = parseFloat(e.target.value) || 0;
                            const newData = [...breakdownData];
                            newData[i] = val;
                            setBreakdownData(newData);
                            // Auto-update annual target to match sum
                            const newSum = newData.reduce((a, b) => a + b, 0);
                            setTempAnnualTarget(newSum);
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Validation Banner */}
              <div className={`p-6 rounded-[2rem] flex justify-between items-center transition-all duration-500 ${
                Math.abs(breakdownData.reduce((a, b) => a + b, 0) - tempAnnualTarget) < 0.1
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                  : 'bg-amber-50 text-amber-700 border border-amber-100'
              }`}>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm transition-all ${
                    Math.abs(breakdownData.reduce((a, b) => a + b, 0) - tempAnnualTarget) < 0.1
                      ? 'bg-white text-emerald-500'
                      : 'bg-white text-amber-500'
                  }`}>
                    {Math.abs(breakdownData.reduce((a, b) => a + b, 0) - tempAnnualTarget) < 0.1
                      ? <CheckCircle size={24} />
                      : <AlertCircle size={24} />
                    }
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60">
                      {language === 'zh' ? '目前分配總計' : 'Current Total Allocation'}
                    </p>
                    <h6 className="text-xl font-black">
                      {breakdownData.reduce((a, b) => a + b, 0).toLocaleString()} 
                      <span className="text-xs ml-2 opacity-60">{t.common.kwh}</span>
                    </h6>
                  </div>
                </div>

                {Math.abs(breakdownData.reduce((a, b) => a + b, 0) - tempAnnualTarget) >= 0.1 && (
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60">
                      {language === 'zh' ? '與年度目標差異' : 'Diff from Annual Target'}
                    </p>
                    <p className="text-lg font-black">
                      {(tempAnnualTarget - breakdownData.reduce((a, b) => a + b, 0)).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-10 bg-gray-50/50 flex gap-4">
              <button 
                onClick={() => setIsMonthlyBreakdownOpen(false)}
                className="flex-1 py-4 bg-[#E7E6E6] text-gray-600 rounded-2xl font-black text-sm hover:bg-gray-200 transition-all border border-gray-100"
              >
                {t.assets.cancel}
              </button>
              <button 
                onClick={handleSaveBreakdown}
                className="flex-[2] py-4 bg-[#54585A] text-white rounded-2xl font-black text-sm hover:bg-[#444749] transition-all shadow-lg active:scale-95"
              >
                {t.assets.confirmSave}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Force Terminate Modal */}
      {isTerminateModalOpen && terminatingContract && (
        <div className="fixed inset-0 bg-red-900/40 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300 border-4 border-red-100">
            <div className="p-12 bg-red-600 text-white relative overflow-hidden">
              <div className="absolute top-[-20px] right-[-20px] opacity-10">
                <AlertTriangle size={200} />
              </div>
              <div className="relative z-10 flex items-start gap-6">
                <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm shrink-0">
                  <AlertTriangle size={40} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-3xl font-black tracking-tight leading-tight">
                    {t.assets.terminateWarningTitle}
                  </h3>
                  <p className="text-red-100 font-bold text-lg opacity-90">
                    {t.assets.terminateWarningSub}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-12 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">
                    {t.assets.terminationEffectiveDate}
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="date"
                      value={terminationForm.effectiveDate}
                      onChange={e => setTerminationForm(prev => ({ ...prev, effectiveDate: e.target.value }))}
                      className="w-full pl-14 pr-6 py-4 bg-gray-50 border-2 border-transparent focus:border-red-500 rounded-2xl font-bold text-gray-900 transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">
                    {t.assets.terminationReason}
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="text"
                      placeholder={t.assets.terminationReasonPlaceholder}
                      value={terminationForm.reason}
                      onChange={e => setTerminationForm(prev => ({ ...prev, reason: e.target.value }))}
                      className="w-full pl-14 pr-6 py-4 bg-gray-50 border-2 border-transparent focus:border-red-500 rounded-2xl font-bold text-gray-900 transition-all outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <label className="flex items-start gap-4 p-6 bg-gray-50 rounded-3xl cursor-pointer hover:bg-red-50 transition-all border-2 border-transparent has-[:checked]:border-red-200 group">
                  <div className="relative mt-1">
                    <input 
                      type="checkbox"
                      checked={terminationForm.check1}
                      onChange={e => setTerminationForm(prev => ({ ...prev, check1: e.target.checked }))}
                      className="peer sr-only"
                    />
                    <div className="w-6 h-6 border-2 border-gray-300 rounded-lg peer-checked:bg-red-600 peer-checked:border-red-600 transition-all flex items-center justify-center">
                      <Check size={14} className="text-white scale-0 peer-checked:scale-100 transition-transform" />
                    </div>
                  </div>
                  <span className="text-sm font-bold text-gray-600 leading-relaxed group-hover:text-red-900 transition-colors">
                    {t.assets.confirmTerminationCheck1}
                  </span>
                </label>

                <label className="flex items-start gap-4 p-6 bg-gray-50 rounded-3xl cursor-pointer hover:bg-red-50 transition-all border-2 border-transparent has-[:checked]:border-red-200 group">
                  <div className="relative mt-1">
                    <input 
                      type="checkbox"
                      checked={terminationForm.check2}
                      onChange={e => setTerminationForm(prev => ({ ...prev, check2: e.target.checked }))}
                      className="peer sr-only"
                    />
                    <div className="w-6 h-6 border-2 border-gray-300 rounded-lg peer-checked:bg-red-600 peer-checked:border-red-600 transition-all flex items-center justify-center">
                      <Check size={14} className="text-white scale-0 peer-checked:scale-100 transition-transform" />
                    </div>
                  </div>
                  <span className="text-sm font-bold text-gray-600 leading-relaxed group-hover:text-red-900 transition-colors">
                    {t.assets.confirmTerminationCheck2}
                  </span>
                </label>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => setIsTerminateModalOpen(false)}
                  className="flex-1 py-5 bg-[#E7E6E6] text-gray-600 rounded-3xl font-black text-sm hover:bg-gray-200 transition-all uppercase tracking-widest"
                >
                  {t.common.cancel}
                </button>
                <button 
                  disabled={!terminationForm.check1 || !terminationForm.check2 || !terminationForm.effectiveDate || !terminationForm.reason}
                  onClick={handleTerminateContract}
                  className="flex-[2] py-5 bg-red-600 text-white rounded-3xl font-black text-sm hover:bg-red-700 transition-all shadow-xl shadow-red-200 active:scale-95 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed uppercase tracking-widest"
                >
                  {t.assets.forceTerminateContract}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Client Confirmation Modal */}
      {isDeleteClientModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md z-[300] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-10 text-center space-y-6">
              <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto text-rose-600">
                <Trash2 size={40} />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-gray-900">{t.assets.deleteClientTitle}</h3>
                <p className="text-sm font-bold text-gray-500 leading-relaxed">
                  {t.assets.deleteClientWarning}
                </p>
              </div>
              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => setIsDeleteClientModalOpen(false)}
                  className="flex-1 py-4 bg-[#E7E6E6] text-gray-600 rounded-2xl font-black text-sm hover:bg-gray-200 transition-all"
                >
                  {t.assets.cancel}
                </button>
                <button 
                  onClick={confirmDeleteClient}
                  className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-black text-sm hover:bg-rose-700 transition-all shadow-lg shadow-rose-200"
                >
                  {t.common.confirm}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Batch Import Meters Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md z-[300] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-10 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="text-2xl font-black text-gray-900 tracking-tight">{t.assets.batchImportTitle}</h3>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
                  {t.assets.selectFile}
                </p>
              </div>
              <button 
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportPreviewData([]);
                }}
                className="w-12 h-12 flex items-center justify-center rounded-2xl hover:bg-white hover:shadow-lg transition-all text-gray-400 hover:text-gray-900"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-10 space-y-8">
              {isParsingImport ? (
                <div className="py-20 text-center space-y-6">
                  <div className="w-16 h-16 border-4 border-gray-100 border-t-blue-600 rounded-full animate-spin mx-auto" />
                  <p className="text-lg font-black text-gray-900 animate-pulse">{t.assets.parsing}</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-black text-gray-900">
                      {t.assets.importPreview.replace('{count}', importPreviewData.length.toString())}
                    </h4>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
                    {importPreviewData.map((meter, idx) => (
                      <div key={idx} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-gray-400 font-mono text-xs font-bold shadow-sm">
                            {idx + 1}
                          </div>
                          <div>
                            <div className="text-sm font-black text-gray-900">{meter.displayName}</div>
                            <div className="text-[10px] font-mono font-bold text-gray-400">{meter.taipowerId}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-black text-gray-900">{meter.rate} {t.common.unitPrice}</div>
                          <div className="text-[10px] font-bold text-gray-400">{t.assets.recFee}: {meter.recFee}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-10 bg-gray-50/50 flex gap-4">
              <button 
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportPreviewData([]);
                }}
                className="flex-1 py-4 bg-[#E7E6E6] text-gray-600 rounded-2xl font-black text-sm hover:bg-gray-100 transition-all border border-gray-100"
              >
                {t.assets.cancel}
              </button>
              <button 
                onClick={confirmImportMeters}
                disabled={isParsingImport || importPreviewData.length === 0}
                className="flex-[2] py-4 bg-[#54585A] text-white rounded-2xl font-black text-sm hover:bg-[#444749] transition-all shadow-lg disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
              >
                {t.assets.confirmImport}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Assets;
