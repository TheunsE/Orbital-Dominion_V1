import type { ResourceDefinition, BuildingType } from '@/types'

export function hasSufficientResources(
  resources: ResourceDefinition[],
  costs: { resource_type: string; cost: number }[]
): boolean {
  return costs.every(cost => {
    const resource = resources.find(r => r.resource_type === cost.resource_type)
    return resource && resource.quantity >= cost.cost
  })
}
