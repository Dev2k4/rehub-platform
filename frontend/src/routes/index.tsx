import { createFileRoute } from '@tanstack/react-router'
import { HomeMarketplacePage } from '@/features/home/components/HomeMarketplacePage'

export const Route = createFileRoute('/')({
  component: Index,
})

function Index() {
  return <HomeMarketplacePage />
}
