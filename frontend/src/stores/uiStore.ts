import { create } from 'zustand';

export type SortKey = 'createdAt' | 'totalWeight' | 'sampleNo';

/** 降落事件筛选：null=全部；具体 id=仅该事件；'__none__'=未归档样本 */
export type EventFilterValue = string | null;

export interface SampleFilterState {
  categories: string[];
  groups: string[];
  minWeight: number | null;
  maxWeight: number | null;
  keyword: string;
  sort: SortKey;
  eventId: EventFilterValue;
  setCategories: (v: string[]) => void;
  setGroups: (v: string[]) => void;
  setWeightRange: (min: number | null, max: number | null) => void;
  setKeyword: (v: string) => void;
  setSort: (v: SortKey) => void;
  setEventId: (v: EventFilterValue) => void;
  reset: () => void;
}

const initial = {
  categories: [] as string[],
  groups: [] as string[],
  minWeight: null as number | null,
  maxWeight: null as number | null,
  keyword: '',
  sort: 'createdAt' as SortKey,
  eventId: null as EventFilterValue,
};

/** 全站筛选条件（供 /、/sections 与 /locations 共享） */
export const useUiStore = create<SampleFilterState>((set) => ({
  ...initial,
  setCategories: (v) => set({ categories: v }),
  setGroups: (v) => set({ groups: v }),
  setWeightRange: (min, max) => set({ minWeight: min, maxWeight: max }),
  setKeyword: (v) => set({ keyword: v }),
  setSort: (v) => set({ sort: v }),
  setEventId: (v) => set({ eventId: v }),
  reset: () => set({ ...initial }),
}));

/** 侧栏提示条（轻量全局反馈） */
export interface ToastState {
  message: string;
  severity: 'success' | 'info' | 'warning';
  open: boolean;
  notify: (message: string, severity?: ToastState['severity']) => void;
  close: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  message: '',
  severity: 'success',
  open: false,
  notify: (message, severity = 'success') => set({ message, severity, open: true }),
  close: () => set({ open: false }),
}));
