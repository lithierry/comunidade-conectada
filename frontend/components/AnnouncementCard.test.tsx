import React from "react";
import { render, screen } from "@testing-library/react";
import { AnnouncementCard } from "./AnnouncementCard";
import type { Announcement } from "@/lib/types";
const item: Announcement={id:1,title:"Mesa para doação",description:"Mesa em bom estado.",category:"donation",neighborhood:"Centro",status:"published",created_at:"2026-08-10T10:00:00Z"};
describe("AnnouncementCard",()=>{it("renders announcement information and link",()=>{render(<AnnouncementCard item={item}/>);expect(screen.getByRole("link",{name:/mesa para doação/i})).toHaveAttribute("href","/anuncio/1");expect(screen.getByText("Doações")).toBeInTheDocument();expect(screen.getByText(/Centro/)).toBeInTheDocument();});});
