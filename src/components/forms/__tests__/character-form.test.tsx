import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CharacterForm } from "../character-form";
import type { Character } from "@prisma/client";

// Mock Next.js router
const mockPush = vi.fn();
const mockBack = vi.fn();
const mockRefresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
    refresh: mockRefresh,
  }),
}));

// Mock Server Actions
vi.mock("@/app/worlds/[slug]/characters/actions", () => ({
  createCharacter: vi.fn(),
  updateCharacter: vi.fn(),
}));

// Mock MDEditor (dynamic import with SSR disabled)
vi.mock("@uiw/react-md-editor", () => ({
  default: ({
    value,
    onChange,
  }: {
    value?: string;
    onChange: (value?: string) => void;
  }) => (
    <textarea
      data-testid="markdown-editor"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

// Mock Next.js Image component
vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    <img src={src} alt={alt} data-testid="image-preview" />
  ),
}));

describe("CharacterForm", () => {
  const mockWorldId = "world-123";
  const mockWorldSlug = "test-world";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Create Mode", () => {
    it("renders create form with all fields", () => {
      render(
        <CharacterForm
          worldId={mockWorldId}
          worldSlug={mockWorldSlug}
          mode="create"
        />
      );

      expect(screen.getByLabelText(/character name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/role/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/species/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/age/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/gender/i)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /create character/i })
      ).toBeInTheDocument();
    });

    it("shows all tabs (basics, appearance, personality, backstory, advanced)", () => {
      render(
        <CharacterForm
          worldId={mockWorldId}
          worldSlug={mockWorldSlug}
          mode="create"
        />
      );

      expect(screen.getByRole("tab", { name: /basics/i })).toBeInTheDocument();
      expect(
        screen.getByRole("tab", { name: /appearance/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("tab", { name: /personality/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("tab", { name: /backstory/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("tab", { name: /advanced/i })
      ).toBeInTheDocument();
    });

    it("validates required name field", async () => {
      const user = userEvent.setup();
      render(
        <CharacterForm
          worldId={mockWorldId}
          worldSlug={mockWorldSlug}
          mode="create"
        />
      );

      const submitButton = screen.getByRole("button", {
        name: /create character/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      });
    });

    it("validates name max length (100 characters)", async () => {
      const user = userEvent.setup();
      render(
        <CharacterForm
          worldId={mockWorldId}
          worldSlug={mockWorldSlug}
          mode="create"
        />
      );

      const nameInput = screen.getByLabelText(/character name/i);
      await user.type(nameInput, "A".repeat(101));

      const submitButton = screen.getByRole("button", {
        name: /create character/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/name must be 100 characters or less/i)
        ).toBeInTheDocument();
      });
    });

    it("submits form with minimal data (name only)", async () => {
      const user = userEvent.setup();
      const { createCharacter } = await import(
        "@/app/worlds/[slug]/characters/actions"
      );

      vi.mocked(createCharacter).mockResolvedValue({
        success: true,
        data: {
          id: "char-123",
          slug: "test-character",
          name: "Test Character",
          worldId: mockWorldId,
          role: null,
          species: null,
          age: null,
          gender: null,
          appearance: null,
          personality: null,
          backstory: null,
          goals: null,
          fears: null,
          attributes: null,
          imageUrl: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as Character,
      });

      render(
        <CharacterForm
          worldId={mockWorldId}
          worldSlug={mockWorldSlug}
          mode="create"
        />
      );

      const nameInput = screen.getByLabelText(/character name/i);
      await user.type(nameInput, "Test Character");

      const submitButton = screen.getByRole("button", {
        name: /create character/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(createCharacter).toHaveBeenCalledWith(
          mockWorldId,
          expect.objectContaining({
            name: "Test Character",
          })
        );
        expect(mockPush).toHaveBeenCalledWith(
          `/worlds/${mockWorldSlug}/characters/test-character`
        );
        expect(mockRefresh).toHaveBeenCalled();
      });
    });

    it("submits form with all basic fields", async () => {
      const user = userEvent.setup();
      const { createCharacter } = await import(
        "@/app/worlds/[slug]/characters/actions"
      );

      vi.mocked(createCharacter).mockResolvedValue({
        success: true,
        data: {
          id: "char-123",
          slug: "warrior-character",
          name: "Warrior Character",
          worldId: mockWorldId,
          role: "Warrior",
          species: "Human",
          age: "25",
          gender: "Male",
          appearance: null,
          personality: null,
          backstory: null,
          goals: null,
          fears: null,
          attributes: null,
          imageUrl: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as Character,
      });

      render(
        <CharacterForm
          worldId={mockWorldId}
          worldSlug={mockWorldSlug}
          mode="create"
        />
      );

      await user.type(
        screen.getByLabelText(/character name/i),
        "Warrior Character"
      );
      await user.type(screen.getByLabelText(/role/i), "Warrior");
      await user.type(screen.getByLabelText(/species/i), "Human");
      await user.type(screen.getByLabelText(/age/i), "25");
      await user.type(screen.getByLabelText(/gender/i), "Male");

      const submitButton = screen.getByRole("button", {
        name: /create character/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(createCharacter).toHaveBeenCalledWith(
          mockWorldId,
          expect.objectContaining({
            name: "Warrior Character",
            role: "Warrior",
            species: "Human",
            age: "25",
            gender: "Male",
          })
        );
      });
    });

    it("shows error message on submission failure", async () => {
      const user = userEvent.setup();
      const { createCharacter } = await import(
        "@/app/worlds/[slug]/characters/actions"
      );

      vi.mocked(createCharacter).mockResolvedValue({
        success: false,
        error: "Failed to create character",
      });

      render(
        <CharacterForm
          worldId={mockWorldId}
          worldSlug={mockWorldSlug}
          mode="create"
        />
      );

      const nameInput = screen.getByLabelText(/character name/i);
      await user.type(nameInput, "Test Character");

      const submitButton = screen.getByRole("button", {
        name: /create character/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/failed to create character/i)
        ).toBeInTheDocument();
      });
    });

    it("accepts valid image URL", async () => {
      const user = userEvent.setup();
      const { createCharacter } = await import(
        "@/app/worlds/[slug]/characters/actions"
      );

      vi.mocked(createCharacter).mockResolvedValue({
        success: true,
        data: {
          id: "char-123",
          slug: "test-character",
          name: "Test Character",
          worldId: mockWorldId,
          role: null,
          species: null,
          age: null,
          gender: null,
          appearance: null,
          personality: null,
          backstory: null,
          goals: null,
          fears: null,
          attributes: null,
          imageUrl: "https://example.com/portrait.jpg",
          createdAt: new Date(),
          updatedAt: new Date(),
        } as Character,
      });

      render(
        <CharacterForm
          worldId={mockWorldId}
          worldSlug={mockWorldSlug}
          mode="create"
        />
      );

      // Fill in required name field in basics tab
      const nameInput = screen.getByLabelText(/character name/i);
      await user.type(nameInput, "Test Character");

      // Navigate to appearance tab
      const appearanceTab = screen.getByRole("tab", { name: /appearance/i });
      await user.click(appearanceTab);

      const imageInput = screen.getByLabelText(/character portrait url/i);
      await user.type(imageInput, "https://example.com/portrait.jpg");

      const submitButton = screen.getByRole("button", {
        name: /create character/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(createCharacter).toHaveBeenCalledWith(
          mockWorldId,
          expect.objectContaining({
            imageUrl: "https://example.com/portrait.jpg",
          })
        );
      });
    });
  });

  describe("Edit Mode", () => {
    const mockCharacter: Character = {
      id: "char-123",
      worldId: mockWorldId,
      name: "Existing Character",
      slug: "existing-character",
      role: "Warrior",
      species: "Human",
      age: "30",
      gender: "Female",
      appearance: "Tall and strong",
      personality: "Brave and loyal",
      backstory: "Born in a small village",
      goals: "Save the kingdom",
      fears: "Losing loved ones",
      attributes: { strength: 18, dexterity: 14 },
      imageUrl: "https://example.com/portrait.jpg",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it("renders edit form with existing data", () => {
      render(
        <CharacterForm
          worldId={mockWorldId}
          worldSlug={mockWorldSlug}
          character={mockCharacter}
          mode="edit"
        />
      );

      const nameInput = screen.getByLabelText(
        /character name/i
      ) as HTMLInputElement;
      expect(nameInput.value).toBe("Existing Character");
      expect(
        screen.getByRole("button", { name: /update character/i })
      ).toBeInTheDocument();
    });

    it("pre-populates all basic fields in edit mode", () => {
      render(
        <CharacterForm
          worldId={mockWorldId}
          worldSlug={mockWorldSlug}
          character={mockCharacter}
          mode="edit"
        />
      );

      expect(
        (screen.getByLabelText(/character name/i) as HTMLInputElement).value
      ).toBe("Existing Character");
      expect((screen.getByLabelText(/role/i) as HTMLInputElement).value).toBe(
        "Warrior"
      );
      expect(
        (screen.getByLabelText(/species/i) as HTMLInputElement).value
      ).toBe("Human");
      expect((screen.getByLabelText(/age/i) as HTMLInputElement).value).toBe(
        "30"
      );
      expect((screen.getByLabelText(/gender/i) as HTMLInputElement).value).toBe(
        "Female"
      );
    });

    it("submits updated data", async () => {
      const user = userEvent.setup();
      const { updateCharacter } = await import(
        "@/app/worlds/[slug]/characters/actions"
      );

      vi.mocked(updateCharacter).mockResolvedValue({
        success: true,
        data: {
          ...mockCharacter,
          name: "Updated Character",
        },
      });

      render(
        <CharacterForm
          worldId={mockWorldId}
          worldSlug={mockWorldSlug}
          character={mockCharacter}
          mode="edit"
        />
      );

      const nameInput = screen.getByLabelText(/character name/i);
      await user.clear(nameInput);
      await user.type(nameInput, "Updated Character");

      const submitButton = screen.getByRole("button", {
        name: /update character/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(updateCharacter).toHaveBeenCalledWith(
          mockCharacter.id,
          expect.objectContaining({
            name: "Updated Character",
          })
        );
      });
    });
  });

  describe("Field Tabs", () => {
    it("shows appearance tab fields", async () => {
      const user = userEvent.setup();
      render(
        <CharacterForm
          worldId={mockWorldId}
          worldSlug={mockWorldSlug}
          mode="create"
        />
      );

      const appearanceTab = screen.getByRole("tab", { name: /appearance/i });
      await user.click(appearanceTab);

      expect(
        screen.getByLabelText(/character portrait url/i)
      ).toBeInTheDocument();
      // Markdown editor for appearance
      const markdownEditors = screen.getAllByTestId("markdown-editor");
      expect(markdownEditors.length).toBeGreaterThan(0);
    });

    it("shows personality tab fields", async () => {
      const user = userEvent.setup();
      render(
        <CharacterForm
          worldId={mockWorldId}
          worldSlug={mockWorldSlug}
          mode="create"
        />
      );

      const personalityTab = screen.getByRole("tab", { name: /personality/i });
      await user.click(personalityTab);

      // Should have markdown editors for personality, goals, and fears
      const markdownEditors = screen.getAllByTestId("markdown-editor");
      expect(markdownEditors.length).toBe(3);
    });

    it("shows backstory tab fields", async () => {
      const user = userEvent.setup();
      render(
        <CharacterForm
          worldId={mockWorldId}
          worldSlug={mockWorldSlug}
          mode="create"
        />
      );

      const backstoryTab = screen.getByRole("tab", { name: /backstory/i });
      await user.click(backstoryTab);

      // Should have one markdown editor for backstory
      const markdownEditors = screen.getAllByTestId("markdown-editor");
      expect(markdownEditors.length).toBe(1);
    });

    it("shows advanced tab fields", async () => {
      const user = userEvent.setup();
      render(
        <CharacterForm
          worldId={mockWorldId}
          worldSlug={mockWorldSlug}
          mode="create"
        />
      );

      const advancedTab = screen.getByRole("tab", { name: /advanced/i });
      await user.click(advancedTab);

      expect(
        screen.getByText(/custom attributes/i, { selector: "h3" })
      ).toBeInTheDocument();
      expect(screen.getByLabelText(/attributes.*json/i)).toBeInTheDocument();
    });
  });

  describe("Image Preview", () => {
    it("shows image preview when valid URL is entered", async () => {
      const user = userEvent.setup();
      render(
        <CharacterForm
          worldId={mockWorldId}
          worldSlug={mockWorldSlug}
          mode="create"
        />
      );

      // Navigate to appearance tab
      const appearanceTab = screen.getByRole("tab", { name: /appearance/i });
      await user.click(appearanceTab);

      const imageInput = screen.getByLabelText(/character portrait url/i);
      await user.type(imageInput, "https://example.com/portrait.jpg");

      // Image preview should appear (mocked)
      await waitFor(() => {
        expect(screen.getByTestId("image-preview")).toBeInTheDocument();
      });
    });
  });

  describe("Cancel Button", () => {
    it("calls router.back() when cancel is clicked", async () => {
      const user = userEvent.setup();
      render(
        <CharacterForm
          worldId={mockWorldId}
          worldSlug={mockWorldSlug}
          mode="create"
        />
      );

      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockBack).toHaveBeenCalled();
    });
  });

  describe("Disabled States", () => {
    it("disables all inputs while submitting", async () => {
      const user = userEvent.setup();
      const { createCharacter } = await import(
        "@/app/worlds/[slug]/characters/actions"
      );

      // Make createCharacter hang to keep form in submitting state
      vi.mocked(createCharacter).mockImplementation(
        () => new Promise(() => {})
      );

      render(
        <CharacterForm
          worldId={mockWorldId}
          worldSlug={mockWorldSlug}
          mode="create"
        />
      );

      const nameInput = screen.getByLabelText(/character name/i);
      await user.type(nameInput, "Test Character");

      const submitButton = screen.getByRole("button", {
        name: /create character/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(nameInput).toBeDisabled();
        expect(submitButton).toBeDisabled();
        expect(screen.getByRole("button", { name: /cancel/i })).toBeDisabled();
      });
    });
  });

  describe("Markdown Editors", () => {
    it("allows entering markdown in appearance field", async () => {
      const user = userEvent.setup();
      render(
        <CharacterForm
          worldId={mockWorldId}
          worldSlug={mockWorldSlug}
          mode="create"
        />
      );

      // Navigate to appearance tab
      const appearanceTab = screen.getByRole("tab", { name: /appearance/i });
      await user.click(appearanceTab);

      const markdownEditor = screen.getByTestId("markdown-editor");
      await user.type(markdownEditor, "**Bold text** for appearance");

      expect(markdownEditor).toHaveValue("**Bold text** for appearance");
    });
  });
});
