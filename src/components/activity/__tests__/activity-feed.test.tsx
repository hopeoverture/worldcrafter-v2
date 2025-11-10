import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { ActivityFeed, type ActivityWithUser } from "../activity-feed"

// Mock Next.js Link component
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

// Helper to create mock activity
function createMockActivity(
  overrides?: Partial<ActivityWithUser>
): ActivityWithUser {
  return {
    id: `activity-${Math.random()}`,
    worldId: "world-123",
    userId: "user-123",
    entityType: "WORLD",
    entityId: "world-123",
    action: "created",
    metadata: null,
    createdAt: new Date(),
    user: {
      name: "Test User",
      email: "test@example.com",
    },
    ...overrides,
  }
}

describe("ActivityFeed", () => {
  describe("Empty State", () => {
    it("shows empty state when no activities exist", () => {
      render(<ActivityFeed activities={[]} worldId="world-123" />)

      expect(screen.getByText("Recent Activity")).toBeInTheDocument()
      expect(
        screen.getByText(/No activity yet. Start creating locations/i)
      ).toBeInTheDocument()
    })
  })

  describe("Activity Display", () => {
    it("displays activity count in description", () => {
      const activities = [
        createMockActivity(),
        createMockActivity(),
        createMockActivity(),
      ]

      render(<ActivityFeed activities={activities} worldId="world-123" />)

      expect(screen.getByText("3 recent changes")).toBeInTheDocument()
    })

    it("uses singular form for single activity", () => {
      const activities = [createMockActivity()]

      render(<ActivityFeed activities={activities} worldId="world-123" />)

      expect(screen.getByText("1 recent change")).toBeInTheDocument()
    })

    it("displays activity action and entity type", () => {
      const activities = [
        createMockActivity({
          action: "created",
          entityType: "LOCATION",
        }),
      ]

      render(<ActivityFeed activities={activities} worldId="world-123" />)

      expect(screen.getByText("Created location")).toBeInTheDocument()
    })

    it("displays user name", () => {
      const activities = [
        createMockActivity({
          user: {
            name: "John Doe",
            email: "john@example.com",
          },
        }),
      ]

      render(<ActivityFeed activities={activities} worldId="world-123" />)

      expect(screen.getByText("by John Doe")).toBeInTheDocument()
    })

    it("displays user email when name is not provided", () => {
      const activities = [
        createMockActivity({
          user: {
            name: null,
            email: "john@example.com",
          },
        }),
      ]

      render(<ActivityFeed activities={activities} worldId="world-123" />)

      expect(screen.getByText("by john@example.com")).toBeInTheDocument()
    })
  })

  describe("Activity Metadata", () => {
    it("displays metadata when provided", () => {
      const activities = [
        createMockActivity({
          metadata: {
            field1: "value1",
            field2: "value2",
          },
        }),
      ]

      render(<ActivityFeed activities={activities} worldId="world-123" />)

      expect(screen.getByText(/field1:/)).toBeInTheDocument()
      expect(screen.getByText(/value1/)).toBeInTheDocument()
      expect(screen.getByText(/field2:/)).toBeInTheDocument()
      expect(screen.getByText(/value2/)).toBeInTheDocument()
    })

    it("does not render metadata section when metadata is null", () => {
      const activities = [
        createMockActivity({
          metadata: null,
        }),
      ]

      render(<ActivityFeed activities={activities} worldId="world-123" />)

      // Should not show any metadata-related content
      const activityCard = screen.getByText("Created world").closest("div")
      expect(activityCard).not.toHaveTextContent("field:")
    })
  })

  describe("Time Formatting", () => {
    it("shows 'Just now' for activities less than 1 minute old", () => {
      const activities = [
        createMockActivity({
          createdAt: new Date(Date.now() - 30000), // 30 seconds ago
        }),
      ]

      render(<ActivityFeed activities={activities} worldId="world-123" />)

      expect(screen.getByText("Just now")).toBeInTheDocument()
    })

    it("shows minutes for activities less than 1 hour old", () => {
      const activities = [
        createMockActivity({
          createdAt: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
        }),
      ]

      render(<ActivityFeed activities={activities} worldId="world-123" />)

      expect(screen.getByText("15m ago")).toBeInTheDocument()
    })

    it("shows hours for activities less than 24 hours old", () => {
      const activities = [
        createMockActivity({
          createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
        }),
      ]

      render(<ActivityFeed activities={activities} worldId="world-123" />)

      expect(screen.getByText("3h ago")).toBeInTheDocument()
    })

    it("shows days for activities less than 7 days old", () => {
      const activities = [
        createMockActivity({
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        }),
      ]

      render(<ActivityFeed activities={activities} worldId="world-123" />)

      expect(screen.getByText("3d ago")).toBeInTheDocument()
    })

    it("shows date for activities older than 7 days", () => {
      const activities = [
        createMockActivity({
          createdAt: new Date("2024-01-15"),
        }),
      ]

      render(<ActivityFeed activities={activities} worldId="world-123" />)

      // Date format varies by current year - could include year and different day
      expect(screen.getByText(/Jan/i)).toBeInTheDocument()
      expect(screen.getByText(/2024/)).toBeInTheDocument()
    })
  })

  describe("Pagination", () => {
    it("shows only first 5 activities initially", () => {
      const activities = Array.from({ length: 10 }, (_, i) =>
        createMockActivity({
          id: `activity-${i}`,
          action: "updated",
        })
      )

      render(<ActivityFeed activities={activities} worldId="world-123" />)

      // Should show 5 activities - count "Updated world" text
      const activityCards = screen.getAllByText("Updated world")
      expect(activityCards.length).toBe(5)
    })

    it("shows 'Show All' button when more than 5 activities", () => {
      const activities = Array.from({ length: 10 }, (_, i) =>
        createMockActivity({ id: `activity-${i}` })
      )

      render(<ActivityFeed activities={activities} worldId="world-123" />)

      expect(screen.getByText("Show All (10)")).toBeInTheDocument()
    })

    it("does not show 'Show All' button when 5 or fewer activities", () => {
      const activities = Array.from({ length: 3 }, (_, i) =>
        createMockActivity({ id: `activity-${i}` })
      )

      render(<ActivityFeed activities={activities} worldId="world-123" />)

      expect(screen.queryByText(/Show All/)).not.toBeInTheDocument()
    })

    it("expands to show all activities when 'Show All' is clicked", () => {
      const activities = Array.from({ length: 10 }, (_, i) =>
        createMockActivity({
          id: `activity-${i}`,
          action: "updated",
        })
      )

      render(<ActivityFeed activities={activities} worldId="world-123" />)

      const showAllButton = screen.getByText("Show All (10)")
      fireEvent.click(showAllButton)

      // Should now show all 10 activities
      const activityCards = screen.getAllByText("Updated world")
      expect(activityCards.length).toBe(10)

      // Should show 'Show Less' button
      expect(screen.getByText("Show Less")).toBeInTheDocument()
    })

    it("collapses back to 5 activities when 'Show Less' is clicked", () => {
      const activities = Array.from({ length: 10 }, (_, i) =>
        createMockActivity({
          id: `activity-${i}`,
          action: "updated",
        })
      )

      render(<ActivityFeed activities={activities} worldId="world-123" />)

      // Expand
      const showAllButton = screen.getByText("Show All (10)")
      fireEvent.click(showAllButton)

      // Collapse
      const showLessButton = screen.getByText("Show Less")
      fireEvent.click(showLessButton)

      // Should show only 5 activities again
      const activityCards = screen.getAllByText("Updated world")
      expect(activityCards.length).toBe(5)
    })
  })

  describe("Entity Types and Actions", () => {
    it("displays different entity types correctly", () => {
      const activities = [
        createMockActivity({ entityType: "WORLD", action: "created" }),
        createMockActivity({ entityType: "LOCATION", action: "created" }),
      ]

      render(<ActivityFeed activities={activities} worldId="world-123" />)

      expect(screen.getByText("Created world")).toBeInTheDocument()
      expect(screen.getByText("Created location")).toBeInTheDocument()
    })

    it("displays different actions correctly", () => {
      const activities = [
        createMockActivity({ action: "created" }),
        createMockActivity({ action: "updated" }),
        createMockActivity({ action: "deleted" }),
      ]

      render(<ActivityFeed activities={activities} worldId="world-123" />)

      expect(screen.getByText("Created world")).toBeInTheDocument()
      expect(screen.getByText("Updated world")).toBeInTheDocument()
      expect(screen.getByText("Deleted world")).toBeInTheDocument()
    })

    it("handles unknown action types gracefully", () => {
      const activities = [
        createMockActivity({ action: "archived" as any }),
      ]

      render(<ActivityFeed activities={activities} worldId="world-123" />)

      expect(screen.getByText("archived world")).toBeInTheDocument()
    })
  })
})
