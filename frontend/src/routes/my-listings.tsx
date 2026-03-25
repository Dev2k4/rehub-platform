import { createFileRoute } from '@tanstack/react-router'

function MyListingsPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Tin đăng của tôi</h1>
        <p className="mt-2 text-gray-600">Trang này sẽ được implement trong bước tiếp theo</p>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/my-listings')({
  component: MyListingsPage,
})
