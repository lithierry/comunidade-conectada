import { statusLabel, type AnnouncementStatus } from "@/lib/types";
export function StatusBadge({ status }: { status: AnnouncementStatus }) { return <span className={`status ${status}`}>{statusLabel(status)}</span>; }
