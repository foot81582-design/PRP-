/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Printer, 
  Plus, 
  Eye, 
  Trash2, 
  Info, 
  X, 
  Check, 
  Loader2,
  Calendar,
  User,
  Heart,
  Settings,
  AlertCircle,
  Stethoscope,
  Pill,
  Edit,
  Minus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Apply, Plan, Bag, CollectModalData, DrugRecord } from './types';
import { DEMO_APPLY_LIST, DEMO_PLANS, DEMO_BAGS } from './constants';

// --- Helper Functions ---
const toast = (msg: string, type: 'ok' | 'err' = 'ok') => {
  // In a real app, we'd use a state-based toast system.
  // For simplicity, we'll use a simple event emitter or just console for now, 
  // but I'll implement a proper React toast component below.
  window.dispatchEvent(new CustomEvent('app-toast', { detail: { msg, type } }));
};

const makeBarcodePattern = (text: string, className = "w-full h-9") => {
  let hash = 0;
  for (let i = 0; i < text.length; i++) hash = ((hash << 5) - hash) + text.charCodeAt(i);
  const rng = (seed: number) => { 
    seed = (seed ^ 61) ^ (seed >>> 16); 
    seed += seed << 3; 
    seed ^= seed >>> 4; 
    seed *= 0x27d4eb2d; 
    seed ^= seed >>> 15; 
    return Math.abs(seed); 
  };
  const bars: { x: number; w: number; fill: string }[] = [];
  let x = 2;
  bars.push({ x, w: 8, fill: 'white' }); x += 8;
  [3, 1, 2, 1, 1, 4].forEach(w => { bars.push({ x, w, fill: bars.length % 2 === 0 ? 'black' : 'white' }); x += w; });
  for (let i = 0; i < text.length; i++) {
    const seed = rng(hash + i * 1234567);
    const widths = [seed % 3 + 1, seed % 2 + 1, seed % 3 + 1, seed % 2 + 1, seed % 2 + 1, seed % 3 + 1];
    widths.forEach((w, j) => { bars.push({ x, w, fill: j % 2 === 0 ? 'black' : 'white' }); x += w; });
  }
  [2, 3, 3, 1, 1, 1, 2].forEach((w, j) => { bars.push({ x, w, fill: j % 2 === 0 ? 'black' : 'white' }); x += w; });
  bars.push({ x, w: 8, fill: 'white' }); x += 8;
  const totalW = x;
  const scale = 160 / totalW;
  return (
    <svg className={className} viewBox="0 0 160 36" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="160" height="36" fill="white" />
      {bars.map((b, i) => (
        <rect key={i} x={(b.x * scale).toFixed(1)} y="0" width={Math.max(0.8, parseFloat((b.w * scale).toFixed(1)))} height="36" fill={b.fill} />
      ))}
    </svg>
  );
};

const calcExpire = (collectDateStr?: string | null) => {
  const base = collectDateStr ? new Date(collectDateStr) : new Date();
  base.setDate(base.getDate() + 180);
  return base.toISOString().split('T')[0];
};

const btCode = (bloodType?: string) => {
  if (!bloodType) return 'UNK';
  const abo = bloodType.match(/[ABO]{1,2}/)?.[0] || 'UNK';
  const rh = bloodType.includes('(-)') ? 'N' : 'P';
  return abo + rh;
};

const buildBarcodeContent = (bag: Bag, applyInfo: Apply) => {
  const pid = (applyInfo.visitNo || applyInfo.admissionNo || 'UNK').replace(/[^A-Za-z0-9]/g, '');
  const treatId = (applyInfo.applyNo || '').slice(-8);
  const bagCode = (bag.storageCode || '').slice(-6);
  const bt = btCode(applyInfo.bloodType);
  const expire = calcExpire(bag.collectTime || applyInfo.planDate).replace(/-/g, '');
  return `${pid}-${treatId}-${bagCode}-${bt}-${expire}`;
};

const PatientLabel = ({ bag, apply, isPrint = false }: { bag: Bag; apply: Apply; isPrint?: boolean; key?: React.Key }) => {
  const barcodeContent = buildBarcodeContent(bag, apply);
  
  return (
    <div className={`relative bg-white text-black font-sans box-border flex flex-wrap ${!isPrint ? 'shadow-md mx-auto mb-4' : 'mb-[4mm]'}`} style={{ width: '80mm', height: '50mm', padding: '0', border: isPrint ? 'none' : '1px solid #ccc', pageBreakInside: 'avoid', overflow: 'hidden' }}>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="w-[40mm] h-[25mm] flex flex-col items-center justify-center border-r border-b border-dashed border-gray-300 box-border p-1">
          <div className="text-[9pt] font-bold mb-1 w-full text-center truncate">{apply.patientName} | {apply.bloodType}</div>
          {makeBarcodePattern(barcodeContent, 'w-[34mm] h-[8mm]')}
          <div className="text-[7pt] font-mono mt-[1mm] tracking-widest">{barcodeContent}</div>
        </div>
      ))}
    </div>
  );
};

const BloodBagLabel = ({ bag, apply, isPrint = false, index = 0 }: { bag: Bag; apply: Apply; isPrint?: boolean; key?: React.Key; index?: number }) => {
  const collectDate = bag.collectTime || apply.planDate || new Date().toISOString().split('T')[0];
  const expireDate = calcExpire(collectDate);
  const patientName = apply.patientName;
  const patientId = apply.visitNo || apply.admissionNo || '001489251000';
  const bloodType = apply.bloodType?.replace(/[^ABO]/g, '') || 'B';
  const rh = apply.bloodType?.includes('-') ? '-' : '+';
  
  // Barcode 1: Date (8 digits) + 1 + Patient Sequence (4 digits)
  // Assuming apply.id can be used as patient sequence for demo purposes
  const dateStr = collectDate.replace(/-/g, '');
  const patientSeq = String(apply.id).padStart(4, '0');
  const bc1 = `${dateStr}1${patientSeq}`;
  
  // Barcode 2: Distinction code P00VIP01, P00VIP02, etc.
  const bagSeq = String(index + 1).padStart(2, '0');
  const bc2 = `P00VIP${bagSeq}`;
  
  // Barcode 3: Blood Type Code
  const bc3 = btCode(apply.bloodType);
  
  // Barcode 4: Expire Date
  const bc4 = expireDate.replace(/-/g, '');

  // Determine time (9:00 for morning, 13:00 for afternoon)
  // For demo, we'll just use 09:00 as default or derive from applyTime if available
  const timeStr = apply.applyTime?.includes('13:') || apply.applyTime?.includes('14:') || apply.applyTime?.includes('15:') ? '13:00' : '09:00';

  // PRP Sequence
  const prpSeq = String(apply._prpN || 1).padStart(4, '0');

  return (
    <div className={`relative bg-white text-black font-sans box-border ${!isPrint ? 'shadow-md mx-auto mb-4' : 'mb-[4mm]'}`} style={{ width: '80mm', height: '50mm', padding: '0', border: isPrint ? 'none' : '1px solid #ccc', pageBreakInside: 'avoid', overflow: 'hidden' }}>
      {/* Name and ID */}
      <div className="absolute top-[3mm] left-[4mm] text-[12pt] font-bold tracking-widest">{patientName}</div>
      <div className="absolute top-[3mm] left-[20mm] text-[11pt] font-mono tracking-wider">{patientId}</div>
      
      {/* Blood Type */}
      <div className="absolute top-[3mm] right-[15mm] text-[14pt] font-bold">{bloodType}</div>
      <div className="absolute top-[3mm] right-[5mm] text-[12pt] font-bold">{rh}</div>

      {/* Barcode 1: Blood Bag Number */}
      <div className="absolute top-[9mm] left-[4mm] flex flex-col items-center">
        {makeBarcodePattern(bc1, 'w-[32mm] h-[8mm]')}
        <div className="text-[8pt] font-mono mt-[0.5mm] tracking-widest">{bc1}</div>
      </div>

      {/* Barcode 3: Blood Type Code */}
      <div className="absolute top-[9mm] right-[5mm] flex flex-col items-center">
        <div className="text-[8pt] font-bold mb-[0.5mm]">{bloodType}{rh}</div>
        {makeBarcodePattern(bc3, 'w-[18mm] h-[8mm]')}
        <div className="text-[8pt] font-mono mt-[0.5mm] tracking-widest">{bc3}</div>
      </div>

      {/* Barcode 2: Distinction Code */}
      <div className="absolute top-[21mm] left-[4mm] flex flex-col items-center">
        {makeBarcodePattern(bc2, 'w-[26mm] h-[8mm]')}
        <div className="text-[8pt] font-mono mt-[0.5mm] tracking-widest">{bc2}</div>
      </div>

      {/* Collect Time */}
      <div className="absolute top-[23mm] left-[32mm] text-[10pt] tracking-wide whitespace-nowrap">
        采血时间:{collectDate} {timeStr}
      </div>

      {/* Component Name */}
      <div className="absolute top-[33mm] left-[4mm] text-[11pt] font-bold tracking-wide">
        富血小板血浆（PRP）
      </div>

      {/* Volume */}
      <div className="absolute top-[39mm] left-[4mm] text-[10pt] tracking-wide">
        血量:1单位
      </div>

      {/* Product Code / PRP Sequence */}
      <div className="absolute top-[44mm] left-[4mm] text-[11pt] font-bold tracking-wider">
        第{apply._prpN || 1}例: PRP-{prpSeq}
      </div>

      {/* Barcode 4: Expire Time */}
      <div className="absolute top-[32mm] right-[5mm] flex flex-col items-center">
        {makeBarcodePattern(bc4, 'w-[26mm] h-[8mm]')}
        <div className="text-[8pt] font-mono mt-[0.5mm] tracking-widest">{bc4}</div>
      </div>

      {/* Expire Time Text */}
      <div className="absolute top-[44mm] right-[5mm] text-[10pt] tracking-wide whitespace-nowrap">
        失效时间: {expireDate} {timeStr}
      </div>
    </div>
  );
};

// --- Components ---

const ToastContainer = () => {
  const [toasts, setToasts] = useState<{ id: number; msg: string; type: 'ok' | 'err' }[]>([]);

  useEffect(() => {
    const handleToast = (e: any) => {
      const id = Date.now();
      setToasts(prev => [...prev, { id, ...e.detail }]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 3200);
    };
    window.addEventListener('app-toast', handleToast);
    return () => window.removeEventListener('app-toast', handleToast);
  }, []);

  return (
    <div className="fixed top-4 right-5 z-[9999] flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`px-[18px] py-[10px] rounded-md text-white text-[13px] shadow-lg flex items-center gap-2 ${t.type === 'ok' ? 'bg-accent' : 'bg-danger'}`}
          >
            {t.type === 'ok' ? <Check size={16} /> : <AlertCircle size={16} />}
            {t.msg}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default function App() {
  const [startDate, setStartDate] = useState('2024-01-01');
  const [endDate, setEndDate] = useState('2025-03-20');
  const [searchName, setSearchName] = useState('');
  const [applyList, setApplyList] = useState<Apply[]>([]);
  const [selectedApply, setSelectedApply] = useState<Apply | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [bags, setBags] = useState<Bag[]>([]);
  const [loading, setLoading] = useState(false);
  const [plansLoading, setPlansLoading] = useState(false);
  const [bagsLoading, setBagsLoading] = useState(false);

  const [showCollectModal, setShowCollectModal] = useState(false);
  const [collectData, setCollectData] = useState<CollectModalData | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Sync plans actualVolume with bags length
  useEffect(() => {
    if (plans.length > 0 && plans[0].actualVolume !== bags.length) {
      setPlans(prev => prev.map(p => ({ ...p, actualVolume: bags.length })));
    }
  }, [bags.length, plans]);

  // Initial load
  useEffect(() => {
    handleSearch();
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(r => setTimeout(r, 500));
      const list = DEMO_APPLY_LIST.filter(a => {
        const matchesName = searchName ? a.patientName.includes(searchName) : true;
        return matchesName;
      });
      setApplyList(list);
    } catch (e) {
      toast('查询失败', 'err');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectApply = async (apply: Apply) => {
    setSelectedApply(apply);
    setPlansLoading(true);
    setBagsLoading(true);
    try {
      // Simulate API calls
      await new Promise(r => setTimeout(r, 400));
      const initialPlans = DEMO_PLANS[apply.id] || [];
      setPlans(initialPlans);
      
      const defaultBagCount = initialPlans.length > 0 ? initialPlans[0].planVolume : 5;
      setBags(DEMO_BAGS[apply.id] || Array.from({ length: defaultBagCount }, (_, i) => ({
        id: apply.id * 100 + i + 1,
        storageCode: `20241201${String(apply.id * 100 + i + 1).padStart(5, '0')}`,
        productCode: null,
        bloodComponent: null,
        volume: 0,
        status: '未入库',
        collectTime: null
      })));
    } catch (e) {
      toast('加载详情失败', 'err');
    } finally {
      setPlansLoading(false);
      setBagsLoading(false);
    }
  };

  const handleOpenCollect = (bag: Bag) => {
    if (!selectedApply) return;
    setCollectData({
      applyId: selectedApply.id,
      patientName: selectedApply.patientName,
      gender: selectedApply.gender,
      age: selectedApply.age,
      bloodType: selectedApply.bloodType,
      visitNo: selectedApply.visitNo,
      applyNo: selectedApply.applyNo,
      bagCodes: [bag.storageCode],
      patientBloodType: selectedApply.bloodType,
      collectDate: new Date().toISOString().split('T')[0],
      drugs: [{ drugTime: '', drugName: '', dosage: '', route: '' }]
    });
    setShowCollectModal(true);
  };

  const handleAddBag = () => {
    if (!selectedApply) return;
    const nextIdx = bags.length;
    const newBag: Bag = {
      id: Date.now(),
      storageCode: `20241201${String(selectedApply.id * 100 + nextIdx + 1).padStart(5, '0')}`,
      productCode: null,
      bloodComponent: null,
      volume: 0,
      status: '未入库',
      collectTime: null
    };
    setBags(prev => [...prev, newBag]);
    toast('已新增一袋');
  };

  const handleRemoveBag = () => {
    if (bags.length <= 1) {
      toast('至少保留一袋', 'err');
      return;
    }
    setBags(prev => prev.slice(0, -1));
    toast('已删除一袋');
  };

  const handleSubmitCollect = async (data: CollectModalData) => {
    try {
      // Simulate submit
      await new Promise(r => setTimeout(r, 800));
      toast('登记完成，血袋状态已更新为已入库 ✓');
      setShowCollectModal(false);
      // Update local state
      const perBagVol = data.bloodCollectionVol ? data.bloodCollectionVol / bags.length : 0;
      setBags(prev => prev.map(b => ({ 
        ...b, 
        status: '已入库', 
        collectTime: data.collectDate || null,
        volume: perBagVol
      })));
    } catch (e) {
      toast('提交失败', 'err');
    }
  };

  const handlePrint = () => {
    window.print();
    setShowPrintModal(false);
    toast(`已发送打印，共 ${bags.length + 1} 张标签`);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-bg">
      <ToastContainer />

      {/* Topbar */}
      <header className="bg-primary-dark text-white px-4 h-[38px] flex items-center gap-4 shrink-0">
        <div className="flex h-full">
          <div className="px-3.5 h-full flex items-center cursor-pointer opacity-75 hover:opacity-100 transition-opacity">主页</div>
          <div className="px-3.5 h-full flex items-center cursor-pointer bg-bg text-primary-dark rounded-t-md font-medium">自体血管理</div>
        </div>
      </header>

      <main className="flex-1 flex flex-col p-2.5 gap-2 overflow-hidden">
        {/* Filter Bar */}
        <div className="bg-card border border-border rounded-md px-3.5 py-2 flex items-center gap-2.5 shrink-0">
          <label className="text-text-muted whitespace-nowrap">申请日期</label>
          <input 
            type="date" 
            value={startDate} 
            onChange={e => setStartDate(e.target.value)}
            className="border border-border rounded px-2 py-1 text-[13px] w-[130px] outline-none focus:border-primary-light"
          />
          <span className="text-text-muted">—</span>
          <input 
            type="date" 
            value={endDate} 
            onChange={e => setEndDate(e.target.value)}
            className="border border-border rounded px-2 py-1 text-[13px] w-[130px] outline-none focus:border-primary-light"
          />
          <input 
            type="text" 
            placeholder="患者姓名" 
            value={searchName}
            onChange={e => setSearchName(e.target.value)}
            className="border border-border rounded px-2 py-1 text-[13px] w-[100px] outline-none focus:border-primary-light"
          />
          <button 
            onClick={handleSearch}
            className="bg-primary text-white px-3 py-1.5 rounded text-[12px] flex items-center gap-1 hover:brightness-110 transition-all disabled:opacity-50"
            disabled={loading}
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
            查询
          </button>
          <button className="bg-info text-white px-3 py-1.5 rounded text-[12px] flex items-center gap-1 hover:brightness-110 transition-all">
            查看采血申请单
          </button>
          <button className="bg-[#ecf0f1] text-text border border-border px-3 py-1.5 rounded text-[12px] flex items-center gap-1 hover:brightness-110 transition-all">
            ¥ 费用信息
          </button>
        </div>

        {/* Split Layout */}
        <div className="flex-1 flex flex-col gap-2 overflow-hidden">
          {/* Top Panel: Apply Table */}
          <div className="bg-card border border-border rounded-md overflow-hidden shrink-0 max-h-[230px] flex flex-col">
            <div className="table-wrap flex-1">
              <table>
                <thead>
                  <tr>
                    <th>申请类型</th>
                    <th>输血性质</th>
                    <th>申请日期</th>
                    <th>申请单号</th>
                    <th>预定日期</th>
                    <th>姓名</th>
                    <th>血型</th>
                    <th>RhD</th>
                    <th>性别</th>
                    <th>年龄</th>
                    <th>就诊号</th>
                    <th>住院号</th>
                    <th>申请医师</th>
                    <th>申请科室</th>
                  </tr>
                </thead>
                <tbody>
                  {applyList.length === 0 ? (
                    <tr className="empty-row">
                      <td colSpan={14} className="text-center py-5 text-text-muted italic">暂无数据</td>
                    </tr>
                  ) : (
                    applyList.map(a => (
                      <tr 
                        key={a.id} 
                        onClick={() => handleSelectApply(a)}
                        className={selectedApply?.id === a.id ? 'selected' : ''}
                      >
                        <td>{a.applyType}</td>
                        <td>{a.bloodNature}</td>
                        <td>{a.applyTime}</td>
                        <td>{a.applyNo}</td>
                        <td>{a.planDate}</td>
                        <td>{a.patientName}</td>
                        <td>{a.bloodType.split(' ')[0]}</td>
                        <td>{a.bloodType.split(' ')[1] || ''}</td>
                        <td>{a.gender}</td>
                        <td>{a.age}</td>
                        <td>{a.visitNo}</td>
                        <td>{a.admissionNo}</td>
                        <td>{a.applyDoctor}</td>
                        <td>{a.applyDept}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom Panels */}
          <div className="flex gap-2 flex-1 overflow-hidden min-h-0">
            {/* Left: Plan Table */}
            <div className="bg-card border border-border rounded-md overflow-hidden flex flex-col w-[42%]">
              <div className="px-3 py-1.5 bg-[#f7fafc] border-b border-border flex items-center gap-1.5 shrink-0">
                <button 
                  onClick={() => setShowPrintModal(true)}
                  disabled={!selectedApply || bags.length === 0}
                  className="bg-primary text-white px-2.5 py-1 rounded text-[12px] flex items-center gap-1 hover:brightness-110 transition-all disabled:opacity-50"
                >
                  <Printer size={14} /> 打印标签
                </button>
                <button 
                  onClick={() => bags.length > 0 && handleOpenCollect(bags[0])}
                  disabled={!selectedApply || bags.length === 0}
                  className="bg-accent text-white px-2.5 py-1 rounded text-[12px] flex items-center gap-1 hover:brightness-110 transition-all disabled:opacity-50"
                >
                  <Edit size={14} /> 登记采集信息
                </button>
                {plansLoading && <Loader2 size={14} className="animate-spin text-primary" />}
              </div>
              <div className="table-wrap flex-1">
                <table>
                  <thead>
                    <tr>
                      <th>计划采血时间</th>
                      <th>血液成分</th>
                      <th>计划采血</th>
                      <th>已采血</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plans.length === 0 ? (
                      <tr className="empty-row">
                        <td colSpan={4} className="text-center py-5 text-text-muted italic">
                          {!selectedApply ? '请先选择申请单' : '暂无计划'}
                        </td>
                      </tr>
                    ) : (
                      plans.map((p, i) => (
                        <tr key={i} className="selected">
                          <td>{p.planTime}</td>
                          <td>{p.bloodComponent}</td>
                          <td>{p.planVolume}单位</td>
                          <td>{p.actualVolume}单位</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right: Bag Table */}
            <div className="bg-card border border-border rounded-md overflow-hidden flex flex-col flex-1">
              <div className="px-3 py-1.5 bg-[#f7fafc] border-b border-border flex items-center gap-1.5 shrink-0">
                <button 
                  onClick={() => setShowPrintModal(true)}
                  disabled={!selectedApply || bags.length === 0}
                  className="bg-primary text-white px-2.5 py-1 rounded text-[12px] flex items-center gap-1 hover:brightness-110 transition-all disabled:opacity-50"
                >
                  <Printer size={14} /> 打印标签
                </button>
                <button 
                  onClick={handleAddBag}
                  disabled={!selectedApply}
                  className="bg-accent text-white px-2.5 py-1 rounded text-[12px] flex items-center gap-1 hover:brightness-110 transition-all disabled:opacity-50"
                >
                  <Plus size={14} /> 新增
                </button>
                <button 
                  onClick={handleRemoveBag}
                  disabled={!selectedApply || bags.length <= 1}
                  className="bg-danger text-white px-2.5 py-1 rounded text-[12px] flex items-center gap-1 hover:brightness-110 transition-all disabled:opacity-50"
                >
                  <Minus size={14} /> 删除
                </button>
                {bagsLoading && <Loader2 size={14} className="animate-spin text-primary" />}
              </div>
              <div className="table-wrap flex-1">
                <table>
                  <thead>
                    <tr>
                      <th>状态</th>
                      <th>储血码</th>
                      <th>产品码</th>
                      <th>血液成分</th>
                      <th>血量</th>
                      <th>采集信息</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bags.length === 0 ? (
                      <tr className="empty-row">
                        <td colSpan={6} className="text-center py-5 text-text-muted italic">
                          {!selectedApply ? '请先选择申请单' : '暂无血袋记录'}
                        </td>
                      </tr>
                    ) : (
                      bags.map(b => (
                        <tr key={b.id}>
                          <td>
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium ${b.status === '已入库' ? 'bg-instock-bg text-instock-fg' : 'bg-unstock-bg text-unstock-fg'}`}>
                              {b.status}
                            </span>
                          </td>
                          <td>{b.storageCode}</td>
                          <td>{b.productCode || '--'}</td>
                          <td>{b.bloodComponent || '--'}</td>
                          <td>1单位</td>
                          <td>{b.collectTime || '--'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Collect Modal */}
      <AnimatePresence>
        {showCollectModal && collectData && (
          <div className="fixed inset-0 bg-black/55 flex items-center justify-center z-[1000] backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-xl w-full max-w-[820px] max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col"
            >
              <div className="bg-gradient-to-br from-primary-dark to-primary text-white px-5 py-3.5 flex items-center justify-between shrink-0">
                <div>
                  <h3 className="text-base font-semibold">登记采集信息</h3>
                  <div className="text-[12px] opacity-80 mt-0.5">PRP采集 · 一次填写，适用本次所有血袋</div>
                </div>
                <button onClick={() => setShowCollectModal(false)} className="w-6.5 h-6.5 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/35 transition-colors">
                  <X size={15} />
                </button>
              </div>

              <div className="p-[18px] flex flex-col gap-3.5">
                {/* Patient Info Bar */}
                <div className="bg-[#f0f7fb] border border-[#c5dce9] rounded-md p-2.5 px-4 flex gap-5 flex-wrap items-center">
                  <div className="flex flex-col gap-0.5">
                    <div className="text-[11px] text-text-muted">姓名</div>
                    <div className="font-semibold text-primary-dark text-sm">{collectData.patientName}</div>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <div className="text-[11px] text-text-muted">性别</div>
                    <div className="font-semibold text-primary-dark text-sm">{collectData.gender}</div>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <div className="text-[11px] text-text-muted">年龄</div>
                    <div className="font-semibold text-primary-dark text-sm">{collectData.age}岁</div>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <div className="text-[11px] text-text-muted">就诊号</div>
                    <div className="font-semibold text-primary-dark text-sm">{collectData.visitNo}</div>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <div className="text-[11px] text-text-muted">血型</div>
                    <div className="font-semibold text-primary-dark text-sm">{collectData.bloodType}</div>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <div className="text-[11px] text-text-muted">储血码</div>
                    <div className="font-semibold text-primary-dark text-sm">{collectData.bagCodes[0]}</div>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <div className="text-[11px] text-text-muted">申请单号</div>
                    <div className="font-semibold text-primary-dark text-sm">{collectData.applyNo}</div>
                  </div>
                  <div className="flex flex-col gap-1 w-full mt-1 pt-2 border-t border-dashed border-[#c5dce9]">
                    <div className="flex items-center justify-between">
                      <div className="text-[11px] text-text-muted flex items-center gap-1">
                        <Stethoscope size={12} /> 最近血常规日期: 2025-11-17
                      </div>
                      <button className="text-[11px] text-primary border border-primary/30 bg-primary/5 px-2 py-0.5 rounded hover:bg-primary/10 transition-colors">
                        提取最近的血常规信息
                      </button>
                    </div>
                    <div className="text-[12px] text-primary-dark font-medium flex flex-wrap gap-x-4 gap-y-1">
                      <span>HGB: 130g/L</span>
                      <span>红细胞计数: 4.29x10^12/L</span>
                      <span>白细胞: 7.56x10^9/L</span>
                      <span>血小板: 365x10^9/L</span>
                      <span>红细胞压积: 38%</span>
                    </div>
                  </div>
                </div>

                <hr className="border-border" />

                {/* Form Sections */}
                <div className="flex flex-col gap-2">
                  <div className="text-[13px] font-semibold text-primary border-l-3 border-primary pl-2 flex items-center gap-1.5">
                    <Info size={14} /> 采集基本信息
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="flex flex-col gap-1">
                      <label className="text-[12px] text-text-muted">采集者<span className="text-danger">*</span></label>
                      <select 
                        value={collectData.collector || ''}
                        onChange={e => setCollectData({ ...collectData, collector: e.target.value })}
                        className="border border-border rounded px-2 py-1.5 text-[13px] outline-none focus:border-primary-light"
                      >
                        <option value="">-- 请选择 --</option>
                        <option value="张护士">张护士（工号001）</option>
                        <option value="李护士">李护士（工号002）</option>
                        <option value="王护士">王护士（工号003）</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[12px] text-text-muted">采集日期<span className="text-danger">*</span></label>
                      <input 
                        type="date" 
                        value={collectData.collectDate || ''}
                        onChange={e => setCollectData({ ...collectData, collectDate: e.target.value })}
                        className="border border-border rounded px-2 py-1.5 text-[13px] outline-none focus:border-primary-light"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[12px] text-text-muted">患者血型<span className="text-danger">*</span></label>
                      <div className="flex gap-1.5">
                        <select 
                          className="flex-1 border border-border rounded px-2 py-1.5 text-[13px] outline-none focus:border-primary-light"
                          value={collectData.patientBloodType?.split(' ')[0] || ''}
                          onChange={e => {
                            const rh = collectData.patientBloodType?.split(' ')[1] || 'RhD(+)';
                            setCollectData({ ...collectData, patientBloodType: `${e.target.value} ${rh}` });
                          }}
                        >
                          <option>A</option><option>B</option><option>O</option><option>AB</option>
                        </select>
                        <select 
                          className="flex-1 border border-border rounded px-2 py-1.5 text-[13px] outline-none focus:border-primary-light"
                          value={collectData.patientBloodType?.split(' ')[1] || ''}
                          onChange={e => {
                            const abo = collectData.patientBloodType?.split(' ')[0] || 'A';
                            setCollectData({ ...collectData, patientBloodType: `${abo} ${e.target.value}` });
                          }}
                        >
                          <option>RhD(+)</option><option>RhD(-)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <hr className="border-border" />

                <div className="flex flex-col gap-2">
                  <div className="text-[13px] font-semibold text-primary border-l-3 border-primary pl-2 flex items-center gap-1.5">
                    <Settings size={14} /> 治疗参数
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: '总循环血量（ml）', key: 'totalVolume' },
                      { label: '采血量（ml）', key: 'bloodCollectionVol' },
                      { label: '血浆采集量（ml）', key: 'plasmaVolume' },
                      { label: '抗凝剂使用量（ml）', key: 'anticoagulantVol' },
                      { label: '循环次数（次）', key: 'cycleCount' },
                      { label: '持续时间（min）', key: 'durationMin' },
                    ].map(f => (
                      <div key={f.key} className="flex flex-col gap-1">
                        <label className="text-[12px] text-text-muted">{f.label}</label>
                        <input 
                          type="number" 
                          placeholder="请输入"
                          value={(collectData as any)[f.key] || ''}
                          onChange={e => setCollectData({ ...collectData, [f.key]: e.target.value ? parseFloat(e.target.value) : undefined })}
                          className="border border-border rounded px-2 py-1.5 text-[13px] outline-none focus:border-primary-light"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <hr className="border-border" />

                <div className="flex flex-col gap-2">
                  <div className="text-[13px] font-semibold text-primary border-l-3 border-primary pl-2 flex items-center gap-1.5">
                    <Heart size={14} /> 生命体征
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1">
                      <label className="text-[12px] text-text-muted">开始时间<span className="text-danger">*</span></label>
                      <input type="time" className="border border-border rounded px-2 py-1.5 text-[13px] outline-none focus:border-primary-light" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[12px] text-text-muted">结束时间</label>
                      <input type="time" className="border border-border rounded px-2 py-1.5 text-[13px] outline-none focus:border-primary-light" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="flex flex-col gap-1">
                      <label className="text-[12px] text-text-muted">治疗前 血压(mmHg) / 心率(/min)</label>
                      <div className="flex items-center gap-1.5">
                        <input type="number" placeholder="收缩压" className="w-16 border border-border rounded px-2 py-1.5 text-[13px] outline-none focus:border-primary-light" />
                        <span className="text-text-muted">/</span>
                        <input type="number" placeholder="舒张压" className="w-16 border border-border rounded px-2 py-1.5 text-[13px] outline-none focus:border-primary-light" />
                        <span className="text-[11px] text-text-muted">mmHg</span>
                        <span className="text-text-muted mx-1">·</span>
                        <input type="number" placeholder="心率" className="w-14 border border-border rounded px-2 py-1.5 text-[13px] outline-none focus:border-primary-light" />
                        <span className="text-[11px] text-text-muted">/min</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[12px] text-text-muted">治疗后 血压(mmHg) / 心率(/min)</label>
                      <div className="flex items-center gap-1.5">
                        <input type="number" placeholder="收缩压" className="w-16 border border-border rounded px-2 py-1.5 text-[13px] outline-none focus:border-primary-light" />
                        <span className="text-text-muted">/</span>
                        <input type="number" placeholder="舒张压" className="w-16 border border-border rounded px-2 py-1.5 text-[13px] outline-none focus:border-primary-light" />
                        <span className="text-[11px] text-text-muted">mmHg</span>
                        <span className="text-text-muted mx-1">·</span>
                        <input type="number" placeholder="心率" className="w-14 border border-border rounded px-2 py-1.5 text-[13px] outline-none focus:border-primary-light" />
                        <span className="text-[11px] text-text-muted">/min</span>
                      </div>
                    </div>
                  </div>
                </div>

                <hr className="border-border" />

                <div className="flex flex-col gap-2">
                  <div className="text-[13px] font-semibold text-primary border-l-3 border-primary pl-2 flex items-center gap-1.5">
                    <Pill size={14} /> 治疗中药物使用情况
                  </div>
                  <table className="w-full border-collapse text-[12px]">
                    <thead>
                      <tr className="bg-[#f5f8fa]">
                        <th className="w-[120px] p-1.5 text-left text-text-muted border-b border-border">时间</th>
                        <th className="p-1.5 text-left text-text-muted border-b border-border">内容 (药物-剂量-途径)</th>
                        <th className="w-[36px] p-1.5 border-b border-border"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {(collectData.drugs || []).map((d, i) => (
                        <tr key={i} className="border-b border-[#f0f3f5]">
                          <td className="p-1">
                            <input 
                              type="time" 
                              value={d.drugTime || ''}
                              onChange={e => {
                                const newDrugs = [...(collectData.drugs || [])];
                                newDrugs[i].drugTime = e.target.value;
                                setCollectData({ ...collectData, drugs: newDrugs });
                              }}
                              className="w-full border border-border rounded px-1.5 py-1 text-[12px] outline-none focus:border-primary-light" 
                            />
                          </td>
                          <td className="p-1">
                            <select 
                              value={d.drugName || ''}
                              onChange={e => {
                                const newDrugs = [...(collectData.drugs || [])];
                                newDrugs[i].drugName = e.target.value;
                                setCollectData({ ...collectData, drugs: newDrugs });
                              }}
                              className="w-full border border-border rounded px-1.5 py-1 text-[12px] outline-none focus:border-primary-light"
                            >
                              <option value="">-- 请选择 --</option>
                              <option value="乳酸林格氏液 100mL 静脉输液">乳酸林格氏液 100mL 静脉输液</option>
                              <option value="乳酸林格氏液 150mL 静脉输液">乳酸林格氏液 150mL 静脉输液</option>
                              <option value="乳酸林格氏液 200mL 静脉输液">乳酸林格氏液 200mL 静脉输液</option>
                              <option value="氯化钠注射液 100mL 静脉输液">氯化钠注射液 100mL 静脉输液</option>
                              <option value="氯化钠注射液 150mL 静脉输液">氯化钠注射液 150mL 静脉输液</option>
                              <option value="氯化钠注射液 200mL 静脉输液">氯化钠注射液 200mL 静脉输液</option>
                              <option value="20%葡萄糖注射液 10g 口服">20%葡萄糖注射液 10g 口服</option>
                              <option value="葡萄糖氯化钠注射液 150mL 静脉输液">葡萄糖氯化钠注射液 150mL 静脉输液</option>
                            </select>
                          </td>
                          <td className="p-1 text-center">
                            <button 
                              onClick={() => {
                                const newDrugs = [...(collectData.drugs || [])];
                                newDrugs.splice(i, 1);
                                setCollectData({ ...collectData, drugs: newDrugs });
                              }}
                              className="text-danger hover:scale-110 transition-transform"
                            >
                              <X size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <button 
                    onClick={() => setCollectData({ ...collectData, drugs: [...(collectData.drugs || []), { drugTime: '', drugName: '', dosage: '', route: '' }] })}
                    className="self-start text-[12px] text-primary border border-dashed border-primary-light rounded px-2.5 py-1 mt-1 hover:bg-accent-light transition-colors"
                  >
                    ＋ 添加用药记录
                  </button>
                </div>

                <hr className="border-border" />

                <div className="flex flex-col gap-2">
                  <div className="text-[13px] font-semibold text-primary border-l-3 border-primary pl-2 flex items-center gap-1.5">
                    <AlertCircle size={14} /> 治疗中不良反应
                  </div>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={collectData.noAdverse}
                      onChange={e => setCollectData({ ...collectData, noAdverse: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="font-medium">无不良反应</span>
                  </label>
                  <div className={`mt-2 flex flex-col gap-2 transition-opacity ${collectData.noAdverse ? 'opacity-30 pointer-events-none' : ''}`}>
                    <div className="flex gap-3.5 flex-wrap text-[13px]">
                      {['低血钙反应（手足抽搐）', '低血压', '头晕/恶心', '过敏反应', '其他'].map(v => (
                        <label key={v} className="flex items-center gap-1.5 cursor-pointer">
                          <input type="checkbox" className="w-4 h-4" /> {v}
                        </label>
                      ))}
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[12px] text-text-muted">不良反应描述</label>
                      <select 
                        value={collectData.adverseDesc || ''}
                        onChange={e => setCollectData({ ...collectData, adverseDesc: e.target.value })}
                        className="border border-border rounded px-2 py-1.5 text-[13px] outline-none focus:border-primary-light"
                      >
                        <option value="">-- 请选择 --</option>
                        <option value="头晕，血压降低">头晕，血压降低</option>
                        <option value="口周发麻">口周发麻</option>
                        <option value="晕针晕血">晕针晕血</option>
                      </select>
                    </div>
                  </div>
                </div>

                <hr className="border-border" />

                <div className="flex flex-col gap-2">
                  <div className="text-[13px] font-semibold text-primary border-l-3 border-primary pl-2 flex items-center gap-1.5">
                    <Info size={14} /> 备注
                  </div>
                  <select 
                    value={collectData.remarks || ''}
                    onChange={e => setCollectData({ ...collectData, remarks: e.target.value })}
                    className="border border-border rounded px-2 py-1.5 text-[13px] outline-none focus:border-primary-light"
                  >
                    <option value="">-- 请选择 --</option>
                    <option value="服用阿司匹林 50mg/天">服用阿司匹林 50mg/天</option>
                    <option value="服用阿司匹林 75mg/天">服用阿司匹林 75mg/天</option>
                    <option value="无阿司匹林肝素应用">无阿司匹林肝素应用</option>
                    <option value="血管细，采集报警">血管细，采集报警</option>
                  </select>
                </div>
              </div>

              <div className="px-5 py-3 border-t border-border flex items-center justify-between bg-[#fafcfd] rounded-b-xl shrink-0">
                <div className="text-[12px] text-text-muted">登记完成后，本次所有血袋状态将变为 <strong>已入库</strong></div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setShowCollectModal(false)}
                    className="bg-[#ecf0f1] text-text border border-border px-4 py-1.5 rounded text-[13px] hover:brightness-105 transition-all"
                  >
                    取消
                  </button>
                  <button 
                    onClick={() => handleSubmitCollect(collectData)}
                    className="bg-accent text-white px-4 py-1.5 rounded text-[13px] flex items-center gap-1 hover:brightness-110 transition-all"
                  >
                    <Check size={16} /> 登记完成
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Print Modal */}
      <AnimatePresence>
        {showPrintModal && selectedApply && (
          <div className="fixed inset-0 bg-black/55 flex items-center justify-center z-[1000] backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-xl w-full max-w-[680px] max-h-[88vh] overflow-y-auto shadow-2xl flex flex-col"
            >
              <div className="bg-gradient-to-br from-primary-dark to-primary text-white px-5 py-3.5 flex items-center justify-between shrink-0">
                <div>
                  <h3 className="text-base font-semibold">🖨 打印标签</h3>
                  <div className="text-[12px] opacity-80 mt-0.5">
                    {selectedApply.patientName} | {selectedApply.bloodType} | PRP-{selectedApply._prpN || 1} | 共 {bags.length} 袋
                  </div>
                </div>
                <button onClick={() => setShowPrintModal(false)} className="w-6.5 h-6.5 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/35 transition-colors">
                  <X size={15} />
                </button>
              </div>

              <div className="p-[18px] flex flex-col gap-3">
                <div className="text-[12px] text-text-muted bg-[#f5f8fa] border border-border rounded-md p-2 px-3 leading-relaxed">
                  <strong>条码内容说明：</strong>患者ID · 本次治疗ID(申请单号后8位) · 血袋区别码(储血码后6位) · 血型码 · 失效日期(采集日+190天)<br />
                  <span className="text-[#888]">示例：{buildBarcodeContent(bags[0], selectedApply)}</span>
                </div>

                <div className="grid grid-cols-1 gap-4 place-items-center bg-[#f0f3f5] p-4 rounded-lg">
                  <div className="text-sm text-text-muted font-medium w-full text-center">患者核对标签预览 (1张)</div>
                  {bags.slice(0, 1).map((bag) => (
                    <PatientLabel key={bag.id} bag={bag} apply={selectedApply} />
                  ))}
                  
                  <div className="text-sm text-text-muted font-medium w-full text-center mt-2">血袋标签预览 (共{bags.length}张)</div>
                  {bags.slice(0, 1).map((bag, index) => (
                    <BloodBagLabel key={bag.id} bag={bag} apply={selectedApply} index={index} />
                  ))}
                </div>
              </div>

              <div className="px-5 py-3 border-t border-border flex items-center justify-between bg-[#fafcfd] rounded-b-xl shrink-0">
                <div className="text-[12px] text-text-muted">共 <strong>{bags.length + 1}</strong> 张标签</div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setShowPrintModal(false)}
                    className="bg-[#ecf0f1] text-text border border-border px-4 py-1.5 rounded text-[13px] hover:brightness-105 transition-all"
                  >
                    取消
                  </button>
                  <button 
                    onClick={handlePrint}
                    className="bg-primary text-white px-4 py-1.5 rounded text-[13px] flex items-center gap-1 hover:brightness-110 transition-all"
                  >
                    <Printer size={16} /> 确认打印
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Hidden Print Area */}
      <div id="printArea" className="hidden print:flex print:flex-wrap print:content-start print:gap-0 print:p-[8mm] print:bg-white print:fixed print:inset-0">
        {selectedApply && showPrintModal && bags.slice(0, 1).map((bag) => (
          <PatientLabel key={bag.id} bag={bag} apply={selectedApply} isPrint={true} />
        ))}
        {selectedApply && showPrintModal && bags.map((bag, index) => (
          <BloodBagLabel key={bag.id} bag={bag} apply={selectedApply} isPrint={true} index={index} />
        ))}
      </div>
    </div>
  );
}
