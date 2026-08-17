import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { AnnouncementForm } from "./AnnouncementForm";

describe("AnnouncementForm", () => {
  it("shows validation before calling submit", async () => {
    const onSubmit = vi.fn();
    render(<AnnouncementForm submitLabel="Enviar" onSubmit={onSubmit} />);
    fireEvent.click(screen.getByRole("button", { name: "Enviar" }));
    expect(await screen.findByText("Informe um título para a publicação.")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("explains the minimum description length in Portuguese", async () => {
    const onSubmit = vi.fn();
    render(<AnnouncementForm submitLabel="Enviar" onSubmit={onSubmit} />);
    fireEvent.change(screen.getByLabelText(/Título/), { target: { value: "Doação de livros" } });
    fireEvent.change(screen.getByLabelText(/Bairro/), { target: { value: "Centro" } });
    fireEvent.change(screen.getByLabelText(/Descrição/), { target: { value: "Curta" } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar" }));
    expect(await screen.findByText("A descrição deve ter pelo menos 10 caracteres.")).toBeInTheDocument();
    expect(screen.getByLabelText(/Descrição/)).toHaveFocus();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("requires authorization before publishing", async () => {
    const onSubmit = vi.fn();
    render(<AnnouncementForm submitLabel="Enviar" onSubmit={onSubmit} />);
    fireEvent.change(screen.getByLabelText(/Título/), { target: { value: "Doação de livros" } });
    fireEvent.change(screen.getByLabelText(/Bairro/), { target: { value: "Centro" } });
    fireEvent.change(screen.getByLabelText(/Descrição/), { target: { value: "Livros em bom estado para retirada." } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar" }));
    expect(await screen.findByText("Confirme a autorização para publicar os dados informados.")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
