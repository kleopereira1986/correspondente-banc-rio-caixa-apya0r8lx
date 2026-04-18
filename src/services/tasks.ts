import pb from '@/lib/pocketbase/client'

export const getTaskTypes = () => pb.collection('task_types').getFullList({ sort: 'name' })

export const createTaskType = (data: any) => pb.collection('task_types').create(data)

export const getTasks = () =>
  pb.collection('tasks').getFullList({
    expand: 'type,requester,assigned_analyst',
    sort: '-created',
  })

export const getTask = (id: string) =>
  pb.collection('tasks').getOne(id, {
    expand: 'type,requester,assigned_analyst',
  })

export const createTask = (data: any) => {
  data.request_date = new Date().toISOString()
  return pb.collection('tasks').create(data)
}

export const updateTask = (id: string, data: any) => {
  if ((data.status === 'completed' || data.status === 'returned') && !data.return_date) {
    data.return_date = new Date().toISOString()
  }
  // Clear return date if status goes back
  if (data.status === 'pending' || data.status === 'in_progress') {
    data.return_date = null
  }
  return pb.collection('tasks').update(id, data)
}

export const getInteractions = (taskId: string) =>
  pb.collection('task_interactions').getFullList({
    filter: `task="${taskId}"`,
    expand: 'user',
    sort: 'created',
  })

export const createInteraction = (data: any) => pb.collection('task_interactions').create(data)
