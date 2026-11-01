import { useData } from './DataContext';
import type { Role } from '../types';

// Деректер енді Supabase-те (DataContext). Бұл файл экрандар үшін ыңғайлы қабық.
export type { Application, AppStatus, NewIdea } from './DataContext';

export function useIdeas() {
  const { projects, applications, addProject, apply, setAppStatus } = useData();
  return {
    allProjects: projects,
    applications,
    addIdea: addProject,
    apply: (projectId: string, role: Role, message: string) => apply(projectId, role, message),
    setStatus: setAppStatus,
  };
}
