import type { Resource } from '@/types'

interface Cost {
  resource_type: 'metal' | 'crystal' | 'food'
  cost: number
}
export function hasSufficientResources(
  resources: Resource[],
  costs: Cost[]
): boolean {
  return costs.every((cost) => {
    const playerResource = resources.find(
      (r) => r.resource_type === cost.resource_type
    )
    return playerResource ? playerResource.quantity >= cost.cost : false
  })
}
