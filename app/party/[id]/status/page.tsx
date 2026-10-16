import type { Metadata } from "next";
import { Suspense } from "react";
import { PartyStatus } from "@/components/status/PartyStatus";

export const metadata: Metadata = { title: "Your party" };

/** Party status: filling, accept and pay, on its way, collected, or closed. Reads `?handover=1` on the client, hence the Suspense boundary. */
export default async function PartyStatusPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={null}>
      <PartyStatus id={id} />
    </Suspense>
  );
}
