import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { Project } from '../api/types'
import { STORAGE_KEYS } from '../api/types'
import { getDemoProjectsSync } from '../api/projects'
import { genId, nowIso } from '../utils/id'

function readStoredProjects(): Project[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.projects)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return null
    return (parsed as Project[]).map((project) => ({
      ...project,
      title: project.title.replace(/（示例）$/u, ''),
      assets: project.assets.map((asset) => ({
        ...asset,
        name: asset.name.replace(/示例图$/u, ''),
      })),
    }))
  } catch {
    return null
  }
}

/** 创作记录持久化（localStorage 'funong-mvp.projects.v1'，数组元素兼容 P1 首页只读展示） */
export const useProjectsStore = defineStore('projects', () => {
  const projects = ref<Project[]>(readStoredProjects() ?? [])

  function persist(): void {
    localStorage.setItem(STORAGE_KEYS.projects, JSON.stringify(projects.value))
  }

  /** 保存创作记录（写入数组头部并持久化） */
  function saveProject(input: Omit<Project, 'id' | 'createdAt'>): Project {
    const project: Project = {
      ...input,
      id: genId('project'),
      createdAt: nowIso(),
    }
    projects.value = [project, ...projects.value]
    persist()
    return project
  }

  /** 删除创作记录（按 id，持久化后返回是否删除成功） */
  function deleteProject(id: string): boolean {
    const before = projects.value.length
    projects.value = projects.value.filter((item) => item.id !== id)
    if (projects.value.length === before) return false
    persist()
    return true
  }

  /** 写入演示种子数据（仅当本地为空时，供演示场景调用） */
  function seedDemoProjects(): void {
    if (projects.value.length > 0) return
    projects.value = getDemoProjectsSync().map((item) => ({ ...item }))
    persist()
  }

  return { projects, saveProject, deleteProject, seedDemoProjects, persist }
})
