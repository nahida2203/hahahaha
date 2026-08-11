<script setup lang="ts">
defineProps<{ description?: string }>()
</script>

<template>
  <div class="state-panel">
    <el-empty :description="description ?? '暂无数据'">
      <template #default>
        <slot name="action" />
      </template>
    </el-empty>
  </div>
</template>
