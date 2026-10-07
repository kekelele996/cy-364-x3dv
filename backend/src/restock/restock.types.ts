export interface RestockItem {
  storeName: string;
  skuCode: string;
  skuName: string;
  /** 合并后的现存量（含历次补货） */
  currentStock: number;
  /** 安全库存阈值 */
  safetyStock: number;
  /** 建议补货量：安全库存 - 现存量，最小为 0 */
  suggestedQty: number;
  /** warning=低于安全线，normal=已达安全线 */
  status: "warning" | "normal";
  /** 最近一次补货数量，无补货记录为 null */
  lastRestockQty: number | null;
  /** 最近一次补货处理日期（ISO 字符串），无补货记录为 null */
  lastHandledDate: string | null;
}

export interface RestockListResult {
  items: RestockItem[];
  /** 低于安全线的条目数，即总览「待处理」 */
  warningCount: number;
}
