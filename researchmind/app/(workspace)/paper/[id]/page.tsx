import { PaperDetailShell } from "@/components/paper/paper-detail-shell";

export const metadata = { title: "Paper — ResearchMind" };

export default async function PaperPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PaperDetailShell paperId={id} />;
}
