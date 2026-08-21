import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const { signOut, replace, refresh } = vi.hoisted(() => ({
  signOut: vi.fn().mockResolvedValue({ error: null }),
  replace: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace, refresh }) }));
vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: { user: { email: "lia@example.com", user_metadata: { name: "Lia Souza" } } } } }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      signOut,
    },
  },
}));

import { Header } from "./Header";
import { beforeEach } from "node:test";
import { expect } from "vitest";

describe("Header", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows the account name and allows the user to sign out", async () => {
    render(<Header />);
    const account = await screen.findByRole("button", { name: /Lia/ });
    expect(screen.queryByRole("link", { name: "Entrar" })).not.toBeInTheDocument();

    fireEvent.click(account);
    fireEvent.click(screen.getByRole("button", { name: "Sair" }));

    await waitFor(() => expect(signOut).toHaveBeenCalledOnce());
    expect(replace).toHaveBeenCalledWith("/");
    expect(refresh).toHaveBeenCalledOnce();
  });

  it("moves focus to the first navigation item when the mobile menu opens", async () => {
    render(<Header />);

    const menuButton = screen.getByRole("button", {
      name: "Abrir menu",
    });

    fireEvent.click(menuButton);

    const exploreLink = screen.getByRole("link", {
      name: "Explorar",
    });

    await waitFor(() => {
      expect(exploreLink).toHaveFocus();
    });

    expect(menuButton).toHaveAttribute("aria-expanded", "true");
  });

  it("returns focus to the menu button when Shift+Tab is pressed on the first item", async () => {
    render(<Header />);

    const menuButton = screen.getByRole("button", {
      name: "Abrir menu",
    });

    fireEvent.click(menuButton);

    const exploreLink = screen.getByRole("link", {
      name: "Explorar",
    });

    await waitFor(() => {
      expect(exploreLink).toHaveFocus();
    });

    fireEvent.keyDown(exploreLink, {
      key: "Tab",
      shiftKey: true,
    });

    expect(menuButton).toHaveFocus();
  });

  it("cycles focus to the first navigation item when Tab is pressed on the last item", async () => {
    render(<Header />);

    const menuButton = screen.getByRole("button", {
      name: "Abrir menu",
    });

    fireEvent.click(menuButton);

    const exploreLink = screen.getByRole("link", {
      name: "Explorar",
    });

    const publishLink = screen.getByRole("link", {
      name: "Publicar anúncio",
    });

    await waitFor(() => {
      expect(exploreLink).toHaveFocus();
    });

    publishLink.focus();

    fireEvent.keyDown(publishLink, {
      key: "Tab",
    });

    expect(exploreLink).toHaveFocus();
  });

  it("closes the mobile menu and returns focus to the menu button with Escape", async () => {
    render(<Header />);

    const menuButton = screen.getByRole("button", {
      name: "Abrir menu",
    });

    fireEvent.click(menuButton);

    const exploreLink = screen.getByRole("link", {
      name: "Explorar",
    });

    await waitFor(() => {
      expect(exploreLink).toHaveFocus();
    });

    fireEvent.keyDown(exploreLink, {
      key: "Escape",
    });

    expect(menuButton).toHaveFocus();

    await waitFor(() => {
      expect(menuButton).toHaveAttribute("aria-expanded", "false");
    });
  });
});
