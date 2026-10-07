import { IsInt, IsOptional, IsString, Matches, Min } from "class-validator";
import { Transform } from "class-transformer";

/** 店长回填一条补货处理 */
export class FillRestockDto {
  @IsInt()
  @Min(1)
  storeId!: number;

  @IsInt()
  @Min(1)
  skuId!: number;

  /** 实际补货数量，必须为正整数 */
  @IsInt()
  @Min(1)
  restockQuantity!: number;

  /** 处理日期，格式 YYYY-MM-DD */
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: "handledAt 必须是 YYYY-MM-DD 格式的日期" })
  handledAt!: string;
}

/** 补货处理历史查询参数 */
export class RestockHistoryQueryDto {
  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
  @IsInt()
  @Min(1)
  storeId?: number;

  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
  @IsInt()
  @Min(1)
  skuId?: number;
}
