import type { Status } from "@/lib/schemas";
import { STATUS_LABELS, STATUS_STYLES } from "@/lib/status";

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset ${STATUS_STYLES[status].badge}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
