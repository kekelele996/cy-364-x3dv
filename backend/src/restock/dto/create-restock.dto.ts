import { Type } from "class-transformer";
import { IsDateString, IsInt, IsNotEmpty, IsString, Min } from "class-validator";

export class CreateRestockDto {
  @IsString()
  @IsNotEmpty()
  storeName!: string;

  @IsString()
  @IsNotEmpty()
  skuCode!: string;

  /** 补货数量 */
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;

  /** 处理日期，格式 YYYY-MM-DD */
  @IsDateString()
  handledDate!: string;
}
