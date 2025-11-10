import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Page Title',
  description: 'Page description'
}

export default async function PageName() {
  // Server Component - can fetch data directly
  // const data = await prisma.model.findMany()

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold">Page Title</h1>

      <div className="mt-6">
        {/* Page content */}
      </div>
    </div>
  )
}
