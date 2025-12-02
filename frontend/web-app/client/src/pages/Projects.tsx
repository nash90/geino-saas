import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";
import { format } from "date-fns";
import { projectsApi } from "@/api/projects";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import type { ProjectWithMembers } from "@/types/entities";
import { toast } from "sonner";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { CreateProjectDialog } from "@/components/projects/CreateProjectDialog";
import { ProjectDetailDialog } from "@/components/projects/ProjectDetailDialog";
import { AddMemberDialog } from "@/components/projects/AddMemberDialog";

export default function Projects() {
  const { user, organizations } = useAuth();
  const { isOrganizationManagerOrAbove, isProjectManagerOrAbove } = usePermissions();
  
  const [projects, setProjects] = useState<ProjectWithMembers[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectWithMembers | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await projectsApi.list();
      // Load full details for each project to get members
      const projectsWithMembers = await Promise.all(
        data.projects.map(async (project) => {
          try {
            const detailData = await projectsApi.get(project.id);
            return detailData.project;
          } catch {
            // If we can't access the project details, return basic info with empty members
            return { ...project, members: [] };
          }
        })
      );
      setProjects(projectsWithMembers);
    } catch (error) {
      console.error('Failed to load projects:', error);
      toast.error('プロジェクトの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleProjectClick = (project: ProjectWithMembers) => {
    setSelectedProject(project);
    setDetailDialogOpen(true);
  };

  const handleAddMemberSuccess = async () => {
    // Reload project details
    if (selectedProject) {
      const data = await projectsApi.get(selectedProject.id);
      setSelectedProject(data.project);
    }
    loadProjects();
  };

  const calculateProgress = (project: ProjectWithMembers) => {
    if (!project.startDate || !project.endDate) return 0;
    
    const start = new Date(project.startDate).getTime();
    const end = new Date(project.endDate).getTime();
    const now = new Date().getTime();
    
    if (now < start) return 0;
    if (now > end) return 100;
    
    const progress = ((now - start) / (end - start)) * 100;
    return Math.round(progress);
  };

  const handleCreateProject = async (data: {
    organizationId: string;
    name: string;
    description?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    try {
      setSubmitting(true);
      await projectsApi.create({
        organizationId: data.organizationId,
        name: data.name,
        description: data.description || undefined,
        startDate: data.startDate,
        endDate: data.endDate,
      });
      
      toast.success('プロジェクトを作成しました');
      setCreateDialogOpen(false);
      loadProjects();
    } catch (error) {
      console.error('Failed to create project:', error);
      toast.error('プロジェクトの作成に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusLabel = (statusCode: number) => {
    switch (statusCode) {
      case 1: return '進行中';
      case 2: return '完了';
      case 3: return 'アーカイブ';
      default: return '不明';
    }
  };

  // Check if user can create projects in any organization
  const canCreateProject = organizations.some(org => isOrganizationManagerOrAbove(org.id));

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">プロジェクト一覧</h1>
        {canCreateProject && (
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            新規プロジェクト作成
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          プロジェクトがありません
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={() => handleProjectClick(project)}
              calculateProgress={calculateProgress}
            />
          ))}
        </div>
      )}

      {/* Create Project Dialog */}
      <CreateProjectDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        organizations={organizations}
        isOrganizationManagerOrAbove={isOrganizationManagerOrAbove}
        onSubmit={handleCreateProject}
        submitting={submitting}
      />

      {/* Project Detail Dialog */}
      <ProjectDetailDialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        project={selectedProject}
        isProjectManagerOrAbove={isProjectManagerOrAbove}
        onAddMember={() => setAddMemberDialogOpen(true)}
        getStatusLabel={getStatusLabel}
      />

      {/* Add Member Dialog */}
      <AddMemberDialog
        open={addMemberDialogOpen}
        onClose={() => setAddMemberDialogOpen(false)}
        project={selectedProject}
        onSuccess={handleAddMemberSuccess}
      />
    </div>
  );
}

