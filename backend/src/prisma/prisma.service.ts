import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { INVENTORY_SEED } from "../restock/restock.seed";

// 与 database/init.sql 保持一致，兜底覆盖“数据卷在挂载初始化脚本之前已创建”的场景。
const ENSURE_INVENTORY_TABLE = `
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
)`;

const ENSURE_INVENTORY_INDEX = `
CREATE INDEX IF NOT EXISTS idx_inventory_entries_store_sku
ON inventory_entries (store_name, sku_code)`;

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
    await this.$executeRawUnsafe(ENSURE_INVENTORY_TABLE);
    await this.$executeRawUnsafe(ENSURE_INVENTORY_INDEX);
    const existing = await this.inventoryEntry.count();
    if (existing === 0) {
      await this.inventoryEntry.createMany({ data: INVENTORY_SEED });
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
