/** 降落事件（FallEvent）：同一场坠落/回收的归档 */
export interface FallEvent {
  id: string;
  /** 事件名称，如「2024 年撒哈拉流星雨」 */
  name: string;
  /** 坠落 / 发现日期 YYYY-MM-DD */
  eventDate: string;
  /** 主发现地（地名或地区） */
  primaryLocation: string;
  /** 备注（可选） */
  note?: string;
  createdAt: number;
  updatedAt: number;
}

/** 生成一份空事件草稿（日期默认今天） */
export function emptyEventDraft(): Omit<FallEvent, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    name: '',
    eventDate: new Date().toISOString().slice(0, 10),
    primaryLocation: '',
    note: '',
  };
}
