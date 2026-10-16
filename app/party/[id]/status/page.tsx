import type { Metadata } from "next";
import { PartyStatus } from "@/components/status/PartyStatus";

export const metadata: Metadata = { title: "Your party" };

/** Party status: filling, accept and pay, on its way, or closed. */
export default async function PartyStatusPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PartyStatus id={id} />;
}
