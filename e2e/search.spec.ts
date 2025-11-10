import { test, expect } from "@playwright/test"

test.describe("Location Search", () => {
  const testUser = {
    name: "Test Search User",
    email: `test-search-${Date.now()}@example.com`,
    password: "TestPassword123!",
  }

  const testWorld = {
    name: `Search Test World ${Date.now()}`,
    genre: "FANTASY",
  }

  const testLocations = [
    {
      name: "Crystal Tower",
      type: "Building",
      description: "A magnificent tower made of enchanted crystal",
    },
    {
      name: "Emerald Forest",
      type: "Forest",
      description: "A lush forest with emerald green leaves",
    },
    {
      name: "Dragon Peak",
      type: "Mountain",
      description: "A towering mountain where ancient dragons once nested",
    },
  ]

  let worldSlug: string

  test.beforeAll(async ({ browser }) => {
    // Set up test data: user, world, and locations
    const page = await browser.newPage()

    // Sign up
    await page.goto("/signup")
    await page.fill('input[name="name"]', testUser.name)
    await page.fill('input[type="email"]', testUser.email)
    await page.fill('input[name="password"]', testUser.password)
    await page.fill('input[name="confirmPassword"]', testUser.password)
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/(dashboard|worlds)/, { timeout: 15000 })

    // Create world
    await page.goto("/worlds/new")
    await page.fill('input[name="name"]', testWorld.name)
    await page.click('button[role="combobox"]')
    await page.click("text=Fantasy")
    await page.click('input[value="PRIVATE"]')
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/worlds\/[^/]+$/, { timeout: 10000 })

    // Get world slug from URL
    worldSlug = page.url().split("/worlds/")[1].split("/")[0]

    // Create test locations
    for (const location of testLocations) {
      await page.goto(`/worlds/${worldSlug}/locations/new`)
      await page.waitForSelector('input[name="name"]')
      await page.fill('input[name="name"]', location.name)

      // Select type
      await page.click('button[role="combobox"]')
      await page.click(`text=${location.type}`)

      // Fill description
      await page.fill('textarea[name="description"]', location.description)

      // Submit
      await page.click('button[type="submit"]:has-text("Create Location")')
      await page.waitForURL(/\/worlds\/[^/]+\/locations$/, { timeout: 10000 })
    }

    await page.close()
  })

  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto("/login")
    await page.fill('input[type="email"]', testUser.email)
    await page.fill('input[type="password"]', testUser.password)
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/(dashboard|worlds)/)
  })

  test("global search opens with ⌘K keyboard shortcut", async ({ page }) => {
    // Navigate to world page
    await page.goto(`/worlds/${worldSlug}`)

    // Press ⌘K (Cmd+K on Mac, Ctrl+K on Windows)
    await page.keyboard.press("Meta+k")

    // Verify search dialog opened
    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 3000 })
    await expect(page.locator('input[placeholder*="Search locations"]')).toBeVisible()
  })

  test("can search for locations in global search", async ({ page }) => {
    // Navigate to world page
    await page.goto(`/worlds/${worldSlug}`)

    // Open search with keyboard shortcut
    await page.keyboard.press("Meta+k")

    // Wait for dialog to open
    await page.waitForSelector('[role="dialog"]', { timeout: 3000 })

    // Type search query
    const searchInput = page.locator('input[placeholder*="Search locations"]')
    await searchInput.fill("Crystal")

    // Wait for search results
    await page.waitForSelector("text=Crystal Tower", { timeout: 5000 })

    // Verify result is shown
    await expect(page.locator("text=Crystal Tower")).toBeVisible()
    await expect(page.locator("text=A magnificent tower")).toBeVisible()
  })

  test("can navigate to location from search results", async ({ page }) => {
    // Navigate to world page
    await page.goto(`/worlds/${worldSlug}`)

    // Open search
    await page.keyboard.press("Meta+k")
    await page.waitForSelector('[role="dialog"]')

    // Search for location
    await page.fill('input[placeholder*="Search locations"]', "Emerald")
    await page.waitForSelector("text=Emerald Forest", { timeout: 5000 })

    // Click on search result
    await page.click("text=Emerald Forest")

    // Wait for navigation to location detail page
    await page.waitForURL(/\/worlds\/[^/]+\/locations\/[^/]+$/, { timeout: 10000 })

    // Verify we're on the location detail page
    await expect(page.locator("h1")).toContainText("Emerald Forest")
    await expect(page.locator("text=A lush forest")).toBeVisible()
  })

  test("search results page displays all matching locations", async ({ page }) => {
    // Navigate directly to search page
    await page.goto(`/worlds/${worldSlug}/search?q=dragon`)

    // Verify search page loaded
    await expect(page.locator("h1")).toContainText("Search")

    // Wait for search to complete
    await page.waitForSelector("text=Dragon Peak", { timeout: 5000 })

    // Verify search results
    await expect(page.locator("text=Dragon Peak")).toBeVisible()
    await expect(page.locator("text=Found 1 result")).toBeVisible()
  })

  test("search shows empty state when no results", async ({ page }) => {
    // Navigate to world page
    await page.goto(`/worlds/${worldSlug}`)

    // Open search
    await page.keyboard.press("Meta+k")
    await page.waitForSelector('[role="dialog"]')

    // Search for non-existent location
    await page.fill('input[placeholder*="Search locations"]', "nonexistentlocation12345")

    // Wait a bit for search to complete
    await page.waitForTimeout(1000)

    // Verify empty state
    await expect(page.locator("text=No locations found")).toBeVisible()
  })

  test("search results update as user types", async ({ page }) => {
    // Navigate to world page
    await page.goto(`/worlds/${worldSlug}`)

    // Open search
    await page.keyboard.press("Meta+k")
    await page.waitForSelector('[role="dialog"]')

    const searchInput = page.locator('input[placeholder*="Search locations"]')

    // Type partial query
    await searchInput.fill("Cryst")

    // Should show Crystal Tower
    await page.waitForSelector("text=Crystal Tower", { timeout: 5000 })
    await expect(page.locator("text=Crystal Tower")).toBeVisible()

    // Clear and type different query
    await searchInput.clear()
    await searchInput.fill("Forest")

    // Should now show Emerald Forest
    await page.waitForSelector("text=Emerald Forest", { timeout: 5000 })
    await expect(page.locator("text=Emerald Forest")).toBeVisible()

    // Crystal Tower should not be visible
    await expect(page.locator("text=Crystal Tower")).not.toBeVisible()
  })

  test("can access search from world dashboard quick action", async ({ page }) => {
    // Navigate to world page
    await page.goto(`/worlds/${worldSlug}`)

    // Click "Search World" quick action
    await page.click('a[href$="/search"]:has-text("Search World")')

    // Wait for search page to load
    await page.waitForURL(/\/worlds\/[^/]+\/search$/)

    // Verify we're on the search page
    await expect(page.locator("h1")).toContainText("Search")
    await expect(page.locator('input[type="search"]')).toBeVisible()
  })

  test("search results show location type badges", async ({ page }) => {
    // Navigate to world page
    await page.goto(`/worlds/${worldSlug}`)

    // Open search
    await page.keyboard.press("Meta+k")
    await page.waitForSelector('[role="dialog"]')

    // Search for location
    await page.fill('input[placeholder*="Search locations"]', "Crystal")
    await page.waitForSelector("text=Crystal Tower", { timeout: 5000 })

    // Verify type badge is shown
    await expect(page.locator("text=Building")).toBeVisible()
  })

  test("global search closes when Escape is pressed", async ({ page }) => {
    // Navigate to world page
    await page.goto(`/worlds/${worldSlug}`)

    // Open search
    await page.keyboard.press("Meta+k")
    await page.waitForSelector('[role="dialog"]')

    // Verify dialog is open
    await expect(page.locator('[role="dialog"]')).toBeVisible()

    // Press Escape
    await page.keyboard.press("Escape")

    // Verify dialog is closed
    await expect(page.locator('[role="dialog"]')).not.toBeVisible()
  })

  test("search is scoped to current world only", async ({ page, browser }) => {
    // Create a second world with a unique location
    const secondPage = await browser.newPage()
    await secondPage.goto("/login")
    await secondPage.fill('input[type="email"]', testUser.email)
    await secondPage.fill('input[type="password"]', testUser.password)
    await secondPage.click('button[type="submit"]')
    await secondPage.waitForURL(/\/(dashboard|worlds)/)

    // Create second world
    await secondPage.goto("/worlds/new")
    await secondPage.fill('input[name="name"]', `Second World ${Date.now()}`)
    await secondPage.click('button[role="combobox"]')
    await secondPage.click("text=Fantasy")
    await secondPage.click('input[value="PRIVATE"]')
    await secondPage.click('button[type="submit"]')
    await secondPage.waitForURL(/\/worlds\/[^/]+$/)

    const secondWorldSlug = secondPage.url().split("/worlds/")[1].split("/")[0]

    // Create unique location in second world
    await secondPage.goto(`/worlds/${secondWorldSlug}/locations/new`)
    await secondPage.fill('input[name="name"]', "Unique Location 12345")
    await secondPage.click('button[role="combobox"]')
    await secondPage.click("text=City")
    await secondPage.fill('textarea[name="description"]', "A very unique place")
    await secondPage.click('button[type="submit"]')
    await secondPage.waitForURL(/\/worlds\/[^/]+\/locations$/)

    await secondPage.close()

    // Now search in first world - should NOT find location from second world
    await page.goto(`/worlds/${worldSlug}`)
    await page.keyboard.press("Meta+k")
    await page.waitForSelector('[role="dialog"]')

    await page.fill('input[placeholder*="Search locations"]', "Unique Location 12345")
    await page.waitForTimeout(1000)

    // Should show no results
    await expect(page.locator("text=No locations found")).toBeVisible()
    await expect(page.locator("text=Unique Location 12345")).not.toBeVisible()
  })
})
