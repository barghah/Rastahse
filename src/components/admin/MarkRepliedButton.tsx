"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { markMessageReplied } from "@/actions/admin";

export function MarkRepliedButton({ messageId }: { messageId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() =>
        startTransition(async () => {
          await markMessageReplied(messageId);
          router.refresh();
        })
      }
      disabled={isPending}
      className="px-4 py-1.5 bg-berry/20 border border-berry/30 rounded-[8px] font-label text-[10px] text-berry hover:bg-berry/30 disabled:opacity-50 transition-all uppercase tracking-wider"
    >
      {isPending ? "Marking…" : "Mark Replied"}
    </button>
  );
}
