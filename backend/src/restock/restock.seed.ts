// 门店 SKU 库存种子数据，与 database/init.sql 中的 INSERT 保持一致。
// 同一门店同一 SKU 允许多条登记，用于验证“先合并再判定”的逻辑。
export const INVENTORY_SEED = [
  { storeName: "城东旗舰店", skuCode: "SKU-1001", skuName: "矿泉水550ml", quantity: 12, safetyStock: 30 },
  { storeName: "城东旗舰店", skuCode: "SKU-1001", skuName: "矿泉水550ml", quantity: 6, safetyStock: null },
  { storeName: "城东旗舰店", skuCode: "SKU-1002", skuName: "全麦面包", quantity: 40, safetyStock: 20 },
  { storeName: "城东旗舰店", skuCode: "SKU-1005", skuName: "洗衣液2kg", quantity: 22, safetyStock: 18 },
  { storeName: "高新万达店", skuCode: "SKU-1001", skuName: "矿泉水550ml", quantity: 8, safetyStock: 25 },
  { storeName: "高新万达店", skuCode: "SKU-1003", skuName: "鲜牛奶950ml", quantity: 5, safetyStock: 15 },
  { storeName: "滨湖万象店", skuCode: "SKU-1002", skuName: "全麦面包", quantity: 50, safetyStock: null },
  { storeName: "滨湖万象店", skuCode: "SKU-1004", skuName: "抽纸3包装", quantity: 9, safetyStock: 12 },
];
