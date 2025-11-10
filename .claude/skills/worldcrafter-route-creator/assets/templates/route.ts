import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    // Optional: Authentication
    // const supabase = await createClient()
    // const { data: { user } } = await supabase.auth.getUser()
    // if (!user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    // Fetch data
    const data = await prisma.yourModel.findMany()

    return NextResponse.json(data)
  } catch (error) {
    console.error('GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    // Parse body
    const body = await request.json()

    // Validate input (use Zod schema)
    // const validated = schema.parse(body)

    // Create record
    const result = await prisma.yourModel.create({
      data: body
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, ...data } = body

    const result = await prisma.yourModel.update({
      where: { id },
      data
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('PUT error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID required' },
        { status: 400 }
      )
    }

    await prisma.yourModel.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
