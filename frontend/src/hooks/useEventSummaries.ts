import { useMemo } from 'react';
import { useSampleStore } from '../stores/sampleStore';
import { buildEventSummaries, type EventSummary } from '../utils/event';

/** 全部降落事件的实时汇总（成员数 / 总重量 / 各处发现地随样本变更即时重算） */
export function useEventSummaries(): EventSummary[] {
  const events = useSampleStore((s) => s.events);
  const samples = useSampleStore((s) => s.samples);
  const finds = useSampleStore((s) => s.finds);
  return useMemo(
    () => buildEventSummaries(events, samples, finds),
    [events, samples, finds],
  );
}
