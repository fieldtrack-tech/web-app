import type { ActivityStatus } from "@/types";

const MAP: Record<ActivityStatus, string> = {
  ACTIVE: "badge-success",
  RECENT: "badge-info",
  INACTIVE: "badge-neutral",
};

export function ActivityBadge({ status }: { status: ActivityStatus }) {
  return <span className={MAP[status]}>{status}</span>;
}
