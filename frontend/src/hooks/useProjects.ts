import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { ActivityInput } from '../types/cpm'

export interface Project {
  id: string
  name: string
  created_at: string
  updated_at: string
}

export const useProjects = (userId: string | undefined) => {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchProjects = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    const { data, error } = await supabase
      .from('projects')
      .select('id, name, created_at, updated_at')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (error) setError(error.message)
    else setProjects(data ?? [])
    setLoading(false)
  }, [userId])

  useEffect(() => { fetchProjects() }, [fetchProjects])

  const createProject = async (name: string): Promise<string | null> => {
    if (!userId) return null
    const { data, error } = await supabase
      .from('projects')
      .insert({ user_id: userId, name })
      .select('id')
      .single()

    if (error) { setError(error.message); return null }
    await fetchProjects()
    return data.id
  }

  const deleteProject = async (projectId: string) => {
    await supabase.from('tasks').delete().eq('project_id', projectId)
    await supabase.from('projects').delete().eq('id', projectId)
    await fetchProjects()
  }

  const saveActivities = async (projectId: string, activities: ActivityInput[]) => {
    await supabase.from('tasks').delete().eq('project_id', projectId)
    if (activities.length === 0) return

    const rows = activities.map((a) => ({
      project_id: projectId,
      task_id: a.id,
      name: a.name,
      duration: a.duration,
      predecessors: a.predecessors,
    }))

    const { error } = await supabase.from('tasks').insert(rows)
    if (error) setError(error.message)

    await supabase
      .from('projects')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', projectId)

    await fetchProjects()
  }

  const loadActivities = async (projectId: string): Promise<ActivityInput[]> => {
    const { data, error } = await supabase
      .from('tasks')
      .select('task_id, name, duration, predecessors')
      .eq('project_id', projectId)

    if (error) { setError(error.message); return [] }
    return (data ?? []).map((row) => ({
      id: row.task_id,
      name: row.name,
      duration: row.duration,
      predecessors: row.predecessors,
    }))
  }

  return { projects, loading, error, createProject, deleteProject, saveActivities, loadActivities }
}
