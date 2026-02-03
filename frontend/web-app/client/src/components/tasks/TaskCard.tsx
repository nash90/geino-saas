import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { TaskWithDetails } from "@/types/entities";

interface TaskCardProps {
  task: TaskWithDetails;
  onClick: () => void;
  isDraggable?: boolean;
}

export function TaskCard({ task, onClick, isDraggable = true }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    disabled: !isDraggable,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getAssigneeInitials = (firstname?: string, lastname?: string) => {
    if (!firstname || !lastname) return "??";
    return `${lastname[0]}${firstname[0]}`.toUpperCase();
  };

  const getPriorityColor = (priorityCode?: number) => {
    switch (priorityCode) {
      case 4:
        return "border-red-500"; // Urgent
      case 3:
        return "border-orange-500"; // High
      case 2:
        return "border-yellow-500"; // Medium
      case 1:
        return "border-green-500"; // Low
      default:
        return "border-gray-300";
    }
  };

  const getTypeLabel = (typeCode?: number) => {
    return typeCode === 1 ? "タスク種別A" : typeCode === 2 ? "タスク種別B" : "";
  };

  const badgeColorClass =
    task.typeCode === 1 ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700";

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...(isDraggable ? listeners : {})}
      onClick={onClick}
      className={`bg-white rounded-lg shadow p-4 border-l-4 ${getPriorityColor(task.priorityCode)} cursor-pointer hover:shadow-md transition-shadow ${!isDraggable ? 'opacity-90' : ''}`}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-sm flex-1">{task.title}</h3>
        {task.typeCode && (
          <span className={`text-xs px-2 py-1 rounded ${badgeColorClass} ml-2 whitespace-nowrap`}>
            {getTypeLabel(task.typeCode)}
          </span>
        )}
      </div>
      {task.description && (
        <p className="text-xs text-gray-600 mb-3 line-clamp-2">{task.description}</p>
      )}
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {task.assignee && (
            <div
              className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-medium"
              title={`${task.assignee.lastname} ${task.assignee.firstname}`}
            >
              {getAssigneeInitials(task.assignee.firstname, task.assignee.lastname)}
            </div>
          )}
        </div>
        {task.deadline && (
          <span className="text-xs text-gray-500">
            期限 {new Date(task.deadline).toLocaleDateString("ja-JP")}
          </span>
        )}
      </div>
    </div>
  );
}
