import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import 'element-plus/dist/index.css'
import App from './App.vue'
import router from './router'
import './styles/tokens.css'
import './styles/base.css'
import { useThemeStore } from './stores/theme'
import { loadAppConfig } from './utils/configLoader'
import { loadAppData } from './utils/appDataLoader'

async function bootstrap() {
  // 1. 初始化配置和数据源 (去除硬编码)
  try {
    await Promise.all([loadAppConfig(), loadAppData()])
  } catch (error) {
    console.error('Failed to initialize application data/config:', error)
    // 可以渲染一个全屏错误，或者继续运行但提示错误
  }

  const app = createApp(App)
  const pinia = createPinia()
  app.use(pinia)
  useThemeStore(pinia).initialize()
  app.use(router)
  app.use(ElementPlus, { locale: zhCn })
  app.mount('#app')
}

bootstrap()

