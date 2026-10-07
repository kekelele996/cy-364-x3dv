-- 连锁门店库存调配系统 初始化脚本
-- 运行时由 Prisma (prisma db push) 自动建表；本脚本作为规范化的建库/种子参考。

CREATE TABLE IF NOT EXISTS stores (
  id SERIAL PRIMARY KEY,
  code VARCHAR(64) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS skus (
  id SERIAL PRIMARY KEY,
  code VARCHAR(64) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  spec VARCHAR(120),
  barcode VARCHAR(64),
  category VARCHAR(64),
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 各门店 SKU 的库存登记；同一门店同一 SKU 可以有多条，
-- 判定预警前先按 (store_id, sku_id) 聚合。
CREATE TABLE IF NOT EXISTS stock_registrations (
  id SERIAL PRIMARY KEY,
  store_id INTEGER NOT NULL REFERENCES stores(id),
  sku_id INTEGER NOT NULL REFERENCES skus(id),
  on_hand INTEGER NOT NULL,
  safety_stock INTEGER,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_stock_registrations_store_sku
  ON stock_registrations (store_id, sku_id);

-- 店长回填的补货处理记录
CREATE TABLE IF NOT EXISTS restock_records (
  id SERIAL PRIMARY KEY,
  store_id INTEGER NOT NULL REFERENCES stores(id),
  sku_id INTEGER NOT NULL REFERENCES skus(id),
  restock_quantity INTEGER NOT NULL,
  handled_at TIMESTAMP(3) NOT NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_restock_records_store_sku
  ON restock_records (store_id, sku_id);
