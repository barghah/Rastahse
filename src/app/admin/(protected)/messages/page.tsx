import { getContactMessages, markMessageReplied } from "@/actions/admin";
import { MarkRepliedButton } from "@/components/admin/MarkRepliedButton";

export default async function AdminMessagesPage() {
  const hasSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  const messages = hasSupabase ? await getContactMessages() : [];
  const unread = messages.filter((m) => !m.replied).length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl">
      <div>
        <h1 className="font-label text-xl sm:text-2xl text-ink font-semibold tracking-tight">Customer Messages</h1>
        <p className="font-body text-xs text-ink/50 mt-1">
          {messages.length} total message{messages.length !== 1 ? "s" : ""} · {unread} unread
        </p>
      </div>

      {messages.length === 0 ? (
        <div className="rounded-[18px] p-12 text-center bg-paper border border-brand shadow-soft">
          <p className="font-body text-sm text-ink/40">No messages yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`rounded-[18px] p-6 border shadow-soft space-y-4 transition-all ${
                msg.replied
                  ? "bg-paper/70 border-brand opacity-85"
                  : "bg-paper border-berry/30 ring-1 ring-berry/10"
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-label text-sm text-ink font-semibold">{msg.name}</p>
                    {!msg.replied ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-berry/10 border border-berry/20 text-berry font-label text-[9.5px] uppercase tracking-wider font-semibold">
                        New
                      </span>
                    ) : (
                      <span className="font-label text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider font-medium">
                        ✓ Replied
                      </span>
                    )}
                  </div>
                  <p className="font-body text-xs text-ink/50 mt-0.5">{msg.email}</p>
                </div>
                <p className="font-body text-[11px] text-ink/40 shrink-0">
                  {new Date(msg.created_at).toLocaleDateString("en-IN", {
                    day: "numeric", month: "short", year: "numeric",
                  })}
                </p>
              </div>

              {/* Subject */}
              {msg.subject && (
                <div>
                  <span className="font-label text-[11px] text-berry font-medium uppercase tracking-wider bg-berry/5 px-2.5 py-1 rounded-md border border-berry/15 inline-block">
                    {msg.subject}
                  </span>
                </div>
              )}

              {/* Message body */}
              <p className="font-body text-sm text-ink/80 leading-relaxed whitespace-pre-wrap bg-surface/40 p-4 rounded-[12px] border border-brand/60">
                {msg.message}
              </p>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-1">
                <a
                  href={`mailto:${msg.email}?subject=Re: ${encodeURIComponent(msg.subject ?? "Your message to Rastahse")}`}
                  className="px-4 py-2 border border-brand rounded-[10px] font-label text-[10.5px] text-ink/70 hover:text-berry hover:border-berry/30 bg-paper transition-all uppercase tracking-wider font-medium shadow-xs inline-flex items-center gap-1.5"
                >
                  Reply via email ↗
                </a>
                {!msg.replied && <MarkRepliedButton messageId={msg.id} />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
