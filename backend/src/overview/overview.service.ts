import { Injectable } from "@nestjs/common";
import { overviewData } from "./overview.data";
import { RestockService } from "../restock/restock.service";

const PENDING_KPI_LABEL = "待处理";

@Injectable()
export class OverviewService {
  constructor(private readonly restockService: RestockService) {}

  async getOverview() {
    // 「待处理」跟着真实库存走：低于安全线的门店 SKU 数
    const { warningCount } = await this.restockService.getRestockList();
    return {
      ...overviewData,
      kpis: overviewData.kpis.map((kpi) =>
        kpi.label === PENDING_KPI_LABEL ? { ...kpi, value: String(warningCount) } : kpi,
      ),
    };
  }

  getHealth() {
    return { status: "ok" };
  }
}
