import type { FallEvent } from '../types/event';
import type { FindRecord } from '../types/find';
import type { MeteoriteSample } from '../types/sample';

export interface EventSite {
  /** 国家 / 地区 */
  region: string;
  placeName: string;
  /** 该发现点归入事件的样本数 */
  count: number;
}

export interface EventSummary {
  event: FallEvent;
  members: MeteoriteSample[];
  memberCount: number;
  totalWeight: number;
  sites: EventSite[];
}

/**
 * 汇总一场降落事件的成员数量、总重量与各处发现地。
 * 归属以样本上的 eventId 为准，发现地经 FindRecord 关联；
 * 成员被移除或改归后由调用方传入的最新集合重算，不会残留。
 */
export function buildEventSummary(
  event: FallEvent,
  samples: MeteoriteSample[],
  finds: FindRecord[],
): EventSummary {
  const members = samples.filter((s) => s.eventId === event.id);
  const findOf = new Map(finds.map((f) => [f.sampleId, f]));
  const siteMap = new Map<string, EventSite>();
  for (const member of members) {
    const find = findOf.get(member.id);
    if (!find) continue;
    const key = `${find.region}__${find.placeName}`;
    const entry = siteMap.get(key);
    if (entry) entry.count += 1;
    else siteMap.set(key, { region: find.region, placeName: find.placeName, count: 1 });
  }
  const sites = [...siteMap.values()].sort((a, b) => b.count - a.count || a.region.localeCompare(b.region));
  return {
    event,
    members,
    memberCount: members.length,
    totalWeight: members.reduce((n, s) => n + s.totalWeight, 0),
    sites,
  };
}

/** 按事件 id 批量汇总，保持 events 入参顺序 */
export function buildEventSummaries(
  events: FallEvent[],
  samples: MeteoriteSample[],
  finds: FindRecord[],
): EventSummary[] {
  return events.map((event) => buildEventSummary(event, samples, finds));
}
