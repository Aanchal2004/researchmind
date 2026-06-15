import { CollectionDetailPage } from "@/components/collections/collection-detail-page";

export const metadata = { title: "Collection — ResearchMind" };

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CollectionDetailPage collectionId={id} />;
}
