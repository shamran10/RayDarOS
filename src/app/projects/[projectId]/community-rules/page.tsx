import { CommunityRulesScreen } from "@/screens/community-rules-screen";

export default function CommunityRulesPage({ params }: { params: { projectId: string } }) {
  return <CommunityRulesScreen projectId={params.projectId} />;
}
