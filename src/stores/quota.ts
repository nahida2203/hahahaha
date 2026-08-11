import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { QuotaLedgerEntry, QuotaState } from '../api/types'
import { STORAGE_KEYS } from '../api/types'
import { getSettingsSync } from '../utils/configLoader'
import { genId, nowIso } from '../utils/id'

/** 初始额度：优先取动态数据源（config.yaml settings.quota.initial_balance） */
function initialBalance(): number {
  return getSettingsSync().quota.initial_balance
}

function readStoredQuota(): QuotaState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.quota)
    if (!raw) return null
    const parsed = JSON.parse(raw) as QuotaState
    if (typeof parsed.balance !== 'number' || typeof parsed.total !== 'number' || !Array.isArray(parsed.ledger)) {
      return null
    }
    // 兼容旧版本的演示初始额度；已有消费记录的账号继续保留当前状态。
    if (parsed.balance === 5000 && parsed.total === 5000 && parsed.ledger.length === 0) {
      const balance = initialBalance()
      return { balance, total: balance, ledger: [] }
    }
    return parsed
  } catch {
    return null
  }
}

/** 额度与消费明细（localStorage 'funong-mvp.quota.v1'） */
export const useQuotaStore = defineStore('quota', () => {
  const initBalance = initialBalance()
  const state = ref<QuotaState>(
    readStoredQuota() ?? {
      balance: initBalance,
      total: initBalance,
      ledger: [],
    },
  )

  const balance = computed(() => state.value.balance)
  const total = computed(() => state.value.total)
  const used = computed(() => total.value - balance.value)
  const ledger = computed(() => state.value.ledger)

  function persist(): void {
    localStorage.setItem(STORAGE_KEYS.quota, JSON.stringify(state.value))
  }

  function canAfford(cost: number): boolean {
    return state.value.balance >= cost
  }

  /** 扣减额度；余额不足时返回失败且不扣减 */
  function spend(cost: number, title: string): { ok: boolean; message?: string } {
    if (cost <= 0) return { ok: true }
    if (!canAfford(cost)) {
      return {
        ok: false,
        message: `额度不足：本次需 ${cost} 点，剩余 ${state.value.balance} 点。请联系平台管理员补充额度后再试。`,
      }
    }
    state.value.balance -= cost
    const entry: QuotaLedgerEntry = {
      id: genId('quota'),
      createdAt: nowIso(),
      title,
      cost,
      balanceAfter: state.value.balance,
    }
    state.value.ledger = [entry, ...state.value.ledger]
    persist()
    return { ok: true }
  }

  /** 重置演示额度（演示用） */
  function reset(): void {
    const balance = initialBalance()
    state.value = { balance, total: balance, ledger: [] }
    persist()
  }

  return { state, balance, total, used, ledger, canAfford, spend, reset }
})
