#!/usr/bin/env python3
"""
Test Factory Generator for WorldCrafter

Generates test data factories using Faker.

Usage:
    python generate_factory.py <ModelName>
    python generate_factory.py User
    python generate_factory.py BlogPost
"""

import sys
import re
from pathlib import Path


def to_pascal_case(text: str) -> str:
    """Convert text to PascalCase"""
    return ''.join(word.capitalize() for word in re.split(r'[-_\s]+', text))


def to_camel_case(text: str) -> str:
    """Convert text to camelCase"""
    words = re.split(r'[-_\s]+', text)
    return words[0].lower() + ''.join(word.capitalize() for word in words[1:])


def generate_factory(model_name: str) -> str:
    """Generate test factory file"""
    pascal_name = to_pascal_case(model_name)
    camel_name = to_camel_case(model_name)

    template = f'''import {{ faker }} from '@faker-js/faker'

/**
 * Test data factory for {pascal_name}
 */

export interface Mock{pascal_name} {{
  id: string
  name: string
  email: string
  createdAt: Date
  updatedAt: Date
  // TODO: Add model-specific fields
}}

/**
 * Create a mock {pascal_name} with optional overrides
 */
export function createMock{pascal_name}(overrides: Partial<Mock{pascal_name}> = {}): Mock{pascal_name} {{
  return {{
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    email: faker.internet.email(),
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    ...overrides
  }}
}}

/**
 * Create multiple mock {pascal_name}s
 */
export function createMock{pascal_name}s(count: number, overrides: Partial<Mock{pascal_name}> = {}): Mock{pascal_name}[] {{
  return Array.from({{ length: count }}, () => createMock{pascal_name}(overrides))
}}

/**
 * Create {pascal_name} data for database insertion
 * (excludes auto-generated fields)
 */
export function create{pascal_name}Data(
  overrides: Partial<Omit<Mock{pascal_name}, 'id' | 'createdAt' | 'updatedAt'>> = {{}}
) {{
  return {{
    name: faker.person.fullName(),
    email: faker.internet.email(),
    ...overrides
  }}
}}

/**
 * Common test scenarios
 */
export const {camel_name}Fixtures = {{
  valid: createMock{pascal_name}({{
    name: 'John Doe',
    email: 'john@example.com'
  }}),

  minimal: createMock{pascal_name}({{
    name: 'User',
    email: 'user@example.com'
  }}),

  recent: createMock{pascal_name}({{
    createdAt: new Date(),
    updatedAt: new Date()
  }}),

  old: createMock{pascal_name}({{
    createdAt: faker.date.past({{ years: 5 }}),
    updatedAt: faker.date.past({{ years: 1 }})
  }})
}}
'''
    return template


def main():
    if len(sys.argv) < 2:
        print("Usage: python generate_factory.py <ModelName>")
        print("\nExamples:")
        print("  python generate_factory.py User")
        print("  python generate_factory.py BlogPost")
        print("  python generate_factory.py Comment")
        sys.exit(1)

    model_name = sys.argv[1]
    pascal_name = to_pascal_case(model_name)
    camel_name = to_camel_case(model_name)

    print("=" * 60)
    print(f"Generating test factory for: {pascal_name}")
    print("=" * 60)

    # Generate factory
    factory_content = generate_factory(model_name)

    print("\nGenerated Factory:")
    print("=" * 60)
    print(factory_content)
    print("=" * 60)

    # Ask if user wants to save
    save_choice = input("\nSave factory file? (Y/n): ").strip().lower()

    if save_choice in ['', 'y', 'yes']:
        project_root = Path.cwd()

        # Save to src/test/factories/
        factory_dir = project_root / 'src' / 'test' / 'factories'
        factory_dir.mkdir(parents=True, exist_ok=True)

        factory_file = factory_dir / f'{camel_name}.ts'

        with open(factory_file, 'w') as f:
            f.write(factory_content)

        print(f"\nFactory saved to: {factory_file}")

        print("\nNext steps:")
        print(f"1. Review and customize the factory in {factory_file}")
        print(f"2. Update fields to match your Prisma model")
        print(f"3. Add model-specific fixtures")
        print(f"4. Use in tests: import {{ createMock{pascal_name} }} from '@/test/factories/{camel_name}'")
    else:
        print("\nFactory not saved. Copy the content above manually.")


if __name__ == "__main__":
    main()
