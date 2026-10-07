import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * 初始化演示数据：
 * - 3 家门店、4 个 SKU
 * - 同一门店同一 SKU 有多条登记，聚合后才能判定
 * - 其中有 SKU 未填安全库存，不进入待补货清单
 */
async function main() {
  // 幂等：已有数据则跳过
  const storeCount = await prisma.store.count();
  if (storeCount > 0) {
    console.log("seed: 数据已存在，跳过初始化");
    return;
  }

  const stores = await Promise.all([
    prisma.store.create({ data: { code: "SH001", name: "上海徐汇店" } }),
    prisma.store.create({ data: { code: "SH002", name: "上海浦东店" } }),
    prisma.store.create({ data: { code: "BJ001", name: "北京朝阳店" } }),
  ]);

  const skus = await Promise.all([
    prisma.sku.create({
      data: { code: "SKU1001", name: "农夫山泉饮用水", spec: "550ml", barcode: "6921168509256", category: "饮料" },
    }),
    prisma.sku.create({
      data: { code: "SKU1002", name: "抽纸", spec: "100抽*3包", barcode: "6901234500011", category: "日用品" },
    }),
    prisma.sku.create({
      data: { code: "SKU1003", name: "全麦面包", spec: "400g", barcode: "6901234500028", category: "烘焙" },
    }),
    prisma.sku.create({
      data: { code: "SKU1004", name: "电池", spec: "5号 4粒装", barcode: "6901234500035", category: "日用品" },
    }),
  ]);

  const [shXh, shPd, bjCy] = stores;
  const [water, tissue, bread, battery] = skus;

  const registrations = [
    // 徐汇店 / 饮用水：两条登记 18 + 6 = 24，安全库存取 max(40, 35)=40 -> 缺 16
    { storeId: shXh.id, skuId: water.id, onHand: 18, safetyStock: 40 },
    { storeId: shXh.id, skuId: water.id, onHand: 6, safetyStock: 35 },
    // 徐汇店 / 抽纸：30 >= 20，不预警
    { storeId: shXh.id, skuId: tissue.id, onHand: 30, safetyStock: 20 },
    // 徐汇店 / 面包：12 < 15 -> 缺 3
    { storeId: shXh.id, skuId: bread.id, onHand: 12, safetyStock: 15 },
    // 徐汇店 / 电池：安全库存未填，不进清单
    { storeId: shXh.id, skuId: battery.id, onHand: 5, safetyStock: null },

    // 浦东店 / 饮用水：50 >= 40，不预警
    { storeId: shPd.id, skuId: water.id, onHand: 50, safetyStock: 40 },
    // 浦东店 / 抽纸：两条 4 + 2 = 6，安全库存 max(25, 25)=25 -> 缺 19
    { storeId: shPd.id, skuId: tissue.id, onHand: 4, safetyStock: 25 },
    { storeId: shPd.id, skuId: tissue.id, onHand: 2, safetyStock: null },
    // 浦东店 / 面包：8 < 20 -> 缺 12
    { storeId: shPd.id, skuId: bread.id, onHand: 8, safetyStock: 20 },

    // 朝阳店 / 饮用水：两条 20 + 15 = 35，安全库存 max(50, 45)=50 -> 缺 15
    { storeId: bjCy.id, skuId: water.id, onHand: 20, safetyStock: 50 },
    { storeId: bjCy.id, skuId: water.id, onHand: 15, safetyStock: 45 },
    // 朝阳店 / 抽纸：22 < 30 -> 缺 8
    { storeId: bjCy.id, skuId: tissue.id, onHand: 22, safetyStock: 30 },
    // 朝阳店 / 面包：26 >= 18，不预警
    { storeId: bjCy.id, skuId: bread.id, onHand: 26, safetyStock: 18 },
  ];

  await prisma.stockRegistration.createMany({ data: registrations });

  console.log(`seed: 完成，门店 ${stores.length} 家，SKU ${skus.length} 个，登记 ${registrations.length} 条`);
}

main()
  .catch((error) => {
    console.error("seed 失败:", error);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
