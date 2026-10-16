"use client";

import { useParams } from "next/navigation";
import { BasketScreen } from "@/components/basket/BasketScreen";

/** W4 "Your order" for the party you're about to create (the host's draft). */
export default function CreateBasketPage() {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  return <BasketScreen mode="host" restaurantId={restaurantId} />;
}
