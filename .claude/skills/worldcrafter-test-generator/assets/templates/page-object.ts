import { Page, Locator } from '@playwright/test'

/**
 * Page Object Model for Feature Page
 *
 * Encapsulates page elements and interactions for the Feature page.
 * Use this to keep E2E tests clean and maintainable.
 */
export class FeaturePage {
  readonly page: Page

  // Locators
  readonly heading: Locator
  readonly titleInput: Locator
  readonly descriptionInput: Locator
  readonly submitButton: Locator
  readonly resetButton: Locator
  readonly successMessage: Locator
  readonly errorMessage: Locator
  readonly loadingIndicator: Locator

  constructor(page: Page) {
    this.page = page

    // Initialize locators
    this.heading = page.locator('h1')
    this.titleInput = page.locator('input[name="title"]')
    this.descriptionInput = page.locator('textarea[name="description"]')
    this.submitButton = page.locator('button[type="submit"]')
    this.resetButton = page.locator('button:has-text("Reset")')
    this.successMessage = page.locator('[role="alert"]:has-text("Success")')
    this.errorMessage = page.locator('[role="alert"]:has-text("Error")')
    this.loadingIndicator = page.locator('[role="status"]')
  }

  /**
   * Navigate to the feature page
   */
  async goto() {
    await this.page.goto('/feature')
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * Fill the title input
   */
  async fillTitle(title: string) {
    await this.titleInput.fill(title)
  }

  /**
   * Fill the description input
   */
  async fillDescription(description: string) {
    await this.descriptionInput.fill(description)
  }

  /**
   * Fill the entire form
   */
  async fillForm(data: { title: string; description?: string }) {
    await this.fillTitle(data.title)

    if (data.description) {
      await this.fillDescription(data.description)
    }
  }

  /**
   * Submit the form
   */
  async submit() {
    await this.submitButton.click()
  }

  /**
   * Reset the form
   */
  async reset() {
    await this.resetButton.click()
  }

  /**
   * Submit form with data (fill and submit)
   */
  async submitForm(data: { title: string; description?: string }) {
    await this.fillForm(data)
    await this.submit()
  }

  /**
   * Wait for success message
   */
  async expectSuccess() {
    await this.successMessage.waitFor({ state: 'visible' })
  }

  /**
   * Wait for error message
   */
  async expectError(message?: string) {
    await this.errorMessage.waitFor({ state: 'visible' })

    if (message) {
      await expect(this.errorMessage).toContainText(message)
    }
  }

  /**
   * Wait for loading to complete
   */
  async waitForLoading() {
    await this.loadingIndicator.waitFor({ state: 'hidden' })
  }

  /**
   * Check if form is empty
   */
  async expectEmptyForm() {
    await expect(this.titleInput).toHaveValue('')
    await expect(this.descriptionInput).toHaveValue('')
  }

  /**
   * Check if form has values
   */
  async expectFormValues(data: { title: string; description?: string }) {
    await expect(this.titleInput).toHaveValue(data.title)

    if (data.description !== undefined) {
      await expect(this.descriptionInput).toHaveValue(data.description)
    }
  }

  /**
   * Check if submit button is disabled
   */
  async expectSubmitDisabled() {
    await expect(this.submitButton).toBeDisabled()
  }

  /**
   * Check if submit button is enabled
   */
  async expectSubmitEnabled() {
    await expect(this.submitButton).toBeEnabled()
  }
}
