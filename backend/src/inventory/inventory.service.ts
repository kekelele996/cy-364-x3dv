import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { FillRestockDto } from "./dto/restock.dto";

/** 聚合查询得到的单个门店 SKU 原始行 */
interface AggregatedStockRow {
  storeId: number;
  storeCode: string;
  storeName: string;
  skuId: number;
  skuCode: string;
  skuName: string;
  skuSpec: string | null;
  onHand: number;
  safetyStock: number | null;
  registrationCount: number;
  restockTotal: number;
  lastRestockQuantity: number | null;
  lastHandledAt: Date | null;
}

export interface RestockListItem {
  storeId: number;
  storeCode: string;
  storeName: string;
  skuId: number;
  skuCode: string;
  skuName: string;
  skuSpec: string | null;
  /** 现存量（各条登记合计 + 历次补货回填合计） */
  currentLevel: number;
  /** 安全库存阈值 */
  safetyStock: number;
  /** 合并的登记笔数 */
  registrationCount: number;
  /** 预警状态：现存量低于安全库存 */
  warning: boolean;
  /** 建议补货量：安全库存 - 现存量；不低于安全线时为 0 */
  suggestedQuantity: number;
  /** 最近一次回填的补货数量 */
  lastRestockQuantity: number | null;
  /** 最近一次处理日期（YYYY-MM-DD） */
  lastHandledAt: string | null;
}

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

export interface RestockListResponse {
  items: RestockListItem[];
  /** 待处理数：低于安全库存的门店 SKU 条数 */
  pendingCount: number;
}

function toDateText(value: Date | null): string | null {
  if (!value) {
    return null;
  }
  const year = value.getUTCFullYear();
  const month = String(value.getUTCMonth() + 1).padStart(2, "0");
  const day = String(value.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 按 (门店, SKU) 聚合：
   * - 同一门店同一 SKU 的多条登记先合并：现存量求和，安全库存取非空中的最大值
   * - 安全库存全部未填（NULL）的分组不进清单（HAVING COUNT(safety_stock) > 0）
   * - 现存量还要叠加历次补货回填数量
   */
  private async aggregateStock(): Promise<AggregatedStockRow[]> {
    const rows = await this.prisma.$queryRaw<AggregatedStockRow[]>`
      SELECT
        s.id AS "storeId",
        s.code AS "storeCode",
        s.name AS "storeName",
        k.id AS "skuId",
        k.code AS "skuCode",
        k.name AS "skuName",
        k.spec AS "skuSpec",
        COALESCE(SUM(r.on_hand), 0)::int AS "onHand",
        MAX(r.safety_stock) AS "safetyStock",
        COUNT(r.id)::int AS "registrationCount",
        COALESCE(
          (SELECT SUM(rr.restock_quantity)::int
             FROM restock_records rr
            WHERE rr.store_id = s.id AND rr.sku_id = k.id),
          0
        ) AS "restockTotal",
        latest.latest_quantity AS "lastRestockQuantity",
        latest.latest_handled_at AS "lastHandledAt"
      FROM stores s
      CROSS JOIN skus k
      JOIN stock_registrations r ON r.store_id = s.id AND r.sku_id = k.id
      LEFT JOIN LATERAL (
        SELECT rr.restock_quantity AS latest_quantity,
               rr.handled_at AS latest_handled_at
          FROM restock_records rr
         WHERE rr.store_id = s.id AND rr.sku_id = k.id
         ORDER BY rr.handled_at DESC, rr.id DESC
         LIMIT 1
      ) latest ON TRUE
      GROUP BY s.id, s.code, s.name, k.id, k.code, k.name, k.spec,
               latest.latest_quantity, latest.latest_handled_at
      HAVING COUNT(r.safety_stock) > 0
    `;
    return rows;
  }

  private toListItem(row: AggregatedStockRow): RestockListItem {
    const safetyStock = row.safetyStock ?? 0;
    const currentLevel = row.onHand + row.restockTotal;
    const warning = currentLevel < safetyStock;
    return {
      storeId: row.storeId,
      storeCode: row.storeCode,
      storeName: row.storeName,
      skuId: row.skuId,
      skuCode: row.skuCode,
      skuName: row.skuName,
      skuSpec: row.skuSpec,
      currentLevel,
      safetyStock,
      registrationCount: row.registrationCount,
      warning,
      suggestedQuantity: warning ? safetyStock - currentLevel : 0,
      lastRestockQuantity: row.lastRestockQuantity,
      lastHandledAt: toDateText(row.lastHandledAt),
    };
  }

  async getRestockList(): Promise<RestockListResponse> {
    const rows = await this.aggregateStock();
    const items = rows.map((row) => this.toListItem(row));

    items.sort((a, b) => {
      // 低于安全线的排前面
      if (a.warning !== b.warning) {
        return a.warning ? -1 : 1;
      }
      if (a.warning && b.warning) {
        // 缺货越多越靠前；缺口相同则现存量越少越靠前
        const gapDiff = b.suggestedQuantity - a.suggestedQuantity;
        if (gapDiff !== 0) {
          return gapDiff;
        }
        const levelDiff = a.currentLevel - b.currentLevel;
        if (levelDiff !== 0) {
          return levelDiff;
        }
      }
      const storeCmp = a.storeName.localeCompare(b.storeName, "zh-Hans-CN");
      if (storeCmp !== 0) {
        return storeCmp;
      }
      return a.skuName.localeCompare(b.skuName, "zh-Hans-CN");
    });

    const pendingCount = items.filter((item) => item.warning).length;
    return { items, pendingCount };
  }

  /** 店长回填一条补货处理；此后该门店 SKU 的现存量/预警/建议补货量按补货后计算 */
  async fillRestock(dto: FillRestockDto): Promise<RestockListResponse> {
    const rows = await this.aggregateStock();
    const target = rows.find(
      (row) => row.storeId === dto.storeId && row.skuId === dto.skuId,
    );
    if (!target) {
      throw new NotFoundException(
        "未找到对应的门店 SKU 库存（该 SKU 可能没有库存登记或未设置安全库存）",
      );
    }

    const handledAt = this.parseHandledDate(dto.handledAt);

    await this.prisma.restockRecord.create({
      data: {
        storeId: dto.storeId,
        skuId: dto.skuId,
        restockQuantity: dto.restockQuantity,
        handledAt,
      },
    });

    return this.getRestockList();
  }

  async getRestockHistory(options: {
    storeId?: number;
    skuId?: number;
  }): Promise<RestockHistoryItem[]> {
    const rows = await this.prisma.$queryRaw<
      Array<{
        id: number;
        storeId: number;
        storeName: string;
        skuId: number;
        skuName: string;
        skuSpec: string | null;
        restockQuantity: number;
        handledAt: Date;
        createdAt: Date;
      }>
    >`
      SELECT rr.id AS "id",
             s.id AS "storeId",
             s.name AS "storeName",
             k.id AS "skuId",
             k.name AS "skuName",
             k.spec AS "skuSpec",
             rr.restock_quantity AS "restockQuantity",
             rr.handled_at AS "handledAt",
             rr.created_at AS "createdAt"
        FROM restock_records rr
        JOIN stores s ON s.id = rr.store_id
        JOIN skus k ON k.id = rr.sku_id
       WHERE (${options.storeId ?? null}::int IS NULL OR rr.store_id = ${options.storeId ?? null})
         AND (${options.skuId ?? null}::int IS NULL OR rr.sku_id = ${options.skuId ?? null})
       ORDER BY rr.handled_at DESC, rr.id DESC
       LIMIT 100
    `;

    return rows.map((row) => ({
      id: row.id,
      storeId: row.storeId,
      storeName: row.storeName,
      skuId: row.skuId,
      skuName: row.skuName,
      skuSpec: row.skuSpec,
      restockQuantity: row.restockQuantity,
      handledAt: toDateText(row.handledAt) ?? "",
      createdAt: row.createdAt.toISOString(),
    }));
  }

  private parseHandledDate(text: string): Date {
    const date = new Date(`${text}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException("handledAt 不是有效的日期");
    }
    return date;
  }
}
