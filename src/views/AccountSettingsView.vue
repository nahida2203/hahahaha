<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, ArrowRight, Camera, Check, CopyDocument, SwitchButton, Sunny, Moon } from '@element-plus/icons-vue'
import { useSessionStore } from '../stores/session'
import { useThemeStore, type ThemeMode } from '../stores/theme'
import { getSampleAssetsSync } from '../api/assets'
import DefaultAvatar from '../components/DefaultAvatar.vue'

const router = useRouter()
const session = useSessionStore()
const theme = useThemeStore()
const { user } = storeToRefs(session)
const profileEditVisible = ref(false)
const appearanceVisible = ref(false)
const waterMarkEnabled = ref(true)
const form = reactive({ name: user.value?.name ?? '', phone: user.value?.phone ?? '' })
const profileId = computed(() => String(user.value?.username ?? '4291026015').replace(/\D/g, '').slice(-10) || '4291026015')
const backgroundUrl = getSampleAssetsSync()[3]?.url ?? ''
const themeLabel = computed(() => theme.mode === 'light' ? '浅色' : '深色')

function openNameEditor(): void {
  form.name = user.value?.name ?? ''
  form.phone = user.value?.phone ?? ''
  profileEditVisible.value = true
}

function saveProfile(): void {
  const name = form.name.trim()
  const phone = form.phone.trim()
  if (!name) { ElMessage.warning('请输入昵称'); return }
  if (name.length > 20) { ElMessage.warning('昵称不能超过20个字'); return }
  if (phone && !/^1\d{10}$/.test(phone)) { ElMessage.warning('请输入正确的11位手机号'); return }
  session.updateProfile({ name, phone })
  profileEditVisible.value = false
  ElMessage.success('个人资料已更新')
}

function showComingSoon(message: string): void { ElMessage.info(message) }

function selectTheme(mode: ThemeMode): void {
  theme.setMode(mode)
  appearanceVisible.value = false
  ElMessage.success(mode === 'light' ? '已切换为浅色外观' : '已切换为深色外观')
}

async function copyId(): Promise<void> {
  try {
    await navigator.clipboard.writeText(profileId.value)
    ElMessage.success('ID 已复制')
  } catch {
    ElMessage.info('ID：' + profileId.value)
  }
}

async function handleLogout(): Promise<void> {
  try {
    await ElMessageBox.confirm('退出后需重新登录才能继续使用，确定退出吗？', '退出登录', { confirmButtonText: '退出', cancelButtonText: '取消', type: 'warning' })
  } catch { return }
  session.logout()
  ElMessage.success('已退出登录')
  router.replace({ name: 'login' })
}
</script>

<template>
  <div class="settings-page">
    <header class="settings-header">
      <button class="back-button" type="button" aria-label="返回我的" @click="router.back()"><el-icon :size="24"><ArrowLeft /></el-icon></button>
      <h1>个人设置</h1>
      <span class="header-spacer" aria-hidden="true" />
    </header>

    <div class="settings-avatar-wrap">
      <div class="settings-avatar" aria-label="当前头像"><DefaultAvatar /></div>
      <button class="avatar-edit" type="button" aria-label="修改头像" @click="showComingSoon('头像修改功能将在后续版本开放')"><el-icon :size="15"><Camera /></el-icon></button>
    </div>

    <section class="settings-card profile-card" aria-label="个人资料设置">
      <button class="setting-row" type="button" @click="openNameEditor"><span class="row-label">昵称</span><span class="row-value">{{ user?.name ?? '未设置' }}</span><el-icon><ArrowRight /></el-icon></button>
      <button class="setting-row" type="button" @click="showComingSoon('简介编辑功能将在后续版本开放')"><span class="row-label">简介</span><span class="row-value row-value-wide">专注农产品内容创作</span><el-icon><ArrowRight /></el-icon></button>
      <button class="setting-row background-row" type="button" @click="showComingSoon('背景修改功能将在后续版本开放')"><span class="row-label">背景</span><span class="background-thumb" :style="{ backgroundImage: 'url(' + backgroundUrl + ')' }" aria-hidden="true" /><el-icon><ArrowRight /></el-icon></button>
      <button class="setting-row" type="button" @click="copyId"><span class="row-label">ID</span><span class="row-value">{{ profileId }}</span><el-icon><CopyDocument /></el-icon></button>
    </section>

    <section class="settings-card single-card"><button class="setting-row" type="button" @click="showComingSoon('隐私设置将在后续版本开放')"><span class="row-label">隐私设置</span><span class="row-value" /><el-icon><ArrowRight /></el-icon></button></section>
    <section class="settings-card single-card"><button class="setting-row" type="button" @click="appearanceVisible = true"><span class="row-label">外观设置</span><span class="row-value">{{ themeLabel }}</span><el-icon><ArrowRight /></el-icon></button></section>
    <section class="settings-card single-card"><button class="setting-row" type="button" @click="waterMarkEnabled = !waterMarkEnabled"><span class="row-label">AI生成水印设置</span><span class="watermark-state">{{ waterMarkEnabled ? '已开启' : '已关闭' }}</span><el-icon><ArrowRight /></el-icon></button></section>
    <section class="settings-card single-card danger-card">
      <button class="setting-row" type="button" @click="showComingSoon('账号注销请联系平台管理员')"><span class="row-label">账号注销</span><span class="row-value" /><el-icon><ArrowRight /></el-icon></button>
      <button class="setting-row logout-row" type="button" @click="handleLogout"><span class="row-label">退出登录</span><span class="row-value" /><el-icon><SwitchButton /></el-icon></button>
    </section>

    <el-drawer v-model="profileEditVisible" direction="btt" size="min(58dvh, 460px)" :with-header="false" append-to-body class="profile-edit-drawer">
      <div class="edit-drawer-content">
        <div class="edit-drawer-head"><h2>编辑个人资料</h2><button type="button" aria-label="关闭编辑" @click="profileEditVisible = false">×</button></div>
        <label class="edit-field"><span>昵称</span><el-input v-model="form.name" maxlength="20" show-word-limit /></label>
        <label class="edit-field"><span>手机号</span><el-input v-model="form.phone" maxlength="11" inputmode="numeric" placeholder="可选" /></label>
        <el-button type="primary" class="edit-save" @click="saveProfile"><el-icon><Check /></el-icon>保存修改</el-button>
      </div>
    </el-drawer>

    <el-drawer v-model="appearanceVisible" direction="btt" size="min(42dvh, 340px)" :with-header="false" append-to-body class="appearance-drawer">
      <div class="appearance-content">
        <div class="edit-drawer-head"><h2>外观设置</h2><button type="button" aria-label="关闭外观设置" @click="appearanceVisible = false">×</button></div>
        <p class="appearance-hint">选择适合你的界面色调，切换会应用到整个应用。</p>
        <div class="appearance-options" role="radiogroup" aria-label="外观模式">
          <button class="appearance-option" :class="{ selected: theme.mode === 'dark' }" type="button" role="radio" :aria-checked="theme.mode === 'dark'" @click="selectTheme('dark')">
            <span class="appearance-icon dark-icon"><el-icon :size="22"><Moon /></el-icon></span><span class="appearance-copy"><strong>深色</strong><small>沉浸式深色界面</small></span><el-icon v-if="theme.mode === 'dark'" class="appearance-check"><Check /></el-icon>
          </button>
          <button class="appearance-option" :class="{ selected: theme.mode === 'light' }" type="button" role="radio" :aria-checked="theme.mode === 'light'" @click="selectTheme('light')">
            <span class="appearance-icon light-icon"><el-icon :size="22"><Sunny /></el-icon></span><span class="appearance-copy"><strong>浅色</strong><small>清爽明亮界面</small></span><el-icon v-if="theme.mode === 'light'" class="appearance-check"><Check /></el-icon>
          </button>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<style scoped>
.settings-page { min-height: 100dvh; padding: calc(8px + env(safe-area-inset-top)) 16px 32px; background: #090b0c; color: #f7faf7; }
.settings-header { display: grid; grid-template-columns: 48px minmax(0, 1fr) 48px; align-items: center; min-height: 52px; }
.settings-header h1 { margin: 0; font-size: 20px; font-weight: 700; text-align: center; }
.back-button { display: inline-flex; align-items: center; justify-content: center; width: 48px; height: 48px; padding: 0; border: 0; background: transparent; color: #f7faf7; cursor: pointer; }
.header-spacer { width: 48px; }
.settings-avatar-wrap { position: relative; display: flex; justify-content: center; margin: 35px 0 38px; }
.settings-avatar { display: flex; align-items: center; justify-content: center; width: 128px; height: 128px; border: 4px solid #f6f7f5; border-radius: 50%; background: #f6f7f5; color: #c0c4c5; font-size: 48px; font-weight: 700; box-shadow: 0 10px 26px rgba(0,0,0,.3); }
.avatar-edit { position: absolute; right: calc(50% - 66px); bottom: -2px; display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; border: 2px solid #090b0c; border-radius: 50%; background: #92ff3c; color: #183219; cursor: pointer; }
.settings-card { overflow: hidden; border-radius: 8px; background: #17191b; }
.profile-card, .single-card { margin-bottom: 24px; }
.setting-row { display: flex; align-items: center; gap: 12px; width: 100%; min-height: 74px; padding: 0 16px; border: 0; border-bottom: 1px solid rgba(255,255,255,.055); background: transparent; color: #f2f5f2; text-align: left; cursor: pointer; }
.setting-row:last-child { border-bottom: 0; }
.setting-row:active { background: rgba(255,255,255,.06); }
.row-label { flex: 0 0 auto; font-size: 16px; font-weight: 600; }
.row-value { min-width: 0; flex: 1; overflow: hidden; color: #f3f5f3; font-size: 15px; text-align: right; text-overflow: ellipsis; white-space: nowrap; }
.row-value-wide { max-width: 70%; }
.setting-row > .el-icon { flex: 0 0 auto; color: #f0f4f0; }
.background-thumb { width: 104px; height: 56px; margin-left: auto; border-radius: 4px; background-position: center; background-size: cover; }
.watermark-state { margin-left: auto; color: #97ff48; font-size: 13px; }
.logout-row .el-icon { color: #ffb2b2; }
.appearance-drawer { color: #f2f5f2; }
@media (min-width: 680px) { .settings-page { width: min(100%, 720px); margin: 0 auto; padding-right: 24px; padding-left: 24px; } }
</style>

<style>
.profile-edit-drawer { overflow: hidden; border-radius: 16px 16px 0 0; background: #17191b; color: #f2f5f2; }
.profile-edit-drawer .el-drawer__body { padding: 0; background: #17191b; }
.edit-drawer-content { display: flex; min-height: 100%; flex-direction: column; gap: 18px; padding: 20px 16px calc(18px + env(safe-area-inset-bottom)); }
.edit-drawer-head { display: flex; align-items: center; justify-content: space-between; }
.edit-drawer-head h2 { margin: 0; font-size: 18px; }
.edit-drawer-head button { width: 40px; height: 40px; border: 0; background: transparent; color: #b8c2bb; font-size: 28px; cursor: pointer; }
.edit-field { display: flex; flex-direction: column; gap: 7px; color: #c6d0c9; font-size: 13px; }
.edit-field .el-input__wrapper { background: #25282a; box-shadow: none; }
.edit-field .el-input__inner { color: #f2f7f2; }
.edit-save { width: 100%; min-height: 48px; margin-top: auto; }
.appearance-content { display: flex; min-height: 100%; flex-direction: column; gap: 8px; padding: 20px 16px calc(18px + env(safe-area-inset-bottom)); }
.appearance-hint { margin: 0 0 8px; color: #9aa69e; font-size: 13px; line-height: 1.5; }
.appearance-options { display: grid; gap: 10px; }
.appearance-option { display: flex; align-items: center; gap: 12px; min-height: 68px; padding: 10px 12px; border: 1px solid rgba(255,255,255,.1); border-radius: 12px; background: #202325; color: #f2f5f2; text-align: left; cursor: pointer; }
.appearance-option.selected { border-color: #92cfa7; background: rgba(144,205,164,.12); }
.appearance-icon { display: inline-flex; align-items: center; justify-content: center; width: 42px; height: 42px; border-radius: 12px; }
.dark-icon { background: #17191b; color: #dbe8df; }
.light-icon { background: #eaf5ec; color: #2b7a55; }
.appearance-copy { display: flex; min-width: 0; flex-direction: column; gap: 3px; }
.appearance-copy strong { font-size: 15px; }
.appearance-copy small { color: #9aa69e; font-size: 12px; }
.appearance-check { margin-left: auto; color: #8fd09f; }
</style>
