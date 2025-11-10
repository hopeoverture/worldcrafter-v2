import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CharactersList } from "../characters-list";

// Mock Next.js router
const mockPush = vi.fn();
const mockRefresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

// Mock Server Actions
vi.mock("@/app/worlds/[slug]/characters/actions", () => ({
  deleteCharacter: vi.fn(),
}));

// Mock Sonner
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockCharacters = [
  {
    id: "char1",
    name: "Aldrin the Wise",
    slug: "aldrin-the-wise",
    role: "Wizard",
    species: "Human",
    age: "387",
    gender: "Male",
    imageUrl: "https://example.com/aldrin.jpg",
    appearance: "Ancient wizard with a long white beard",
    updatedAt: new Date("2025-01-10"),
  },
  {
    id: "char2",
    name: "Elara Swift",
    slug: "elara-swift",
    role: "Rogue",
    species: "Elf",
    age: "142",
    gender: "Female",
    imageUrl: null,
    appearance: "Nimble elf with silver hair",
    updatedAt: new Date("2025-01-09"),
  },
  {
    id: "char3",
    name: "Gorath Ironheart",
    slug: "gorath-ironheart",
    role: "Warrior",
    species: "Dwarf",
    age: "205",
    gender: "Male",
    imageUrl: null,
    appearance: null,
    updatedAt: new Date("2025-01-08"),
  },
];

describe("CharactersList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Empty State", () => {
    it("shows empty state when no characters exist", () => {
      render(<CharactersList characters={[]} worldSlug="test-world" />);

      expect(screen.getByText("No characters yet")).toBeInTheDocument();
      expect(
        screen.getByText(/Start populating your world by creating characters/)
      ).toBeInTheDocument();
      expect(screen.getByText("Create First Character")).toBeInTheDocument();
    });

    it("renders create character link with correct href", () => {
      render(<CharactersList characters={[]} worldSlug="test-world" />);

      const createLink = screen
        .getByText("Create First Character")
        .closest("a");
      expect(createLink).toHaveAttribute(
        "href",
        "/worlds/test-world/characters/new"
      );
    });
  });

  describe("Character List", () => {
    it("displays character count correctly", () => {
      render(
        <CharactersList characters={mockCharacters} worldSlug="test-world" />
      );

      expect(screen.getByText(/3 of 3 characters/)).toBeInTheDocument();
    });

    it("renders add character button when characters exist", () => {
      render(
        <CharactersList characters={mockCharacters} worldSlug="test-world" />
      );

      expect(screen.getByText("Add Character")).toBeInTheDocument();
    });

    it("displays all characters in card view by default", () => {
      render(
        <CharactersList characters={mockCharacters} worldSlug="test-world" />
      );

      expect(screen.getByText("Aldrin the Wise")).toBeInTheDocument();
      expect(screen.getByText("Elara Swift")).toBeInTheDocument();
      expect(screen.getByText("Gorath Ironheart")).toBeInTheDocument();
    });
  });

  describe("View Modes", () => {
    it("defaults to card view", () => {
      render(
        <CharactersList characters={mockCharacters} worldSlug="test-world" />
      );

      const cardViewButton = screen.getByRole("button", { name: /Card View/i });
      expect(cardViewButton).toHaveClass("bg-primary"); // Active button styling
    });

    it("switches to table view when table view button is clicked", async () => {
      const user = userEvent.setup();
      render(
        <CharactersList characters={mockCharacters} worldSlug="test-world" />
      );

      const tableViewButton = screen.getByRole("button", {
        name: /Table View/i,
      });
      await user.click(tableViewButton);

      // Table headers should be visible
      expect(screen.getByText("Name")).toBeInTheDocument();
      expect(screen.getByText("Role")).toBeInTheDocument();
      expect(screen.getByText("Species")).toBeInTheDocument();
      expect(screen.getByText("Age")).toBeInTheDocument();
    });

    it("switches back to card view from table view", async () => {
      const user = userEvent.setup();
      render(
        <CharactersList characters={mockCharacters} worldSlug="test-world" />
      );

      // Switch to table view
      const tableViewButton = screen.getByRole("button", {
        name: /Table View/i,
      });
      await user.click(tableViewButton);

      // Switch back to card view
      const cardViewButton = screen.getByRole("button", { name: /Card View/i });
      await user.click(cardViewButton);

      // Table headers should not be visible
      expect(screen.queryByText("Name")).not.toBeInTheDocument();
    });
  });

  describe("Filtering", () => {
    it("shows role filter when characters have roles", () => {
      render(
        <CharactersList characters={mockCharacters} worldSlug="test-world" />
      );

      expect(screen.getByText("Role:")).toBeInTheDocument();
      expect(screen.getByText("All Roles")).toBeInTheDocument();
    });

    it("shows species filter when characters have species", () => {
      render(
        <CharactersList characters={mockCharacters} worldSlug="test-world" />
      );

      expect(screen.getByText("Species:")).toBeInTheDocument();
      expect(screen.getByText("All Species")).toBeInTheDocument();
    });
  });

  describe("Table View Features", () => {
    it("displays character information in table format", async () => {
      const user = userEvent.setup();
      render(
        <CharactersList characters={mockCharacters} worldSlug="test-world" />
      );

      // Switch to table view
      const tableViewButton = screen.getByRole("button", {
        name: /Table View/i,
      });
      await user.click(tableViewButton);

      // Check table content
      expect(screen.getByText("Aldrin the Wise")).toBeInTheDocument();
      expect(screen.getByText("Wizard")).toBeInTheDocument();
      expect(screen.getByText("Human")).toBeInTheDocument();
      expect(screen.getByText("387")).toBeInTheDocument();
    });

    it("shows dash for missing data in table", async () => {
      const user = userEvent.setup();
      const characterWithMissingData = [
        {
          ...mockCharacters[0],
          role: null,
          species: null,
          age: null,
        },
      ];

      render(
        <CharactersList
          characters={characterWithMissingData}
          worldSlug="test-world"
        />
      );

      const tableViewButton = screen.getByRole("button", {
        name: /Table View/i,
      });
      await user.click(tableViewButton);

      // Count dashes for missing data
      const dashes = screen.getAllByText("-");
      expect(dashes.length).toBeGreaterThanOrEqual(3);
    });

    it("renders action buttons for each character in table", async () => {
      const user = userEvent.setup();
      render(
        <CharactersList characters={mockCharacters} worldSlug="test-world" />
      );

      const tableViewButton = screen.getByRole("button", {
        name: /Table View/i,
      });
      await user.click(tableViewButton);

      await waitFor(() => {
        // Check for view/edit/delete text in sr-only spans
        const viewTexts = screen.getAllByText("View", { selector: ".sr-only" });
        expect(viewTexts.length).toBe(3);

        const editTexts = screen.getAllByText("Edit", { selector: ".sr-only" });
        expect(editTexts.length).toBe(3);

        const deleteTexts = screen.getAllByText("Delete", {
          selector: ".sr-only",
        });
        expect(deleteTexts.length).toBe(3);
      });
    });
  });

  describe("Character Links", () => {
    it("renders correct view links for characters in table", async () => {
      const user = userEvent.setup();
      render(
        <CharactersList characters={mockCharacters} worldSlug="test-world" />
      );

      const tableViewButton = screen.getByRole("button", {
        name: /Table View/i,
      });
      await user.click(tableViewButton);

      await waitFor(() => {
        const characterLink = screen.getByText("Aldrin the Wise").closest("a");
        expect(characterLink).toHaveAttribute(
          "href",
          "/worlds/test-world/characters/aldrin-the-wise"
        );
      });
    });
  });
});
