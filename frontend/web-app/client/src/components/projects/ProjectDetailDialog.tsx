import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, X, Pencil } from "lucide-react";
import { format } from "date-fns";
import type { ProjectWithMembers } from "@/types/entities";

interface ProjectDetailDialogProps {
  open: boolean;
  onClose: () => void;
  project: ProjectWithMembers | null;
  isProjectManagerOrAbove: (projectId: string) => boolean;
  onAddMember: () => void;
  onRemoveMember: (userId: string) => void;
  onEdit: () => void;
  getStatusLabel: (statusCode: number) => string;
}

export function ProjectDetailDialog({
  open,
  onClose,
  project,
  isProjectManagerOrAbove,
  onAddMember,
  onRemoveMember,
  onEdit,
  getStatusLabel,
}: ProjectDetailDialogProps) {
  if (!project) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between pr-8">
            <DialogTitle>{project.name}</DialogTitle>
            {isProjectManagerOrAbove(project.id) && (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
              >
                <Pencil className="w-4 h-4 mr-1" />
                編集
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">プロジェクト概要</h4>
            <p className="text-sm text-gray-600">
              {project.description || '説明なし'}
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">ステータス</h4>
            <p className="text-sm text-gray-600">{getStatusLabel(project.statusCode)}</p>
          </div>

          {project.startDate && project.endDate && (
            <div>
              <h4 className="font-semibold mb-2">スケジュール</h4>
              <p className="text-sm text-gray-600">
                {format(new Date(project.startDate), 'yyyy/MM/dd')} 〜{' '}
                {format(new Date(project.endDate), 'yyyy/MM/dd')}
              </p>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold">メンバー ({project.members.length})</h4>
              {isProjectManagerOrAbove(project.id) && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddMember();
                  }}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  メンバー追加
                </Button>
              )}
            </div>
            {project.members.length > 0 ? (
              <div className="space-y-2">
                {project.members.map((member) => (
                  <div key={member.id} className="flex items-center gap-3 p-2 rounded hover:bg-gray-50">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-xs font-semibold">
                      {member.user.firstname.charAt(0)}{member.user.lastname.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">
                        {member.user.lastname} {member.user.firstname}
                      </div>
                      <div className="text-xs text-gray-500">{member.user.email}</div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {member.projectRoleCode === 1 ? 'PM' : 
                       member.projectRoleCode === 2 ? 'Geino' : 'Genba'}
                    </div>
                    {isProjectManagerOrAbove(project.id) && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveMember(member.userId);
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">メンバーがいません</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
