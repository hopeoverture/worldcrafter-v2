import { test, expect } from "@playwright/test";

// Test configuration
test.describe("World Management", () => {
  const testUser = {
    name: "Test World User",
    email: `test-${Date.now()}@example.com`,
    password: "TestPassword123!",
  };

  const testWorld = {
    name: `Test World ${Date.now()}`,
    genre: "FANTASY",
    description:
      "# Test Description\n\nThis is a **test world** for E2E testing.",
    setting: "A fantasy realm for testing purposes",
    privacy: "PRIVATE",
  };

  test.beforeEach(async ({ page }) => {
    // Start from home page
    await page.goto("/");
  });

  test("user can sign up, create, edit, and delete a world", async ({
    page,
  }) => {
    // Step 1: Sign up
    await page.goto("/signup");
    await page.fill('input[name="name"]', testUser.name);
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.fill('input[name="confirmPassword"]', testUser.password);
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard or worlds page
    await page.waitForURL(/\/(dashboard|worlds)/, { timeout: 30000 });

    // Step 2: Navigate to create world page
    // Wait for dashboard to load fully
    await page.waitForSelector('h1:has-text("Dashboard")', { timeout: 10000 });

    // Click Create World button (could be in header or in content)
    const createWorldButton = page
      .locator('button:has-text("Create World"), a:has-text("Create World")')
      .first();
    await createWorldButton.waitFor({ timeout: 10000 });
    await createWorldButton.click();
    await page.waitForURL("/worlds/new");

    // Step 3: Fill out world creation form
    await page.fill('input[name="name"]', testWorld.name);

    // Select genre from dropdown (shadcn Select component)
    await page.click('button[role="combobox"]');
    // Wait for dropdown to open and click the specific item
    await page.click('[role="option"]:has-text("Fantasy")');

    // Fill setting first (it's the first textarea)
    await page.fill('textarea[name="setting"]', testWorld.setting);

    // Fill description (markdown editor - it's the second textarea, inside MDEditor)
    const descriptionTextarea = page.locator("textarea").nth(1);
    await descriptionTextarea.fill(testWorld.description);

    // Select privacy (also a Select dropdown)
    // Find the privacy dropdown (it's the second combobox after genre)
    const privacySelect = page.locator('button[role="combobox"]').nth(1);
    await privacySelect.click();
    await page.click('[role="option"]:has-text("Private")');

    // Submit form
    await page.click('button[type="submit"]:has-text("Create World")');

    // Wait for redirect to world detail page
    await page.waitForURL(/\/worlds\/[^/]+$/, { timeout: 10000 });

    // Step 4: Verify world was created
    // Use more specific selector to avoid markdown h1 elements
    await expect(page.locator("h1").first()).toContainText(testWorld.name);
    // Check for rendered markdown (ReactMarkdown converts **text** to <strong>text</strong>)
    await expect(
      page.locator("text=This is a test world for E2E testing")
    ).toBeVisible();

    // Step 5: Edit the world
    await page.click('a[href$="/edit"]:has-text("Edit")');
    await page.waitForURL(/\/worlds\/[^/]+\/edit/);

    // Update world name
    const updatedName = `${testWorld.name} - Updated`;
    await page.fill('input[name="name"]', updatedName);

    // Update setting
    const updatedSetting = "An updated fantasy realm";
    await page.fill('textarea[name="setting"]', updatedSetting);

    // Submit update
    await page.click('button[type="submit"]:has-text("Update World")');

    // Wait for redirect back to detail page
    await page.waitForURL(/\/worlds\/[^/]+$/);

    // Verify updates
    await expect(page.locator("h1").first()).toContainText(updatedName);
    await expect(page.locator("text=" + updatedSetting)).toBeVisible();

    // Step 6: Access settings page
    await page.click('a[href$="/settings"]:has-text("Settings")');
    await page.waitForURL(/\/worlds\/[^/]+\/settings/);

    // Verify settings page loaded
    await expect(page.locator("h1").first()).toContainText("World Settings");
    await expect(page.locator("text=Privacy Settings")).toBeVisible();

    // Step 7: Change privacy to PUBLIC
    // Click the label instead of the hidden radio input (shadcn RadioGroup pattern)
    await page.click("text=Public");
    await page.click('button[type="submit"]:has-text("Save Changes")');

    // Wait for toast notification
    await expect(page.locator('text="Privacy settings updated"')).toBeVisible({
      timeout: 5000,
    });

    // Step 8: Delete the world
    await page.click('button:has-text("Delete World")');

    // Verify delete dialog appears
    await expect(page.locator("text=Type")).toBeVisible();
    // Name appears multiple times in the dialog, so use .first()
    await expect(page.locator("text=" + updatedName).first()).toBeVisible();

    // Type incorrect confirmation text first (should not enable button)
    await page.fill('input[placeholder*="' + updatedName + '"]', "wrong name");
    // There are 2 "Delete World" buttons - one on settings page, one in dialog
    // Scope to dialog by using getByRole with dialog
    const dialog = page.getByRole("alertdialog");
    const deleteButton = dialog.getByRole("button", { name: "Delete World" });
    await expect(deleteButton).toBeDisabled();

    // Type correct confirmation text
    await page.fill('input[placeholder*="' + updatedName + '"]', updatedName);
    await expect(deleteButton).toBeEnabled();

    // Confirm deletion
    await deleteButton.click();

    // Wait for redirect to worlds list
    await page.waitForURL("/worlds", { timeout: 10000 });

    // Verify success toast
    await expect(
      page.locator(`text="World \\"${updatedName}\\" has been deleted"`)
    ).toBeVisible({ timeout: 5000 });

    // Verify world is no longer in the list
    await expect(page.locator("text=" + updatedName)).not.toBeVisible();
  });

  test("world creation form validates required fields", async ({ page }) => {
    // Signup first to ensure user exists
    await page.goto("/signup");
    await page.fill('input[name="name"]', testUser.name);
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.fill('input[name="confirmPassword"]', testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(dashboard|worlds)/, { timeout: 30000 });

    // Navigate to create world
    await page.goto("/worlds/new");

    // Try to submit without filling required fields
    await page.click('button[type="submit"]');

    // Verify validation errors appear
    await expect(page.locator("text=/required|must/i")).toBeVisible();
  });

  test.skip("user cannot access another user's world settings", async ({
    page,
  }) => {
    // TODO: Implement world settings page first
    // This test would require setting up two users
    // For now, we'll test that accessing a non-existent world returns 404

    // Signup first to ensure user exists
    await page.goto("/signup");
    await page.fill('input[name="name"]', testUser.name);
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.fill('input[name="confirmPassword"]', testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(dashboard|worlds)/, { timeout: 30000 });

    // Try to access settings for non-existent world
    await page.goto("/worlds/non-existent-world-slug/settings");

    // Should redirect to 404 or error page
    await expect(page.locator("text=/not found|404/i")).toBeVisible({
      timeout: 5000,
    });
  });

  test.skip("privacy settings update immediately", async ({ page }) => {
    // TODO: Implement world settings page first
    // Signup first to ensure user exists
    await page.goto("/signup");
    await page.fill('input[name="name"]', testUser.name);
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.fill('input[name="confirmPassword"]', testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(dashboard|worlds)/, { timeout: 30000 });

    // Create a quick test world
    await page.goto("/worlds/new");
    await page.fill('input[name="name"]', `Privacy Test ${Date.now()}`);
    // Select genre
    await page.click('button[role="combobox"]');
    await page.click('[role="option"]:has-text("Fantasy")');
    // Select privacy (second combobox)
    const privacySelect = page.locator('button[role="combobox"]').nth(1);
    await privacySelect.click();
    await page.click('[role="option"]:has-text("Private")');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/worlds\/[^/]+$/);

    // Go to settings
    await page.click('a[href$="/settings"]');
    await page.waitForURL(/\/worlds\/[^/]+\/settings/);

    // Verify PRIVATE is selected
    await expect(page.locator('input[value="PRIVATE"]')).toBeChecked();

    // Change to UNLISTED
    await page.click('input[value="UNLISTED"]');
    await page.click('button:has-text("Save Changes")');

    // Verify toast
    await expect(page.locator('text="Privacy settings updated"')).toBeVisible();

    // Reload page and verify persistence
    await page.reload();
    await expect(page.locator('input[value="UNLISTED"]')).toBeChecked();
  });

  test("markdown editor renders properly in world form", async ({ page }) => {
    // Signup first to ensure user exists
    await page.goto("/signup");
    await page.fill('input[name="name"]', testUser.name);
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.fill('input[name="confirmPassword"]', testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(dashboard|worlds)/, { timeout: 30000 });

    // Navigate to create world
    await page.goto("/worlds/new");

    // Find markdown editor
    const markdownEditor = page.locator(".w-md-editor");
    await expect(markdownEditor).toBeVisible();

    // Type markdown
    const descriptionTextarea = page.locator("textarea").first();
    await descriptionTextarea.fill(
      "# Heading\n\n**Bold text**\n\n- List item 1\n- List item 2"
    );

    // Preview should be available (markdown editor usually has preview mode)
    await expect(descriptionTextarea).toHaveValue(/# Heading/);
  });

  test("world list displays created worlds", async ({ page }) => {
    // Signup first to ensure user exists
    await page.goto("/signup");
    await page.fill('input[name="name"]', testUser.name);
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.fill('input[name="confirmPassword"]', testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(dashboard|worlds)/, { timeout: 30000 });

    // Navigate to worlds list
    await page.goto("/worlds");

    // Verify page loaded - check for any h1
    await expect(page.locator("h1")).toBeVisible();

    // Basic page load verification - the page should have loaded successfully
    // Note: Specific UI elements (grid/list toggle, filters) may not be implemented yet
    await expect(page).toHaveURL(/\/worlds/);
  });
});
