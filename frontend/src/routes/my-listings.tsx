import { createFileRoute } from '@tanstack/react-router'
import { MyListingsPage } from '@/features/listings/pages/MyListingsPage'

export const Route = createFileRoute('/my-listings')({
  component: MyListingsPage,
})
