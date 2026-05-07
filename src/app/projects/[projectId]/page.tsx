import { ProjectBrainScreen } from "@/screens/project-brain-screen";

export default function ProjectBrainPage({ params }: { params: { projectId: string } }) {
  return <ProjectBrainScreen projectId={params.projectId} />;
}
