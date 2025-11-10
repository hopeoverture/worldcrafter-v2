import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { LocationForm } from "../location-form"
import type { Location } from "@prisma/client"

// Mock Next.js router
const mockPush = vi.fn()
const mockBack = vi.fn()
const mockRefresh = vi.fn()

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
    refresh: mockRefresh,
  }),
}))

// Mock createLocationFormSchema to use createLocationSchema for testing
vi.mock("@/lib/schemas/location.schema", async () => {
  const actual = await vi.importActual("@/lib/schemas/location.schema")
  return {
    ...actual,
    createLocationFormSchema: (actual as any).createLocationSchema,
  }
})

// Mock Server Actions
vi.mock("@/app/worlds/[slug]/locations/actions", () => ({
  createLocation: vi.fn(),
  updateLocation: vi.fn(),
}))

// Mock LocationParentSelector component
vi.mock("@/components/forms/location-parent-selector", () => ({
  LocationParentSelector: ({
    value,
    onChange,
    disabled,
  }: {
    value?: string | null
    onChange: (value: string | null) => void
    disabled?: boolean
  }) => (
    <div data-testid="parent-selector">
      <button
        type="button"
        onClick={() => onChange("parent-123")}
        disabled={disabled}
      >
        Select Parent
      </button>
      <button
        type="button"
        onClick={() => onChange(null)}
        disabled={disabled}
      >
        Clear Parent
      </button>
      {value && <span>Selected: {value}</span>}
    </div>
  ),
}))

// Mock MDEditor (dynamic import with SSR disabled)
vi.mock("@uiw/react-md-editor", () => ({
  default: ({
    value,
    onChange,
  }: {
    value?: string
    onChange: (value?: string) => void
  }) => (
    <textarea
      data-testid="markdown-editor"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}))

describe("LocationForm", () => {
  const mockWorldId = "world-123"
  const mockWorldSlug = "test-world"

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("Create Mode", () => {
    it("renders create form with all fields", () => {
      render(
        <LocationForm
          worldId={mockWorldId}
          worldSlug={mockWorldSlug}
          mode="create"
        />
      )

      expect(screen.getByLabelText(/location name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/type/i)).toBeInTheDocument()
      expect(screen.getByTestId("parent-selector")).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /create location/i })).toBeInTheDocument()
    })

    it("shows all tabs (basics, details, attributes, advanced)", () => {
      render(
        <LocationForm
          worldId={mockWorldId}
          worldSlug={mockWorldSlug}
          mode="create"
        />
      )

      expect(screen.getByRole("tab", { name: /basics/i })).toBeInTheDocument()
      expect(screen.getByRole("tab", { name: /details/i })).toBeInTheDocument()
      expect(screen.getByRole("tab", { name: /attributes/i })).toBeInTheDocument()
      expect(screen.getByRole("tab", { name: /advanced/i })).toBeInTheDocument()
    })

    it("validates required fields", async () => {
      const user = userEvent.setup()
      render(
        <LocationForm
          worldId={mockWorldId}
          worldSlug={mockWorldSlug}
          mode="create"
        />
      )

      const submitButton = screen.getByRole("button", { name: /create location/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/location name is required/i)).toBeInTheDocument()
      })
    })

    it("submits form with valid data", async () => {
      const user = userEvent.setup()
      const { createLocation } = await import("@/app/worlds/[slug]/locations/actions")

      vi.mocked(createLocation).mockResolvedValue({
        success: true,
        data: {
          id: "loc-123",
          slug: "test-location",
          name: "Test Location",
          worldId: mockWorldId,
          type: "City",
          parentId: null,
          description: null,
          geography: null,
          climate: null,
          population: null,
          government: null,
          economy: null,
          culture: null,
          coordinates: null,
          attributes: null,
          imageUrl: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      })

      render(
        <LocationForm
          worldId={mockWorldId}
          worldSlug={mockWorldSlug}
          mode="create"
        />
      )

      const nameInput = screen.getByLabelText(/location name/i)
      await user.type(nameInput, "Test Location")

      const submitButton = screen.getByRole("button", { name: /create location/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(createLocation).toHaveBeenCalledWith(
          expect.objectContaining({
            name: "Test Location",
            worldId: mockWorldId,
          })
        )
        expect(mockPush).toHaveBeenCalledWith(`/worlds/${mockWorldSlug}/locations/test-location`)
        expect(mockRefresh).toHaveBeenCalled()
      })
    })

    it("shows error message on submission failure", async () => {
      const user = userEvent.setup()
      const { createLocation } = await import("@/app/worlds/[slug]/locations/actions")

      vi.mocked(createLocation).mockResolvedValue({
        success: false,
        error: "Failed to create location",
      })

      render(
        <LocationForm
          worldId={mockWorldId}
          worldSlug={mockWorldSlug}
          mode="create"
        />
      )

      const nameInput = screen.getByLabelText(/location name/i)
      await user.type(nameInput, "Test Location")

      const submitButton = screen.getByRole("button", { name: /create location/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/failed to create location/i)).toBeInTheDocument()
      })
    })

    it("allows selecting parent location", async () => {
      const user = userEvent.setup()
      render(
        <LocationForm
          worldId={mockWorldId}
          worldSlug={mockWorldSlug}
          mode="create"
        />
      )

      const selectButton = screen.getByRole("button", { name: /select parent/i })
      await user.click(selectButton)

      await waitFor(() => {
        expect(screen.getByText(/selected: parent-123/i)).toBeInTheDocument()
      })
    })
  })

  describe("Edit Mode", () => {
    const mockLocation: Location = {
      id: "loc-123",
      worldId: mockWorldId,
      name: "Existing Location",
      slug: "existing-location",
      type: "City",
      parentId: null,
      description: "Test description",
      geography: "Mountainous terrain",
      climate: "Temperate",
      population: "50,000",
      government: "Democracy",
      economy: "Trade-based",
      culture: "Diverse",
      coordinates: { x: 100, y: 200 },
      attributes: { customField: "value" },
      imageUrl: "https://example.com/image.jpg",
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    it("renders edit form with existing data", () => {
      render(
        <LocationForm
          worldId={mockWorldId}
          worldSlug={mockWorldSlug}
          location={mockLocation}
          mode="edit"
        />
      )

      const nameInput = screen.getByLabelText(/location name/i) as HTMLInputElement
      expect(nameInput.value).toBe("Existing Location")
      expect(screen.getByRole("button", { name: /update location/i })).toBeInTheDocument()
    })

    it("submits updated data", async () => {
      const user = userEvent.setup()
      const { updateLocation } = await import("@/app/worlds/[slug]/locations/actions")

      vi.mocked(updateLocation).mockResolvedValue({
        success: true,
        data: {
          ...mockLocation,
          name: "Updated Location",
        },
      })

      render(
        <LocationForm
          worldId={mockWorldId}
          worldSlug={mockWorldSlug}
          location={mockLocation}
          mode="edit"
        />
      )

      const nameInput = screen.getByLabelText(/location name/i)
      await user.clear(nameInput)
      await user.type(nameInput, "Updated Location")

      const submitButton = screen.getByRole("button", { name: /update location/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(updateLocation).toHaveBeenCalledWith(
          mockLocation.id,
          expect.objectContaining({
            name: "Updated Location",
          })
        )
      })
    })
  })

  describe("Field Tabs", () => {
    it("shows details tab fields", async () => {
      const user = userEvent.setup()
      render(
        <LocationForm
          worldId={mockWorldId}
          worldSlug={mockWorldSlug}
          mode="create"
        />
      )

      const detailsTab = screen.getByRole("tab", { name: /details/i })
      await user.click(detailsTab)

      expect(screen.getByLabelText(/geography/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/climate/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/population/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/culture/i)).toBeInTheDocument()
    })

    it("shows attributes tab fields", async () => {
      const user = userEvent.setup()
      render(
        <LocationForm
          worldId={mockWorldId}
          worldSlug={mockWorldSlug}
          mode="create"
        />
      )

      const attributesTab = screen.getByRole("tab", { name: /attributes/i })
      await user.click(attributesTab)

      expect(screen.getByLabelText(/government/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/economy/i)).toBeInTheDocument()
    })

    it("shows advanced tab fields", async () => {
      const user = userEvent.setup()
      render(
        <LocationForm
          worldId={mockWorldId}
          worldSlug={mockWorldSlug}
          mode="create"
        />
      )

      const advancedTab = screen.getByRole("tab", { name: /advanced/i })
      await user.click(advancedTab)

      expect(screen.getByLabelText(/x coordinate/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/y coordinate/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/image url/i)).toBeInTheDocument()
    })
  })

  describe("Cancel Button", () => {
    it("calls router.back() when cancel is clicked", async () => {
      const user = userEvent.setup()
      render(
        <LocationForm
          worldId={mockWorldId}
          worldSlug={mockWorldSlug}
          mode="create"
        />
      )

      const cancelButton = screen.getByRole("button", { name: /cancel/i })
      await user.click(cancelButton)

      expect(mockBack).toHaveBeenCalled()
    })
  })

  describe("Disabled States", () => {
    it("disables all inputs while submitting", async () => {
      const user = userEvent.setup()
      const { createLocation } = await import("@/app/worlds/[slug]/locations/actions")

      // Make createLocation hang to keep form in submitting state
      vi.mocked(createLocation).mockImplementation(
        () => new Promise(() => {})
      )

      render(
        <LocationForm
          worldId={mockWorldId}
          worldSlug={mockWorldSlug}
          mode="create"
        />
      )

      const nameInput = screen.getByLabelText(/location name/i)
      await user.type(nameInput, "Test Location")

      const submitButton = screen.getByRole("button", { name: /create location/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(nameInput).toBeDisabled()
        expect(submitButton).toBeDisabled()
        expect(screen.getByRole("button", { name: /cancel/i })).toBeDisabled()
      })
    })
  })
})
