"use client";

import { useParams } from "next/navigation";
import { BasketScreen } from "@/components/basket/BasketScreen";

/** W4 "Your order" for a party you're joining. */
export default function PartyBasketPage() {
  const { id } = useParams<{ id: string }>();
  return <BasketScreen mode="join" partyId={id} />;
}
