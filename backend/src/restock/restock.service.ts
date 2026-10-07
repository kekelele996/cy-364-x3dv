import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateRestockDto } from "./dto/create-restock.dto";
import type { RestockItem, RestockListResult } from "./restock.types";

const RESTOCK_ENTRY_TYPE = "restock";

interface InventoryGroup {
  storeName: string;
  skuCode: string;
  skuName: string;
  currentStock: number;
  safetyStock: number | null;
  lastRestockQty: number | null;
  lastHandledDate: Date | null;
}

@Injectable()
export class RestockService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 待补货清单：同一门店同一 SKU 的多条登记先合并（数量求和、
   * 安全库存取非空阈值的最大值）再与安全线比较；安全库存未填的不进清单。
   */
  async getRestockList(): Promise<RestockListResult> {
    const entries = await this.prisma.inventoryEntry.findMany({
      orderBy: { id: "asc" },
    });
    const groups = new Map<string, InventoryGroup>();

    for (const entry of entries) {
      const key = `${entry.storeName}::${entry.skuCode}`;
      let group = groups.get(key);
      if (!group) {
        group = {
          storeName: entry.storeName,
          skuCode: entry.skuCode,
          skuName: entry.skuName,
          currentStock: 0,
          safetyStock: null,
          lastRestockQty: null,
          lastHandledDate: null,
        };
        groups.set(key, group);
      }
      group.currentStock += entry.quantity;
      if (entry.skuName) {
        group.skuName = entry.skuName;
      }
      if (entry.safetyStock !== null) {
        group.safetyStock =
          group.safetyStock === null
            ? entry.safetyStock
            : Math.max(group.safetyStock, entry.safetyStock);
      }
      // entries 按 id 升序，后出现的补货记录覆盖先出现的，最终保留最近一次
      if (entry.entryType === RESTOCK_ENTRY_TYPE) {
        group.lastRestockQty = entry.quantity;
        group.lastHandledDate = entry.handledDate;
      }
    }

    const items: RestockItem[] = [];
    for (const group of groups.values()) {
      if (group.safetyStock === null) {
        continue;
      }
      const suggestedQty = Math.max(0, group.safetyStock - group.currentStock);
      items.push({
        storeName: group.storeName,
        skuCode: group.skuCode,
        skuName: group.skuName,
        currentStock: group.currentStock,
        safetyStock: group.safetyStock,
        suggestedQty,
        status: group.currentStock < group.safetyStock ? "warning" : "normal",
        lastRestockQty: group.lastRestockQty,
        lastHandledDate: group.lastHandledDate ? group.lastHandledDate.toISOString() : null,
      });
    }

    // 低于安全线的排前面，缺口越大越靠前
    items.sort((a, b) => {
      if (a.status !== b.status) {
        return a.status === "warning" ? -1 : 1;
      }
      return (
        b.suggestedQty - a.suggestedQty ||
        a.storeName.localeCompare(b.storeName, "zh-Hans-CN") ||
        a.skuCode.localeCompare(b.skuCode)
      );
    });

    return {
      items,
      warningCount: items.filter((item) => item.status === "warning").length,
    };
  }

  /**
   * 店长回填补货数量和处理日期：写入一条补货分录，
   * 此后该 SKU 的现存量、预警状态、建议补货量都按补货后的数重新计算。
   */
  async createRestock(dto: CreateRestockDto): Promise<RestockListResult> {
    const latest = await this.prisma.inventoryEntry.findFirst({
      where: { storeName: dto.storeName, skuCode: dto.skuCode },
      orderBy: { id: "desc" },
    });
    if (!latest) {
      throw new BadRequestException("未找到该门店 SKU 的库存登记，无法补货");
    }

    await this.prisma.inventoryEntry.create({
      data: {
        storeName: dto.storeName,
        skuCode: dto.skuCode,
        skuName: latest.skuName,
        quantity: dto.quantity,
        safetyStock: latest.safetyStock,
        entryType: RESTOCK_ENTRY_TYPE,
        handledDate: new Date(dto.handledDate),
      },
    });

    return this.getRestockList();
  }
}
