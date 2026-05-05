import pb from '@/lib/pocketbase/client'

export const getProcesses = () =>
  pb.collection('processes').getFullList({
    expand:
      'buyer,seller,assigned_analyst,broker,credit_analysis_type,property_type,development_type',
    sort: '-created',
  })
export const getProcess = (id: string) =>
  pb.collection('processes').getOne(id, {
    expand:
      'buyer,seller,assigned_analyst,broker,credit_analysis_type,property_type,development_type',
  })

export const getCreditAnalysisTypes = () =>
  pb.collection('credit_analysis_types').getFullList({ sort: '-created' })
export const createCreditAnalysisType = (data: any) =>
  pb.collection('credit_analysis_types').create(data)
export const updateCreditAnalysisType = (id: string, data: any) =>
  pb.collection('credit_analysis_types').update(id, data)
export const deleteCreditAnalysisType = (id: string) =>
  pb.collection('credit_analysis_types').delete(id)

export const getPropertyTypes = () =>
  pb.collection('property_types').getFullList({ sort: '-created' })
export const createPropertyType = (data: any) => pb.collection('property_types').create(data)
export const updatePropertyType = (id: string, data: any) =>
  pb.collection('property_types').update(id, data)
export const deletePropertyType = (id: string) => pb.collection('property_types').delete(id)

export const getDevelopmentTypes = () =>
  pb.collection('development_types').getFullList({ sort: '-created' })
export const createDevelopmentType = (data: any) => pb.collection('development_types').create(data)
export const updateDevelopmentType = (id: string, data: any) =>
  pb.collection('development_types').update(id, data)
export const deleteDevelopmentType = (id: string) => pb.collection('development_types').delete(id)

export const createProcess = (data: any) => pb.collection('processes').create(data)
export const getEngineeringRequests = () =>
  pb.collection('engineering_requests').getFullList({ sort: '-created' })
export const createEngineeringRequest = (data: FormData) =>
  pb.collection('engineering_requests').create(data)
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
export const createUser = (data: any) =>
  pb.collection('users').create({ ...data, passwordConfirm: data.password })
export const updateUser = (id: string, data: any) => pb.collection('users').update(id, data)
export const deleteUser = (id: string) => pb.collection('users').delete(id)
