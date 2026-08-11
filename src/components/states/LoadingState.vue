<script setup lang="ts">
import { Loading } from '@element-plus/icons-vue'

defineProps<{ text?: string }>()
</script>

<template>
  <div class="state-panel" role="status" aria-live="polite">
    <el-icon class="spin" aria-hidden="true"><Loading /></el-icon>
    <p>{{ text ?? '加载中…' }}</p>
  </div>
</template>
