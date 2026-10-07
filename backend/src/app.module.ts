import { Module } from "@nestjs/common";
import { OverviewController } from "./overview/overview.controller";
import { OverviewService } from "./overview/overview.service";
import { AppLogger } from "./common/app.logger";
import { PrismaModule } from "./prisma/prisma.module";
import { InventoryModule } from "./inventory/inventory.module";

@Module({
  imports: [PrismaModule, InventoryModule],
  controllers: [OverviewController],
  providers: [OverviewService, AppLogger],
})
export class AppModule {}
