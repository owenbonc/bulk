import type { Metadata } from "next";
import { BasketScreen } from "@/components/basket/BasketScreen";

export const metadata: Metadata = { title: "Your order" };

/** W4 "Your order" for a party you're joining. */
export default async function PartyBasketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BasketScreen mode="join" partyId={id} />;
}
