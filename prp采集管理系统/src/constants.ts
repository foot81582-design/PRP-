import { Apply, Plan, Bag } from './types';

export const DEMO_APPLY_LIST: Apply[] = [
  {
    id: 1,
    applyType: '自体采血',
    bloodNature: 'PRP治疗用血',
    applyTime: '2024-07-19 09:22:49',
    applyNo: 'SCR20240719001',
    planDate: '2024-07-20',
    patientName: '张伟',
    bloodType: 'A RhD(+)',
    gender: '男',
    age: 35,
    visitNo: 'V20240001',
    admissionNo: 'C20240001',
    applyDoctor: '薛春山',
    applyDept: '骨科',
    _prpN: 1
  },
  {
    id: 2,
    applyType: '自体采血',
    bloodNature: 'PRP治疗用血',
    applyTime: '2024-09-05 10:15:00',
    applyNo: 'SCR20240905001',
    planDate: '2024-09-06',
    patientName: '王芳',
    bloodType: 'A RhD(-)',
    gender: '女',
    age: 28,
    visitNo: 'V20240005',
    admissionNo: 'C20240005',
    applyDoctor: '周建国',
    applyDept: '骨科',
    _prpN: 2
  },
  {
    id: 3,
    applyType: '自体采血',
    bloodNature: 'PRP治疗用血',
    applyTime: '2024-10-12 14:30:00',
    applyNo: 'SCR20241012001',
    planDate: '2024-10-13',
    patientName: '李秀英',
    bloodType: 'B RhD(+)',
    gender: '女',
    age: 42,
    visitNo: 'V20240002',
    admissionNo: 'C20240002',
    applyDoctor: '肖彬彬',
    applyDept: '整形外科',
    _prpN: 1
  },
  {
    id: 4,
    applyType: '自体采血',
    bloodNature: 'PRP治疗用血',
    applyTime: '2024-08-20 11:00:00',
    applyNo: 'SCR20240820001',
    planDate: '2024-08-21',
    patientName: '赵磊',
    bloodType: 'AB RhD(+)',
    gender: '男',
    age: 50,
    visitNo: 'V20240004',
    admissionNo: 'C20240004',
    applyDoctor: '吴明',
    applyDept: '生殖医学科',
    _prpN: 1
  },
  {
    id: 5,
    applyType: '自体采血',
    bloodNature: 'PRP治疗用血',
    applyTime: '2024-10-01 09:30:00',
    applyNo: 'SCR20241001001',
    planDate: '2024-10-02',
    patientName: '陈静',
    bloodType: 'AB RhD(+)',
    gender: '女',
    age: 33,
    visitNo: 'V20240006',
    admissionNo: 'C20240006',
    applyDoctor: '郑丽',
    applyDept: '康复科',
    _prpN: 2
  }
];

export const DEMO_PLANS: Record<number, Plan[]> = {
  1: [{ planTime: '2024-07-19 00:00:00', bloodComponent: 'prp（c）', planVolume: 5, actualVolume: 5 }],
  2: [{ planTime: '2024-09-05 00:00:00', bloodComponent: 'prp（c）', planVolume: 5, actualVolume: 5 }],
  3: [{ planTime: '2024-10-12 00:00:00', bloodComponent: 'prp（c）', planVolume: 5, actualVolume: 5 }],
  4: [{ planTime: '2024-08-20 00:00:00', bloodComponent: 'prp（c）', planVolume: 5, actualVolume: 5 }],
  5: [{ planTime: '2024-10-01 00:00:00', bloodComponent: 'prp（c）', planVolume: 5, actualVolume: 5 }]
};

export const DEMO_BAGS: Record<number, Bag[]> = {
  1: [
    { id: 101, storageCode: '2024071900001', productCode: 'PRP00001', bloodComponent: 'prp（c）', volume: 10, status: '已入库', collectTime: '2024-07-19' },
    { id: 102, storageCode: '2024071900002', productCode: 'PRP00001', bloodComponent: 'prp（c）', volume: 10, status: '已入库', collectTime: '2024-07-19' },
    { id: 103, storageCode: '2024071900003', productCode: 'PRP00001', bloodComponent: 'prp（c）', volume: 10, status: '已入库', collectTime: '2024-07-19' },
    { id: 104, storageCode: '2024071900004', productCode: 'PRP00001', bloodComponent: 'prp（c）', volume: 10, status: '已入库', collectTime: '2024-07-19' },
    { id: 105, storageCode: '2024071900005', productCode: 'PRP00001', bloodComponent: 'prp（c）', volume: 10, status: '已入库', collectTime: '2024-07-19' }
  ],
  2: [
    { id: 201, storageCode: '2024090500001', productCode: 'PRP00001', bloodComponent: 'prp（c）', volume: 10, status: '已入库', collectTime: '2024-09-05' },
    { id: 202, storageCode: '2024090500002', productCode: 'PRP00001', bloodComponent: 'prp（c）', volume: 10, status: '已入库', collectTime: '2024-09-05' },
    { id: 203, storageCode: '2024090500003', productCode: 'PRP00001', bloodComponent: 'prp（c）', volume: 10, status: '已入库', collectTime: '2024-09-05' },
    { id: 204, storageCode: '2024090500004', productCode: 'PRP00001', bloodComponent: 'prp（c）', volume: 10, status: '已入库', collectTime: '2024-09-05' },
    { id: 205, storageCode: '2024090500005', productCode: 'PRP00001', bloodComponent: 'prp（c）', volume: 10, status: '已入库', collectTime: '2024-09-05' }
  ],
  3: [
    { id: 301, storageCode: '2024101200001', productCode: 'PRP00002', bloodComponent: 'prp（c）', volume: 10, status: '已入库', collectTime: '2024-10-12' },
    { id: 302, storageCode: '2024101200002', productCode: 'PRP00002', bloodComponent: 'prp（c）', volume: 10, status: '已入库', collectTime: '2024-10-12' },
    { id: 303, storageCode: '2024101200003', productCode: 'PRP00002', bloodComponent: 'prp（c）', volume: 10, status: '已入库', collectTime: '2024-10-12' },
    { id: 304, storageCode: '2024101200004', productCode: 'PRP00002', bloodComponent: 'prp（c）', volume: 10, status: '已入库', collectTime: '2024-10-12' },
    { id: 305, storageCode: '2024101200005', productCode: 'PRP00002', bloodComponent: 'prp（c）', volume: 10, status: '已入库', collectTime: '2024-10-12' }
  ],
  4: [
    { id: 401, storageCode: '2024082000001', productCode: 'PRP00003', bloodComponent: 'prp（c）', volume: 10, status: '已入库', collectTime: '2024-08-20' },
    { id: 402, storageCode: '2024082000002', productCode: 'PRP00003', bloodComponent: 'prp（c）', volume: 10, status: '已入库', collectTime: '2024-08-20' },
    { id: 403, storageCode: '2024082000003', productCode: 'PRP00003', bloodComponent: 'prp（c）', volume: 10, status: '已入库', collectTime: '2024-08-20' },
    { id: 404, storageCode: '2024082000004', productCode: 'PRP00003', bloodComponent: 'prp（c）', volume: 10, status: '已入库', collectTime: '2024-08-20' },
    { id: 405, storageCode: '2024082000005', productCode: 'PRP00003', bloodComponent: 'prp（c）', volume: 10, status: '已入库', collectTime: '2024-08-20' }
  ],
  5: [
    { id: 501, storageCode: '2024100100001', productCode: null, bloodComponent: null, volume: 0, status: '未入库', collectTime: null },
    { id: 502, storageCode: '2024100100002', productCode: null, bloodComponent: null, volume: 0, status: '未入库', collectTime: null },
    { id: 503, storageCode: '2024100100003', productCode: null, bloodComponent: null, volume: 0, status: '未入库', collectTime: null },
    { id: 504, storageCode: '2024100100004', productCode: null, bloodComponent: null, volume: 0, status: '未入库', collectTime: null },
    { id: 505, storageCode: '2024100100005', productCode: null, bloodComponent: null, volume: 0, status: '未入库', collectTime: null }
  ]
};
