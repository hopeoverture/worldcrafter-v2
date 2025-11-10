#!/usr/bin/env python3
"""
E2E Test and Page Object Generator for WorldCrafter

Generates Playwright E2E tests with Page Object Model pattern.

Usage:
    python generate_e2e.py <feature-name>
    python generate_e2e.py checkout-flow
    python generate_e2e.py user-settings
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


def generate_page_object(feature_name: str, pascal_name: str) -> str:
    """Generate Page Object Model"""
    template = f'''import {{ Page, Locator }} from '@playwright/test'

export class {pascal_name}Page {{
  readonly page: Page
  readonly heading: Locator
  readonly submitButton: Locator
  readonly successMessage: Locator

  constructor(page: Page) {{
    this.page = page
    this.heading = page.locator('h1')
    this.submitButton = page.locator('button[type="submit"]')
    this.successMessage = page.locator('[role="alert"]:has-text("Success")')
  }}

  async goto() {{
    await this.page.goto('/{feature_name}')
    await this.page.waitForLoadState('networkidle')
  }}

  async submit() {{
    await this.submitButton.click()
  }}

  async expectSuccess() {{
    await this.successMessage.waitFor({{ state: 'visible' }})
  }}
}}
'''
    return template


def generate_e2e_test(feature_name: str, pascal_name: str) -> str:
    """Generate E2E test file"""
    template = f'''import {{ test, expect }} from '@playwright/test'
import {{ {pascal_name}Page }} from './pages/{feature_name}.page'

test.describe('{pascal_name} E2E Tests', () => {{
  test.beforeEach(async ({{ page }}) => {{
    await page.goto('/{feature_name}')
  }})

  test('renders {feature_name} page correctly', async ({{ page }}) => {{
    await expect(page.locator('h1')).toContainText('{pascal_name}')

    // Verify key elements are present
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  }})

  test('submits form successfully', async ({{ page }}) => {{
    const {feature_name.replace('-', '')}Page = new {pascal_name}Page(page)

    // TODO: Fill form fields

    await {feature_name.replace('-', '')}Page.submit()

    await page.waitForLoadState('networkidle')

    await {feature_name.replace('-', '')}Page.expectSuccess()
  }})

  test('displays validation errors', async ({{ page }}) => {{
    // Submit without filling required fields
    await page.click('button[type="submit"]')

    // Verify error messages appear
    await expect(page.locator('text=/required/i')).toBeVisible()
  }})

  test('disables submit during submission', async ({{ page }}) => {{
    const submitButton = page.locator('button[type="submit"]')

    await submitButton.click()

    await expect(submitButton).toBeDisabled()

    await page.waitForLoadState('networkidle')

    await expect(submitButton).toBeEnabled()
  }})
}})

test.describe('{pascal_name} - Mobile', () => {{
  test.use({{
    viewport: {{ width: 375, height: 667 }}
  }})

  test('works on mobile viewport', async ({{ page }}) => {{
    await page.goto('/{feature_name}')

    await expect(page.locator('button[type="submit"]')).toBeVisible()
  }})
}})

test.describe('{pascal_name} - Accessibility', () => {{
  test('is keyboard navigable', async ({{ page }}) => {{
    await page.goto('/{feature_name}')

    await page.keyboard.press('Tab')

    // TODO: Verify focused elements

    await page.keyboard.press('Enter')
  }})
}})
'''
    return template


def main():
    if len(sys.argv) < 2:
        print("Usage: python generate_e2e.py <feature-name>")
        print("\nExamples:")
        print("  python generate_e2e.py checkout-flow")
        print("  python generate_e2e.py user-settings")
        sys.exit(1)

    feature_name = sys.argv[1]
    kebab_name = to_kebab_case(feature_name)
    pascal_name = to_pascal_case(feature_name)

    print("=" * 60)
    print(f"Generating E2E test for: {feature_name}")
    print("=" * 60)

    # Generate Page Object
    page_object = generate_page_object(kebab_name, pascal_name)

    print("\nGenerated Page Object:")
    print("=" * 60)
    print(page_object)
    print("=" * 60)

    # Generate E2E Test
    e2e_test = generate_e2e_test(kebab_name, pascal_name)

    print("\nGenerated E2E Test:")
    print("=" * 60)
    print(e2e_test)
    print("=" * 60)

    # Ask if user wants to save
    save_choice = input("\nSave test files? (Y/n): ").strip().lower()

    if save_choice in ['', 'y', 'yes']:
        project_root = Path.cwd()

        # Save Page Object
        page_dir = project_root / 'e2e' / 'pages'
        page_dir.mkdir(parents=True, exist_ok=True)
        page_file = page_dir / f'{kebab_name}.page.ts'

        with open(page_file, 'w') as f:
            f.write(page_object)

        print(f"\nPage Object saved to: {page_file}")

        # Save E2E Test
        e2e_dir = project_root / 'e2e'
        e2e_file = e2e_dir / f'{kebab_name}.spec.ts'

        with open(e2e_file, 'w') as f:
            f.write(e2e_test)

        print(f"E2E Test saved to: {e2e_file}")

        print("\nNext steps:")
        print(f"1. Review and customize the tests in {e2e_file}")
        print(f"2. Add page-specific locators to {page_file}")
        print(f"3. Fill in TODO sections with actual test logic")
        print(f"4. Run E2E tests: npm run test:e2e {kebab_name}")
    else:
        print("\nTests not saved. Copy the content above manually.")


if __name__ == "__main__":
    main()
