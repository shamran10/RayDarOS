import { KnowledgeBaseScreen } from "@/screens/knowledge-base-screen";

export default function ProductKnowledgePage({ params }: { params: { projectId: string } }) {
  return <KnowledgeBaseScreen projectId={params.projectId} kind="product" />;
}
