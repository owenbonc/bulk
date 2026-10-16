"use client";

import { Check, UserPlus } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Avatar, EXIT, IconButton, Marquee, Pill, SPRING, SPRING_SNAPPY, cn } from "@/components/ui";
import { ME } from "@/lib/data";
import { pendingInvites } from "@/lib/requests";
import { basketCount } from "@/lib/split";
import { useApp } from "@/lib/store";
import type { OrderRequest, Participant } from "@/lib/types";

export type MemberMode = "filling" | "accept" | "delivery";

/** Accept round order: paid first, then pending, declined last. Stable within each group. */
function acceptRank(p: Participant): number {
  if (p.paid) return 0;
  if (p.declined) return 2;
  return 1;
}

function ordered(request: OrderRequest, mode: MemberMode): Participant[] {
  const host = request.participants.filter((p) => p.userId === request.hostId);
  const rest = request.participants.filter((p) => p.userId !== request.hostId);
  const list = [...host, ...rest];
  if (mode !== "accept") return list;
  return list.map((p, i) => ({ p, i })).sort((a, b) => acceptRank(a.p) - acceptRank(b.p) || a.i - b.i).map(({ p }) => p);
}

type Row = { id: string; name: string; member?: Participant };

/**
 * The "Party" rows: everyone in the party with a Host tag and a per-state trailing detail
 * (choosing / item count, Paid / Pending, add friend), then friends you've invited who haven't joined yet
 * ("invited…"), separated by hairlines that start at the name. Rows animate in as people join and slide into
 * place when the paid order changes. A row is keyed by the person, so an invited friend's row turns into their
 * member row in place when they join.
 */
export function MemberList({ request, mode }: { request: OrderRequest; mode: MemberMode }) {
  const { state, dispatch } = useApp();
  const rows: Row[] = [
    ...ordered(request, mode).map((p) => ({ id: p.userId, name: p.name, member: p })),
    ...(mode === "filling" ? pendingInvites(request).map((invite) => ({ id: invite.userId, name: invite.name })) : []),
  ];

  return (
    <ul className="flex flex-col">
      <AnimatePresence initial={false}>
        {rows.map(({ id, name, member: p }, i) => {
          const you = id === ME.userId;
          const invited = !p;
          return (
            <motion.li
              key={id}
              layout="position"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, transition: EXIT }}
              transition={SPRING}
              className="relative"
            >
              {i > 0 && <div aria-hidden className="absolute top-0 right-0 left-11 h-px bg-line" />}
              <div className="flex min-h-14 items-center gap-3 py-2">
                {/* Only the decorative avatar dims while the invite is pending; the text keeps its contrast. */}
                <Avatar name={name} you={you} className={cn("transition-opacity duration-200 ease-out", invited && "opacity-60")} />
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <Marquee className={cn("text-body transition-colors duration-200 ease-out", invited ? "text-ink-2" : "text-ink", you && "font-semibold")}>
                    {you ? "You" : name}
                  </Marquee>
                  {id === request.hostId && <Pill tone="outline" className="shrink-0">Host</Pill>}
                </div>
                {p ? (
                  <Trailing
                    participant={p}
                    mode={mode}
                    you={you}
                    friend={state.friends.includes(id)}
                    onAddFriend={() => dispatch({ type: "ADD_FRIEND", userId: id })}
                  />
                ) : (
                  <span className="shrink-0 text-meta text-ink-3">invited…</span>
                )}
              </div>
            </motion.li>
          );
        })}
      </AnimatePresence>
    </ul>
  );
}

function Trailing({
  participant: p,
  mode,
  you,
  friend,
  onAddFriend,
}: {
  participant: Participant;
  mode: MemberMode;
  you: boolean;
  friend: boolean;
  onAddFriend: () => void;
}) {
  if (mode === "filling") {
    if (!p.finalised) return <span className="shrink-0 text-meta text-ink-3">choosing…</span>;
    const n = basketCount(p.basket);
    return (
      <span className="tnum shrink-0 text-meta text-ink-2">
        {n} item{n === 1 ? "" : "s"}
      </span>
    );
  }

  if (mode === "accept") {
    if (p.paid) {
      return (
        <Pill tone="success" icon={<Check strokeWidth={2.5} />}>
          Paid
        </Pill>
      );
    }
    if (p.declined) return <Pill tone="offer">Declined</Pill>;
    return <Pill tone="neutral">Pending</Pill>;
  }

  if (you) return null;
  return (
    <div className="grid shrink-0 place-items-center">
      {friend ? (
        <motion.span
          key="added"
          className="[grid-area:1/1]"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={SPRING_SNAPPY}
        >
          <Pill tone="ink" icon={<Check strokeWidth={2.5} />} role="status">
            Added
          </Pill>
        </motion.span>
      ) : (
        <span key="add" className="[grid-area:1/1]">
          <IconButton aria-label={`Add ${p.name} as a friend`} size="sm" variant="outline" onClick={onAddFriend}>
            <UserPlus />
          </IconButton>
        </span>
      )}
    </div>
  );
}
