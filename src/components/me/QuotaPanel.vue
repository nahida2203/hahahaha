<script setup lang="ts">
import { computed } from 'vue'
import EmptyState from '../states/EmptyState.vue'
import { useQuotaStore } from '../../stores/quota'

const quota = useQuotaStore()

const usedPercent = computed(() => {
  if (quota.total <= 0) return 0
  return Math.min(100, Math.round((quota.used / quota.total) * 100))
})

function formatTime(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

</script>

<template>
  <section class="page-panel quota-panel" aria-label="AI 额度">
    <div class="panel-head">
      <h2>AI 额度</h2>
    </div>

    <div class="quota-stats">
      <div class="stat">
        <span class="stat-label">当前余额</span>
        <strong class="stat-value">{{ quota.balance }}</strong>
        <span class="stat-unit">点</span>
      </div>
      <div class="stat">
        <span class="stat-label">总额度</span>
        <strong class="stat-value">{{ quota.total }}</strong>
        <span class="stat-unit">点</span>
      </div>
      <div class="stat">
        <span class="stat-label">已消耗</span>
        <strong class="stat-value">{{ quota.used }}</strong>
        <span class="stat-unit">点</span>
      </div>
    </div>
    <el-progress
      :percentage="usedPercent"
      :stroke-width="8"
      :show-text="false"
      color="var(--color-brand)"
      aria-label="额度消耗进度"
    />

    <div class="ledger-head">
      <h3>消费明细</h3>
      <span class="ledger-count">共 {{ quota.ledger.length }} 条</span>
    </div>

    <ul v-if="quota.ledger.length > 0" class="ledger-list">
      <li v-for="entry in quota.ledger" :key="entry.id" class="ledger-row">
        <div class="ledger-top">
          <span class="ledger-title" :title="entry.title">{{ entry.title }}</span>
          <span class="ledger-cost">-{{ entry.cost }} 点</span>
        </div>
        <div class="ledger-bottom">
          <span class="ledger-time">{{ formatTime(entry.createdAt) }}</span>
          <span class="ledger-balance">余额 {{ entry.balanceAfter }}</span>
        </div>
      </li>
    </ul>
    <EmptyState v-else description="暂无消费明细，完成一次创作后会在这里记录每次消耗" />
  </section>
</template>

<style scoped>
.quota-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.quota-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  min-width: 0;
  padding: 10px;
  border-radius: 10px;
  background: var(--color-surface-soft);
}

.stat-label {
  color: var(--color-muted);
  font-size: 12px;
  line-height: 1.5;
}

.stat-value {
  max-width: 100%;
  overflow: hidden;
  color: var(--color-ink);
  font-size: 20px;
  font-weight: 700;
  line-height: 1.3;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.stat-unit {
  color: var(--color-muted);
  font-size: 11px;
}

.ledger-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  margin-top: 4px;
}

.ledger-head h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.4;
}

.ledger-count {
  color: var(--color-muted);
  font-size: 12px;
}

.ledger-list {
  margin: 0;
  padding: 0;
  list-style: none;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: 10px;
}

.ledger-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
}

.ledger-row + .ledger-row {
  border-top: 1px solid var(--color-border);
}

.ledger-top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
}

.ledger-title {
  min-width: 0;
  overflow: hidden;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.5;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ledger-cost {
  flex: 0 0 auto;
  color: var(--color-danger);
  font-size: 13px;
  font-weight: 600;
}

.ledger-bottom {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
}

.ledger-time,
.ledger-balance {
  color: var(--color-muted);
  font-size: 12px;
  line-height: 1.5;
}
</style>
