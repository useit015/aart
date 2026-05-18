import "@testing-library/jest-dom/vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import App from "../src/App.jsx";

describe("ASCII Magic app shell", () => {
  it("renders the primary editor controls and can generate a demo", async () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "ASCII Magic" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Upload Image / Video" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Export" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Source" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Look" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Motion" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("tab", { name: "Look" }));
    expect(screen.getByText("Render style")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Inspire Me" }));

    expect(screen.getByText(/Demo loaded/i)).toBeInTheDocument();
    expect(screen.getByTestId("ascii-canvas")).toBeInTheDocument();
  });

  it("exposes parity controls for galleries, crop, lights, masks, and animated export", async () => {
    render(<App />);

    expect(screen.getByText("Demo gallery")).toBeInTheDocument();
    expect(screen.getByText("Background gallery")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Demo 02" }));
    expect(screen.getByText(/Demo 02 loaded/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("tab", { name: "Motion" }));
    await userEvent.click(screen.getByRole("button", { name: "Add Light" }));
    expect(screen.getByText(/Light 1 selected/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("switch", { name: "Enable Mask" }));
    expect(screen.getByText("Draw Mask")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("tab", { name: "Finish" }));
    await userEvent.click(screen.getByRole("button", { name: "Crop / Rotate" }));
    expect(screen.getByRole("dialog", { name: "Crop & Rotate" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });

  it("exposes final public parity controls for video demos, timed exports, crop handles, and effect intensity", async () => {
    render(<App />);

    expect(screen.getByText("Video demos")).toBeInTheDocument();
    expect(screen.getByText("Animation duration")).toBeInTheDocument();
    expect(screen.getByText("Frame rate")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("tab", { name: "Finish" }));
    await userEvent.click(screen.getByRole("switch", { name: "Glitch" }));
    expect(screen.getByText("Glitch Amount")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Crop / Rotate" }));
    expect(screen.getAllByLabelText(/Crop handle/i)).toHaveLength(8);
    expect(screen.getByRole("button", { name: "Undo" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Redo" })).toBeInTheDocument();
  });
});
