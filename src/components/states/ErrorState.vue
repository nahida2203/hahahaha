<script setup lang="ts">
import { CircleCloseFilled } from '@element-plus/icons-vue'

defineProps<{ message?: string }>()

const emit = defineEmits<{ (e: 'retry'): void }>()
</script>

<template>
  <div class="state-panel" role="alert">
    <el-icon class="error-icon" aria-hidden="true"><CircleCloseFilled /></el-icon>
    <p>{{ message ?? '加载失败，请稍后重试' }}</p>
    <el-button type="primary" @click="emit('retry')">重试</el-button>
  </div>
</template>
