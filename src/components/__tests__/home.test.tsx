import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import Home from "@/app/page";

describe("Home", () => {
  it("renders home page heading", () => {
    render(<Home />);
    expect(screen.getByRole("heading", { name: /build infinite worlds/i })).toBeInTheDocument();
  });
});
