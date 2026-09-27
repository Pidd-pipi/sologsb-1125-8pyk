import { useMemo } from 'react';
import { useSampleStore } from '../stores/sampleStore';
import type { FallEvent } from '../types/event';

/** 一处发现地（按成员的发现记录去重聚合） */
export interface EventLocation {
  /** 展示名：地区 · 地名（无发现记录时回退到事件主发现地） */
  label: string;
  region: string;
  placeName: string;
  sampleCount: number;
  totalWeight: number;
}

/** 单个事件的汇总卡数据 */
export interface EventSummary extends FallEvent {
  memberCount: number;
  totalWeight: number;
  locations: EventLocation[];
  memberIds: string[];
}

/**
 * 聚合每场降落事件的成员数量、总重量与各处发现地。
 * 成员关系以样本上的 eventId 为准；发现地来自成员的 FindRecord，按地区去重。
 */
export function useEventSummaries(): EventSummary[] {
  const events = useSampleStore((s) => s.events);
  const samples = useSampleStore((s) => s.samples);
  const finds = useSampleStore((s) => s.finds);

  return useMemo(() => {
    const sampleMap = new Map(samples.map((s) => [s.id, s]));
    return events.map((event) => {
      const members = samples.filter((s) => s.eventId === event.id);
      const memberIds = members.map((s) => s.id);

      // 以「地区 + 地名」为键聚合各处发现地
      const locMap = new Map<string, EventLocation>();
      for (const f of finds.filter((x) => x.sampleId && sampleMap.get(x.sampleId)?.eventId === event.id)) {
        const region = f.region?.trim() || '未标注地区';
        const placeName = f.placeName?.trim() || '未命名地点';
        const key = `${region}::${placeName}`;
        const sample = sampleMap.get(f.sampleId);
        const prev =
          locMap.get(key) ?? { label: `${region} · ${placeName}`, region, placeName, sampleCount: 0, totalWeight: 0 };
        prev.sampleCount += 1;
        prev.totalWeight += sample?.totalWeight ?? 0;
        locMap.set(key, prev);
      }
      // 成员没有发现记录时，仍展示事件登记的主发现地，避免「各处发现地」为空
      if (locMap.size === 0 && event.primaryLocation.trim()) {
        locMap.set(event.primaryLocation, {
          label: event.primaryLocation.trim(),
          region: event.primaryLocation.trim(),
          placeName: '',
          sampleCount: 0,
          totalWeight: 0,
        });
      }

      return {
        ...event,
        memberCount: members.length,
        totalWeight: members.reduce((n, s) => n + s.totalWeight, 0),
        locations: Array.from(locMap.values()).sort((a, b) => b.sampleCount - a.sampleCount),
        memberIds,
      };
    });
  }, [events, samples, finds]);
}

/** 取单场事件的汇总 */
export function useEventSummary(eventId: string | undefined): EventSummary | undefined {
  const summaries = useEventSummaries();
  return useMemo(() => summaries.find((e) => e.id === eventId), [summaries, eventId]);
}
