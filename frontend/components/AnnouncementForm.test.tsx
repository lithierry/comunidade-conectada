import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { AnnouncementForm } from "./AnnouncementForm";
import { vi } from "vitest";
describe("AnnouncementForm",()=>{it("shows validation before calling submit",async()=>{const onSubmit=vi.fn();render(<AnnouncementForm submitLabel="Enviar" onSubmit={onSubmit}/>);fireEvent.click(screen.getByRole("button",{name:"Enviar"}));expect(await screen.findByText("Preencha os campos obrigatórios.")).toBeInTheDocument();expect(onSubmit).not.toHaveBeenCalled();});});
