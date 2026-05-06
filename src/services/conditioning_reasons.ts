import pb from '@/lib/pocketbase/client'

export const getConditioningReasons = () =>
  pb.collection('conditioning_reasons').getFullList({ sort: 'name' })
export const createConditioningReason = (data: { name: string }) =>
  pb.collection('conditioning_reasons').create(data)
export const updateConditioningReason = (id: string, data: { name: string }) =>
  pb.collection('conditioning_reasons').update(id, data)
export const deleteConditioningReason = (id: string) =>
  pb.collection('conditioning_reasons').delete(id)
