#!/usr/bin/env python3
"""
Route Scaffolder for WorldCrafter

Scaffolds Next.js App Router routes with all necessary files.

Usage:
    python scaffold_route.py <route-path> [options]
    python scaffold_route.py dashboard
    python scaffold_route.py posts/[id]
    python scaffold_route.py api/users --api
"""

import sys
import argparse
from pathlib import Path


def create_page_component(route_name: str, is_protected: bool = False) -> str:
    """Generate page.tsx content"""
    auth_check = '''
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }
''' if is_protected else ''

    imports = '''import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

''' if is_protected else ''

    template = f'''{imports}export default async function {route_name}Page() {{{auth_check}
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold">{route_name}</h1>
      {/* Add your content here */}
    </div>
  )
}}
'''
    return template


def create_layout_component(route_name: str) -> str:
    """Generate layout.tsx content"""
    template = f'''export default function {route_name}Layout({{
  children,
}}: {{
  children: React.ReactNode
}}) {{
  return (
    <div className="{route_name.lower()}-layout">
      {{children}}
    </div>
  )
}}
'''
    return template


def create_loading_component() -> str:
    """Generate loading.tsx content"""
    return '''export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-muted border-t-primary" />
    </div>
  )
}
'''


def create_error_component() -> str:
    """Generate error.tsx content"""
    return '''"use client"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h2 className="text-2xl font-bold">Something went wrong!</h2>
      <p className="text-muted-foreground">{error.message}</p>
      <button
        onClick={reset}
        className="mt-4 rounded bg-primary px-4 py-2 text-primary-foreground"
      >
        Try again
      </button>
    </div>
  )
}
'''


def create_not_found_component(route_name: str) -> str:
    """Generate not-found.tsx content"""
    return f'''import Link from 'next/link'

export default function NotFound() {{
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h2 className="text-2xl font-bold">{route_name} Not Found</h2>
      <p className="text-muted-foreground">Could not find the requested resource</p>
      <Link
        href="/"
        className="mt-4 rounded bg-primary px-4 py-2 text-primary-foreground"
      >
        Go Home
      </Link>
    </div>
  )
}}
'''


def create_api_route(route_name: str) -> str:
    """Generate route.ts content for API"""
    template = f'''import {{ NextResponse }} from 'next/server'
import {{ prisma }} from '@/lib/prisma'
import {{ createClient }} from '@/lib/supabase/server'

export async function GET() {{
  try {{
    // Authentication check (optional)
    // const supabase = await createClient()
    // const {{ data: {{ user }} }} = await supabase.auth.getUser()
    // if (!user) {{
    //   return NextResponse.json({{ error: 'Unauthorized' }}, {{ status: 401 }})
    // }}

    const data = await prisma.yourModel.findMany()
    return NextResponse.json(data)
  }} catch (error) {{
    return NextResponse.json(
      {{ error: 'Internal server error' }},
      {{ status: 500 }}
    )
  }}
}}

export async function POST(request: Request) {{
  try {{
    const body = await request.json()

    // Validate input here

    const result = await prisma.yourModel.create({{
      data: body
    }})

    return NextResponse.json(result, {{ status: 201 }})
  }} catch (error) {{
    return NextResponse.json(
      {{ error: 'Internal server error' }},
      {{ status: 500 }}
    )
  }}
}}
'''
    return template


def scaffold_route(
    route_path: str,
    is_api: bool = False,
    with_layout: bool = False,
    with_not_found: bool = False,
    is_protected: bool = False
):
    """Scaffold route with all files"""
    project_root = Path.cwd()
    route_dir = project_root / 'src' / 'app' / route_path

    # Create directory
    route_dir.mkdir(parents=True, exist_ok=True)

    # Extract route name for component names
    route_name = route_path.split('/')[-1].replace('[', '').replace(']', '').replace('-', ' ').title().replace(' ', '')

    files_created = []

    if is_api:
        # Create API route
        route_file = route_dir / 'route.ts'
        route_file.write_text(create_api_route(route_name))
        files_created.append(route_file)
    else:
        # Create page route
        page_file = route_dir / 'page.tsx'
        page_file.write_text(create_page_component(route_name, is_protected))
        files_created.append(page_file)

        # Create loading
        loading_file = route_dir / 'loading.tsx'
        loading_file.write_text(create_loading_component())
        files_created.append(loading_file)

        # Create error
        error_file = route_dir / 'error.tsx'
        error_file.write_text(create_error_component())
        files_created.append(error_file)

        # Optional layout
        if with_layout:
            layout_file = route_dir / 'layout.tsx'
            layout_file.write_text(create_layout_component(route_name))
            files_created.append(layout_file)

        # Optional not-found (useful for dynamic routes)
        if with_not_found or '[' in route_path:
            not_found_file = route_dir / 'not-found.tsx'
            not_found_file.write_text(create_not_found_component(route_name))
            files_created.append(not_found_file)

    return route_dir, files_created


def main():
    parser = argparse.ArgumentParser(description='Scaffold Next.js App Router routes')
    parser.add_argument('route_path', help='Route path (e.g., dashboard, posts/[id])')
    parser.add_argument('--api', action='store_true', help='Create API route instead of page')
    parser.add_argument('--with-layout', action='store_true', help='Include layout.tsx')
    parser.add_argument('--with-not-found', action='store_true', help='Include not-found.tsx')
    parser.add_argument('--protected', action='store_true', help='Add authentication check')

    args = parser.parse_args()

    print("=" * 60)
    print(f"Scaffolding route: /{args.route_path}")
    print("=" * 60)

    route_dir, files_created = scaffold_route(
        args.route_path,
        is_api=args.api,
        with_layout=args.with_layout,
        with_not_found=args.with_not_found,
        is_protected=args.protected
    )

    print(f"\nCreated route in: {route_dir}")
    print("\nFiles created:")
    for file in files_created:
        print(f"  ✓ {file.relative_to(Path.cwd())}")

    print("\nNext steps:")
    if args.api:
        print(f"1. Update API logic in route.ts")
        print(f"2. Add validation and error handling")
        print(f"3. Test API: http://localhost:3000/{args.route_path}")
    else:
        print(f"1. Customize the page component")
        print(f"2. Add data fetching if needed")
        print(f"3. Update metadata")
        print(f"4. Navigate to: http://localhost:3000/{args.route_path}")


if __name__ == "__main__":
    main()
