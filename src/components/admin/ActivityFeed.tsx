"use client";

import {
  LogIn,
  MapPin,
  AlertTriangle,
  CreditCard,
  RefreshCw,
} from "lucide-react";
import { timeAgo } from "@/lib/utils";

interface FeedEvent {
  id: string;
  type: "login" | "location" | "geofence" | "expense" | "sync";
  actorName: string;
  message: string;
  timestamp: string;
}

interface ActivityFeedProps {
  events?: FeedEvent[];
}

const ICON_MAP: Record<FeedEvent["type"], React.ReactNode> = {
  login:    <LogIn className="w-3.5 h-3.5 text-primary" />,
  location: <MapPin className="w-3.5 h-3.5 text-success-green" />,
  geofence: <AlertTriangle className="w-3.5 h-3.5 text-error" />,
  expense:  <CreditCard className="w-3.5 h-3.5 text-tertiary" />,
  sync:     <RefreshCw className="w-3.5 h-3.5 text-secondary" />,
};

const BG_MAP: Record<FeedEvent["type"], string> = {
  login:    "bg-primary/10",
  location: "bg-success-green/10",
  geofence: "bg-error/10",
  expense:  "bg-tertiary/10",
  sync:     "bg-secondary/10",
};

export function ActivityFeed({ events = [] }: ActivityFeedProps) {
  if (events.length === 0) {
    return (
      <p className="text-sm text-on-surface-variant">No recent activity available.</p>
    );
  }

  return (
    <div className="space-y-3">
      {events.map((ev) => (
        <div
          key={ev.id}
          className="flex items-start gap-3 p-3 rounded-xl hover:bg-surface-container-high/50 transition-colors"
        >
          {/* Icon */}
          <div
            className={`flex items-center justify-center w-7 h-7 rounded-lg shrink-0 ${BG_MAP[ev.type]}`}
          >
            {ICON_MAP[ev.type]}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-on-surface truncate">
                {ev.actorName}
              </span>
              <span className="text-xs text-on-surface-variant shrink-0">
                {timeAgo(ev.timestamp)}
              </span>
            </div>
            <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
              {ev.message}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
