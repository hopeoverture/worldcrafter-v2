#!/usr/bin/env python3
"""
WorldCrafter Feature Scaffolding Script

This script generates a complete feature structure with all necessary files:
- Page component (page.tsx)
- Server Actions (actions.ts)
- Loading state (loading.tsx)
- Error boundary (error.tsx)
- Zod schema (schemas/<feature>.ts)
- Integration test (<feature>.integration.test.ts)
- E2E test (<feature>.spec.ts)

Usage:
    python scaffold_feature.py <feature-name>
    python scaffold_feature.py user-settings
    python scaffold_feature.py blog-posts
"""

import os
import sys
from pathlib import Path


def to_pascal_case(name: str) -> str:
    """Convert kebab-case to PascalCase"""
    return ''.join(word.capitalize() for word in name.split('-'))


def to_camel_case(name: str) -> str:
    """Convert kebab-case to camelCase"""
    words = name.split('-')
    return words[0] + ''.join(word.capitalize() for word in words[1:])


def create_directories(feature_name: str, project_root: Path) -> dict:
    """Create all necessary directories and return paths"""
    paths = {
        'app_route': project_root / 'src' / 'app' / feature_name,
        'schema': project_root / 'src' / 'lib' / 'schemas',
        'test': project_root / 'src' / 'app' / '__tests__',
        'e2e': project_root / 'e2e',
    }

    for path in paths.values():
        path.mkdir(parents=True, exist_ok=True)

    return paths


def generate_schema_file(feature_name: str, paths: dict) -> None:
    """Generate Zod schema file"""
    pascal_name = to_pascal_case(feature_name)
    camel_name = to_camel_case(feature_name)

    schema_content = f'''import {{ z }} from "zod"

export const {camel_name}Schema = z.object({{
  // TODO: Add your schema fields here
  // Example:
  // title: z.string().min(1, "Title is required"),
  // description: z.string().optional(),
  // isPublished: z.boolean().default(false),
}})

export type {pascal_name}FormValues = z.infer<typeof {camel_name}Schema>
'''

    schema_path = paths['schema'] / f'{feature_name}.ts'
    schema_path.write_text(schema_content)
    print(f"Created schema: {schema_path}")


def generate_actions_file(feature_name: str, paths: dict) -> None:
    """Generate Server Actions file"""
    pascal_name = to_pascal_case(feature_name)
    camel_name = to_camel_case(feature_name)

    actions_content = f'''"use server"

import {{ revalidatePath }} from "next/cache"
import {{ prisma }} from "@/lib/prisma"
import {{ createClient }} from "@/lib/supabase/server"
import {{ {camel_name}Schema, type {pascal_name}FormValues }} from "@/lib/schemas/{feature_name}"

export async function submit{pascal_name}(values: {pascal_name}FormValues) {{
  try {{
    // 1. Server-side validation
    const validated = {camel_name}Schema.parse(values)

    // 2. Authentication check (uncomment if needed)
    // const supabase = await createClient()
    // const {{ data: {{ user }} }} = await supabase.auth.getUser()
    // if (!user) {{
    //   return {{ success: false, error: "Unauthorized" }}
    // }}

    // 3. Database operation (TODO: Update model name)
    // const result = await prisma.yourModel.create({{
    //   data: validated,
    // }})

    // 4. Revalidate cached pages
    revalidatePath("/{feature_name}")

    // 5. Return typed response
    return {{ success: true, data: validated }}
  }} catch (error) {{
    console.error("Error in submit{pascal_name}:", error)
    return {{ success: false, error: "Operation failed" }}
  }}
}}
'''

    actions_path = paths['app_route'] / 'actions.ts'
    actions_path.write_text(actions_content)
    print(f"Created actions: {actions_path}")


def generate_page_file(feature_name: str, paths: dict) -> None:
    """Generate page component file"""
    pascal_name = to_pascal_case(feature_name)
    camel_name = to_camel_case(feature_name)

    page_content = f'''"use client"

import {{ useForm }} from "react-hook-form"
import {{ zodResolver }} from "@hookform/resolvers/zod"
import {{ useState }} from "react"
import {{ {camel_name}Schema, type {pascal_name}FormValues }} from "@/lib/schemas/{feature_name}"
import {{ submit{pascal_name} }} from "./actions"
import {{ Button }} from "@/components/ui/button"
import {{
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
}} from "@/components/ui/form"
import {{ Input }} from "@/components/ui/input"

export default function {pascal_name}Page() {{
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<{pascal_name}FormValues>({{
    resolver: zodResolver({camel_name}Schema),
    defaultValues: {{
      // TODO: Add default values
    }},
  }})

  async function onSubmit(values: {pascal_name}FormValues) {{
    setIsSubmitting(true)
    try {{
      const result = await submit{pascal_name}(values)

      if (result.success) {{
        form.reset()
        // TODO: Show success message or redirect
        console.log("Success:", result.data)
      }} else {{
        form.setError("root", {{ message: result.error }})
      }}
    }} finally {{
      setIsSubmitting(false)
    }}
  }}

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <h1 className="mb-6 text-3xl font-bold">{pascal_name}</h1>

      <Form {{...form}}>
        <form onSubmit={{form.handleSubmit(onSubmit)}} className="space-y-4">
          {{/* TODO: Add form fields */}}
          {{/* Example:
          <FormField
            control={{form.control}}
            name="title"
            render={{({{ field }}) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input {{...field}} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}}
          />
          */}}

          <Button type="submit" disabled={{isSubmitting}}>
            {{isSubmitting ? "Submitting..." : "Submit"}}
          </Button>

          {{form.formState.errors.root && (
            <p className="text-sm text-destructive">
              {{form.formState.errors.root.message}}
            </p>
          )}}
        </form>
      </Form>
    </div>
  )
}}
'''

    page_path = paths['app_route'] / 'page.tsx'
    page_path.write_text(page_content)
    print(f"Created page: {page_path}")


def generate_loading_file(feature_name: str, paths: dict) -> None:
    """Generate loading state file"""
    loading_content = '''export default function Loading() {
  return (
    <div className="container mx-auto max-w-2xl py-8">
      <div className="space-y-4">
        {/* Header skeleton */}
        <div className="h-10 w-64 animate-pulse rounded bg-muted" />

        {/* Form skeleton */}
        <div className="space-y-4">
          <div className="h-10 w-full animate-pulse rounded bg-muted" />
          <div className="h-10 w-full animate-pulse rounded bg-muted" />
          <div className="h-10 w-32 animate-pulse rounded bg-muted" />
        </div>
      </div>
    </div>
  )
}
'''

    loading_path = paths['app_route'] / 'loading.tsx'
    loading_path.write_text(loading_content)
    print(f"Created loading: {loading_path}")


def generate_error_file(feature_name: str, paths: dict) -> None:
    """Generate error boundary file"""
    error_content = '''"use client"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="container mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center py-8">
      <h2 className="mb-4 text-2xl font-bold">Something went wrong!</h2>
      <p className="mb-6 text-muted-foreground">{error.message}</p>
      <button
        onClick={reset}
        className="rounded bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
      >
        Try again
      </button>
    </div>
  )
}
'''

    error_path = paths['app_route'] / 'error.tsx'
    error_path.write_text(error_content)
    print(f"Created error: {error_path}")


def generate_integration_test(feature_name: str, paths: dict) -> None:
    """Generate integration test file"""
    pascal_name = to_pascal_case(feature_name)
    camel_name = to_camel_case(feature_name)

    test_content = f'''import {{ describe, it, expect, afterAll }} from 'vitest'
import {{ prisma }} from '@/lib/prisma'
// import {{ createMockUser }} from '@/test/factories/user'
import {{ submit{pascal_name} }} from '../{feature_name}/actions'

describe('{pascal_name} Integration Tests', () => {{
  // Store IDs for cleanup
  const createdIds: string[] = []

  afterAll(async () => {{
    // Clean up test data
    // TODO: Update model name
    // if (createdIds.length > 0) {{
    //   await prisma.yourModel.deleteMany({{
    //     where: {{ id: {{ in: createdIds }} }},
    //   }})
    // }}
  }})

  it('creates {feature_name} in database', async () => {{
    const testData = {{
      // TODO: Add test data
    }}

    const result = await submit{pascal_name}(testData)

    expect(result.success).toBe(true)
    expect(result.data).toBeDefined()

    // Store for cleanup
    // createdIds.push(result.data!.id)

    // Verify in database
    // TODO: Update model name and query
    // const dbRecord = await prisma.yourModel.findUnique({{
    //   where: {{ id: result.data!.id }},
    // }})
    // expect(dbRecord).toBeTruthy()
  }})

  it('validates input data', async () => {{
    const invalidData = {{
      // TODO: Add invalid data
    }}

    const result = await submit{pascal_name}(invalidData as any)

    expect(result.success).toBe(false)
    expect(result.error).toBeTruthy()
  }})

  // it('requires authentication', async () => {{
  //   // TODO: Test without auth context
  //   const result = await submit{pascal_name}(testData)
  //
  //   expect(result.success).toBe(false)
  //   expect(result.error).toContain('Unauthorized')
  // }})
}})
'''

    test_path = paths['test'] / f'{feature_name}.integration.test.ts'
    test_path.write_text(test_content)
    print(f"Created integration test: {test_path}")


def generate_e2e_test(feature_name: str, paths: dict) -> None:
    """Generate E2E test file"""
    pascal_name = to_pascal_case(feature_name)

    e2e_content = f'''import {{ test, expect }} from '@playwright/test'

test.describe('{pascal_name} E2E Tests', () => {{
  test('renders {feature_name} page', async ({{ page }}) => {{
    await page.goto('/{feature_name}')

    // Verify page loads
    await expect(page.locator('h1')).toContainText('{pascal_name}')
  }})

  test('submits form successfully', async ({{ page }}) => {{
    await page.goto('/{feature_name}')

    // TODO: Fill form fields
    // await page.fill('input[name="title"]', 'Test Title')

    // Submit form
    await page.click('button[type="submit"]')

    // TODO: Verify success
    // await expect(page.locator('text=Success')).toBeVisible()
  }})

  test('displays validation errors', async ({{ page }}) => {{
    await page.goto('/{feature_name}')

    // Submit without filling required fields
    await page.click('button[type="submit"]')

    // TODO: Verify error messages appear
    // await expect(page.locator('text=required')).toBeVisible()
  }})
}})
'''

    e2e_path = paths['e2e'] / f'{feature_name}.spec.ts'
    e2e_path.write_text(e2e_content)
    print(f"Created E2E test: {e2e_path}")


def scaffold_feature(feature_name: str) -> None:
    """Main scaffolding function"""
    # Validate feature name
    if not feature_name or not feature_name.replace('-', '').isalnum():
        print("Error: Feature name must be kebab-case (e.g., user-settings)")
        sys.exit(1)

    # Find project root
    script_dir = Path(__file__).parent
    project_root = script_dir.parent.parent.parent  # Go up to worldcrafter root

    if not (project_root / 'package.json').exists():
        print("Error: Could not find project root (package.json not found)")
        sys.exit(1)

    print(f"Scaffolding feature: {feature_name}")
    print(f"Project root: {project_root}\n")

    # Create directory structure
    paths = create_directories(feature_name, project_root)

    # Generate files
    generate_schema_file(feature_name, paths)
    generate_actions_file(feature_name, paths)
    generate_page_file(feature_name, paths)
    generate_loading_file(feature_name, paths)
    generate_error_file(feature_name, paths)
    generate_integration_test(feature_name, paths)
    generate_e2e_test(feature_name, paths)

    print(f"\nFeature scaffolding complete!")
    print(f"\nNext steps:")
    print(f"1. Update the schema in: src/lib/schemas/{feature_name}.ts")
    print(f"2. Add form fields in: src/app/{feature_name}/page.tsx")
    print(f"3. Implement database operations in: src/app/{feature_name}/actions.ts")
    print(f"4. Update tests with actual test data")
    print(f"5. Run tests: npm test && npm run test:e2e")


def main():
    if len(sys.argv) != 2:
        print("Usage: python scaffold_feature.py <feature-name>")
        print("Example: python scaffold_feature.py user-settings")
        sys.exit(1)

    feature_name = sys.argv[1]
    scaffold_feature(feature_name)


if __name__ == "__main__":
    main()
