import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { projectsApi } from "@/api/projects";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import type { ProjectWithMembers } from "@/types/entities";
import { toast } from "sonner";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { CreateProjectDialog } from "@/components/projects/CreateProjectDialog";
import { ProjectDetailDialog } from "@/components/projects/ProjectDetailDialog";
import { EditProjectDialog } from "@/components/projects/EditProjectDialog";
import { AddMemberDialog } from "@/components/projects/AddMemberDialog";

export default function Projects() {
  const { organizations } = useAuth();
  const { isOrganizationManagerOrAbove, isProjectManagerOrAbove } = usePermissions();
  
  const [projects, setProjects] = useState<ProjectWithMembers[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectWithMembers | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState<string>("all");

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

  const handleRemoveMember = async (userId: string) => {
    if (!selectedProject) return;

    if (!confirm('このメンバーをプロジェクトから削除しますか？')) {
      return;
    }

    try {
      await projectsApi.removeMember(selectedProject.id, userId);
      toast.success('メンバーを削除しました');
      
      // Reload project details
      const data = await projectsApi.get(selectedProject.id);
      setSelectedProject(data.project);
      loadProjects();
    } catch (error) {
      console.error('Failed to remove member:', error);
      toast.error('メンバーの削除に失敗しました');
    }
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

  const handleEditProject = async (data: {
    name: string;
    description: string;
    startDate: string;
    endDate: string;
    statusCode: number;
  }) => {
    if (!selectedProject) return;

    try {
      setSubmitting(true);
      await projectsApi.update(selectedProject.id, {
        name: data.name,
        description: data.description || undefined,
        startDate: data.startDate || undefined,
        endDate: data.endDate || undefined,
        statusCode: data.statusCode,
      });

      toast.success('プロジェクトを更新しました');
      setEditDialogOpen(false);

      // Reload project details
      const updatedData = await projectsApi.get(selectedProject.id);
      setSelectedProject(updatedData.project);
      loadProjects();
    } catch (error) {
      console.error('Failed to update project:', error);
      toast.error('プロジェクトの更新に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = () => {
    setDetailDialogOpen(false);
    setEditDialogOpen(true);
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

  // Filter projects by selected organization
  const filteredProjects = selectedOrganization === "all"
    ? projects
    : projects.filter(p => p.organizationId === selectedOrganization);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">プロジェクト一覧</h1>
          {organizations.length > 1 && (
            <Select value={selectedOrganization} onValueChange={setSelectedOrganization}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="組織でフィルター" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべての組織</SelectItem>
                {organizations.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
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
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {projects.length === 0
            ? "プロジェクトがありません"
            : "選択した組織にプロジェクトがありません"}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project) => (
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
        onRemoveMember={handleRemoveMember}
        onEdit={handleOpenEdit}
        getStatusLabel={getStatusLabel}
      />

      {/* Edit Project Dialog */}
      <EditProjectDialog
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          setDetailDialogOpen(true);
        }}
        project={selectedProject}
        onSubmit={handleEditProject}
        submitting={submitting}
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

