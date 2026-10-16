"use client";

import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";
import { EXIT, SPRING, SectionHeader } from "@/components/ui";
import { ME } from "@/lib/data";
import { pendingInvites } from "@/lib/requests";
import type { OrderRequest } from "@/lib/types";

/** The Party section is hidden while you're alone in the party (whether or not you created it) and nobody is invited. */
export function showPartySection(request: OrderRequest): boolean {
  return request.participants.some((p) => p.userId !== ME.userId) || pendingInvites(request).length > 0;
}

/** "Party · n" section that animates in when someone else is in the party with you. */
export function PartySection({ request, children }: { request: OrderRequest; children: ReactNode }) {
  const show = showPartySection(request);
  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.section
          aria-labelledby="party-title"
          className="flex flex-col gap-group"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0, transition: SPRING }}
          exit={{ opacity: 0, transition: EXIT }}
        >
          <SectionHeader id="party-title" title="Party" count={request.participants.length} />
          {children}
        </motion.section>
      )}
    </AnimatePresence>
  );
}
