import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { FillRestockDto, RestockHistoryQueryDto } from "./dto/restock.dto";
import {
  InventoryService,
  RestockHistoryItem,
  RestockListResponse,
} from "./inventory.service";

@Controller()
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  /** 待补货清单（含待处理数） */
  @Get("restock-list")
  restockList(): Promise<RestockListResponse> {
    return this.inventoryService.getRestockList();
  }

  @Get("api/restock-list")
  apiRestockList(): Promise<RestockListResponse> {
    return this.inventoryService.getRestockList();
  }

  /** 店长回填补货数量和处理日期 */
  @Post("restock-records")
  fillRestock(@Body() dto: FillRestockDto): Promise<RestockListResponse> {
    return this.inventoryService.fillRestock(dto);
  }

  @Post("api/restock-records")
  apiFillRestock(@Body() dto: FillRestockDto): Promise<RestockListResponse> {
    return this.inventoryService.fillRestock(dto);
  }

  /** 补货处理历史（可按门店 / SKU 过滤） */
  @Get("restock-records")
  restockHistory(
    @Query() query: RestockHistoryQueryDto,
  ): Promise<RestockHistoryItem[]> {
    return this.inventoryService.getRestockHistory(query);
  }

  @Get("api/restock-records")
  apiRestockHistory(
    @Query() query: RestockHistoryQueryDto,
  ): Promise<RestockHistoryItem[]> {
    return this.inventoryService.getRestockHistory(query);
  }
}
