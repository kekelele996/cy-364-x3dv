<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import type {
  RestockHistoryItem,
  RestockListItem,
} from "../types";

export interface FillPayload {
  storeId: number;
  skuId: number;
  restockQuantity: number;
  handledAt: string;
}

const props = defineProps<{
  items: RestockListItem[];
  pendingCount: number;
  /** 后端不可用时为 true，禁止回填操作 */
  offline: boolean;
  /** 由父组件提供补货历史数据加载 */
  loadHistory: (storeId: number, skuId: number) => Promise<RestockHistoryItem[]>;
}>();

const emit = defineEmits<{
  (e: "fill", payload: FillPayload): void;
}>();

// ---- 回填弹窗 ----
const fillVisible = ref(false);
const fillTarget = ref<RestockListItem | null>(null);
const fillForm = reactive({
  restockQuantity: 1,
  handledAt: "",
});

function todayText(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function openFill(row: RestockListItem) {
  if (props.offline) {
    ElMessage.warning("后端未联通，当前为本地样例数据，无法回填。");
    return;
  }
  fillTarget.value = row;
  fillForm.restockQuantity = Math.max(row.suggestedQuantity, 1);
  fillForm.handledAt = todayText();
  fillVisible.value = true;
}

function submitFill() {
  if (!fillTarget.value) {
    return;
  }
  if (!Number.isInteger(fillForm.restockQuantity) || fillForm.restockQuantity <= 0) {
    ElMessage.error("补货数量必须为正整数。");
    return;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fillForm.handledAt)) {
    ElMessage.error("请选择处理日期。");
    return;
  }
  emit("fill", {
    storeId: fillTarget.value.storeId,
    skuId: fillTarget.value.skuId,
    restockQuantity: fillForm.restockQuantity,
    handledAt: fillForm.handledAt,
  });
  ElMessage.success("补货已回填，现存量与预警状态已按补货后重算。");
  fillVisible.value = false;
}

// ---- 历史记录弹窗 ----
const historyVisible = ref(false);
const historyLoading = ref(false);
const historyTarget = ref<RestockListItem | null>(null);
const historyRows = ref<RestockHistoryItem[]>([]);

async function openHistory(row: RestockListItem) {
  if (props.offline) {
    ElMessage.warning("后端未联通，本地样例不含补货处理记录。");
    return;
  }
  historyTarget.value = row;
  historyVisible.value = true;
  historyLoading.value = true;
  try {
    historyRows.value = await props.loadHistory(row.storeId, row.skuId);
  } finally {
    historyLoading.value = false;
  }
}

const fillTitle = computed(() => {
  const t = fillTarget.value;
  return t ? `回填补货 · ${t.storeName} / ${t.skuName}` : "回填补货";
});
</script>

<template>
  <section class="restock-panel">
    <div class="restock-head">
      <div>
        <h2>待补货清单</h2>
        <p>按各门店 SKU 现存量与安全库存阈值实时计算，低于安全线的排前面；同一门店同一 SKU 的多条登记已先合并；安全库存未填的不进入清单。</p>
      </div>
      <el-tag :type="pendingCount > 0 ? 'danger' : 'success'" size="large" effect="dark">
        待处理 {{ pendingCount }} 条
      </el-tag>
    </div>

    <el-table :data="items" style="width: 100%" size="large">
      <el-table-column label="预警" width="90">
        <template #default="{ row }">
          <el-tag v-if="row.warning" type="danger" effect="dark">低库存</el-tag>
          <el-tag v-else type="success">正常</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="storeName" label="门店" min-width="130" />
      <el-table-column label="SKU" min-width="180">
        <template #default="{ row }">
          <div class="sku-cell">
            <strong>{{ row.skuName }}</strong>
            <small>{{ row.skuCode }}<template v-if="row.skuSpec"> · {{ row.skuSpec }}</template></small>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="现存量" width="100" align="right">
        <template #default="{ row }">
          <span :class="{ 'level-low': row.warning }">{{ row.currentLevel }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="safetyStock" label="安全库存" width="100" align="right" />
      <el-table-column label="建议补货量" width="120" align="right">
        <template #default="{ row }">
          <strong :class="{ 'suggest-qty': row.warning }">
            {{ row.warning ? row.suggestedQuantity : 0 }}
          </strong>
        </template>
      </el-table-column>
      <el-table-column prop="registrationCount" label="合并登记" width="90" align="center" />
      <el-table-column label="最近处理" min-width="140">
        <template #default="{ row }">
          <template v-if="row.lastHandledAt">
            {{ row.lastHandledAt }} 补 {{ row.lastRestockQuantity }}
          </template>
          <span v-else class="muted">—</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="170" fixed="right">
        <template #default="{ row }">
          <el-button
            :type="row.warning ? 'primary' : 'default'"
            size="small"
            @click="openFill(row)"
          >
            回填补货
          </el-button>
          <el-button size="small" @click="openHistory(row)">补货记录</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="fillVisible" :title="fillTitle" width="420px">
      <el-form label-width="110px" v-if="fillTarget">
        <el-form-item label="现存量">
          <span>{{ fillTarget.currentLevel }}</span>
          <span class="muted"> / 安全库存 {{ fillTarget.safetyStock }}</span>
        </el-form-item>
        <el-form-item label="建议补货量">
          <el-tag type="danger" effect="plain">
            {{ fillTarget.suggestedQuantity > 0 ? fillTarget.suggestedQuantity : 0 }}
          </el-tag>
        </el-form-item>
        <el-form-item label="补货数量">
          <el-input-number
            v-model="fillForm.restockQuantity"
            :min="1"
            :step="1"
            :precision="0"
          />
        </el-form-item>
        <el-form-item label="处理日期">
          <el-date-picker
            v-model="fillForm.handledAt"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="选择处理日期"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="fillVisible = false">取消</el-button>
        <el-button type="primary" @click="submitFill">确认回填</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="historyVisible"
      :title="historyTarget ? `补货记录 · ${historyTarget.storeName} / ${historyTarget.skuName}` : '补货记录'"
      width="520px"
    >
      <el-table :data="historyRows" v-loading="historyLoading" size="small">
        <el-table-column prop="handledAt" label="处理日期" width="120" />
        <el-table-column prop="restockQuantity" label="补货数量" width="100" align="right" />
        <el-table-column label="记录创建时间" min-width="180">
          <template #default="{ row }">
            {{ new Date(row.createdAt).toLocaleString() }}
          </template>
        </el-table-column>
        <template #empty>
          <span class="muted">该门店 SKU 还没有补货处理记录。</span>
        </template>
      </el-table>
    </el-dialog>
  </section>
</template>
