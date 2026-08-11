<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Pear } from '@element-plus/icons-vue'
import { useSessionStore } from '../stores/session'

const router = useRouter()
const route = useRoute()
const session = useSessionStore()

const form = reactive({
  username: '',
  password: '',
})

const submitting = ref(false)

async function submit() {
  if (!form.username.trim()) {
    ElMessage.warning('请输入账号')
    return
  }
  if (!form.password) {
    ElMessage.warning('请输入密码')
    return
  }
  submitting.value = true
  try {
    await new Promise((resolve) => setTimeout(resolve, 500))
    const result = session.login(form.username, form.password)
    if (!result.ok) {
      ElMessage.error(result.message ?? '登录失败')
      return
    }
    ElMessage.success(`欢迎回来，${session.user?.name ?? ''}`)
    const redirect = typeof route.query.redirect === 'string' && route.query.redirect ? route.query.redirect : '/'
    router.replace(redirect)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-hero" aria-hidden="true">
      <div class="hero-mark"><el-icon :size="26"><Pear /></el-icon></div>
      <h1>福农AI创</h1>
      <p class="hero-sub">移动端创作中心</p>
    </div>

    <section class="login-card" aria-label="账号登录">
      <form novalidate @submit.prevent="submit">
        <label class="field">
          <span class="field-label">账号</span>
          <el-input
            v-model="form.username"
            size="large"
            placeholder="请输入账号"
            autocomplete="username"
            aria-label="账号"
          />
        </label>
        <label class="field">
          <span class="field-label">密码</span>
          <el-input
            v-model="form.password"
            size="large"
            type="password"
            show-password
            placeholder="请输入密码"
            autocomplete="current-password"
            aria-label="密码"
            @keyup.enter="submit"
          />
        </label>
        <el-button class="submit-btn" type="primary" native-type="submit" :loading="submitting">
          {{ submitting ? '登录中…' : '登 录' }}
        </el-button>
      </form>
    </section>
  </div>
</template>

<style scoped>
.login-page {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  padding: 48px 20px calc(32px + env(safe-area-inset-bottom));
  background:
    radial-gradient(120% 60% at 50% -10%, rgba(22, 140, 97, 0.28) 0%, rgba(22, 140, 97, 0) 60%),
    var(--color-page);
}

.login-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 28px;
  text-align: center;
}

.hero-mark {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  margin-bottom: 12px;
  border-radius: 18px;
  background: var(--color-brand);
  color: #fff;
  box-shadow: 0 10px 24px rgba(22, 140, 97, 0.28);
}

.login-hero h1 {
  margin: 0 0 4px;
  font-size: 20px;
}

.hero-sub {
  margin: 0;
  color: var(--color-muted);
  font-size: 13px;
}

.login-card {
  width: 100%;
  max-width: 420px;
  margin: 0 auto;
  padding: 22px 18px 18px;
  border: 1px solid var(--color-border);
  border-radius: 16px;
  background: var(--color-surface);
  box-shadow: 0 8px 28px rgba(21, 23, 34, 0.06);
}

.field {
  display: block;
  margin-bottom: 14px;
}

.field-label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-ink-secondary);
}

.submit-btn {
  width: 100%;
  margin-top: 6px;
  font-size: 16px;
  letter-spacing: 4px;
}

</style>
