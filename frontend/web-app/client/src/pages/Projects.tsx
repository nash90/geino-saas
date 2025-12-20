import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, ChevronLeft, ChevronRight } from "lucide-react";
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
import { ProjectStatus } from "@/types/entities";
import { toast } from "sonner";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { CreateProjectDialog } from "@/components/projects/CreateProjectDialog";
import { ProjectDetailDialog } from "@/components/projects/ProjectDetailDialog";
import { EditProjectDialog } from "@/components/projects/EditProjectDialog";
import { AddMemberDialog } from "@/components/projects/AddMemberDialog";
import { OrganizationMultiSelect } from "@/components/OrganizationMultiSelect";

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

  // Organization multi-select with localStorage
  const [selectedOrganizations, setSelectedOrganizations] = useState<string[]>(() => {
    const stored = localStorage.getItem('projects_selected_organizations');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return [];
      }
    }
    return [];
  });

  // Status filter
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, []);

  // Validate and initialize selected organizations
  useEffect(() => {
    if (organizations.length === 0) return;

    const orgIds = organizations.map(o => o.id);
    let validSelections = selectedOrganizations.filter(id => orgIds.includes(id));

    // If no valid selections, default to all organizations (up to 5)
    if (validSelections.length === 0) {
      validSelections = orgIds.slice(0, 5);
    }

    // Enforce max 5 limit
    if (validSelections.length > 5) {
      validSelections = validSelections.slice(0, 5);
    }

    const currentSelection = JSON.stringify(selectedOrganizations.slice().sort());
    const newSelection = JSON.stringify(validSelections.slice().sort());

    if (currentSelection !== newSelection) {
      setSelectedOrganizations(validSelections);
    }
  }, [organizations, selectedOrganizations]);

  // Persist selected organizations to localStorage
  useEffect(() => {
    localStorage.setItem('projects_selected_organizations', JSON.stringify(selectedOrganizations));
  }, [selectedOrganizations]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedOrganizations, selectedStatus]);

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
    const status = Object.values(ProjectStatus).find(s => s.code === statusCode);
    return status?.label || '不明';
  };

  // Check if user can create projects in any organization
  const canCreateProject = organizations.some(org => isOrganizationManagerOrAbove(org.id));

  // Filter projects by selected organizations and status
  let filteredProjects = projects;

  // Filter by organization
  if (selectedOrganizations.length > 0) {
    filteredProjects = filteredProjects.filter(p =>
      selectedOrganizations.includes(p.organizationId)
    );
  }

  // Filter by status
  if (selectedStatus !== "all") {
    filteredProjects = filteredProjects.filter(p =>
      p.statusCode === parseInt(selectedStatus)
    );
  }

  // Pagination
  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProjects = filteredProjects.slice(startIndex, endIndex);

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">プロジェクト一覧</h1>
          {canCreateProject && (
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              新規プロジェクト作成
            </Button>
          )}
        </div>

        <div className="flex items-center gap-4">
          {organizations.length > 0 && (
            <OrganizationMultiSelect
              organizations={organizations.map(o => ({ id: o.id, name: o.name }))}
              selectedOrganizationIds={selectedOrganizations}
              onSelectionChange={setSelectedOrganizations}
              maxSelections={5}
              placeholder="組織を選択 (最大5つ)"
            />
          )}

          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="ステータスでフィルター" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべてのステータス</SelectItem>
              <SelectItem value={ProjectStatus.ACTIVE.code.toString()}>{ProjectStatus.ACTIVE.label}</SelectItem>
              <SelectItem value={ProjectStatus.COMPLETED.code.toString()}>{ProjectStatus.COMPLETED.label}</SelectItem>
              <SelectItem value={ProjectStatus.ARCHIVED.code.toString()}>{ProjectStatus.ARCHIVED.label}</SelectItem>
            </SelectContent>
          </Select>

          <div className="ml-auto text-sm text-gray-500">
            {filteredProjects.length}件のプロジェクト
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {projects.length === 0
            ? "プロジェクトがありません"
            : "選択した条件に一致するプロジェクトがありません"}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onClick={() => handleProjectClick(project)}
                calculateProgress={calculateProgress}
              />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                前へ
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  // Show first page, last page, current page, and pages around current
                  const showPage =
                    page === 1 ||
                    page === totalPages ||
                    Math.abs(page - currentPage) <= 1;

                  if (!showPage) {
                    // Show ellipsis
                    if (page === currentPage - 2 || page === currentPage + 2) {
                      return <span key={page} className="px-2 text-gray-400">...</span>;
                    }
                    return null;
                  }

                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="w-10"
                    >
                      {page}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
              >
                次へ
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}
        </>
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

