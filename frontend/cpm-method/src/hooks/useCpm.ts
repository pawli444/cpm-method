import { useMemo } from 'react'
import type { ActivityInput, ActivityResult, CpmResult } from '../types/cpm'

const byEsThenId = (a: ActivityResult, b: ActivityResult) => {
  if (a.es === b.es) {
    return a.id.localeCompare(b.id)
  }

  return a.es - b.es
}

const buildTopologicalOrder = (
  activities: ActivityInput[],
): { order: string[]; errors: string[] } => {
  const errors: string[] = []
  const ids = new Set<string>()

  for (const activity of activities) {
    if (ids.has(activity.id)) {
      errors.push(`Powtorzone ID czynnosci: ${activity.id}`)
    }
    ids.add(activity.id)
  }

  for (const activity of activities) {
    for (const predecessor of activity.predecessors) {
      if (!ids.has(predecessor)) {
        errors.push(
          `Czynnosc ${activity.id} odwoluje sie do nieistniejacego poprzednika: ${predecessor}`,
        )
      }
    }
  }

  if (errors.length > 0) {
    return { order: [], errors }
  }

  const indegree = new Map<string, number>()
  const successors = new Map<string, string[]>()

  for (const activity of activities) {
    indegree.set(activity.id, activity.predecessors.length)
    successors.set(activity.id, [])
  }

  for (const activity of activities) {
    for (const predecessor of activity.predecessors) {
      const prevSuccessors = successors.get(predecessor) ?? []
      prevSuccessors.push(activity.id)
      successors.set(predecessor, prevSuccessors)
    }
  }

  const queue = [...activities]
    .filter((activity) => (indegree.get(activity.id) ?? 0) === 0)
    .map((activity) => activity.id)
    .sort()

  const order: string[] = []

  while (queue.length > 0) {
    const current = queue.shift()
    if (!current) {
      break
    }

    order.push(current)

    for (const next of successors.get(current) ?? []) {
      const newValue = (indegree.get(next) ?? 0) - 1
      indegree.set(next, newValue)
      if (newValue === 0) {
        queue.push(next)
        queue.sort()
      }
    }
  }

  if (order.length !== activities.length) {
    return {
      order: [],
      errors: ['Wykryto cykl zaleznosci. Siec CPM musi byc acykliczna.'],
    }
  }

  return { order, errors: [] }
}

const computeCpm = (activities: ActivityInput[]): CpmResult => {
  const { order, errors } = buildTopologicalOrder(activities)

  if (errors.length > 0) {
    return {
      activities: [],
      projectDuration: 0,
      criticalPath: [],
      topologicalOrder: [],
      errors,
    }
  }

  const byId = new Map(activities.map((activity) => [activity.id, activity]))
  const successors = new Map<string, string[]>()

  for (const activity of activities) {
    successors.set(activity.id, [])
  }

  for (const activity of activities) {
    for (const predecessor of activity.predecessors) {
      const nextList = successors.get(predecessor) ?? []
      nextList.push(activity.id)
      successors.set(predecessor, nextList)
    }
  }

  const es = new Map<string, number>()
  const ef = new Map<string, number>()

  for (const id of order) {
    const current = byId.get(id)
    if (!current) {
      continue
    }

    const earliestStart = current.predecessors.reduce((maxValue, predecessor) => {
      return Math.max(maxValue, ef.get(predecessor) ?? 0)
    }, 0)

    es.set(id, earliestStart)
    ef.set(id, earliestStart + current.duration)
  }

  const projectDuration = Math.max(...Array.from(ef.values()), 0)

  const reversedOrder = [...order].reverse()
  const lf = new Map<string, number>()
  const ls = new Map<string, number>()

  for (const id of reversedOrder) {
    const current = byId.get(id)
    if (!current) {
      continue
    }

    const nextActivities = successors.get(id) ?? []
    const latestFinish =
      nextActivities.length > 0
        ? Math.min(...nextActivities.map((nextId) => ls.get(nextId) ?? projectDuration))
        : projectDuration

    lf.set(id, latestFinish)
    ls.set(id, latestFinish - current.duration)
  }

  const activityResults: ActivityResult[] = activities
    .map((activity) => {
      const earliestStart = es.get(activity.id) ?? 0
      const earliestFinish = ef.get(activity.id) ?? activity.duration
      const latestStart = ls.get(activity.id) ?? earliestStart
      const latestFinish = lf.get(activity.id) ?? earliestFinish
      const slack = latestStart - earliestStart

      return {
        ...activity,
        es: earliestStart,
        ef: earliestFinish,
        ls: latestStart,
        lf: latestFinish,
        slack,
        isCritical: slack === 0,
      }
    })
    .sort(byEsThenId)

  const criticalPath = activityResults
    .filter((activity) => activity.isCritical)
    .sort(byEsThenId)
    .map((activity) => activity.id)

  return {
    activities: activityResults,
    projectDuration,
    criticalPath,
    topologicalOrder: order,
    errors: [],
  }
}

export const useCpm = (activities: ActivityInput[]) => {
  return useMemo(() => computeCpm(activities), [activities])
}
