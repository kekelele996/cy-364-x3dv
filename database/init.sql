CREATE TABLE IF NOT EXISTS operation_records (
  id SERIAL PRIMARY KEY,
  module_name VARCHAR(120) NOT NULL,
  owner_name VARCHAR(80) NOT NULL,
  status VARCHAR(40) NOT NULL,
  metric VARCHAR(40) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO operation_records (module_name, owner_name, status, metric)
VALUES ('多门店SKU统一管理', '运营组', 'ready', '100%');

-- 门店 SKU 库存登记：同一门店同一 SKU 可有多条登记（含补货回填），
-- 现存量按全部分录求和，安全库存取各登记中的非空阈值。
CREATE TABLE IF NOT EXISTS inventory_entries (
  id SERIAL PRIMARY KEY,
  store_name VARCHAR(120) NOT NULL,
  sku_code VARCHAR(60) NOT NULL,
  sku_name VARCHAR(120) NOT NULL,
  quantity INTEGER NOT NULL,
  safety_stock INTEGER,
  entry_type VARCHAR(20) NOT NULL DEFAULT 'registration',
  handled_date TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_inventory_entries_store_sku
ON inventory_entries (store_name, sku_code);

-- 种子数据与 backend/src/restock/restock.seed.ts 保持一致
INSERT INTO inventory_entries (store_name, sku_code, sku_name, quantity, safety_stock, entry_type)
VALUES
  ('城东旗舰店', 'SKU-1001', '矿泉水550ml', 12, 30, 'registration'),
  ('城东旗舰店', 'SKU-1001', '矿泉水550ml', 6, NULL, 'registration'),
  ('城东旗舰店', 'SKU-1002', '全麦面包', 40, 20, 'registration'),
  ('城东旗舰店', 'SKU-1005', '洗衣液2kg', 22, 18, 'registration'),
  ('高新万达店', 'SKU-1001', '矿泉水550ml', 8, 25, 'registration'),
  ('高新万达店', 'SKU-1003', '鲜牛奶950ml', 5, 15, 'registration'),
  ('滨湖万象店', 'SKU-1002', '全麦面包', 50, NULL, 'registration'),
  ('滨湖万象店', 'SKU-1004', '抽纸3包装', 9, 12, 'registration');
