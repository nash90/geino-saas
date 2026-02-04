import type { TaskWithDetails } from "@/types/entities";
import { TaskStatus } from "@/types/entities";
import { formatDateTime } from "@/lib/date-utils";

interface CalendarTaskListProps {
  selectedDate: Date | null;
  tasks: TaskWithDetails[];
  onTaskClick?: (task: TaskWithDetails) => void;
}

export function CalendarTaskList({ selectedDate, tasks, onTaskClick }: CalendarTaskListProps) {
  const getStatusColorClass = (statusCode: number): string => {
    switch (statusCode) {
      case TaskStatus.HOLD.code:
        return "bg-gray-500";
      case TaskStatus.TODO.code:
        return "bg-blue-500";
      case TaskStatus.IN_PROGRESS.code:
        return "bg-yellow-500";
      case TaskStatus.DONE.code:
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  if (!selectedDate) {
    return <p className="text-sm text-gray-500">日付を選択してください</p>;
  }

  return (
    <>
      <h3 className="text-lg font-bold mb-4">
        {selectedDate.getMonth() + 1}月{selectedDate.getDate()}日
      </h3>
      <div className="space-y-3">
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <div
              key={task.id}
              className="border-b pb-3 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
              onClick={() => onTaskClick?.(task)}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-2 h-2 rounded-full ${getStatusColorClass(task.statusCode)}`}></div>
                <p className="text-sm font-medium">{task.title}</p>
              </div>
              {task.description && (
                <p className="text-xs text-gray-600 mb-1 line-clamp-2">{task.description}</p>
              )}
              {task.assignee && (
                <p className="text-xs text-gray-500">
                  担当: {task.assignee.lastname} {task.assignee.firstname}
                </p>
              )}
              {task.deadline && (
                <p className="text-xs text-gray-400 mt-1">
                  期限: {formatDateTime(task.deadline)}
                </p>
              )}
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-500">この日のタスクはありません</p>
        )}
      </div>
    </>
  );
}
