import { Body, Controller, Get, Post } from "@nestjs/common";
import { RestockService } from "./restock.service";
import { CreateRestockDto } from "./dto/create-restock.dto";

@Controller()
export class RestockController {
  constructor(private readonly restockService: RestockService) {}

  @Get("restocks")
  restocks() {
    return this.restockService.getRestockList();
  }

  @Get("api/restocks")
  apiRestocks() {
    return this.restockService.getRestockList();
  }

  @Post("restocks")
  createRestock(@Body() dto: CreateRestockDto) {
    return this.restockService.createRestock(dto);
  }

  @Post("api/restocks")
  apiCreateRestock(@Body() dto: CreateRestockDto) {
    return this.restockService.createRestock(dto);
  }
}
