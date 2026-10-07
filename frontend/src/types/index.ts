export interface FeatureItem {
  id: number;
  title: string;
  description: string;
  status: string;
  metric: string;
}

export interface KpiItem {
  label: string;
  value: string;
  trend: string;
  tone: string;
}

export interface OperationRecord {
  key: string;
  name: string;
  owner: string;
  status: string;
  metric: string;
  priority: string;
}

/** 待补货清单条目 */
export interface RestockListItem {
  storeId: number;
  storeCode: string;
  storeName: string;
  skuId: number;
  skuCode: string;
  skuName: string;
  skuSpec: string | null;
  currentLevel: number;
  safetyStock: number;
  registrationCount: number;
  warning: boolean;
  suggestedQuantity: number;
  lastRestockQuantity: number | null;
  lastHandledAt: string | null;
}

export interface RestockListResponse {
  items: RestockListItem[];
  pendingCount: number;
}

/** 店长回填的补货处理记录 */
export interface RestockHistoryItem {
  id: number;
  storeId: number;
  storeName: string;
  skuId: number;
  skuName: string;
  skuSpec: string | null;
  restockQuantity: number;
  handledAt: string;
  createdAt: string;
}

export interface FillRestockPayload {
  storeId: number;
  skuId: number;
  restockQuantity: number;
  handledAt: string;
}

export interface OverviewResponse {
  appName: string;
  appCode: string;
  description: string;
  features: FeatureItem[];
  kpis: KpiItem[];
  records: OperationRecord[];
}
