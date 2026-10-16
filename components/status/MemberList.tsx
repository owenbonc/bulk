"use client";

import { Check, UserPlus } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Avatar, IconButton, Marquee, Pill, SPRING, SPRING_SNAPPY, cn } from "@/components/ui";
import { ME } from "@/lib/data";
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

/**
 * The "Party" rows: everyone in the party with a Host tag and a per-state trailing detail
 * (choosing / item count, Paid / Pending, add friend), separated by hairlines that start at the name. Rows animate in as people join and
 * slide into place when the paid order changes.
 */
export function MemberList({ request, mode }: { request: OrderRequest; mode: MemberMode }) {
  const { state, dispatch } = useApp();
  const members = ordered(request, mode);

  return (
    <ul className="flex flex-col">
      <AnimatePresence initial={false}>
        {members.map((p, i) => {
          const you = p.userId === ME.userId;
          return (
            <motion.li
              key={p.userId}
              layout="position"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={SPRING}
              className="relative"
            >
              {i > 0 && <div aria-hidden className="absolute top-0 right-0 left-11 h-px bg-line" />}
              <div className="flex min-h-14 items-center gap-3 py-2">
                <Avatar name={p.name} you={you} />
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <Marquee className={cn("text-body text-ink", you && "font-semibold")}>{you ? "You" : p.name}</Marquee>
                  {p.userId === request.hostId && <Pill tone="outline" className="shrink-0">Host</Pill>}
                </div>
                <Trailing participant={p} mode={mode} you={you} friend={state.friends.includes(p.userId)} onAddFriend={() => dispatch({ type: "ADD_FRIEND", userId: p.userId })} />
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
