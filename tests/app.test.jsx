import "@testing-library/jest-dom/vitest";
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "../src/App.jsx";
import { CHAR_SETS } from "../src/ascii.js";

async function openMode(name) {
  await userEvent.click(screen.getByRole("button", { name }));
}

describe("Glyph Studio app shell", () => {
  afterEach(() => {
    window.history.pushState({}, "", "/");
  });

  it("renders the stage, bottom shader rail, and source inspector", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "Glyph Studio" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Shader modes" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "SOURCE" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "ASCII" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "PARTICLES" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "RIPPLES" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "LINES" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "METAL" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "CHROME" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "TOOLS" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "EXPORT" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Upload Image / Video" })).toBeInTheDocument();
    expect(screen.getByTestId("ascii-canvas")).toBeInTheDocument();
    expect(screen.queryByRole("tab")).not.toBeInTheDocument();
    expect(screen.queryByText("Background gallery")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Random Demo" })).not.toBeInTheDocument();
  });

  it("uses one active dynamic inspector for shader modes", async () => {
    render(<App />);

    await openMode("ASCII");
    expect(screen.getByRole("heading", { name: "Minimal ASCII" })).toBeInTheDocument();
    expect(screen.getByText("Glyph Map")).toBeInTheDocument();
    expect(screen.getByText("Quality Presets")).toBeInTheDocument();
    expect(screen.getByText("Gamma")).toBeInTheDocument();
    expect(screen.queryByText("Enable Lights")).not.toBeInTheDocument();

    await openMode("PARTICLES");
    expect(screen.getByRole("heading", { name: "Particle Field" })).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: "Enable Interaction" })).toBeChecked();
    expect(screen.getByLabelText("Behavior")).toBeInTheDocument();
    expect(screen.getByText("Turbulence")).toBeInTheDocument();
    expect(screen.queryByText("Crop & Rotate")).not.toBeInTheDocument();

    await openMode("RIPPLES");
    expect(screen.getByRole("heading", { name: "Ripple Scan" })).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: "Animated ASCII" })).toBeChecked();
    expect(screen.getByLabelText("Animation Style")).toBeInTheDocument();
    expect(screen.getByText("Scan Lines Amount")).toBeInTheDocument();
  });

  it("applies metal and chrome presets without exposing unrelated controls", async () => {
    render(<App />);

    await openMode("METAL");
    expect(screen.getByRole("heading", { name: "Metal Glyph" })).toBeInTheDocument();
    expect(screen.getByText("Top Shade")).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: "Bloom" })).toBeChecked();
    expect(screen.queryByText("Character Set")).not.toBeInTheDocument();

    await openMode("CHROME");
    expect(screen.getByRole("heading", { name: "Chrome Glyph" })).toBeInTheDocument();
    expect(screen.getByText("Uniformity")).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: "Chromatic" })).toBeChecked();
    expect(screen.getByRole("button", { name: "Randomize" })).toBeInTheDocument();
  });

  it("keeps export timing and effect controls behind relevant choices", async () => {
    render(<App />);

    await openMode("EXPORT");
    expect(screen.queryByText("Animation duration")).not.toBeInTheDocument();
    expect(screen.queryByText("Frame rate")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Format")).toBeInTheDocument();
    expect(screen.getByLabelText("Resolution")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Export" }).length).toBeGreaterThan(0);
    expect(screen.queryByRole("switch", { name: "Glitch" })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("switch", { name: "Edit Final Effects" }));
    await userEvent.click(screen.getByRole("switch", { name: "Glitch" }));
    expect(screen.getByText("Glitch Amount")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Crop / Rotate" }));
    expect(screen.getByRole("dialog", { name: "Crop & Rotate" })).toBeInTheDocument();
    expect(screen.getAllByLabelText(/Crop handle/i)).toHaveLength(8);
    expect(screen.getByRole("button", { name: "Undo" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Redo" })).toBeInTheDocument();
  });

  it("accepts video uploads even when the browser reports a generic MIME type", async () => {
    const originalCreateObjectUrl = URL.createObjectURL;
    URL.createObjectURL = vi.fn(() => "blob:clip");
    try {
      const { container } = render(<App />);
      const fileInput = container.querySelector('input[type="file"]');
      const videoFile = new File(["video"], "clip.mp4", { type: "application/octet-stream" });

      expect(fileInput).not.toBeNull();
      expect(fileInput).toHaveAttribute("accept", expect.stringContaining(".mp4"));
      fireEvent.change(fileInput, { target: { files: [videoFile] } });
      const video = container.querySelector("video");

      expect(screen.getByText("clip.mp4 loaded")).toBeInTheDocument();
      expect(screen.getByText("Video source")).toBeInTheDocument();
      expect(screen.getByText("Video Transport")).toBeInTheDocument();
      expect(screen.queryByText("Unsupported file type")).not.toBeInTheDocument();
      expect(video).toHaveAttribute("preload", "auto");
      expect(video).toHaveAttribute("autoplay");
      expect(video).toHaveClass("pointer-events-none");
    } finally {
      URL.createObjectURL = originalCreateObjectUrl;
    }
  });

  it("keeps light and mask tools explicit and reversible", async () => {
    render(<App />);

    await openMode("TOOLS");
    expect(screen.queryByRole("button", { name: "Place Lights" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Draw Mask" })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("switch", { name: "Enable Mask" }));
    expect(screen.getByRole("button", { name: "Draw Mask" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Undo Stroke" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Clear Mask" })).toBeDisabled();

    await userEvent.click(screen.getByRole("button", { name: "Draw Mask" }));
    expect(screen.getByRole("button", { name: "Stop Drawing" })).toBeInTheDocument();
    fireEvent.pointerDown(screen.getByTestId("ascii-canvas"), { clientX: 40, clientY: 40 });
    fireEvent.pointerUp(screen.getByTestId("ascii-canvas"), { clientX: 40, clientY: 40 });
    expect(await screen.findByText("Mask strokes: 1")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Undo Stroke" }));
    expect(screen.getByText("Mask strokes: 0")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("switch", { name: "Enable Lights" }));
    expect(screen.getByRole("button", { name: "Place Lights" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Place Lights" }));
    expect(screen.getByRole("button", { name: "Stop Placing" })).toBeInTheDocument();
    fireEvent.pointerDown(screen.getByTestId("ascii-canvas"), { clientX: 80, clientY: 80 });
    expect(await screen.findByText("1 / 4")).toBeInTheDocument();
  });

  it("applies quality presets and marks manual quality edits as custom", async () => {
    render(<App />);

    await openMode("ASCII");
    expect(screen.getByText("Quality Presets")).toBeInTheDocument();
    expect(screen.getByText("Active quality preset: Balanced")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Detailed" }));
    expect(screen.getByText("Active quality preset: Detailed")).toBeInTheDocument();

    expect(screen.getByText("145%")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Random Demo" })).not.toBeInTheDocument();
  });

  it("reveals and hides the inspector with focus mode", async () => {
    render(<App />);

    expect(screen.getByRole("complementary", { name: "Load Source inspector" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "HIDE" }));
    expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "SHOW" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "SHOW" }));
    expect(screen.getByRole("complementary", { name: "Load Source inspector" })).toBeInTheDocument();
  });

  it("supports the standalone changelog route", () => {
    window.history.pushState({}, "", "/changelog");

    render(<App />);

    expect(screen.getByRole("heading", { name: "Changelog" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to Glyph Studio" })).toBeInTheDocument();
  });

  it("shows feedback sent and retry states with captured technical details", async () => {
    render(<App />);

    await userEvent.click(screen.getByRole("button", { name: "Menu" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Report a Bug" }));

    expect(screen.getByText("Technical details (auto-captured)")).toBeInTheDocument();
    expect(screen.getByText(/Source:/)).toBeInTheDocument();
    expect(screen.getByText(/Source resolution:/)).toBeInTheDocument();
    expect(screen.getByText(/Screen:/)).toBeInTheDocument();
    expect(screen.getByText(/Connection:/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Send Report" }));
    expect(screen.getByRole("button", { name: "Sent" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });
});
