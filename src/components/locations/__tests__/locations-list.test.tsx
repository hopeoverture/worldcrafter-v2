import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { LocationsList } from "../locations-list"

// Mock Next.js router
const mockPush = vi.fn()
const mockRefresh = vi.fn()

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}))

// Mock Server Actions
vi.mock("@/app/worlds/[slug]/locations/actions", () => ({
  deleteLocation: vi.fn(),
}))

// Mock Sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

describe("LocationsList", () => {
  const mockWorldSlug = "test-world"

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("Empty State", () => {
    it("renders empty state when no locations", () => {
      render(<LocationsList locations={[]} worldSlug={mockWorldSlug} />)

      expect(screen.getByText(/no locations yet/i)).toBeInTheDocument()
      expect(screen.getByText(/create first location/i)).toBeInTheDocument()
    })

    it("shows create location link in empty state", () => {
      render(<LocationsList locations={[]} worldSlug={mockWorldSlug} />)

      const createLink = screen.getByRole("link", { name: /create first location/i })
      expect(createLink).toHaveAttribute("href", `/worlds/${mockWorldSlug}/locations/new`)
    })
  })

  describe("With Locations", () => {
    const mockLocations = [
      {
        id: "1",
        name: "Waterdeep",
        slug: "waterdeep",
        type: "City",
        parentId: null,
        parent: null,
      },
      {
        id: "2",
        name: "Undermountain",
        slug: "undermountain",
        type: "Dungeon",
        parentId: "1",
        parent: {
          id: "1",
          name: "Waterdeep",
          slug: "waterdeep",
        },
      },
      {
        id: "3",
        name: "Baldur's Gate",
        slug: "baldurs-gate",
        type: "City",
        parentId: null,
        parent: null,
      },
    ]

    it("renders location count", () => {
      render(<LocationsList locations={mockLocations} worldSlug={mockWorldSlug} />)

      expect(screen.getByText(/3 of 3 locations/i)).toBeInTheDocument()
    })

    it("renders add location button", () => {
      render(<LocationsList locations={mockLocations} worldSlug={mockWorldSlug} />)

      const addButton = screen.getByRole("link", { name: /add location/i })
      expect(addButton).toHaveAttribute("href", `/worlds/${mockWorldSlug}/locations/new`)
    })

    it("renders view mode toggle buttons", () => {
      render(<LocationsList locations={mockLocations} worldSlug={mockWorldSlug} />)

      expect(screen.getByRole("button", { name: /tree view/i })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /table view/i })).toBeInTheDocument()
    })

    it("renders filter dropdown", () => {
      render(<LocationsList locations={mockLocations} worldSlug={mockWorldSlug} />)

      expect(screen.getByText(/filter by type/i)).toBeInTheDocument()
    })
  })

  describe("Tree View", () => {
    const mockLocations = [
      {
        id: "1",
        name: "Waterdeep",
        slug: "waterdeep",
        type: "City",
        parentId: null,
        parent: null,
      },
      {
        id: "2",
        name: "Undermountain",
        slug: "undermountain",
        type: "Dungeon",
        parentId: "1",
        parent: {
          id: "1",
          name: "Waterdeep",
          slug: "waterdeep",
        },
      },
    ]

    it("renders tree view by default", () => {
      render(<LocationsList locations={mockLocations} worldSlug={mockWorldSlug} />)

      // Tree view should show locations
      expect(screen.getByText("Waterdeep")).toBeInTheDocument()
      expect(screen.getByText("Undermountain")).toBeInTheDocument()
    })

    it("shows location type badges in tree view", () => {
      render(<LocationsList locations={mockLocations} worldSlug={mockWorldSlug} />)

      expect(screen.getByText("City")).toBeInTheDocument()
      expect(screen.getByText("Dungeon")).toBeInTheDocument()
    })

    it("shows hierarchical structure in tree view", () => {
      render(<LocationsList locations={mockLocations} worldSlug={mockWorldSlug} />)

      // Both locations should be visible
      expect(screen.getByText("Waterdeep")).toBeInTheDocument()
      expect(screen.getByText("Undermountain")).toBeInTheDocument()
    })
  })

  describe("Table View", () => {
    const mockLocations = [
      {
        id: "1",
        name: "Waterdeep",
        slug: "waterdeep",
        type: "City",
        parentId: null,
        parent: null,
      },
      {
        id: "2",
        name: "Undermountain",
        slug: "undermountain",
        type: "Dungeon",
        parentId: "1",
        parent: {
          id: "1",
          name: "Waterdeep",
          slug: "waterdeep",
        },
      },
    ]

    it("switches to table view when button clicked", async () => {
      const user = userEvent.setup()
      render(<LocationsList locations={mockLocations} worldSlug={mockWorldSlug} />)

      const tableViewButton = screen.getByRole("button", { name: /table view/i })
      await user.click(tableViewButton)

      // Should show table headers
      expect(screen.getByRole("columnheader", { name: /name/i })).toBeInTheDocument()
      expect(screen.getByRole("columnheader", { name: /type/i })).toBeInTheDocument()
      expect(screen.getByRole("columnheader", { name: /parent/i })).toBeInTheDocument()
      expect(screen.getByRole("columnheader", { name: /actions/i })).toBeInTheDocument()
    })

    it("shows parent location in table view", async () => {
      const user = userEvent.setup()
      render(<LocationsList locations={mockLocations} worldSlug={mockWorldSlug} />)

      const tableViewButton = screen.getByRole("button", { name: /table view/i })
      await user.click(tableViewButton)

      // Undermountain row should show Waterdeep as parent
      const rows = screen.getAllByRole("row")
      // Find the row containing "Undermountain"
      const undermountainRow = rows.find(row => row.textContent?.includes("Undermountain"))
      expect(undermountainRow).toBeDefined()
    })

    it("shows 'None' for locations without parent", async () => {
      const user = userEvent.setup()
      render(<LocationsList locations={mockLocations} worldSlug={mockWorldSlug} />)

      const tableViewButton = screen.getByRole("button", { name: /table view/i })
      await user.click(tableViewButton)

      // Waterdeep should have "None" as parent
      expect(screen.getByText("None")).toBeInTheDocument()
    })
  })

  describe("Filtering", () => {
    const mockLocations = [
      {
        id: "1",
        name: "Waterdeep",
        slug: "waterdeep",
        type: "City",
        parentId: null,
        parent: null,
      },
      {
        id: "2",
        name: "Undermountain",
        slug: "undermountain",
        type: "Dungeon",
        parentId: null,
        parent: null,
      },
      {
        id: "3",
        name: "Baldur's Gate",
        slug: "baldurs-gate",
        type: "City",
        parentId: null,
        parent: null,
      },
    ]

    it("shows filter dropdown", () => {
      render(<LocationsList locations={mockLocations} worldSlug={mockWorldSlug} />)

      // Should show filter label and combobox
      expect(screen.getByText(/filter by type/i)).toBeInTheDocument()
      expect(screen.getByRole("combobox")).toBeInTheDocument()
    })

    it("displays all locations initially", () => {
      render(<LocationsList locations={mockLocations} worldSlug={mockWorldSlug} />)

      // All locations should be visible
      expect(screen.getByText("Waterdeep")).toBeInTheDocument()
      expect(screen.getByText("Undermountain")).toBeInTheDocument()
      expect(screen.getByText("Baldur's Gate")).toBeInTheDocument()
    })

    it("shows location type badges", () => {
      render(<LocationsList locations={mockLocations} worldSlug={mockWorldSlug} />)

      // Should show type badges (there are 2 City badges and 1 Dungeon badge)
      const cityBadges = screen.getAllByText("City")
      expect(cityBadges).toHaveLength(2) // Waterdeep and Baldur's Gate
      expect(screen.getByText("Dungeon")).toBeInTheDocument()
    })

    it("renders correct location count", () => {
      render(<LocationsList locations={mockLocations} worldSlug={mockWorldSlug} />)

      expect(screen.getByText(/3 of 3 locations/i)).toBeInTheDocument()
    })
  })

  describe("Delete Functionality", () => {
    const mockLocations = [
      {
        id: "1",
        name: "Waterdeep",
        slug: "waterdeep",
        type: "City",
        parentId: null,
        parent: null,
      },
    ]

    it("shows delete confirmation dialog", async () => {
      const user = userEvent.setup()
      render(<LocationsList locations={mockLocations} worldSlug={mockWorldSlug} />)

      // Switch to table view for easier access to delete button
      const tableViewButton = screen.getByRole("button", { name: /table view/i })
      await user.click(tableViewButton)

      // Click delete button
      const deleteButtons = screen.getAllByRole("button", { name: /delete/i })
      await user.click(deleteButtons[0])

      // Should show confirmation dialog
      await waitFor(() => {
        expect(screen.getByRole("alertdialog")).toBeInTheDocument()
        expect(screen.getByText(/are you sure you want to delete/i)).toBeInTheDocument()
      })
    })

    it("calls deleteLocation when confirmed", async () => {
      const user = userEvent.setup()
      const { deleteLocation } = await import("@/app/worlds/[slug]/locations/actions")
      const { toast } = await import("sonner")

      vi.mocked(deleteLocation).mockResolvedValue({ success: true })

      render(<LocationsList locations={mockLocations} worldSlug={mockWorldSlug} />)

      // Switch to table view
      const tableViewButton = screen.getByRole("button", { name: /table view/i })
      await user.click(tableViewButton)

      // Click delete button
      const deleteButtons = screen.getAllByRole("button", { name: /delete/i })
      await user.click(deleteButtons[0])

      // Confirm deletion
      await waitFor(() => {
        const confirmButton = screen.getByRole("button", { name: /delete/i, hidden: false })
        // Find the confirm button in the dialog (not the trigger button)
        const dialogButtons = screen.getAllByRole("button", { name: /delete/i })
        const confirmBtn = dialogButtons.find(btn =>
          btn.className.includes("destructive")
        )
        return user.click(confirmBtn!)
      })

      await waitFor(() => {
        expect(deleteLocation).toHaveBeenCalledWith("1")
        expect(toast.success).toHaveBeenCalledWith("Location deleted successfully")
        expect(mockRefresh).toHaveBeenCalled()
      })
    })

    it("shows error toast when delete fails", async () => {
      const user = userEvent.setup()
      const { deleteLocation } = await import("@/app/worlds/[slug]/locations/actions")
      const { toast } = await import("sonner")

      vi.mocked(deleteLocation).mockResolvedValue({
        success: false,
        error: "Failed to delete location",
      })

      render(<LocationsList locations={mockLocations} worldSlug={mockWorldSlug} />)

      // Switch to table view
      const tableViewButton = screen.getByRole("button", { name: /table view/i })
      await user.click(tableViewButton)

      // Click delete and confirm
      const deleteButtons = screen.getAllByRole("button", { name: /delete/i })
      await user.click(deleteButtons[0])

      await waitFor(() => {
        const dialogButtons = screen.getAllByRole("button", { name: /delete/i })
        const confirmBtn = dialogButtons.find(btn =>
          btn.className.includes("destructive")
        )
        return user.click(confirmBtn!)
      })

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Failed to delete location")
      })
    })
  })

  describe("Quick Actions", () => {
    const mockLocations = [
      {
        id: "1",
        name: "Waterdeep",
        slug: "waterdeep",
        type: "City",
        parentId: null,
        parent: null,
      },
    ]

    it("shows view, edit, and delete buttons in table view", async () => {
      const user = userEvent.setup()
      render(<LocationsList locations={mockLocations} worldSlug={mockWorldSlug} />)

      const tableViewButton = screen.getByRole("button", { name: /table view/i })
      await user.click(tableViewButton)

      // Should have view, edit, and delete buttons
      const viewLinks = screen.getAllByRole("link", { name: /view/i })
      const editLinks = screen.getAllByRole("link", { name: /edit/i })
      const deleteButtons = screen.getAllByRole("button", { name: /delete/i })

      expect(viewLinks.length).toBeGreaterThan(0)
      expect(editLinks.length).toBeGreaterThan(0)
      expect(deleteButtons.length).toBeGreaterThan(0)
    })

    it("view button links to location detail page", async () => {
      const user = userEvent.setup()
      render(<LocationsList locations={mockLocations} worldSlug={mockWorldSlug} />)

      const tableViewButton = screen.getByRole("button", { name: /table view/i })
      await user.click(tableViewButton)

      const viewLink = screen.getAllByRole("link", { name: /view/i })[0]
      expect(viewLink).toHaveAttribute("href", `/worlds/${mockWorldSlug}/locations/waterdeep`)
    })

    it("edit button links to location edit page", async () => {
      const user = userEvent.setup()
      render(<LocationsList locations={mockLocations} worldSlug={mockWorldSlug} />)

      const tableViewButton = screen.getByRole("button", { name: /table view/i })
      await user.click(tableViewButton)

      const editLink = screen.getAllByRole("link", { name: /edit/i })[0]
      expect(editLink).toHaveAttribute("href", `/worlds/${mockWorldSlug}/locations/waterdeep/edit`)
    })
  })
})
