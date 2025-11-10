#!/usr/bin/env python3
"""
Test Generator for WorldCrafter

Generates test files for components, Server Actions, and features.

Usage:
    python generate_tests.py component <ComponentName>
    python generate_tests.py integration <feature-name>
    python generate_tests.py component Button
    python generate_tests.py integration user-profile
"""

import sys
import re
from pathlib import Path


def to_pascal_case(text: str) -> str:
    """Convert text to PascalCase"""
    return ''.join(word.capitalize() for word in re.split(r'[-_\s]+', text))


def to_kebab_case(text: str) -> str:
    """Convert PascalCase to kebab-case"""
    s1 = re.sub('(.)([A-Z][a-z]+)', r'\1-\2', text)
    return re.sub('([a-z0-9])([A-Z])', r'\1-\2', s1).lower()


def generate_component_test(component_name: str) -> str:
    """Generate component test file"""
    template = f'''import {{ describe, it, expect, vi }} from 'vitest'
import {{ renderWithProviders, screen, userEvent, waitFor }} from '@/test/utils/render'
import {component_name} from '../{component_name}'

describe('{component_name}', () => {{
  describe('rendering', () => {{
    it('renders correctly', () => {{
      renderWithProviders(<{component_name} />)

      expect(screen.getByRole('heading')).toBeInTheDocument()
    }})

    it('renders with props', () => {{
      renderWithProviders(<{component_name} title="Test Title" />)

      expect(screen.getByText('Test Title')).toBeInTheDocument()
    }})
  }})

  describe('user interactions', () => {{
    it('handles button click', async () => {{
      const user = userEvent.setup()
      const handleClick = vi.fn()

      renderWithProviders(<{component_name} onClick={{handleClick}} />)

      await user.click(screen.getByRole('button'))

      expect(handleClick).toHaveBeenCalledTimes(1)
    }})
  }})

  describe('edge cases', () => {{
    it('handles empty data', () => {{
      renderWithProviders(<{component_name} data={{[]}} />)

      expect(screen.getByText(/no data/i)).toBeInTheDocument()
    }})
  }})
}})
'''
    return template


def generate_integration_test(feature_name: str) -> str:
    """Generate integration test file"""
    pascal_name = to_pascal_case(feature_name)

    template = f'''import {{ describe, it, expect, beforeAll, afterAll }} from 'vitest'
import {{ prisma }} from '@/lib/prisma'
import {{ createMockUser }} from '@/test/factories/user'
import {{ submit{pascal_name}, update{pascal_name}, delete{pascal_name} }} from '../{feature_name}/actions'

describe('{pascal_name} Integration Tests', () => {{
  const createdIds: string[] = []
  let testUserId: string

  beforeAll(async () => {{
    const testUser = await prisma.user.create({{
      data: createMockUser({{ email: '{feature_name}-test@example.com' }})
    }})
    testUserId = testUser.id
  }})

  afterAll(async () => {{
    if (createdIds.length > 0) {{
      await prisma.yourModel.deleteMany({{
        where: {{ id: {{ in: createdIds }} }}
      }})
    }}

    if (testUserId) {{
      await prisma.user.delete({{ where: {{ id: testUserId }} }})
    }}
  }})

  describe('submit{pascal_name}', () => {{
    it('creates record in database', async () => {{
      const testData = {{
        title: 'Test {pascal_name}'
      }}

      const result = await submit{pascal_name}(testData)

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()

      if (result.data?.id) {{
        createdIds.push(result.data.id)
      }}

      const dbRecord = await prisma.yourModel.findUnique({{
        where: {{ id: result.data!.id }}
      }})

      expect(dbRecord).toBeTruthy()
    }})

    it('validates required fields', async () => {{
      const invalidData = {{
        title: ''
      }}

      const result = await submit{pascal_name}(invalidData as any)

      expect(result.success).toBe(false)
      expect(result.error).toBeTruthy()
    }})
  }})
}})
'''
    return template


def save_test_file(content: str, test_type: str, name: str) -> Path:
    """Save test file to appropriate location"""
    project_root = Path.cwd()

    if test_type == 'component':
        # Component tests go in src/components/__tests__/
        test_dir = project_root / 'src' / 'components' / '__tests__'
        filename = f'{name}.test.tsx'
    elif test_type == 'integration':
        # Integration tests go in src/app/__tests__/
        test_dir = project_root / 'src' / 'app' / '__tests__'
        filename = f'{name}.integration.test.ts'
    else:
        raise ValueError(f"Unknown test type: {test_type}")

    test_dir.mkdir(parents=True, exist_ok=True)
    filepath = test_dir / filename

    with open(filepath, 'w') as f:
        f.write(content)

    return filepath


def main():
    if len(sys.argv) < 3:
        print("Usage: python generate_tests.py <type> <name>")
        print("\nTypes:")
        print("  component    - Generate component unit test")
        print("  integration  - Generate integration test")
        print("\nExamples:")
        print("  python generate_tests.py component Button")
        print("  python generate_tests.py integration user-profile")
        sys.exit(1)

    test_type = sys.argv[1].lower()
    name = sys.argv[2]

    if test_type not in ['component', 'integration']:
        print(f"Error: Unknown test type '{test_type}'")
        print("Valid types: component, integration")
        sys.exit(1)

    print("=" * 60)
    print(f"Generating {test_type} test for: {name}")
    print("=" * 60)

    # Generate test content
    if test_type == 'component':
        pascal_name = to_pascal_case(name)
        content = generate_component_test(pascal_name)
        filename = pascal_name
    elif test_type == 'integration':
        kebab_name = to_kebab_case(name)
        content = generate_integration_test(kebab_name)
        filename = kebab_name

    # Display generated test
    print("\nGenerated Test:")
    print("=" * 60)
    print(content)
    print("=" * 60)

    # Ask if user wants to save
    save_choice = input("\nSave test file? (Y/n): ").strip().lower()

    if save_choice in ['', 'y', 'yes']:
        filepath = save_test_file(content, test_type, filename)
        print(f"\nTest file saved to: {filepath}")

        print("\nNext steps:")
        print(f"1. Review and customize the test in {filepath}")
        print(f"2. Update component/action imports if needed")
        print(f"3. Add specific test cases for your use case")
        print(f"4. Run tests: npm test {filepath.stem}")
    else:
        print("\nTest not saved. Copy the content above manually.")


if __name__ == "__main__":
    main()
