import { Injectable, Logger } from "@nestjs/common";
import { overviewData } from "./overview.data";
import { InventoryService } from "../inventory/inventory.service";

@Injectable()
export class OverviewService {
  private readonly logger = new Logger(OverviewService.name);

  constructor(private readonly inventoryService: InventoryService) {}

  async getOverview() {
    const kpis = overviewData.kpis.map((kpi) => ({ ...kpi }));
    const pendingKpi = kpis.find((kpi) => kpi.label === "待处理");
    if (pendingKpi) {
      try {
        const { pendingCount } = await this.inventoryService.getRestockList();
        pendingKpi.value = String(pendingCount);
        pendingKpi.trend = pendingCount > 0 ? "低于安全线，需跟进" : "库存均在安全线以上";
      } catch (error) {
        this.logger.error("读取待补货清单失败，待处理数暂不可用", error as Error);
        pendingKpi.value = "--";
        pendingKpi.trend = "库存数据暂不可用";
      }
    }
    return { ...overviewData, kpis };
  }

  getHealth() {
    return { status: "ok" };
  }
}
