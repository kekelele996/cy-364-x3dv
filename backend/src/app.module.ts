import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { OverviewController } from "./overview/overview.controller";
import { OverviewService } from "./overview/overview.service";
import { RestockController } from "./restock/restock.controller";
import { RestockService } from "./restock/restock.service";
import { PrismaService } from "./prisma/prisma.service";
import { AppLogger } from "./common/app.logger";

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [OverviewController, RestockController],
  providers: [OverviewService, RestockService, PrismaService, AppLogger],
})
export class AppModule {}
