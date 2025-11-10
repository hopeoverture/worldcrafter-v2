import { test, expect } from '@playwright/test'
import { FeaturePage } from './pages/feature.page'

test.describe('Feature E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to feature page before each test
    await page.goto('/feature')
  })

  test('renders feature page correctly', async ({ page }) => {
    // Verify page loads
    await expect(page.locator('h1')).toContainText('Feature')

    // Verify key elements are present
    await expect(page.locator('input[name="title"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('submits form successfully', async ({ page }) => {
    const featurePage = new FeaturePage(page)

    // Fill form
    await featurePage.fillTitle('Test Feature')
    await featurePage.fillDescription('Test Description')

    // Submit
    await featurePage.submit()

    // Wait for submission to complete
    await page.waitForLoadState('networkidle')

    // Verify success
    await expect(page.locator('text=Success')).toBeVisible()
  })

  test('displays validation errors for empty fields', async ({ page }) => {
    // Submit form without filling required fields
    await page.click('button[type="submit"]')

    // Verify error messages appear
    await expect(page.locator('text=/title is required/i')).toBeVisible()
  })

  test('displays validation errors for invalid input', async ({ page }) => {
    // Fill with invalid data
    await page.fill('input[name="title"]', 'a') // Too short

    // Submit form
    await page.click('button[type="submit"]')

    // Verify error message
    await expect(page.locator('text=/too short/i')).toBeVisible()
  })

  test('disables submit button while submitting', async ({ page }) => {
    await page.fill('input[name="title"]', 'Test Title')

    const submitButton = page.locator('button[type="submit"]')

    // Submit form
    await submitButton.click()

    // Button should be disabled immediately
    await expect(submitButton).toBeDisabled()

    // Wait for submission to complete
    await page.waitForLoadState('networkidle')

    // Button should be enabled again
    await expect(submitButton).toBeEnabled()
  })

  test('resets form when reset button is clicked', async ({ page }) => {
    // Fill form
    await page.fill('input[name="title"]', 'Test Title')
    await page.fill('textarea[name="description"]', 'Test Description')

    // Click reset button
    await page.click('button:has-text("Reset")')

    // Verify form is cleared
    await expect(page.locator('input[name="title"]')).toHaveValue('')
    await expect(page.locator('textarea[name="description"]')).toHaveValue('')
  })

  test('handles server errors gracefully', async ({ page }) => {
    // TODO: Mock server error or test with invalid data

    await page.fill('input[name="title"]', 'Test Title')
    await page.click('button[type="submit"]')

    // Wait for error to appear
    await expect(page.locator('text=/operation failed/i')).toBeVisible({
      timeout: 5000
    })
  })
})

test.describe('Feature E2E Tests - Authenticated', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')

    // Wait for login to complete
    await page.waitForURL('/dashboard')

    // Navigate to feature page
    await page.goto('/feature')
  })

  test('authenticated user can create feature', async ({ page }) => {
    await page.fill('input[name="title"]', 'Authenticated Feature')
    await page.click('button[type="submit"]')

    await expect(page.locator('text=Success')).toBeVisible()
  })

  test('displays user-specific data', async ({ page }) => {
    // Verify user's own data is displayed
    await expect(page.locator('[data-testid="user-data"]')).toBeVisible()
  })
})

test.describe('Feature E2E Tests - Mobile', () => {
  test.use({
    viewport: { width: 375, height: 667 } // iPhone SE
  })

  test('form works on mobile viewport', async ({ page }) => {
    await page.goto('/feature')

    // Verify form is responsive
    await expect(page.locator('input[name="title"]')).toBeVisible()

    // Fill and submit
    await page.fill('input[name="title"]', 'Mobile Test')
    await page.click('button[type="submit"]')

    await expect(page.locator('text=Success')).toBeVisible()
  })

  test('displays mobile navigation', async ({ page }) => {
    await page.goto('/')

    // Mobile menu should be visible
    await expect(page.locator('[aria-label="Menu"]')).toBeVisible()

    // Desktop nav should be hidden
    await expect(page.locator('nav.desktop')).not.toBeVisible()
  })
})

test.describe('Feature E2E Tests - Accessibility', () => {
  test('form is keyboard navigable', async ({ page }) => {
    await page.goto('/feature')

    // Tab through form fields
    await page.keyboard.press('Tab')
    await expect(page.locator('input[name="title"]')).toBeFocused()

    await page.keyboard.press('Tab')
    await expect(page.locator('textarea[name="description"]')).toBeFocused()

    await page.keyboard.press('Tab')
    await expect(page.locator('button[type="submit"]')).toBeFocused()

    // Submit with Enter key
    await page.keyboard.press('Enter')
  })

  test('form labels are properly associated', async ({ page }) => {
    await page.goto('/feature')

    // Click label should focus input
    await page.click('label:has-text("Title")')
    await expect(page.locator('input[name="title"]')).toBeFocused()
  })

  test('error messages are announced', async ({ page }) => {
    await page.goto('/feature')

    // Submit without filling fields
    await page.click('button[type="submit"]')

    // Error should be in alert role
    await expect(page.locator('[role="alert"]')).toBeVisible()
  })
})

test.describe('Feature E2E Tests - Error Handling', () => {
  test('redirects to login when not authenticated', async ({ page }) => {
    // Clear auth state
    await page.context().clearCookies()

    // Try to access protected page
    await page.goto('/feature')

    // Should redirect to login
    await expect(page).toHaveURL('/login')
  })

  test('handles network errors', async ({ page }) => {
    // TODO: Intercept network request and simulate failure

    await page.goto('/feature')

    // Try to submit
    await page.fill('input[name="title"]', 'Test')
    await page.click('button[type="submit"]')

    // Should show error
    await expect(page.locator('text=/network error/i')).toBeVisible()
  })
})
