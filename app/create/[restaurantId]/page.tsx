import type { Metadata } from "next";
import { CreateMenuRoute } from "@/components/menu";
import { CATALOG } from "@/lib/data";

export async function generateMetadata({ params }: PageProps<"/create/[restaurantId]">): Promise<Metadata> {
  const { restaurantId } = await params;
  const restaurant = CATALOG.restaurants.find((r) => r.id === restaurantId);
  return { title: restaurant ? `Host at ${restaurant.name}` : "Create a party" };
}

/** W7/W8: the host's menu. Items go into the draft; the party is created from the basket page. */
export default async function CreateMenuPage({ params }: PageProps<"/create/[restaurantId]">) {
  const { restaurantId } = await params;
  return <CreateMenuRoute restaurantId={restaurantId} />;
}
