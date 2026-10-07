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

export interface RestockItem {
  storeName: string;
  skuCode: string;
  skuName: string;
  currentStock: number;
  safetyStock: number;
  suggestedQty: number;
  status: "warning" | "normal";
  lastRestockQty: number | null;
  lastHandledDate: string | null;
}

export interface RestockListResponse {
  items: RestockItem[];
  warningCount: number;
}

export interface CreateRestockPayload {
  storeName: string;
  skuCode: string;
  quantity: number;
  handledDate: string;
}

export interface OverviewResponse {
  appName: string;
  appCode: string;
  description: string;
  features: FeatureItem[];
  kpis: KpiItem[];
  records: OperationRecord[];
}
