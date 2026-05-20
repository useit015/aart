import "@testing-library/jest-dom/vitest";
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "../src/App.jsx";
import { CHAR_SETS } from "../src/ascii.js";

describe("Glyph Studio app shell", () => {
  afterEach(() => {
    window.history.pushState({}, "", "/");
  });

  it("renders the primary editor controls without demo entry points", async () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "Glyph Studio" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Upload Image / Video" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Source" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Style" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Motion" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Export" })).toBeInTheDocument();
    expect(screen.queryByText("Background gallery")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Export" })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("tab", { name: "Style" }));
    expect(screen.getByText("Render style")).toBeInTheDocument();
    expect(screen.getByText("Gamma")).toBeInTheDocument();
    expect(screen.getByTestId("ascii-canvas")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Inspire Me" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Random Demo" })).not.toBeInTheDocument();
    expect(screen.queryByText("Demo gallery")).not.toBeInTheDocument();
    expect(screen.queryByText("Video demos")).not.toBeInTheDocument();
  });

  it("exposes parity controls for backgrounds, crop, lights, masks, and animated export", async () => {
    render(<App />);

    await userEvent.click(screen.getByRole("tab", { name: "Style" }));
    expect(screen.getByText("Background gallery")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Demo 02" })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("tab", { name: "Motion" }));
    await userEvent.click(screen.getByRole("switch", { name: "Enable Lights" }));
    await userEvent.click(screen.getByRole("button", { name: "Add Light" }));
    expect(screen.getByText(/Light 1 selected/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("switch", { name: "Enable Mask" }));
    expect(screen.getByRole("button", { name: "Draw Mask" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("tab", { name: "Export" }));
    await userEvent.click(screen.getByRole("button", { name: "Crop / Rotate" }));
    expect(screen.getByRole("dialog", { name: "Crop & Rotate" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });

  it("keeps export timing and effect intensity controls behind relevant choices", async () => {
    render(<App />);

    expect(screen.queryByText("Video demos")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("tab", { name: "Export" }));
    expect(screen.queryByText("Animation duration")).not.toBeInTheDocument();
    expect(screen.queryByText("Frame rate")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Format")).toBeInTheDocument();
    expect(screen.getByLabelText("Resolution")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Export" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("switch", { name: "Glitch" }));
    expect(screen.getByText("Glitch Amount")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Crop / Rotate" }));
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
      expect(screen.queryByText("Unsupported file type")).not.toBeInTheDocument();
      expect(video).toHaveAttribute("preload", "auto");
      expect(video).toHaveAttribute("autoplay");
      expect(video).not.toHaveClass("hidden");
    } finally {
      URL.createObjectURL = originalCreateObjectUrl;
    }
  });

  it("covers the remaining hard parity surfaces the previous audit missed", async () => {
    render(<App />);

    await userEvent.click(screen.getByRole("tab", { name: "Style" }));
    expect(screen.getByText("34 curated backgrounds")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Background 34" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Video 01" })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("tab", { name: "Motion" }));
    await userEvent.click(screen.getByRole("switch", { name: "Enable Lights" }));
    expect(screen.getByText("0 / 4")).toBeInTheDocument();
    expect(screen.getByText("No lights placed")).toBeInTheDocument();
  });

  it("makes light and mask editing explicit and reversible", async () => {
    render(<App />);

    await userEvent.click(screen.getByRole("tab", { name: "Motion" }));

    expect(screen.queryByText("Preview Tool")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Place Lights" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Draw Mask" })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("switch", { name: "Enable Mask" }));
    expect(screen.getByRole("button", { name: "Draw Mask" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Undo Stroke" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Clear Mask" })).toBeDisabled();

    await userEvent.click(screen.getByRole("button", { name: "Draw Mask" }));
    expect(screen.getByRole("button", { name: "Stop Drawing" })).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: "Enable Mask" })).toBeChecked();
    fireEvent.pointerDown(screen.getByTestId("ascii-canvas"), { clientX: 40, clientY: 40 });
    fireEvent.pointerUp(screen.getByTestId("ascii-canvas"), { clientX: 40, clientY: 40 });
    expect(await screen.findByText("Mask strokes: 1")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Undo Stroke" }));
    expect(screen.getByText("Mask strokes: 0")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("switch", { name: "Enable Lights" }));
    expect(screen.getByRole("button", { name: "Place Lights" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Place Lights" }));
    expect(screen.getByRole("button", { name: "Stop Placing" })).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: "Enable Lights" })).toBeChecked();
    fireEvent.pointerDown(screen.getByTestId("ascii-canvas"), { clientX: 80, clientY: 80 });
    expect(await screen.findByText("1 / 4")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Stop Placing" }));
    expect(screen.getByRole("button", { name: "Place Lights" })).toBeInTheDocument();
  });

  it("applies quality presets and marks manual quality edits as custom", async () => {
    render(<App />);

    await userEvent.click(screen.getByRole("tab", { name: "Style" }));
    expect(screen.getByText("Quality Presets")).toBeInTheDocument();
    expect(screen.getByText("Active quality preset: Balanced")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Detailed" }));
    expect(screen.getByText("Active quality preset: Detailed")).toBeInTheDocument();
    expect(screen.getByLabelText("Chars")).toHaveValue(CHAR_SETS.detailed);
    expect(screen.getByText("145%")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Chars"), { target: { value: "@@" } });
    expect(screen.getByText("Active quality preset: Custom")).toBeInTheDocument();
  });

  it("keeps quality and character choices in their existing controls", async () => {
    render(<App />);

    await userEvent.click(screen.getByRole("tab", { name: "Style" }));
    expect(screen.getByText("Quality Presets")).toBeInTheDocument();
    expect(screen.getByLabelText("Character Set")).toBeInTheDocument();
    expect(screen.queryByText("Detail")).not.toBeInTheDocument();
    expect(screen.queryByText("Glyph Set")).not.toBeInTheDocument();
    expect(screen.queryByText("Palette Mode")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Detailed" }));
    expect(screen.getByLabelText("Chars")).toHaveValue(CHAR_SETS.detailed);
    expect(screen.queryByRole("button", { name: "Random Demo" })).not.toBeInTheDocument();
  });

  it("adds organic preview motion without replacing light and mask workflows", async () => {
    render(<App />);

    await userEvent.click(screen.getByRole("tab", { name: "Motion" }));

    expect(screen.getByText("Interactive Motion")).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: "Enable Interaction" })).not.toBeChecked();
    expect(screen.queryByLabelText("Behavior")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Idle")).not.toBeInTheDocument();
    expect(screen.queryByText("Strength")).not.toBeInTheDocument();
    expect(screen.queryByText("Range")).not.toBeInTheDocument();
    expect(screen.queryByText("Turbulence")).not.toBeInTheDocument();
    expect(screen.queryByText("Damping")).not.toBeInTheDocument();
    expect(screen.queryByText("Trail")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Pointer")).not.toBeInTheDocument();
    expect(screen.queryByText("Motion Amount")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Burst" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Reset Motion" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Place Lights" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Draw Mask" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Animation Style")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("switch", { name: "Enable Interaction" }));
    expect(screen.getByRole("switch", { name: "Enable Interaction" })).toBeChecked();
    expect(screen.getByLabelText("Behavior")).toBeInTheDocument();
    expect(screen.getByText("Strength")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Burst" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("switch", { name: "Animated ASCII" }));
    expect(screen.getByLabelText("Animation Style")).toBeInTheDocument();
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
