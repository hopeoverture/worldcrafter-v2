import { test, expect } from "@playwright/test"

/**
 * E2E tests for Location Management
 * Tests location creation, editing, hierarchy, and deletion
 */

test.describe("Location Management", () => {
  const testUser = {
    name: "Test Location User",
    email: `test-location-${Date.now()}@example.com`,
    password: "TestPassword123!",
  }

  const testWorld = {
    name: `Test World ${Date.now()}`,
    genre: "Fantasy",
    description: "A world for testing locations",
  }

  const testLocations = {
    continent: {
      name: "Test Continent",
      type: "Continent",
      description: "A large continent for testing",
    },
    country: {
      name: "Test Country",
      type: "Country",
      description: "A country within the continent",
    },
    city: {
      name: "Test City",
      type: "City",
      description: "A major city in the country",
      geography: "Built on a river delta",
      climate: "Temperate",
      population: "500,000",
      government: "Republic",
      economy: "Trade and commerce",
      culture: "Diverse and welcoming",
    },
    dungeon: {
      name: "Dark Dungeon",
      type: "Dungeon",
      description: "A dangerous dungeon beneath the city",
    },
  }

  test.beforeEach(async ({ page }) => {
    // Sign up and create a world for each test
    await page.goto("/signup")
    await page.fill('input[name="name"]', testUser.name)
    await page.fill('input[type="email"]', testUser.email)
    await page.fill('input[name="password"]', testUser.password)
    await page.fill('input[name="confirmPassword"]', testUser.password)
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/(dashboard|worlds)/, { timeout: 15000 })

    // Create test world
    await page.click('a[href="/worlds/new"], button:has-text("Create World")')
    await page.waitForURL("/worlds/new")

    await page.fill('input[name="name"]', testWorld.name)
    await page.click('button[role="combobox"]')
    await page.click(`text=${testWorld.genre}`)

    const descriptionTextarea = page.locator('textarea').first()
    await descriptionTextarea.fill(testWorld.description)

    await page.click('button[type="submit"]:has-text("Create World")')
    await page.waitForURL(/\/worlds\/[^/]+$/, { timeout: 10000 })
  })

  test("user can create a location with minimal fields", async ({ page }) => {
    // Navigate to create location page
    await page.click('a[href*="/locations/new"]:has-text("Add Location"), a:has-text("Create Location")')
    await page.waitForURL(/\/worlds\/[^/]+\/locations\/new/)

    // Verify form loaded
    await expect(page.locator("h1")).toContainText(/Create|New|Add/)

    // Fill minimal required fields
    await page.fill('input[name="name"]', testLocations.continent.name)

    // Select location type
    await page.click('button[role="combobox"]')
    await page.click(`text=${testLocations.continent.type}`)

    // Fill description
    const descriptionTextarea = page.locator('textarea').first()
    await descriptionTextarea.fill(testLocations.continent.description)

    // Submit form
    await page.click('button[type="submit"]:has-text("Create")')

    // Should redirect to location detail page or locations list
    await page.waitForURL(/\/worlds\/[^/]+\/locations/, { timeout: 10000 })

    // Verify location appears in list or detail page
    await expect(page.locator(`text=${testLocations.continent.name}`)).toBeVisible()
  })

  test("user can create a location with all fields", async ({ page }) => {
    // Navigate to create location page
    await page.click('a[href*="/locations/new"]:has-text("Add Location"), a:has-text("Create Location")')
    await page.waitForURL(/\/worlds\/[^/]+\/locations\/new/)

    // Fill basic information
    await page.fill('input[name="name"]', testLocations.city.name)

    // Select type
    await page.click('button[role="combobox"]')
    await page.click(`text=${testLocations.city.type}`)

    // Fill description
    const descriptionTextarea = page.locator('textarea').first()
    await descriptionTextarea.fill(testLocations.city.description)

    // Navigate to Details tab if tabs exist
    const detailsTab = page.locator('button:has-text("Details")')
    if (await detailsTab.isVisible()) {
      await detailsTab.click()
    }

    // Fill detailed fields
    await page.fill('textarea[name="geography"]', testLocations.city.geography)
    await page.fill('input[name="climate"]', testLocations.city.climate)
    await page.fill('input[name="population"]', testLocations.city.population)
    await page.fill('input[name="government"]', testLocations.city.government)
    await page.fill('textarea[name="economy"]', testLocations.city.economy)
    await page.fill('textarea[name="culture"]', testLocations.city.culture)

    // Submit form
    await page.click('button[type="submit"]:has-text("Create")')

    // Wait for redirect
    await page.waitForURL(/\/worlds\/[^/]+\/locations/, { timeout: 10000 })

    // Verify location created
    await expect(page.locator(`text=${testLocations.city.name}`)).toBeVisible()
  })

  test("user can create hierarchical locations", async ({ page }) => {
    // Step 1: Create continent (parent)
    await page.click('a[href*="/locations/new"]:has-text("Add Location"), a:has-text("Create Location")')
    await page.waitForURL(/\/worlds\/[^/]+\/locations\/new/)

    await page.fill('input[name="name"]', testLocations.continent.name)
    await page.click('button[role="combobox"]')
    await page.click(`text=${testLocations.continent.type}`)

    const continentDescription = page.locator('textarea').first()
    await continentDescription.fill(testLocations.continent.description)

    await page.click('button[type="submit"]:has-text("Create")')
    await page.waitForURL(/\/worlds\/[^/]+\/locations/, { timeout: 10000 })

    // Step 2: Create country (child of continent)
    await page.click('a[href*="/locations/new"]:has-text("Add Location"), a:has-text("Create Location")')
    await page.waitForURL(/\/worlds\/[^/]+\/locations\/new/)

    await page.fill('input[name="name"]', testLocations.country.name)
    await page.click('button[role="combobox"]')
    await page.click(`text=${testLocations.country.type}`)

    // Select parent location if parent selector exists
    const parentSelector = page.locator('button:has-text("Select parent"), button:has-text("Parent Location")')
    if (await parentSelector.isVisible()) {
      await parentSelector.click()
      await page.click(`text=${testLocations.continent.name}`)
    }

    const countryDescription = page.locator('textarea').first()
    await countryDescription.fill(testLocations.country.description)

    await page.click('button[type="submit"]:has-text("Create")')
    await page.waitForURL(/\/worlds\/[^/]+\/locations/, { timeout: 10000 })

    // Step 3: Verify hierarchy in tree view
    // Look for continent
    await expect(page.locator(`text=${testLocations.continent.name}`)).toBeVisible()

    // Expand continent if collapsed
    const expandButton = page.locator(`text=${testLocations.continent.name}`).locator('xpath=..').locator('button[aria-label*="expand"], button:has-text("▸")')
    if (await expandButton.isVisible()) {
      await expandButton.click()
    }

    // Country should be visible under continent
    await expect(page.locator(`text=${testLocations.country.name}`)).toBeVisible()
  })

  test("user can edit a location", async ({ page }) => {
    // Create a location first
    await page.click('a[href*="/locations/new"]:has-text("Add Location"), a:has-text("Create Location")')
    await page.waitForURL(/\/worlds\/[^/]+\/locations\/new/)

    await page.fill('input[name="name"]', testLocations.city.name)
    await page.click('button[role="combobox"]')
    await page.click(`text=${testLocations.city.type}`)

    const description = page.locator('textarea').first()
    await description.fill(testLocations.city.description)

    await page.click('button[type="submit"]:has-text("Create")')
    await page.waitForURL(/\/worlds\/[^/]+\/locations/, { timeout: 10000 })

    // Find and click edit button
    const editButton = page.locator(`text=${testLocations.city.name}`).locator('xpath=..').locator('a[href*="/edit"]:has-text("Edit"), button:has-text("Edit")')

    // If not visible in tree view, navigate to location detail first
    if (!(await editButton.isVisible())) {
      await page.click(`text=${testLocations.city.name}`)
      await page.waitForURL(/\/worlds\/[^/]+\/locations\/[^/]+$/)
      await page.click('a[href*="/edit"]:has-text("Edit")')
    } else {
      await editButton.click()
    }

    await page.waitForURL(/\/worlds\/[^/]+\/locations\/[^/]+\/edit/)

    // Update location name
    const updatedName = `${testLocations.city.name} - Updated`
    await page.fill('input[name="name"]', updatedName)

    // Update description
    const updatedDescription = "An updated description for the city"
    const descriptionTextarea = page.locator('textarea').first()
    await descriptionTextarea.clear()
    await descriptionTextarea.fill(updatedDescription)

    // Submit update
    await page.click('button[type="submit"]:has-text("Update")')

    // Wait for redirect
    await page.waitForURL(/\/worlds\/[^/]+\/locations/, { timeout: 10000 })

    // Verify updates
    await expect(page.locator(`text=${updatedName}`)).toBeVisible()
  })

  test("user can delete a location", async ({ page }) => {
    // Create a location first
    await page.click('a[href*="/locations/new"]:has-text("Add Location"), a:has-text("Create Location")')
    await page.waitForURL(/\/worlds\/[^/]+\/locations\/new/)

    const locationName = `Location to Delete ${Date.now()}`
    await page.fill('input[name="name"]', locationName)
    await page.click('button[role="combobox"]')
    await page.click(`text=${testLocations.dungeon.type}`)

    const description = page.locator('textarea').first()
    await description.fill(testLocations.dungeon.description)

    await page.click('button[type="submit"]:has-text("Create")')
    await page.waitForURL(/\/worlds\/[^/]+\/locations/, { timeout: 10000 })

    // Find and click delete button
    const deleteButton = page.locator(`text=${locationName}`).locator('xpath=..').locator('button:has-text("Delete")')

    // If not visible in tree view, navigate to location detail first
    if (!(await deleteButton.isVisible())) {
      await page.click(`text=${locationName}`)
      await page.waitForURL(/\/worlds\/[^/]+\/locations\/[^/]+$/)
      await page.click('button:has-text("Delete")')
    } else {
      await deleteButton.click()
    }

    // Confirm deletion in dialog
    await page.click('button:has-text("Delete"), button:has-text("Confirm")')

    // Wait for deletion to complete
    await page.waitForTimeout(1000)

    // Verify location is removed from list
    await expect(page.locator(`text=${locationName}`)).not.toBeVisible()
  })

  test("user can view location tree and table views", async ({ page }) => {
    // Create two locations
    const locations = [testLocations.continent, testLocations.city]

    for (const location of locations) {
      await page.click('a[href*="/locations/new"]:has-text("Add Location"), a:has-text("Create Location")')
      await page.waitForURL(/\/worlds\/[^/]+\/locations\/new/)

      await page.fill('input[name="name"]', location.name)
      await page.click('button[role="combobox"]')
      await page.click(`text=${location.type}`)

      const description = page.locator('textarea').first()
      await description.fill(location.description)

      await page.click('button[type="submit"]:has-text("Create")')
      await page.waitForURL(/\/worlds\/[^/]+\/locations/, { timeout: 10000 })
    }

    // Navigate to locations list
    await page.goto(page.url().split('/locations')[0] + '/locations')

    // Verify tree view (default)
    await expect(page.locator(`text=${locations[0].name}`)).toBeVisible()
    await expect(page.locator(`text=${locations[1].name}`)).toBeVisible()

    // Switch to table view if toggle exists
    const tableViewButton = page.locator('button:has-text("Table"), button[aria-label*="Table"]')
    if (await tableViewButton.isVisible()) {
      await tableViewButton.click()

      // Verify table headers
      await expect(page.locator('th:has-text("Name")')).toBeVisible()
      await expect(page.locator('th:has-text("Type")')).toBeVisible()

      // Verify locations in table
      await expect(page.locator(`text=${locations[0].name}`)).toBeVisible()
      await expect(page.locator(`text=${locations[1].name}`)).toBeVisible()

      // Switch back to tree view
      const treeViewButton = page.locator('button:has-text("Tree"), button[aria-label*="Tree"]')
      if (await treeViewButton.isVisible()) {
        await treeViewButton.click()
      }
    }
  })

  test("user can filter locations by type", async ({ page }) => {
    // Create locations of different types
    const locations = [
      { ...testLocations.continent, name: `Continent ${Date.now()}` },
      { ...testLocations.city, name: `City ${Date.now()}` },
    ]

    for (const location of locations) {
      await page.click('a[href*="/locations/new"]:has-text("Add Location"), a:has-text("Create Location")')
      await page.waitForURL(/\/worlds\/[^/]+\/locations\/new/)

      await page.fill('input[name="name"]', location.name)
      await page.click('button[role="combobox"]')
      await page.click(`text=${location.type}`)

      const description = page.locator('textarea').first()
      await description.fill(location.description)

      await page.click('button[type="submit"]:has-text("Create")')
      await page.waitForURL(/\/worlds\/[^/]+\/locations/, { timeout: 10000 })
    }

    // Navigate to locations list
    await page.goto(page.url().split('/locations')[0] + '/locations')

    // Verify both locations visible
    await expect(page.locator(`text=${locations[0].name}`)).toBeVisible()
    await expect(page.locator(`text=${locations[1].name}`)).toBeVisible()

    // Apply type filter if filter exists
    const typeFilter = page.locator('select[name*="type"], button:has-text("Filter"), button[aria-label*="Filter"]')
    if (await typeFilter.isVisible()) {
      await typeFilter.click()
      await page.click(`text=${locations[0].type}`)

      // Wait for filter to apply
      await page.waitForTimeout(500)

      // First location should be visible
      await expect(page.locator(`text=${locations[0].name}`)).toBeVisible()

      // Second location should not be visible (different type)
      await expect(page.locator(`text=${locations[1].name}`)).not.toBeVisible()
    }
  })

  test("location form validates required fields", async ({ page }) => {
    // Navigate to create location page
    await page.click('a[href*="/locations/new"]:has-text("Add Location"), a:has-text("Create Location")')
    await page.waitForURL(/\/worlds\/[^/]+\/locations\/new/)

    // Try to submit without filling required fields
    await page.click('button[type="submit"]:has-text("Create")')

    // Should show validation error
    await expect(
      page.locator("text=/required|is required|cannot be empty/i")
    ).toBeVisible({ timeout: 5000 })

    // URL should not change (still on form page)
    expect(page.url()).toContain("/locations/new")
  })

  test("cascade delete warning shows for locations with children", async ({
    page,
  }) => {
    // Create parent location
    await page.click('a[href*="/locations/new"]:has-text("Add Location"), a:has-text("Create Location")')
    await page.waitForURL(/\/worlds\/[^/]+\/locations\/new/)

    await page.fill('input[name="name"]', testLocations.continent.name)
    await page.click('button[role="combobox"]')
    await page.click(`text=${testLocations.continent.type}`)

    const parentDescription = page.locator('textarea').first()
    await parentDescription.fill(testLocations.continent.description)

    await page.click('button[type="submit"]:has-text("Create")')
    await page.waitForURL(/\/worlds\/[^/]+\/locations/, { timeout: 10000 })

    // Create child location
    await page.click('a[href*="/locations/new"]:has-text("Add Location"), a:has-text("Create Location")')
    await page.waitForURL(/\/worlds\/[^/]+\/locations\/new/)

    await page.fill('input[name="name"]', testLocations.country.name)
    await page.click('button[role="combobox"]')
    await page.click(`text=${testLocations.country.type}`)

    // Select parent if available
    const parentSelector = page.locator('button:has-text("Select parent"), button:has-text("Parent Location")')
    if (await parentSelector.isVisible()) {
      await parentSelector.click()
      await page.click(`text=${testLocations.continent.name}`)
    }

    const childDescription = page.locator('textarea').first()
    await childDescription.fill(testLocations.country.description)

    await page.click('button[type="submit"]:has-text("Create")')
    await page.waitForURL(/\/worlds\/[^/]+\/locations/, { timeout: 10000 })

    // Try to delete parent
    const deleteButton = page.locator(`text=${testLocations.continent.name}`).locator('xpath=..').locator('button:has-text("Delete")')

    if (await deleteButton.isVisible()) {
      await deleteButton.click()

      // Should show warning about children
      await expect(
        page.locator("text=/children|cascade|also be deleted/i")
      ).toBeVisible({ timeout: 5000 })
    }
  })
})
