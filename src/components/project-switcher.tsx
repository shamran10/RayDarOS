"use client";

import { useReydar } from "@/lib/store";

export function ProjectSwitcher() {
  const { state, activeProject, setActiveProjectId } = useReydar();
  const options = state.projects
    .filter((project) => project.status !== "archived")
    .map((project) => ({ label: project.name, value: project.id }));

  return (
    <div className="project-switcher">
      <div className="project-select-control">
        <label className="project-switcher-label" htmlFor="project-switcher">Project</label>
        <select
          id="project-switcher"
          value={activeProject.id}
          onChange={(event) => setActiveProjectId(event.currentTarget.value)}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span className="project-select-chevron" aria-hidden="true" />
      </div>
    </div>
  );
}
