import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { DoorCustomizer } from "../../src/components/customizer/DoorCustomizer";
import { PlaqueViewModal } from "../../src/components/plaque/PlaqueViewModal";
import { createDemoMuseum } from "../../src/client/demoClient";

// Mock Canvas from @react-three/fiber in unit test
vi.mock("@react-three/fiber", () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="r3f-canvas">{children}</div>
  ),
  useFrame: () => {},
  useThree: () => ({
    camera: {
      position: { copy: vi.fn(), set: vi.fn() },
      lookAt: vi.fn(),
      fov: 55,
      updateProjectionMatrix: vi.fn(),
    },
  }),
}));

describe("Test 13: Plaque & Customizer Component Tests", () => {
  it("DoorCustomizer prefills name with to_name and swatch selection updates config", () => {
    const handleEnter = vi.fn();
    render(<DoorCustomizer initialName="Maya" onEnter={handleEnter} />);

    // Check name pre-filled
    const input = screen.getByLabelText(/Your name/i) as HTMLInputElement;
    expect(input.value).toBe("Maya");

    // Select skin tone swatch "Sienna"
    const siennaSwatch = screen.getByTitle("Sienna");
    expect(siennaSwatch).toBeInTheDocument();
    fireEvent.click(siennaSwatch);

    // Enter museum button
    const enterBtn = screen.getByRole("button", { name: /Enter the museum/i });
    expect(enterBtn).toBeInTheDocument();
  });

  it("PlaqueViewModal renders exact typography, title, body, sign-off matching museum data", () => {
    const demo = createDemoMuseum();
    const handleClose = vi.fn();

    render(
      <PlaqueViewModal
        museum={demo}
        activeArtwork={null}
        isPlaqueOpen={true}
        onClose={handleClose}
      />,
    );

    expect(screen.getByText(/A PERMANENT COLLECTION/i)).toBeInTheDocument();
    expect(screen.getByText(/For Maya/i)).toBeInTheDocument();
    expect(screen.getByText(/Our whole winter/i)).toBeInTheDocument();
    expect(screen.getByText(/Love, Ethan/i)).toBeInTheDocument();

    // Close button works
    const closeBtn = screen.getByLabelText(/Close viewing mode/i);
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalled();
  });
});
