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

describe("Header", () => {
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
});
