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
});
