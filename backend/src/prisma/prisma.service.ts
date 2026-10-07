import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  // 不在启动时强制连接数据库：数据库不可用时健康检查等接口仍可工作，
  // 库存相关接口会在实际查询时返回错误并由前端降级展示本地样例。
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
