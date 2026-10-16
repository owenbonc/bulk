"use client";

import { Check, Clock, Link2, Send } from "lucide-react";
import { Avatar, Button, Pill, Sheet, toast } from "@/components/ui";
import { ME } from "@/lib/data";
import { friendName, isInvited } from "@/lib/requests";
import { useApp } from "@/lib/store";
import type { OrderRequest, Restaurant } from "@/lib/types";

export interface InviteSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: OrderRequest;
  restaurant: Restaurant;
}

/**
 * "Invite friends" while a party is filling: your friends with an Invite button each (or where they are:
 * already in the party, or invited and on their way), plus a copyable invite link. In the demo, invited
 * friends are simulated: they accept a few seconds later and join with their own basket.
 */
export function InviteSheet({ open, onOpenChange, request, restaurant }: InviteSheetProps) {
  const { state, dispatch } = useApp();
  const friends = state.friends;

  const invite = (friendId: string, now: number) => {
    dispatch({ type: "INVITE_FRIEND", requestId: request.id, userId: ME.userId, friendId, now });
    toast.success(`Invited ${friendName(friendId)}`, { description: `They'll join your ${restaurant.name} party if they're in.` });
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
      description={`Bring friends into your ${restaurant.name} party. Every basket helps reach ${restaurant.deal.short}, and delivery is split between more people.`}
      footer={
        <Button variant="secondary" block icon={<Link2 />} onClick={copyLink}>
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
            const inParty = request.participants.some((p) => p.userId === id);
            const invited = isInvited(request, id);
            return (
              <li key={id} className="relative">
                {i > 0 && <div aria-hidden className="absolute top-0 right-0 left-11 h-px bg-line" />}
                <div className="flex min-h-14 items-center gap-3 py-2">
                  <Avatar name={name} />
                  <span className="min-w-0 flex-1 truncate text-body text-ink">{name}</span>
                  {inParty ? (
                    <Pill tone="success" icon={<Check strokeWidth={2.5} />}>
                      In the party
                    </Pill>
                  ) : invited ? (
                    <Pill tone="neutral" icon={<Clock />}>
                      Invited
                    </Pill>
                  ) : (
                    <Button size="sm" variant="secondary" icon={<Send />} onClick={() => invite(id, Date.now())} aria-label={`Invite ${name}`}>
                      Invite
                    </Button>
                  )}
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
