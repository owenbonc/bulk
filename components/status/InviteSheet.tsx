"use client";

import { Check, Clock, Link2, Send } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRef } from "react";
import { Avatar, Button, EASE_OUT, EXIT, Marquee, Pill, Sheet, toast } from "@/components/ui";
import { ME } from "@/lib/data";
import { friendName, isInvited } from "@/lib/requests";
import { useApp } from "@/lib/store";
import type { OrderRequest, PickupPoint, Restaurant } from "@/lib/types";

type FriendState = "invite" | "invited" | "in";

export interface InviteSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: OrderRequest;
  restaurant: Restaurant;
  /** Where the party collects: invited friends collect there too. */
  pickup: PickupPoint;
}

/**
 * "Invite friends" while a party is filling: your friends with an Invite button each (or where they are:
 * already in the party, or invited and on their way), plus a copyable invite link. In the demo, invited
 * friends are simulated: they accept a few seconds later and join with their own basket.
 */
export function InviteSheet({ open, onOpenChange, request, restaurant, pickup }: InviteSheetProps) {
  const { state, dispatch } = useApp();
  const friends = state.friends;
  const inviteRefs = useRef(new Map<string, HTMLButtonElement>());
  const copyRef = useRef<HTMLButtonElement>(null);
  const stateOf = (id: string): FriendState =>
    request.participants.some((p) => p.userId === id) ? "in" : isInvited(request, id) ? "invited" : "invite";

  const invite = (friendId: string, now: number) => {
    dispatch({ type: "INVITE_FRIEND", requestId: request.id, userId: ME.userId, friendId, now });
    toast.success(`Invited ${friendName(friendId)}`, { description: `They'll join your ${restaurant.name} party at ${pickup.name} if they're in.` });
    // The pressed button turns into the "Invited" pill: move on to the next friend still to invite, else the link.
    const at = friends.indexOf(friendId);
    const next = [...friends.slice(at + 1), ...friends.slice(0, at)].find((id) => stateOf(id) === "invite");
    (next ? inviteRefs.current.get(next) : copyRef.current)?.focus();
  };

  const copyLink = async () => {
    const url = `${window.location.origin}/party/${request.id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Invite link copied");
    } catch {
      toast("Couldn't copy automatically", { description: url });
    }
  };

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="Invite friends"
      description={`Bring friends into your ${restaurant.name} party, collecting at ${pickup.name}. Every basket helps reach ${restaurant.deal.short}, and delivery is split between more people.`}
      footer={
        <Button ref={copyRef} variant="secondary" block icon={<Link2 />} onClick={copyLink}>
          Copy invite link
        </Button>
      }
    >
      {friends.length === 0 ? (
        <p className="text-body text-ink-2">
          No friends yet. Add people from a party you&apos;ve ordered with (the + next to their name), or share the link below.
        </p>
      ) : (
        <ul className="flex flex-col">
          {friends.map((id, i) => {
            const name = friendName(id);
            const status = stateOf(id);
            return (
              <li key={id} className="relative">
                {i > 0 && <div aria-hidden className="absolute top-0 right-0 left-11 h-px bg-line" />}
                <div className="flex min-h-14 items-center gap-3 py-2">
                  <Avatar name={name} />
                  <Marquee className="min-w-0 flex-1 text-body text-ink">{name}</Marquee>
                  {/* Invite → Invited → In the party cross-fade in place; the outgoing control leaves the flow. */}
                  <div className="relative grid shrink-0 place-items-center">
                    <AnimatePresence mode="popLayout" initial={false}>
                      <motion.span
                        key={status}
                        className="inline-flex"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1, transition: { duration: 0.18, ease: EASE_OUT } }}
                        exit={{ opacity: 0, transition: EXIT }}
                      >
                        {status === "in" ? (
                          <Pill tone="success" icon={<Check strokeWidth={2.5} />}>
                            In the party
                          </Pill>
                        ) : status === "invited" ? (
                          <Pill tone="neutral" icon={<Clock />}>
                            Invited
                          </Pill>
                        ) : (
                          <Button
                            ref={(el) => {
                              if (el) inviteRefs.current.set(id, el);
                              else inviteRefs.current.delete(id);
                            }}
                            size="sm"
                            variant="secondary"
                            icon={<Send />}
                            onClick={() => invite(id, Date.now())}
                            aria-label={`Invite ${name}`}
                          >
                            Invite
                          </Button>
                        )}
                      </motion.span>
                    </AnimatePresence>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <p className="mt-3 text-meta text-ink-3">Demo: invited friends are simulated and join a few seconds later.</p>
    </Sheet>
  );
}
