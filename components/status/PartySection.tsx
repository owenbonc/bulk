"use client";

import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";
import { EXIT, SPRING, SectionHeader } from "@/components/ui";
import { ME } from "@/lib/data";
import type { OrderRequest } from "@/lib/types";

/** The Party section is hidden while you're the host and nobody else has joined. */
export function showPartySection(request: OrderRequest): boolean {
  return !(request.hostId === ME.userId && request.participants.length <= 1);
}

/** "Party · n" section that animates in when the first person joins your party. */
export function PartySection({ request, children }: { request: OrderRequest; children: ReactNode }) {
  const show = showPartySection(request);
  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.section
          aria-labelledby="party-title"
          className="flex flex-col gap-3"
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
