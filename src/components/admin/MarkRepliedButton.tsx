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
      className="px-4 py-2 bg-berry text-paper font-label text-[10.5px] uppercase tracking-wider rounded-[10px] hover:bg-[#580118] disabled:opacity-50 transition-all active:scale-[0.98] shadow-xs cursor-pointer font-medium"
    >
      {isPending ? "Marking…" : "Mark Replied"}
    </button>
  );
}
