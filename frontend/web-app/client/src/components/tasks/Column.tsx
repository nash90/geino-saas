import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaskCard } from "./TaskCard";
import type { TaskWithDetails } from "@/types/entities";

interface ColumnProps {
  id: string;
  title: string;
  icon: string;
  tasks: TaskWithDetails[];
  onTaskClick: (task: TaskWithDetails) => void;
  onAddTask?: () => void;
  showAddButton?: boolean;
}

export function Column({
  id,
  title,
  icon,
  tasks,
  onTaskClick,
  onAddTask,
  showAddButton = false,
}: ColumnProps) {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div ref={setNodeRef} className="bg-gray-50 rounded-lg p-4 min-h-[500px]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <h2 className="font-bold text-gray-700">{title}</h2>
          <span className="text-sm text-gray-500">{tasks.length}</span>
        </div>
        {showAddButton && onAddTask && (
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onAddTask}>
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}
