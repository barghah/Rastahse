import { getContactMessages, markMessageReplied } from "@/actions/admin";
import { MarkRepliedButton } from "@/components/admin/MarkRepliedButton";

export default async function AdminMessagesPage() {
  const hasSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  const messages = hasSupabase ? await getContactMessages() : [];
  const unread = messages.filter((m) => !m.replied).length;

  return (
    <div className="p-6 sm:p-8 space-y-6">
      <div>
        <h1 className="font-label text-xl text-white/90 font-light tracking-wide">Messages</h1>
        <p className="font-body text-xs text-white/30 mt-1">
          {messages.length} total · {unread} unread
        </p>
      </div>

      {messages.length === 0 ? (
        <div
          className="rounded-[14px] p-10 text-center border"
          style={{ backgroundColor: "#1c1917", borderColor: "rgba(255,255,255,0.07)" }}
        >
          <p className="font-body text-sm text-white/30">No messages yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className="rounded-[14px] p-5 border space-y-3"
              style={{
                backgroundColor: msg.replied ? "#161412" : "#1c1917",
                borderColor: msg.replied ? "rgba(255,255,255,0.05)" : "rgba(108,2,34,0.3)",
              }}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-label text-sm text-white/80">{msg.name}</p>
                    {!msg.replied && (
                      <span className="px-2 py-0.5 rounded-full bg-berry/20 text-berry font-label text-[9px] uppercase tracking-wider">
                        New
                      </span>
                    )}
                  </div>
                  <p className="font-body text-xs text-white/35 mt-0.5">{msg.email}</p>
                </div>
                <p className="font-body text-[10px] text-white/25 shrink-0">
                  {new Date(msg.created_at).toLocaleDateString("en-IN", {
                    day: "numeric", month: "short", year: "numeric",
                  })}
                </p>
              </div>

              {/* Subject */}
              {msg.subject && (
                <p className="font-label text-[11px] text-white/50 uppercase tracking-wider">
                  {msg.subject}
                </p>
              )}

              {/* Message body */}
              <p className="font-body text-sm text-white/65 leading-relaxed">
                {msg.message}
              </p>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-1">
                <a
                  href={`mailto:${msg.email}?subject=Re: ${encodeURIComponent(msg.subject ?? "Your message to Rastahse")}`}
                  className="px-4 py-1.5 border border-white/10 rounded-[8px] font-label text-[10px] text-white/40 hover:text-white hover:border-white/25 transition-all uppercase tracking-wider"
                >
                  Reply via email ↗
                </a>
                {!msg.replied && <MarkRepliedButton messageId={msg.id} />}
                {msg.replied && (
                  <span className="font-label text-[10px] text-white/20 uppercase tracking-wider">
                    ✓ Replied
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
