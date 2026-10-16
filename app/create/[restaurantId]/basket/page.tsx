import type { Metadata } from "next";
import { BasketScreen } from "@/components/basket/BasketScreen";

export const metadata: Metadata = { title: "Your order" };

/** W4 "Your order" for the party you're about to create (the host's draft). */
export default async function CreateBasketPage({ params }: { params: Promise<{ restaurantId: string }> }) {
  const { restaurantId } = await params;
  return <BasketScreen mode="host" restaurantId={restaurantId} />;
}
