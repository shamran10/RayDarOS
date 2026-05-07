import { OpportunityDetailScreen } from "@/screens/opportunity-detail-screen";

export default function OpportunityDetailPage({ params }: { params: { opportunityId: string } }) {
  return <OpportunityDetailScreen opportunityId={params.opportunityId} />;
}
