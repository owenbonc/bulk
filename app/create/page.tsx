import type { Metadata } from "next";
import { CreateScreen } from "@/components/create/CreateScreen";

export const metadata: Metadata = { title: "Create a party" };

/** W6 Create a party: choose a restaurant. */
export default function CreatePage() {
  return <CreateScreen />;
}
