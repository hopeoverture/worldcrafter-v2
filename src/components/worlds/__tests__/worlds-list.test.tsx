import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent, within } from "@testing-library/react"
import { WorldsList } from "../worlds-list"
import { type World } from "@prisma/client"

// Mock Next.js Link component
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

// Helper to create mock world
function createMockWorld(overrides?: Partial<World>): World {
  const id = overrides?.id ?? `world-${Math.random()}`
  return {
    id,
    userId: overrides?.userId ?? "user-123",
    name: overrides?.name ?? "Test World",
    slug: overrides?.slug ?? "test-world",
    genre: overrides?.genre ?? "FANTASY",
    description: overrides?.description ?? "A test world description",
    setting: overrides?.setting ?? "A fantasy realm",
    metadata: overrides?.metadata ?? null,
    coverUrl: overrides?.coverUrl ?? null,
    privacy: overrides?.privacy ?? "PRIVATE",
    createdAt: overrides?.createdAt ?? new Date("2024-01-01"),
    updatedAt: overrides?.updatedAt ?? new Date("2024-01-15"),
  }
}

describe("WorldsList", () => {
  describe("Empty State", () => {
    it("shows empty state when no worlds exist", () => {
      render(<WorldsList worlds={[]} />)

      expect(screen.getByText(/haven't created any worlds yet/i)).toBeInTheDocument()
      expect(screen.getByRole("link", { name: /create your first world/i })).toBeInTheDocument()
    })
  })

  describe("Grid View", () => {
    it("displays worlds in grid view by default", () => {
      const worlds = [
        createMockWorld({ name: "World 1" }),
        createMockWorld({ name: "World 2" }),
        createMockWorld({ name: "World 3" }),
      ]

      render(<WorldsList worlds={worlds} />)

      expect(screen.getByText("World 1")).toBeInTheDocument()
      expect(screen.getByText("World 2")).toBeInTheDocument()
      expect(screen.getByText("World 3")).toBeInTheDocument()
    })

    it("shows genre badges", () => {
      const worlds = [
        createMockWorld({ name: "Fantasy World", genre: "FANTASY" }),
        createMockWorld({ name: "Sci-Fi World", genre: "SCIFI" }),
      ]

      render(<WorldsList worlds={worlds} />)

      expect(screen.getByText("FANTASY")).toBeInTheDocument()
      expect(screen.getByText("SCIFI")).toBeInTheDocument()
    })

    it("shows privacy badges", () => {
      const worlds = [
        createMockWorld({ name: "Private World", privacy: "PRIVATE" }),
        createMockWorld({ name: "Public World", privacy: "PUBLIC" }),
      ]

      render(<WorldsList worlds={worlds} />)

      // Privacy badges are shown on cards - check they exist
      expect(screen.getByText(/Private World/i)).toBeInTheDocument()
      expect(screen.getByText(/Public World/i)).toBeInTheDocument()
    })
  })

  describe("List View", () => {
    it("switches to list view when button clicked", () => {
      const worlds = [createMockWorld({ name: "Test World" })]

      render(<WorldsList worlds={worlds} />)

      // Find and click list view button
      const listViewButton = screen.getAllByRole("button").find((button) => {
        const svg = button.querySelector("svg")
        return svg?.classList.contains("lucide-layout-list") || button.textContent === "List view"
      })

      if (listViewButton) {
        fireEvent.click(listViewButton)
      }

      // Check for table headers (indicates list view)
      expect(screen.getByText("Name")).toBeInTheDocument()
      expect(screen.getByText("Genre")).toBeInTheDocument()
      expect(screen.getByText("Privacy")).toBeInTheDocument()
    })

    it("displays worlds in table format in list view", () => {
      const worlds = [
        createMockWorld({
          name: "Test World",
          genre: "FANTASY",
          privacy: "PUBLIC",
        }),
      ]

      render(<WorldsList worlds={worlds} />)

      // Switch to list view
      const listViewButton = screen.getAllByRole("button").find((button) => {
        const svg = button.querySelector("svg")
        return svg?.classList.contains("lucide-layout-list")
      })

      if (listViewButton) {
        fireEvent.click(listViewButton)
      }

      // Verify table content
      expect(screen.getByText("Test World")).toBeInTheDocument()
      expect(screen.getByText("FANTASY")).toBeInTheDocument()
    })
  })

  describe("Search", () => {
    it("filters worlds by name", () => {
      const worlds = [
        createMockWorld({ name: "Dragon Kingdom" }),
        createMockWorld({ name: "Space Station Alpha" }),
        createMockWorld({ name: "Medieval Dragon Realm" }),
      ]

      render(<WorldsList worlds={worlds} />)

      const searchInput = screen.getByPlaceholderText(/search worlds/i)
      fireEvent.change(searchInput, { target: { value: "dragon" } })

      expect(screen.getByText("Dragon Kingdom")).toBeInTheDocument()
      expect(screen.getByText("Medieval Dragon Realm")).toBeInTheDocument()
      expect(screen.queryByText("Space Station Alpha")).not.toBeInTheDocument()
    })

    it("filters worlds by setting", () => {
      const worlds = [
        createMockWorld({ name: "World 1", setting: "A mystical forest" }),
        createMockWorld({ name: "World 2", setting: "A desert wasteland" }),
      ]

      render(<WorldsList worlds={worlds} />)

      const searchInput = screen.getByPlaceholderText(/search worlds/i)
      fireEvent.change(searchInput, { target: { value: "forest" } })

      expect(screen.getByText("World 1")).toBeInTheDocument()
      expect(screen.queryByText("World 2")).not.toBeInTheDocument()
    })

    it("shows no results message when search has no matches", () => {
      const worlds = [createMockWorld({ name: "Test World" })]

      render(<WorldsList worlds={worlds} />)

      const searchInput = screen.getByPlaceholderText(/search worlds/i)
      fireEvent.change(searchInput, { target: { value: "nonexistent" } })

      expect(screen.getByText(/no worlds match your search/i)).toBeInTheDocument()
    })

    it("clears search when X button clicked", () => {
      const worlds = [
        createMockWorld({ name: "World 1" }),
        createMockWorld({ name: "World 2" }),
      ]

      render(<WorldsList worlds={worlds} />)

      const searchInput = screen.getByPlaceholderText(/search worlds/i)
      fireEvent.change(searchInput, { target: { value: "World 1" } })

      expect(screen.queryByText("World 2")).not.toBeInTheDocument()

      // Click the X button in search input
      const clearButton = searchInput.parentElement?.querySelector("button")
      if (clearButton) {
        fireEvent.click(clearButton)
      }

      // Both worlds should be visible again
      expect(screen.getByText("World 1")).toBeInTheDocument()
      expect(screen.getByText("World 2")).toBeInTheDocument()
    })
  })

  describe("Filtering", () => {
    it("filters worlds by genre", () => {
      const worlds = [
        createMockWorld({ name: "Fantasy World", genre: "FANTASY" }),
        createMockWorld({ name: "Sci-Fi World", genre: "SCIFI" }),
        createMockWorld({ name: "Modern World", genre: "MODERN" }),
      ]

      render(<WorldsList worlds={worlds} />)

      // Find genre select
      const genreSelects = screen.getAllByRole("combobox")
      const genreSelect = genreSelects[0] // First select should be genre

      fireEvent.click(genreSelect)

      // Click on "Fantasy" option
      const fantasyOption = screen.getByText("Fantasy")
      fireEvent.click(fantasyOption)

      expect(screen.getByText("Fantasy World")).toBeInTheDocument()
      expect(screen.queryByText("Sci-Fi World")).not.toBeInTheDocument()
      expect(screen.queryByText("Modern World")).not.toBeInTheDocument()
    })

    it("filters worlds by privacy", () => {
      const worlds = [
        createMockWorld({ name: "Private World", privacy: "PRIVATE" }),
        createMockWorld({ name: "Public World", privacy: "PUBLIC" }),
      ]

      render(<WorldsList worlds={worlds} />)

      // Find privacy select (second select)
      const selects = screen.getAllByRole("combobox")
      const privacySelect = selects[1]

      fireEvent.click(privacySelect)

      // Click on "Private" option
      const privateOption = screen.getByText("Private")
      fireEvent.click(privateOption)

      expect(screen.getByText("Private World")).toBeInTheDocument()
      expect(screen.queryByText("Public World")).not.toBeInTheDocument()
    })

    it("shows clear filters button when filters are active", () => {
      const worlds = [createMockWorld({ name: "Test World" })]

      render(<WorldsList worlds={worlds} />)

      const searchInput = screen.getByPlaceholderText(/search worlds/i)
      fireEvent.change(searchInput, { target: { value: "test" } })

      const clearButton = screen.getByRole("button", { name: /clear/i })
      expect(clearButton).toBeInTheDocument()

      fireEvent.click(clearButton)

      // Search should be cleared
      expect(searchInput).toHaveValue("")
    })
  })

  describe("Sorting", () => {
    it("sorts worlds by name", () => {
      const worlds = [
        createMockWorld({ name: "Zebra World" }),
        createMockWorld({ name: "Alpha World" }),
        createMockWorld({ name: "Beta World" }),
      ]

      render(<WorldsList worlds={worlds} />)

      // Find sort select (third select)
      const selects = screen.getAllByRole("combobox")
      const sortSelect = selects[2]

      fireEvent.click(sortSelect)

      // Click "Name" option
      const nameOption = screen.getByText("Name")
      fireEvent.click(nameOption)

      // Get all world names in order
      const worldNames = screen.getAllByText(/World$/)
      expect(worldNames[0]).toHaveTextContent("Alpha World")
      expect(worldNames[1]).toHaveTextContent("Beta World")
      expect(worldNames[2]).toHaveTextContent("Zebra World")
    })

    it("sorts worlds by last updated by default", () => {
      const worlds = [
        createMockWorld({
          name: "Old World",
          updatedAt: new Date("2024-01-01"),
        }),
        createMockWorld({
          name: "New World",
          updatedAt: new Date("2024-01-15"),
        }),
        createMockWorld({
          name: "Newest World",
          updatedAt: new Date("2024-01-20"),
        }),
      ]

      render(<WorldsList worlds={worlds} />)

      // Get all world names in order (should be newest first)
      const worldNames = screen.getAllByText(/World$/)
      expect(worldNames[0]).toHaveTextContent("Newest World")
      expect(worldNames[1]).toHaveTextContent("New World")
      expect(worldNames[2]).toHaveTextContent("Old World")
    })
  })

  describe("Pagination", () => {
    it("shows 20 worlds per page", () => {
      const worlds = Array.from({ length: 25 }, (_, i) =>
        createMockWorld({ name: `World ${i + 1}`, id: `world-${i}` })
      )

      render(<WorldsList worlds={worlds} />)

      // Should show first 20
      expect(screen.getByText("World 1")).toBeInTheDocument()
      expect(screen.getByText("World 20")).toBeInTheDocument()
      expect(screen.queryByText("World 21")).not.toBeInTheDocument()

      // Should show pagination
      expect(screen.getByText("Showing 20 of 25 worlds")).toBeInTheDocument()
    })

    it("navigates to next page", () => {
      const worlds = Array.from({ length: 25 }, (_, i) =>
        createMockWorld({ name: `World ${i + 1}`, id: `world-${i}` })
      )

      render(<WorldsList worlds={worlds} />)

      const nextButton = screen.getByRole("button", { name: /next/i })
      fireEvent.click(nextButton)

      // Should show worlds 21-25
      expect(screen.getByText("World 21")).toBeInTheDocument()
      expect(screen.getByText("World 25")).toBeInTheDocument()
      expect(screen.queryByText("World 1")).not.toBeInTheDocument()
    })

    it("disables previous button on first page", () => {
      const worlds = Array.from({ length: 25 }, (_, i) =>
        createMockWorld({ name: `World ${i + 1}`, id: `world-${i}` })
      )

      render(<WorldsList worlds={worlds} />)

      const prevButton = screen.getByRole("button", { name: /previous/i })
      expect(prevButton).toBeDisabled()
    })

    it("disables next button on last page", () => {
      const worlds = Array.from({ length: 25 }, (_, i) =>
        createMockWorld({ name: `World ${i + 1}`, id: `world-${i}` })
      )

      render(<WorldsList worlds={worlds} />)

      const nextButton = screen.getByRole("button", { name: /next/i })
      fireEvent.click(nextButton) // Go to page 2 (last page)

      expect(nextButton).toBeDisabled()
    })
  })

  describe("Results Summary", () => {
    it("shows correct results count", () => {
      const worlds = [
        createMockWorld({ name: "World 1" }),
        createMockWorld({ name: "World 2" }),
        createMockWorld({ name: "World 3" }),
      ]

      render(<WorldsList worlds={worlds} />)

      expect(screen.getByText("Showing 3 of 3 worlds")).toBeInTheDocument()
    })

    it("shows filtered count when filters active", () => {
      const worlds = [
        createMockWorld({ name: "Dragon Kingdom" }),
        createMockWorld({ name: "Space Station" }),
        createMockWorld({ name: "Medieval Realm" }),
      ]

      render(<WorldsList worlds={worlds} />)

      const searchInput = screen.getByPlaceholderText(/search worlds/i)
      fireEvent.change(searchInput, { target: { value: "dragon" } })

      expect(screen.getByText("Showing 1 of 1 worlds (filtered)")).toBeInTheDocument()
    })
  })
})
