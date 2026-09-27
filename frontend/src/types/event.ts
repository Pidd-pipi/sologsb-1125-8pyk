/** 降落事件（FallEvent）：把同一场坠落 / 回收的碎块归到一起 */
export interface FallEvent {
  id: string;
  /** 事件名称，如「2024 年春撒哈拉回收批」 */
  name: string;
  /** 坠落 / 回收日期，ISO 日期串 yyyy-mm-dd */
  eventDate: string;
  /** 主发现地 */
  primaryLocation: string;
  createdAt: number;
  /** v4 引入 */
  updatedAt: number;
}
