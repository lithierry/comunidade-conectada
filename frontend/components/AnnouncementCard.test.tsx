import React from "react";
import { render, screen } from "@testing-library/react";

import { AnnouncementCard } from "./AnnouncementCard";

import type { Announcement } from "@/lib/types";

const item: Announcement = {
    id: 1,
    title: "Mesa para doação",
    description: "Mesa em bom estado.",
    category: "donation",
    neighborhood: "Centro",
    status: "published",
    created_at: "2026-08-10T10:00:00Z",
};

describe("AnnouncementCard", () => {
    it("renders announcement information and link", () => {
        render(<AnnouncementCard item={item} />);

        expect(
            screen.getByRole("heading", {
                name: "Mesa para doação",
            })
        ).toBeInTheDocument();
    });

    it("renders the announcement category", () => {
        render(<AnnouncementCard item={item} />);

        expect(screen.getByText("Doações")).toBeInTheDocument();
    });

    it("renders the announcement neighborhood", () => {
        render(<AnnouncementCard item={item} />);

        expect(screen.getByText("Centro")).toBeInTheDocument();
    });

    it("renders the relative publication date", () => {
        render(<AnnouncementCard item={item} />);

        expect(
            screen.getByText(/Publicado há/i),
        ).toBeInTheDocument();
    });

    it("renders the details action", () => {
        render(<AnnouncementCard item={item} />);

        expect(
            screen.getByText("Ver detalhes"),
        ).toBeInTheDocument();
    });

    it("links to the announcement details page", () => {
        render(<AnnouncementCard item={item} />);

        expect(
            screen.getByRole("link", {
                name: /Ver detalhes de Mesa para doação/i,
            }),
        ).toHaveAttribute("href", "/anuncio/1");
    });

    it("does not render the description in the card", () => {
        render(<AnnouncementCard item={item} />);

        expect(
            screen.queryByText("Mesa em bom estado."),
        ).not.toBeInTheDocument();
    });
});
