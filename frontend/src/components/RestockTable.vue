<script setup lang="ts">
import { reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import { createRestock } from "../api/client";
import { REQUEST_MESSAGES } from "../constants/messages";
import type { RestockItem } from "../types";

defineProps<{ items: RestockItem[] }>();
const emit = defineEmits<{ (event: "restocked"): void }>();

const dialogVisible = ref(false);
const submitting = ref(false);
const activeRow = ref<RestockItem | null>(null);
const form = reactive({ quantity: 1, handledDate: "" });

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(value: string | null): string {
  return value ? value.slice(0, 10) : "—";
}

function openDialog(row: RestockItem) {
  activeRow.value = row;
  form.quantity = Math.max(1, row.suggestedQty);
  form.handledDate = today();
  dialogVisible.value = true;
}

async function submit() {
  if (!activeRow.value || submitting.value) {
    return;
  }
  submitting.value = true;
  try {
    await createRestock({
      storeName: activeRow.value.storeName,
      skuCode: activeRow.value.skuCode,
      quantity: form.quantity,
      handledDate: form.handledDate,
    });
    ElMessage.success(REQUEST_MESSAGES.restockSuccess);
    dialogVisible.value = false;
    emit("restocked");
  } catch {
    ElMessage.error(REQUEST_MESSAGES.restockFailed);
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <el-table :data="items" style="width: 100%" size="large">
    <el-table-column prop="storeName" label="门店" min-width="120" />
    <el-table-column prop="skuCode" label="SKU" min-width="100" />
    <el-table-column prop="skuName" label="品名" min-width="120" />
    <el-table-column prop="currentStock" label="现存量" width="90" align="right" />
    <el-table-column prop="safetyStock" label="安全库存" width="100" align="right" />
    <el-table-column label="建议补货量" width="110" align="right">
      <template #default="{ row }">
        <strong :class="{ 'qty-warning': row.status === 'warning' }">{{ row.suggestedQty }}</strong>
      </template>
    </el-table-column>
    <el-table-column label="状态" width="90">
      <template #default="{ row }">
        <el-tag :type="row.status === 'warning' ? 'danger' : 'success'" disable-transitions>
          {{ row.status === "warning" ? "预警" : "正常" }}
        </el-tag>
      </template>
    </el-table-column>
    <el-table-column label="最近补货" min-width="150">
      <template #default="{ row }">
        <span v-if="row.lastRestockQty !== null">
          +{{ row.lastRestockQty }} · {{ formatDate(row.lastHandledDate) }}
        </span>
        <span v-else>—</span>
      </template>
    </el-table-column>
    <el-table-column label="操作" width="110" fixed="right">
      <template #default="{ row }">
        <el-button size="small" type="primary" plain @click="openDialog(row)">补货登记</el-button>
      </template>
    </el-table-column>
  </el-table>

  <el-dialog
    v-model="dialogVisible"
    title="补货登记"
    width="420px"
    :close-on-click-modal="false"
  >
    <el-form label-width="90px">
      <el-form-item label="门店">
        <span>{{ activeRow?.storeName }}</span>
      </el-form-item>
      <el-form-item label="SKU">
        <span>{{ activeRow?.skuCode }} · {{ activeRow?.skuName }}</span>
      </el-form-item>
      <el-form-item label="补货数量">
        <el-input-number v-model="form.quantity" :min="1" :step="1" step-strictly />
      </el-form-item>
      <el-form-item label="处理日期">
        <el-date-picker
          v-model="form.handledDate"
          type="date"
          value-format="YYYY-MM-DD"
          :clearable="false"
          style="width: 100%"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="submit">确认补货</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.qty-warning {
  color: #b55239;
}
</style>
