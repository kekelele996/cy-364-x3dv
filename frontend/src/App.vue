<script setup lang="ts">
import { onMounted, ref } from "vue";
import { fetchOverview, fetchRestocks } from "./api/client";
import { APP_CODE, APP_NAME } from "./constants/app";
import { REQUEST_MESSAGES } from "./constants/messages";
import { localRestocks } from "./data/workbench";
import { createFallbackOverview } from "./state/dashboard";
import type { OverviewResponse, RestockItem } from "./types";
import FeatureStrip from "./components/FeatureStrip.vue";
import MetricGrid from "./components/MetricGrid.vue";
import OperationsTable from "./components/OperationsTable.vue";
import RestockTable from "./components/RestockTable.vue";

const overview = ref<OverviewResponse>(createFallbackOverview());
const restocks = ref<RestockItem[]>(localRestocks);
const notice = ref(REQUEST_MESSAGES.overviewFallback);

function goHealth() {
  window.location.href = REQUEST_MESSAGES.healthPath;
}

async function refresh() {
  try {
    const [overviewData, restockData] = await Promise.all([fetchOverview(), fetchRestocks()]);
    overview.value = overviewData;
    restocks.value = restockData.items;
    notice.value = "后端服务已联通，当前展示实时接口数据。";
  } catch {
    notice.value = REQUEST_MESSAGES.overviewFallback;
  }
}

onMounted(refresh);
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
        <MetricGrid :items="overview.kpis" />
      </div>
      <FeatureStrip :items="overview.features" />
      <section class="work-panel">
        <h2>待补货清单</h2>
        <p class="panel-desc">
          按各门店 SKU 的现存量与安全库存阈值汇总判定，低于安全线的排在前面；安全库存未填的 SKU 不进入清单。补货登记后，现存量、预警状态与建议补货量按补货后的数量重新计算。
        </p>
        <RestockTable :items="restocks" @restocked="refresh" />
      </section>
      <section class="work-panel">
        <h2>运营任务流</h2>
        <OperationsTable :records="overview.records" />
      </section>
    </section>
  </main>
</template>
