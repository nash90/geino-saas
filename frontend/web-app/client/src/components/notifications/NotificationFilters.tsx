import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TaskStatus } from '@/types/entities';

interface NotificationFiltersProps {
  projects: Array<{ id: string; name: string }>;
  selectedProject: string;
  selectedStatus: string;
  onProjectChange: (value: string) => void;
  onStatusChange: (value: string) => void;
}

export function NotificationFilters({
  projects,
  selectedProject,
  selectedStatus,
  onProjectChange,
  onStatusChange,
}: NotificationFiltersProps) {
  return (
    <div className="flex items-center gap-4 mb-6">
      <Select value={selectedProject} onValueChange={onProjectChange}>
        <SelectTrigger className="w-[250px]">
          <SelectValue placeholder="プロジェクトで絞り込み" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">すべてのプロジェクト</SelectItem>
          {projects.map((project) => (
            <SelectItem key={project.id} value={project.id}>
              {project.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={selectedStatus} onValueChange={onStatusChange}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="ステータスで絞り込み" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">すべてのステータス</SelectItem>
          <SelectItem value={TaskStatus.HOLD.code.toString()}>{TaskStatus.HOLD.label}</SelectItem>
          <SelectItem value={TaskStatus.TODO.code.toString()}>{TaskStatus.TODO.label}</SelectItem>
          <SelectItem value={TaskStatus.IN_PROGRESS.code.toString()}>{TaskStatus.IN_PROGRESS.label}</SelectItem>
          <SelectItem value={TaskStatus.DONE.code.toString()}>{TaskStatus.DONE.label}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
