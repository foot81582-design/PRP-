export interface Apply {
  id: number;
  applyType: string;
  bloodNature: string;
  applyTime: string;
  applyNo: string;
  planDate: string;
  patientName: string;
  bloodType: string;
  gender: string;
  age: number;
  visitNo: string;
  admissionNo: string;
  applyDoctor: string;
  applyDept: string;
  _prpN?: number;
}

export interface Plan {
  planTime: string;
  bloodComponent: string;
  planVolume: number;
  actualVolume: number;
}

export interface Bag {
  id: number;
  storageCode: string;
  productCode: string | null;
  bloodComponent: string | null;
  volume: number;
  status: '已入库' | '未入库';
  collectTime: string | null;
}

export interface DrugRecord {
  drugTime: string | null;
  drugName: string;
  dosage: string | null;
  route: string | null;
}

export interface CollectModalData {
  applyId: number;
  patientName: string;
  gender: string;
  age: string | number;
  bloodType: string;
  visitNo: string;
  applyNo: string;
  bagCodes: string[];
  patientBloodType?: string;
  collector?: string;
  collectDate?: string;
  totalVolume?: number;
  bloodCollectionVol?: number;
  plasmaVolume?: number;
  anticoagulantVol?: number;
  cycleCount?: number;
  durationMin?: number;
  startTime?: string;
  endTime?: string;
  bpBeforeSystolic?: number;
  bpBeforeDiastolic?: number;
  hrBefore?: number;
  bpAfterSystolic?: number;
  bpAfterDiastolic?: number;
  hrAfter?: number;
  noAdverse?: boolean;
  adverseDesc?: string;
  remarks?: string;
  drugs?: DrugRecord[];
}
