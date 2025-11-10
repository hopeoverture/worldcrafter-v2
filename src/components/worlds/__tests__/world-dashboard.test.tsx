import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { WorldDashboard } from "../world-dashboard"
import { type World } from "@prisma/client"
import { type ActivityWithUser } from "@/components/activity/activity-feed"

// Mock Next.js Link component
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

// Mock ReactMarkdown
vi.mock("react-markdown", () => ({
  default: ({ children }: { children: string }) => <div>{children}</div>,
}))

// Helper to create mock world
function createMockWorld(overrides?: Partial<World>): World {
  return {
    id: "world-123",
    userId: "user-123",
    name: "Test World",
    slug: "test-world",
    genre: "FANTASY",
    description: "A test world description",
    setting: "A fantasy realm",
    metadata: null,
    coverUrl: null,
    privacy: "PRIVATE",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-15"),
    ...overrides,
  }
}

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

describe("WorldDashboard", () => {
  it("renders world statistics", () => {
    const world = createMockWorld()
    const activities = [createMockActivity()]
    const locationCount = 5

    render(
      <WorldDashboard
        world={world}
        activities={activities}
        locationCount={locationCount}
      />
    )

    // Check location count
    expect(screen.getByText("5")).toBeInTheDocument()
    expect(screen.getByText("5 locations")).toBeInTheDocument()

    // Check activity count
    expect(screen.getByText("1")).toBeInTheDocument()
    expect(screen.getByText("Recent changes")).toBeInTheDocument()

    // Check dates - format varies by locale and current date
    expect(screen.getByText(/Jan|January/i)).toBeInTheDocument()
    // Look for "Created" text with date in the Last Updated card
    expect(screen.getByText(/Created \d/)).toBeInTheDocument()
  })

  it("shows zero locations when none exist", () => {
    const world = createMockWorld()
    const activities: ActivityWithUser[] = []
    const locationCount = 0

    render(
      <WorldDashboard
        world={world}
        activities={activities}
        locationCount={locationCount}
      />
    )

    // Check for locations-related text
    expect(screen.getByText("Locations")).toBeInTheDocument()
    expect(screen.getByText("No locations yet")).toBeInTheDocument()
  })

  it("renders world description when provided", () => {
    const world = createMockWorld({
      description: "This is a detailed description of the world",
    })
    const activities: ActivityWithUser[] = []

    render(
      <WorldDashboard world={world} activities={activities} locationCount={0} />
    )

    expect(
      screen.getByText("This is a detailed description of the world")
    ).toBeInTheDocument()
  })

  it("does not render description section when description is null", () => {
    const world = createMockWorld({ description: null })
    const activities: ActivityWithUser[] = []

    render(
      <WorldDashboard world={world} activities={activities} locationCount={0} />
    )

    expect(screen.queryByText("Description")).not.toBeInTheDocument()
  })

  it("displays genre badge", () => {
    const world = createMockWorld({ genre: "SCIFI" })
    const activities: ActivityWithUser[] = []

    render(
      <WorldDashboard world={world} activities={activities} locationCount={0} />
    )

    expect(screen.getByText("Sci-Fi")).toBeInTheDocument()
  })

  it("displays privacy badge with correct icon", () => {
    const world = createMockWorld({ privacy: "PUBLIC" })
    const activities: ActivityWithUser[] = []

    render(
      <WorldDashboard world={world} activities={activities} locationCount={0} />
    )

    expect(screen.getByText("Public")).toBeInTheDocument()
  })

  it("renders custom metadata when provided", () => {
    const world = createMockWorld({
      metadata: {
        customField: "Custom Value",
        anotherField: "Another Value",
      },
    })
    const activities: ActivityWithUser[] = []

    render(
      <WorldDashboard world={world} activities={activities} locationCount={0} />
    )

    expect(screen.getByText("Custom Metadata")).toBeInTheDocument()
    expect(screen.getByText("Custom Value")).toBeInTheDocument()
    expect(screen.getByText("Another Value")).toBeInTheDocument()
  })

  it("does not render metadata section when metadata is null", () => {
    const world = createMockWorld({ metadata: null })
    const activities: ActivityWithUser[] = []

    render(
      <WorldDashboard world={world} activities={activities} locationCount={0} />
    )

    expect(screen.queryByText("Custom Metadata")).not.toBeInTheDocument()
  })

  it("passes activities to ActivityFeed component", () => {
    const world = createMockWorld()
    const activities = [
      createMockActivity({ action: "created" }),
      createMockActivity({ action: "updated" }),
    ]

    render(
      <WorldDashboard
        world={world}
        activities={activities}
        locationCount={0}
      />
    )

    // ActivityFeed should be rendered
    expect(screen.getByText("Recent Activity")).toBeInTheDocument()
  })

  it("handles multiple genres correctly", () => {
    const genres: Array<World["genre"]> = [
      "FANTASY",
      "SCIFI",
      "MODERN",
      "HISTORICAL",
      "HORROR",
      "CUSTOM",
    ]
    const expectedLabels = [
      "Fantasy",
      "Sci-Fi",
      "Modern",
      "Historical",
      "Horror",
      "Custom",
    ]

    genres.forEach((genre, index) => {
      const world = createMockWorld({ genre })
      const { unmount } = render(
        <WorldDashboard world={world} activities={[]} locationCount={0} />
      )

      expect(screen.getByText(expectedLabels[index])).toBeInTheDocument()

      unmount()
    })
  })

  it("handles multiple privacy levels correctly", () => {
    const privacyLevels: Array<World["privacy"]> = [
      "PRIVATE",
      "UNLISTED",
      "PUBLIC",
    ]
    const expectedLabels = ["Private", "Unlisted", "Public"]

    privacyLevels.forEach((privacy, index) => {
      const world = createMockWorld({ privacy })
      const { unmount } = render(
        <WorldDashboard world={world} activities={[]} locationCount={0} />
      )

      expect(screen.getByText(expectedLabels[index])).toBeInTheDocument()

      unmount()
    })
  })
})
