import Link from "next/link";
import { formatDuration, formatKm, formatNumber } from "@/lib/utils";
import type { LeaderboardEntry, TopPerformerMetric } from "@/types";

function metricValue(row: LeaderboardEntry, metric: TopPerformerMetric): string {
  if (metric === "distance") return formatKm(row.distance);
  if (metric === "duration") return formatDuration(row.duration);
  if (metric === "expenses") return formatNumber(row.expenses ?? 0);
  return formatNumber(row.sessions);
}

export function LeaderboardTable({
  data,
  metric,
  highlightEmployeeId,
  isAdmin,
}: {
  data: LeaderboardEntry[];
  metric: TopPerformerMetric;
  highlightEmployeeId?: string;
  isAdmin?: boolean;
}) {
  if (!data.length) {
    return <p className="text-sm text-on-surface-variant text-center py-8">No leaderboard data available.</p>;
  }

  return (
    <div className="rounded-2xl overflow-hidden bg-surface-container">
      <table className="data-table w-full">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Employee</th>
            <th>Code</th>
            <th className="text-right">{metric.toUpperCase()}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => {
            const isMe = highlightEmployeeId === row.employeeId;
            return (
              <tr key={row.employeeId} className={isMe ? "bg-primary/10" : ""}>
                <td className="font-semibold">#{row.rank}</td>
                <td>
                  {isAdmin ? (
                    <Link href={`/admin/employees/${row.employeeId}`} className="hover:underline">
                      {row.employeeName}
                    </Link>
                  ) : (
                    row.employeeName
                  )}
                </td>
                <td className="text-on-surface-variant">{row.employeeCode ?? "-"}</td>
                <td className="text-right font-medium">{metricValue(row, metric)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
