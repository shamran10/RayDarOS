import { KnowledgeBaseScreen } from "@/screens/knowledge-base-screen";

export default function MarketKnowledgePage({ params }: { params: { projectId: string } }) {
  return <KnowledgeBaseScreen projectId={params.projectId} kind="market" />;
}
