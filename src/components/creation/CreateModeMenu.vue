<script setup lang="ts">
import { Close, Picture, VideoPlay } from '@element-plus/icons-vue'

defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
  (event: 'select', mode: 'chat' | 'image' | 'video'): void
}>()

function closeMenu(): void {
  emit('update:modelValue', false)
}

function selectMode(mode: 'chat' | 'image' | 'video'): void {
  emit('select', mode)
}
</script>

<template>
  <Transition name="create-menu">
    <div
      v-if="modelValue"
      class="create-mode-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="选择创作方式"
      @click.self="closeMenu"
    >
      <div class="create-mode-panel">
        <div class="create-mode-orbit" aria-hidden="true"></div>
        <button class="mode-option mode-option-omni" type="button" @click="selectMode('chat')">
          <span class="mode-option-icon mode-option-icon-omni" aria-hidden="true"><span>O</span></span>
          <span class="mode-option-label">对话创作</span>
        </button>
        <button class="mode-option mode-option-image" type="button" @click="selectMode('image')">
          <span class="mode-option-icon mode-option-icon-image"><el-icon :size="28"><Picture /></el-icon></span>
          <span class="mode-option-label">图片生成</span>
        </button>
        <button class="mode-option mode-option-video" type="button" @click="selectMode('video')">
          <span class="mode-option-icon mode-option-icon-video"><el-icon :size="28"><VideoPlay /></el-icon></span>
          <span class="mode-option-label">视频生成</span>
        </button>
        <button class="mode-close" type="button" aria-label="关闭创作方式菜单" @click="closeMenu">
          <el-icon :size="30"><Close /></el-icon>
        </button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.create-mode-overlay {
  position: fixed;
  inset: 0;
  z-index: 80;
  overflow: hidden;
  background: rgba(0, 0, 0, .66);
  backdrop-filter: blur(10px) saturate(.72);
}

.create-mode-panel {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  height: min(31dvh, 340px);
  min-height: 260px;
  overflow: hidden;
  border-top: 1px solid rgba(255, 255, 255, .12);
  border-radius: 50% 50% 0 0 / 26% 26% 0 0;
  background:
    radial-gradient(circle at 50% 15%, rgba(255, 255, 255, .08), transparent 36%),
    linear-gradient(180deg, rgba(57, 59, 58, .92), rgba(28, 30, 29, .98));
  box-shadow: 0 -18px 70px rgba(0, 0, 0, .5);
}

.create-mode-orbit {
  position: absolute;
  top: 18px;
  left: 50%;
  width: min(116vw, 500px);
  height: min(116vw, 500px);
  border: 1px solid rgba(255, 255, 255, .08);
  border-radius: 50%;
  transform: translateX(-50%);
  pointer-events: none;
}

.mode-option {
  position: absolute;
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 7px;
  min-width: 84px;
  min-height: 92px;
  padding: 0;
  border: 0;
  background: transparent;
  color: #f1f4f1;
  cursor: pointer;
  touch-action: manipulation;
}

.mode-option-omni { top: 14px; left: 50%; transform: translateX(-50%); }
.mode-option-video { top: 76px; left: calc(50% - 132px); }
.mode-option-image { top: 76px; right: calc(50% - 132px); }

.mode-option-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border: 1px solid rgba(255, 255, 255, .26);
  border-radius: 50%;
  background: rgba(255, 255, 255, .08);
  box-shadow: inset 0 0 0 5px rgba(255, 255, 255, .03), 0 7px 18px rgba(0, 0, 0, .28);
}

.mode-option-icon-image { color: #dbf5e6; background-color: rgba(38, 112, 78, .36); }
.mode-option-icon-video { color: #dbe9ff; background-color: rgba(61, 76, 125, .36); }

.mode-option-icon-omni {
  position: relative;
  color: #fff;
  background: linear-gradient(135deg, rgba(54, 62, 58, .86), rgba(30, 106, 67, .72));
}

.mode-option-icon-omni span {
  display: block;
  font-family: Georgia, serif;
  font-size: 32px;
  font-weight: 700;
  line-height: 1;
  transform: translateY(-1px);
}

.mode-option-label {
  color: rgba(245, 247, 245, .9);
  font-size: 14px;
  line-height: 1.35;
  text-shadow: 0 1px 5px rgba(0, 0, 0, .32);
}

.mode-close {
  position: absolute;
  top: 164px;
  left: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 58px;
  height: 58px;
  padding: 0;
  border: 1px solid rgba(255, 255, 255, .18);
  border-radius: 50%;
  background: rgba(7, 9, 8, .82);
  color: #f5f7f5;
  box-shadow: 0 8px 22px rgba(0, 0, 0, .3);
  transform: translateX(-50%);
  cursor: pointer;
}

.mode-option:active,
.mode-close:active {
  transform: scale(.96);
}

.mode-option-omni:active,
.mode-close:active {
  transform: translateX(-50%) scale(.96);
}

.create-menu-enter-active,
.create-menu-leave-active {
  transition: opacity 220ms ease;
}

.create-menu-enter-active .create-mode-panel,
.create-menu-leave-active .create-mode-panel {
  transition: transform 260ms cubic-bezier(.2, .8, .2, 1);
}

.create-menu-enter-from,
.create-menu-leave-to {
  opacity: 0;
}

.create-menu-enter-from .create-mode-panel,
.create-menu-leave-to .create-mode-panel {
  transform: translateY(38px);
}

@media (max-width: 360px) {
  .mode-option-omni { left: 50%; }
  .mode-option-image { right: calc(50% - 124px); }
  .mode-option-video { left: calc(50% - 124px); }
  .mode-option-label { font-size: 13px; }
}

@media (prefers-reduced-motion: reduce) {
  .create-menu-enter-active,
  .create-menu-leave-active,
  .create-menu-enter-active .create-mode-panel,
  .create-menu-leave-active .create-mode-panel { transition: none; }
}
</style>
