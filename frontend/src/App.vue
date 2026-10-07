<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import {
  fetchOverview,
  fetchRestockHistory,
  fetchRestockList,
  submitRestock,
} from "./api/client";
import { APP_CODE, APP_NAME } from "./constants/app";
import { REQUEST_MESSAGES } from "./constants/messages";
import { createFallbackOverview } from "./state/dashboard";
import { localRestockList } from "./data/restock";
import type { OverviewResponse, RestockListResponse } from "./types";
import FeatureStrip from "./components/FeatureStrip.vue";
import MetricGrid from "./components/MetricGrid.vue";
import RestockPanel, { type FillPayload } from "./components/RestockPanel.vue";

const overview = ref<OverviewResponse>(createFallbackOverview());
const notice = ref(REQUEST_MESSAGES.overviewFallback);
const backendOnline = ref(false);

// 待补货清单：先给本地样例，后端联通后切换为实时数据
const restock = ref<RestockListResponse>({
  items: localRestockList.items.map((item) => ({ ...item })),
  pendingCount: localRestockList.pendingCount,
});

/** 「待处理」KPI 跟随真实待补货清单：低于安全线的门店 SKU 条数 */
const kpis = computed(() =>
  overview.value.kpis.map((kpi) =>
    kpi.label === "待处理"
      ? {
          ...kpi,
          value: String(restock.value.pendingCount),
          trend:
            restock.value.pendingCount > 0
              ? backendOnline.value
                ? "低于安全线，需跟进"
                : "本地样例数据"
              : "库存均在安全线以上",
        }
      : kpi,
  ),
);

function goHealth() {
  window.location.href = REQUEST_MESSAGES.healthPath;
}

async function handleFill(payload: FillPayload) {
  try {
    const next = await submitRestock(payload);
    restock.value = next;
  } catch (error) {
    ElMessage.error((error as Error).message || "补货回填失败");
  }
}

async function loadHistory(storeId: number, skuId: number) {
  return fetchRestockHistory(storeId, skuId);
}

onMounted(async () => {
  const [overviewResult, restockResult] = await Promise.allSettled([
    fetchOverview(),
    fetchRestockList(),
  ]);

  if (overviewResult.status === "fulfilled") {
    overview.value = overviewResult.value;
  }
  if (restockResult.status === "fulfilled") {
    restock.value = restockResult.value;
  }

  backendOnline.value =
    overviewResult.status === "fulfilled" && restockResult.status === "fulfilled";
  notice.value = backendOnline.value
    ? "后端服务已联通，待补货清单与待处理数为实时库存计算结果。"
    : REQUEST_MESSAGES.overviewFallback;
});
</script>

<template>
  <main class="app-shell">
    <header class="topbar">
      <div>
        <span class="brand-code">{{ APP_CODE }}</span>
        <h1 class="brand-title">{{ APP_NAME }}</h1>
      </div>
      <el-button type="primary" @click="goHealth">API Health</el-button>
    </header>
    <section class="workspace">
      <div class="lead-grid">
        <article class="hero-panel">
          <span class="pill">{{ notice }}</span>
          <h2>{{ overview.appName }}</h2>
          <p>{{ overview.description }}</p>
        </article>
        <MetricGrid :items="kpis" />
      </div>
      <FeatureStrip :items="overview.features" />
      <section class="work-panel">
        <RestockPanel
          :items="restock.items"
          :pending-count="restock.pendingCount"
          :offline="!backendOnline"
          :load-history="loadHistory"
          @fill="handleFill"
        />
      </section>
    </section>
  </main>
</template>
