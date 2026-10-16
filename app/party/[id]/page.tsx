import type { Metadata } from "next";
import { PartyMenuRoute } from "@/components/menu";
import { CATALOG, seedState } from "@/lib/data";

export async function generateMetadata({ params }: PageProps<"/party/[id]">): Promise<Metadata> {
  const { id } = await params;
  const restaurantId = seedState(0).requests.find((r) => r.id === id)?.restaurantId;
  const restaurant = CATALOG.restaurants.find((r) => r.id === restaurantId);
  return { title: restaurant?.name ?? "Party" };
}

/** W2/W3: an open party's menu. Anyone not finalised in it can browse and add; the first item joins. */
export default async function PartyMenuPage({ params }: PageProps<"/party/[id]">) {
  const { id } = await params;
  return <PartyMenuRoute id={id} />;
}
