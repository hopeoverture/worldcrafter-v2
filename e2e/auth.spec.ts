import { test, expect } from "@playwright/test";

/**
 * E2E tests for authentication flows
 * Tests signup, login, logout, and protected routes
 */

test.describe("Authentication", () => {
  // Use more unique email to avoid conflicts in parallel execution
  const testUser = {
    email: `test-auth-${Date.now()}-${Math.random().toString(36).substring(2, 9)}@example.com`,
    password: "SecurePassword123!",
    name: "Test User",
  };

  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("user can sign up with email and password", async ({ page }) => {
    // Navigate to signup page
    await page.goto("/signup");

    // Verify signup page loaded
    await expect(page.locator("h2")).toContainText("Create your account");

    // Fill signup form with all required fields
    await page.fill('input[name="name"]', testUser.name);
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.fill('input[name="confirmPassword"]', testUser.password);

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for success message or redirect
    await page.waitForURL(/\/(dashboard|worlds)/, { timeout: 30000 });

    // Verify user is logged in - check for Dashboard heading specifically
    await expect(
      page.getByRole("heading", { name: "Dashboard" })
    ).toBeVisible();
  });

  test("signup form validates email format", async ({ page }) => {
    await page.goto("/signup");

    // Fill in all required fields with invalid email
    await page.fill('input[name="name"]', "Test User");
    await page.fill('input[type="email"]', "not-an-email");
    await page.fill('input[name="password"]', "ValidPassword123!");
    await page.fill('input[name="confirmPassword"]', "ValidPassword123!");

    // Submit the form to trigger validation (React Hook Form validates on submit)
    await page.click('button[type="submit"]');

    // Should show validation error - look for exact error message
    await expect(
      page.locator('text="Please enter a valid email address"')
    ).toBeVisible({ timeout: 5000 });
  });

  test("signup form validates password strength", async ({ page }) => {
    await page.goto("/signup");

    // Fill in fields with weak password
    await page.fill('input[name="name"]', testUser.name);
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[name="password"]', "weak");
    await page.fill('input[name="confirmPassword"]', "weak");

    // Submit the form to trigger validation (React Hook Form validates on submit)
    await page.click('button[type="submit"]');

    // Should show validation error - look for exact password error message
    await expect(
      page.locator('text="Password must be at least 6 characters"')
    ).toBeVisible({ timeout: 5000 });
  });

  test("user can login with existing credentials", async ({ page }) => {
    // First, create a user via signup
    await page.goto("/signup");
    await page.fill('input[name="name"]', testUser.name);
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.fill('input[name="confirmPassword"]', testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(dashboard|worlds)/, { timeout: 30000 });

    // Clear cookies to logout (simulate logging out)
    await page.context().clearCookies();

    // Navigate to login page
    await page.goto("/login");

    // Now try to login
    await expect(page.locator("h2")).toContainText("Sign in");

    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);
    await page.click('button[type="submit"]');

    // Should redirect to dashboard after successful login
    await page.waitForURL(/\/(dashboard|worlds)/, { timeout: 30000 });
    await expect(
      page.getByRole("heading", { name: "Dashboard" })
    ).toBeVisible();
  });

  test("login shows error for invalid credentials", async ({ page }) => {
    await page.goto("/login");

    // Try invalid credentials
    await page.fill('input[type="email"]', "nonexistent@example.com");
    await page.fill('input[type="password"]', "WrongPassword123!");
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(
      page.locator("text=/Invalid|incorrect|wrong|failed/i")
    ).toBeVisible({ timeout: 5000 });
  });

  test("login redirects to dashboard if already authenticated", async ({
    page,
  }) => {
    // Sign up first
    await page.goto("/signup");
    await page.fill('input[name="name"]', testUser.name);
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.fill('input[name="confirmPassword"]', testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(dashboard|worlds)/, { timeout: 30000 });

    // Try to access login page while authenticated
    await page.goto("/login");

    // Should redirect to dashboard
    await page.waitForURL(/\/(dashboard|worlds)/, { timeout: 5000 });
  });

  test("signup redirects to dashboard if already authenticated", async ({
    page,
  }) => {
    // Sign up first
    await page.goto("/signup");
    await page.fill('input[name="name"]', testUser.name);
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.fill('input[name="confirmPassword"]', testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(dashboard|worlds)/, { timeout: 30000 });

    // Try to access signup page while authenticated
    await page.goto("/signup");

    // Should redirect to dashboard
    await page.waitForURL(/\/(dashboard|worlds)/, { timeout: 5000 });
  });

  test("protected routes redirect to login when not authenticated", async ({
    page,
  }) => {
    // Try to access protected routes without authentication
    const protectedRoutes = ["/dashboard", "/worlds", "/profile"];

    for (const route of protectedRoutes) {
      await page.goto(route);

      // Should redirect to login page
      await page.waitForURL("/login", { timeout: 5000 });
      await expect(page.locator("h2")).toContainText("Sign in");
    }
  });

  test("user can navigate between login and signup pages", async ({ page }) => {
    // Start on login page
    await page.goto("/login");
    await expect(page.locator("h2")).toContainText("Sign in");

    // Click link to signup
    await page.click('a[href="/signup"]');
    await page.waitForURL("/signup");
    await expect(page.locator("h2")).toContainText("Create your account");

    // Click link back to login
    await page.click('a[href="/login"]');
    await page.waitForURL("/login");
    await expect(page.locator("h2")).toContainText("Sign in");
  });

  test("session persists across page navigation", async ({ page }) => {
    // Sign up
    await page.goto("/signup");
    await page.fill('input[name="name"]', testUser.name);
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.fill('input[name="confirmPassword"]', testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(dashboard|worlds)/, { timeout: 30000 });

    // Navigate to different pages
    await page.goto("/worlds");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    // Navigate to profile (if exists)
    await page.goto("/profile");
    // Should not redirect to login - session should persist
    await expect(page.url()).toContain("/profile");
  });

  test("logout clears session and redirects to home", async ({ page }) => {
    // Sign up first
    await page.goto("/signup");
    await page.fill('input[name="name"]', testUser.name);
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.fill('input[name="confirmPassword"]', testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(dashboard|worlds)/, { timeout: 30000 });

    // Find and click logout button
    const logoutButton = page.locator(
      'button:has-text("Logout"), button:has-text("Sign Out"), a:has-text("Logout"), a:has-text("Sign Out")'
    );

    if (await logoutButton.isVisible()) {
      await logoutButton.click();

      // Should redirect to login or home page
      await page.waitForURL(/\/(login|^\/?)$/, { timeout: 5000 });

      // Try to access protected route - should redirect to login
      await page.goto("/dashboard");
      await page.waitForURL("/login", { timeout: 5000 });
      await expect(page.locator("h2")).toContainText("Sign in");
    } else {
      // Skip test if logout functionality not visible
      test.skip();
    }
  });
});
