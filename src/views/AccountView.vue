<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowRight, Bell, Collection, Guide, Menu, Setting, StarFilled } from '@element-plus/icons-vue'
import { useSessionStore } from '../stores/session'
import { useProjectsStore } from '../stores/projects'
import { useQuotaStore } from '../stores/quota'
import { getSampleAssetsSync } from '../api/assets'
import type { MvpTemplate } from '../api/types'
import { getAppDataSync } from '../utils/appDataLoader'
import { readAssetsFromStorage } from '../utils/assetStorage'
import QuotaPanel from '../components/me/QuotaPanel.vue'
import DefaultAvatar from '../components/DefaultAvatar.vue'

const router = useRouter()
const session = useSessionStore()
const projects = useProjectsStore()
const quota = useQuotaStore()
const { user } = storeToRefs(session)
const quotaVisible = ref(false)
const profileId = computed(() => String(user.value?.username ?? '4291026015').replace(/\D/g, '').slice(-10) || '4291026015')
const coverUrl = getSampleAssetsSync()[3]?.url ?? ''
const creationCount = computed(() => projects.projects.length)
const templateCount = computed(() => new Set(projects.projects.map((project) => project.templateId).filter(Boolean)).size)
const assetsCount = ref(readAssetsFromStorage().length)
const recentTemplates = computed(() => {
  const seen = new Set<string>()
  return [...projects.projects]
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .filter((project) => {
      if (!project.templateId || seen.has(project.templateId)) return false
      seen.add(project.templateId)
      return true
    })
    .map((project) => {
      const template = getAppDataSync()?.templates.find((item) => item.id === project.templateId)
      return template ? { project, template } : null
    })
    .filter((item): item is { project: typeof projects.projects[number]; template: MvpTemplate } => item !== null)
    .slice(0, 2)
})

function showMessage(message: string): void { ElMessage.info(message) }

function useTemplate(template: MvpTemplate): void {
  router.push({
    name: 'create-quick',
    query: { template: template.id, channels: template.channelIds.join(',') },
  })
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
  <div class="account-page">
    <section class="profile-hero" :style="{ '--cover-url': 'url(' + coverUrl + ')' }" aria-label="个人主页">
      <div class="hero-topbar">
        <button class="hero-icon-button" type="button" aria-label="打开个人菜单" @click="showMessage('个人菜单将在后续版本开放')"><el-icon :size="25"><Menu /></el-icon></button>
        <button class="hero-icon-button" type="button" aria-label="打开账号设置" @click="router.push({ name: 'account-settings' })"><el-icon :size="22"><Setting /></el-icon></button>
      </div>
      <div class="profile-avatar" aria-label="当前头像"><DefaultAvatar /></div>
      <div class="profile-identity">
        <h1>{{ user?.name ?? '未登录' }}</h1>
        <p>{{ profileId }} <span class="identity-id">ID</span></p>
        <span class="profile-motto">专注农产品内容创作</span>
        <span class="profile-creation-summary">已创作 {{ creationCount }} 条内容</span>
      </div>
    </section>

    <section class="profile-stats" aria-label="个人数据概览">
      <button type="button" @click="router.push({ name: 'projects' })"><strong>{{ creationCount }}</strong><span>创作记录</span></button>
      <button type="button" @click="router.push({ name: 'templates' })"><strong>{{ templateCount }}</strong><span>使用模板</span></button>
      <div><strong>{{ assetsCount }}</strong><span>上传素材</span></div>
      <button type="button" @click="quotaVisible = true"><strong>{{ quota.balance }}</strong><span>消耗额度</span></button>
    </section>

    <button class="member-banner quota-banner" type="button" @click="quotaVisible = true"><span class="member-icon"><el-icon :size="22"><StarFilled /></el-icon></span><span class="member-copy"><strong>AI额度</strong><span>5000点可用·查看额度明细</span></span><el-icon :size="18"><ArrowRight /></el-icon></button>

    <section class="quick-actions" aria-label="快捷功能"><button type="button" @click="router.push({ name: 'projects' })"><el-icon :size="20"><Collection /></el-icon><span>创作记录</span></button><button type="button" @click="showMessage('通知中心功能将在后续版本开放')"><el-icon :size="20"><Bell /></el-icon><span>通知中心</span></button><button type="button" @click="showMessage('使用指南功能将在后续版本开放')"><el-icon :size="20"><Guide /></el-icon><span>使用指南</span></button></section>

    <section class="recent-section" aria-label="最近使用模板">
      <div class="section-heading">
        <div>
          <span class="section-eyebrow">创作捷径</span>
          <h2>最近使用模板</h2>
        </div>
        <button class="section-link" type="button" @click="router.push({ name: 'templates' })">查看模板库<el-icon :size="15"><ArrowRight /></el-icon></button>
      </div>
      <div v-if="recentTemplates.length > 0" class="recent-template-grid">
        <article v-for="item in recentTemplates" :key="item.template.id" class="recent-template-card">
          <img :src="item.template.coverUrl" :alt="item.template.coverAlt" class="recent-template-cover" />
          <div class="recent-template-info">
            <div class="recent-template-meta"><span>{{ item.template.scene }}</span><span>{{ item.template.style }}</span></div>
            <h3>{{ item.template.title }}</h3>
            <p>{{ item.template.description }}</p>
            <button class="reuse-button" type="button" @click="useTemplate(item.template)">再次使用<el-icon :size="14"><ArrowRight /></el-icon></button>
          </div>
        </article>
      </div>
      <div v-else class="recent-empty">
        <div class="recent-empty-mark"><el-icon :size="22"><Collection /></el-icon></div>
        <div><strong>还没有使用过模板</strong><p>从模板库挑选一个，开始创作第一条内容</p></div>
        <button class="empty-link" type="button" @click="router.push({ name: 'templates' })">去模板库<el-icon :size="15"><ArrowRight /></el-icon></button>
      </div>
    </section>

    <el-drawer v-model="quotaVisible" direction="btt" size="min(82dvh, 620px)" :with-header="false" append-to-body class="quota-drawer"><QuotaPanel /></el-drawer>
  </div>
</template>

<style scoped>
.account-page { min-height: 100dvh; padding: 0 12px 108px; overflow: hidden; background: #090b0c; color: #f7faf7; }
.profile-hero { position: relative; min-height: 406px; margin: 0 -12px; overflow: hidden; isolation: isolate; background: #101716; }
.profile-hero::before { position: absolute; inset: 0; z-index: -2; background-image: linear-gradient(180deg, rgba(9,11,12,.15), rgba(9,11,12,.26) 30%, #090b0c 79%, #090b0c), var(--cover-url); background-position: center; background-size: cover; filter: saturate(.72) brightness(.62); content: ''; }
.profile-hero::after { position: absolute; inset: 0; z-index: -1; background: radial-gradient(circle at 24% 13%, rgba(211,123,71,.38), transparent 22%), radial-gradient(circle at 82% 16%, rgba(91,131,122,.4), transparent 28%); mix-blend-mode: screen; content: ''; }
.hero-topbar { display: flex; align-items: center; justify-content: space-between; padding: calc(12px + env(safe-area-inset-top)) 14px 0; }
.hero-icon-button { display: inline-flex; align-items: center; justify-content: center; width: 48px; height: 48px; border: 1px solid rgba(255,255,255,.22); border-radius: 50%; background: rgba(8,11,11,.42); color: #fff; cursor: pointer; backdrop-filter: blur(12px); }
.hero-icon-button:active, .member-banner:active, .quick-actions button:active, .account-tools button:active { transform: scale(.98); }
.profile-avatar { display: flex; align-items: center; justify-content: center; width: 112px; height: 112px; margin: 52px auto 0; border: 4px solid rgba(255,255,255,.95); border-radius: 50%; background: #f5f6f4; color: #b9bec0; box-shadow: 0 9px 30px rgba(0,0,0,.34); font-size: 42px; font-weight: 700; }
.profile-identity { display: flex; flex-direction: column; align-items: center; margin-top: 16px; text-align: center; }
.profile-identity h1 { margin: 0; font-size: 27px; font-weight: 750; line-height: 1.25; letter-spacing: .01em; }
.profile-identity p { display: flex; align-items: center; gap: 6px; margin: 7px 0 0; color: #d0d6d2; font-size: 13px; }
.identity-id { padding: 3px 6px; border: 1px solid rgba(255,255,255,.22); border-radius: 7px; color: #eef2ef; font-size: 11px; }
.profile-motto { margin-top: 15px; color: rgba(244,247,244,.75); font-size: 14px; }
.profile-creation-summary { margin-top: 8px; color: #98a49c; font-size: 12px; }
.profile-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin: -1px 0 16px; padding: 0 6px; text-align: center; }
.profile-stats div, .profile-stats button { display: flex; flex-direction: column; align-items: center; gap: 4px; min-width: 0; padding: 0; border: 0; background: transparent; color: inherit; font: inherit; cursor: pointer; }
.profile-stats strong { color: #f4f7f3; font-size: 22px; font-weight: 650; line-height: 1.15; }
.profile-stats span { color: #7f8983; font-size: 12px; line-height: 1.4; }
.member-banner { display: flex; align-items: center; gap: 11px; width: 100%; min-height: 66px; padding: 0 15px; border: 0; border-radius: 15px; background: linear-gradient(110deg, #d9f1df, #f0faef 53%, #c6e6ce); color: #172b1e; text-align: left; cursor: pointer; box-shadow: 0 10px 24px rgba(0,0,0,.16); }
.member-icon { display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; color: #1b4b2c; }
.member-copy { display: flex; min-width: 0; flex: 1; align-items: baseline; gap: 12px; }
.member-copy strong { font-size: 17px; font-weight: 750; white-space: nowrap; }
.member-copy span { overflow: hidden; color: #5a7962; font-size: 13px; text-overflow: ellipsis; white-space: nowrap; }
.quick-actions { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 14px; }
.quick-actions button { position: relative; display: flex; align-items: center; justify-content: center; gap: 7px; min-height: 64px; padding: 0 6px; border: 1px solid rgba(255,255,255,.08); border-radius: 14px; background: linear-gradient(145deg, #25272a, #17191b); color: #d6dcd8; font-size: 13px; cursor: pointer; }
.quick-actions button em { position: absolute; top: 7px; right: 8px; color: #8de15f; font-size: 10px; font-style: italic; font-weight: 750; }
.recent-section { margin-top: 26px; padding: 20px 0 4px; border-top: 1px solid rgba(255,255,255,.08); }
.section-heading { display: flex; align-items: flex-end; justify-content: space-between; gap: 14px; margin-bottom: 15px; }
.section-eyebrow { display: block; margin-bottom: 5px; color: #89968e; font-size: 11px; letter-spacing: .12em; }
.section-heading h2 { margin: 0; color: #f4f7f3; font-size: 20px; font-weight: 700; line-height: 1.25; }
.section-link, .empty-link { display: inline-flex; align-items: center; gap: 4px; min-height: 44px; padding: 0; border: 0; background: transparent; color: #b9d8c1; font-size: 12px; white-space: nowrap; cursor: pointer; }
.recent-template-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
.recent-template-card { min-width: 0; overflow: hidden; border: 1px solid rgba(255,255,255,.09); border-radius: 12px; background: #151918; box-shadow: 0 8px 22px rgba(0,0,0,.16); }
.recent-template-cover { display: block; width: 100%; aspect-ratio: 1.72; object-fit: cover; background: #202625; }
.recent-template-info { padding: 12px 12px 13px; }
.recent-template-meta { display: flex; gap: 6px; margin-bottom: 7px; overflow: hidden; color: #8fa099; font-size: 10px; white-space: nowrap; }
.recent-template-meta span { overflow: hidden; text-overflow: ellipsis; }
.recent-template-meta span + span::before { margin-right: 6px; color: #4d5c54; content: '·'; }
.recent-template-info h3 { overflow: hidden; margin: 0; color: #f1f5f1; font-size: 14px; font-weight: 650; line-height: 1.35; text-overflow: ellipsis; white-space: nowrap; }
.recent-template-info p { display: -webkit-box; overflow: hidden; min-height: 34px; margin: 6px 0 10px; color: #8d9992; font-size: 11px; line-height: 1.55; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
.reuse-button { display: inline-flex; align-items: center; gap: 4px; min-height: 32px; padding: 0 10px; border: 1px solid rgba(185,216,193,.32); border-radius: 7px; background: rgba(185,216,193,.08); color: #cce6d1; font-size: 11px; cursor: pointer; }
.reuse-button:active, .section-link:active, .empty-link:active { opacity: .72; }
.recent-empty { display: flex; align-items: center; gap: 11px; min-height: 92px; padding: 14px; border: 1px dashed rgba(185,216,193,.22); border-radius: 12px; background: rgba(255,255,255,.025); }
.recent-empty-mark { display: inline-flex; flex: 0 0 auto; align-items: center; justify-content: center; width: 42px; height: 42px; border-radius: 11px; background: rgba(185,216,193,.1); color: #b9d8c1; }
.recent-empty strong { display: block; color: #e5ece6; font-size: 13px; font-weight: 650; }
.recent-empty p { margin: 5px 0 0; color: #849189; font-size: 11px; line-height: 1.45; }
.recent-empty .empty-link { margin-left: auto; }
@media (min-width: 680px) { .account-page { width: min(100%, 720px); margin: 0 auto; padding-right: 24px; padding-left: 24px; } .profile-hero { margin-right: -24px; margin-left: -24px; } }
</style>

<style>
.quota-drawer { overflow: hidden; border-radius: 16px 16px 0 0; background: #121715; color: #f3f7f3; }
.quota-drawer .el-drawer__body { padding: 0; overflow: auto; background: #121715; }
.quota-drawer .page-panel { border-color: rgba(255,255,255,.08); background: #121715; color: #f3f7f3; }
.quota-drawer .stat { background: rgba(255,255,255,.07); }
.quota-drawer .stat-label, .quota-drawer .stat-unit, .quota-drawer .ledger-count, .quota-drawer .ledger-time, .quota-drawer .ledger-balance { color: #8d9992; }
.quota-drawer .stat-value, .quota-drawer .ledger-title, .quota-drawer .ledger-head h3 { color: #f3f7f3; }
.quota-drawer .ledger-list { border-color: rgba(255,255,255,.1); }
.quota-drawer .ledger-row + .ledger-row { border-top-color: rgba(255,255,255,.1); }
</style>
