import { create } from 'zustand';
import { db, makeId, seedIfEmpty } from '../db';
import type { AnalysisRecord } from '../types/analysis';
import type { FindRecord } from '../types/find';
import type { MeteoriteSample } from '../types/sample';
import type { ThinSection } from '../types/section';
import type { FallEvent } from '../types/event';

export interface SampleState {
  samples: MeteoriteSample[];
  finds: FindRecord[];
  sections: ThinSection[];
  analysis: AnalysisRecord[];
  events: FallEvent[];
  loading: boolean;
  loaded: boolean;
  loadAll: () => Promise<void>;
  addSample: (input: Omit<MeteoriteSample, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateSample: (id: string, patch: Partial<MeteoriteSample>) => Promise<void>;
  removeSample: (id: string) => Promise<void>;
  addFind: (input: Omit<FindRecord, 'id' | 'createdAt'>) => Promise<string>;
  addSection: (input: Omit<ThinSection, 'id' | 'createdAt'>) => Promise<string>;
  updateSection: (id: string, patch: Partial<ThinSection>) => Promise<void>;
  addAnalysis: (input: Omit<AnalysisRecord, 'id' | 'createdAt'>) => Promise<string>;
  addEvent: (
    input: Omit<FallEvent, 'id' | 'createdAt' | 'updatedAt'> & { firstSampleId?: string },
  ) => Promise<string>;
  /** 归入 / 改归 / 退出事件：eventId 为 null 表示退出原场；改归会先清掉旧归属 */
  assignSampleToEvent: (sampleId: string, eventId: string | null) => Promise<void>;
  nextSampleSeq: () => number;
}

export const useSampleStore = create<SampleState>((set, get) => ({
  samples: [],
  finds: [],
  sections: [],
  analysis: [],
  events: [],
  loading: false,
  loaded: false,

  loadAll: async () => {
    set({ loading: true });
    await seedIfEmpty();
    const [samples, finds, sections, analysis, events] = await Promise.all([
      db.samples.toArray(),
      db.finds.toArray(),
      db.sections.toArray(),
      db.analysis.toArray(),
      db.events.toArray(),
    ]);
    samples.sort((a, b) => b.createdAt - a.createdAt);
    finds.sort((a, b) => b.createdAt - a.createdAt);
    sections.sort((a, b) => b.createdAt - a.createdAt);
    analysis.sort((a, b) => b.createdAt - a.createdAt);
    events.sort((a, b) => b.eventDate.localeCompare(a.eventDate));
    set({ samples, finds, sections, analysis, events, loading: false, loaded: true });
  },

  addSample: async (input) => {
    const now = Date.now();
    const record: MeteoriteSample = { ...input, id: makeId('sample'), createdAt: now, updatedAt: now };
    await db.samples.add(record);
    set({ samples: [record, ...get().samples] });
    return record.id;
  },

  updateSample: async (id, patch) => {
    const updatedAt = Date.now();
    await db.samples.update(id, { ...patch, updatedAt });
    set({
      samples: get().samples.map((s) => (s.id === id ? { ...s, ...patch, updatedAt } : s)),
    });
  },

  removeSample: async (id) => {
    await db.transaction(
      'rw',
      db.samples,
      db.finds,
      db.sections,
      db.analysis,
      db.events,
      async () => {
        // 删除样本行即一并移除其事件归属（eventId 随样本行消失），
        // 事件卡成员数与总重量由内存集合动态汇总，无需额外清理
        await db.samples.delete(id);
        await db.finds.where('sampleId').equals(id).delete();
        await db.sections.where('sampleId').equals(id).delete();
        await db.analysis.where('sampleId').equals(id).delete();
      },
    );
    set({
      samples: get().samples.filter((s) => s.id !== id),
      finds: get().finds.filter((f) => f.sampleId !== id),
      sections: get().sections.filter((s) => s.sampleId !== id),
      analysis: get().analysis.filter((a) => a.sampleId !== id),
    });
  },

  addFind: async (input) => {
    const record: FindRecord = { ...input, id: makeId('find'), createdAt: Date.now() };
    await db.finds.add(record);
    set({ finds: [record, ...get().finds] });
    return record.id;
  },

  addSection: async (input) => {
    const record: ThinSection = { ...input, id: makeId('section'), createdAt: Date.now() };
    await db.sections.add(record);
    set({ sections: [record, ...get().sections] });
    return record.id;
  },

  updateSection: async (id, patch) => {
    await db.sections.update(id, patch);
    set({ sections: get().sections.map((s) => (s.id === id ? { ...s, ...patch } : s)) });
  },

  addAnalysis: async (input) => {
    const record: AnalysisRecord = { ...input, id: makeId('analysis'), createdAt: Date.now() };
    await db.analysis.add(record);
    set({ analysis: [record, ...get().analysis] });
    return record.id;
  },

  addEvent: async (input) => {
    const { firstSampleId, ...fields } = input;
    const now = Date.now();
    const record: FallEvent = { ...fields, id: makeId('event'), createdAt: now, updatedAt: now };
    await db.transaction('rw', db.events, db.samples, async () => {
      await db.events.add(record);
      if (firstSampleId) await db.samples.update(firstSampleId, { eventId: record.id, updatedAt: now });
    });
    set((state) => ({
      events: [...state.events, record].sort((a, b) => b.eventDate.localeCompare(a.eventDate)),
      samples: firstSampleId
        ? state.samples.map((s) =>
            s.id === firstSampleId ? { ...s, eventId: record.id, updatedAt: now } : s,
          )
        : state.samples,
    }));
    return record.id;
  },

  assignSampleToEvent: async (sampleId, eventId) => {
    const updatedAt = Date.now();
    await db.transaction('rw', db.samples, db.events, async () => {
      // 直接覆盖 eventId：改归时旧场的归属在同一写入中被清掉，保证一块样本只归一场；
      // eventId 置 undefined 会让 Dexie 删除该字段，即「退出原场」
      await db.samples.update(sampleId, { eventId: eventId ?? undefined, updatedAt });
      if (eventId) {
        const exists = await db.events.get(eventId);
        if (exists) await db.events.update(eventId, { updatedAt });
      }
    });
    set({
      samples: get().samples.map((s) => {
        if (s.id !== sampleId) return s;
        const next: MeteoriteSample = { ...s, updatedAt };
        if (eventId) next.eventId = eventId;
        else delete next.eventId;
        return next;
      }),
    });
  },

  nextSampleSeq: () => {
    const year = new Date().getFullYear();
    const prefix = `MET-${year}-`;
    const used = get()
      .samples.map((s) => s.sampleNo)
      .filter((no) => no.startsWith(prefix))
      .map((no) => Number(no.slice(prefix.length)))
      .filter((n) => Number.isFinite(n));
    const max = used.length ? Math.max(...used) : 0;
    return max + 1;
  },
}));
