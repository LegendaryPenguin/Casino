import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

export function EmptyState({
  title = "Nothing here yet",
  description,
  action,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-[#0c1210]/50 px-6 py-16 text-center">
      <Inbox className="mb-4 h-10 w-10 text-[#5c6b64]" aria-hidden />
      <p className="font-display text-lg text-[#c9d4ce]">{title}</p>
      {description ? (
        <p className="mt-2 max-w-md text-sm text-[#8fa39a]">{description}</p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
