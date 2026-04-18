import pb from '@/lib/pocketbase/client'

export const getProcesses = () =>
  pb
    .collection('processes')
    .getFullList({ expand: 'buyer,seller,assigned_analyst', sort: '-created' })
export const getProcess = (id: string) =>
  pb.collection('processes').getOne(id, { expand: 'buyer,seller,assigned_analyst' })
export const createProcess = (data: any) => pb.collection('processes').create(data)
export const updateProcess = (id: string, data: any) => pb.collection('processes').update(id, data)

export const getDocuments = (processId: string) =>
  pb
    .collection('documents')
    .getFullList({ filter: `process="${processId}"`, expand: 'uploaded_by', sort: '-created' })
export const createDocument = (data: FormData) => pb.collection('documents').create(data)
export const updateDocument = (id: string, data: any) => pb.collection('documents').update(id, data)

export const getUsers = (role?: string) => {
  if (role) return pb.collection('users').getFullList({ filter: `role="${role}"` })
  return pb.collection('users').getFullList()
}
