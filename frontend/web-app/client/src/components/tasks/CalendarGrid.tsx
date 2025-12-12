import type { TaskWithDetails } from "@/types/entities";
import { TaskStatus } from "@/types/entities";

interface CalendarGridProps {
  viewMode: "month" | "week";
  currentDate: Date;
  currentWeekStart: Date;
  calendarDays: (number | null)[];
  weekViewDays: Date[];
  weekDays: string[];
  getTasksForDate: (date: Date) => TaskWithDetails[];
  getDayTasks: (day: number) => TaskWithDetails[];
  onDateClick: (date: Date) => void;
}

export function CalendarGrid({
  viewMode,
  currentDate,
  currentWeekStart,
  calendarDays,
  weekViewDays,
  weekDays,
  getTasksForDate,
  getDayTasks,
  onDateClick,
}: CalendarGridProps) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

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

  const isSameDay = (date1: Date, date2: Date) => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  if (viewMode === "month") {
    return (
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day) => (
          <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
            {day}
          </div>
        ))}

        {calendarDays.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="aspect-square"></div>;
          }

          const tasks = getDayTasks(day);
          const date = new Date(year, month, day);
          const isToday = date.toDateString() === new Date().toDateString();

          return (
            <div
              key={day}
              className={`aspect-square border rounded-lg p-2 cursor-pointer hover:bg-gray-50 transition-colors ${
                isToday ? "border-purple-500 border-2" : "border-gray-200"
              }`}
              onClick={() => onDateClick(date)}
            >
              <div className="text-sm font-semibold mb-1">{day}</div>
              <div className="space-y-1">
                {tasks.slice(0, 3).map((task) => (
                  <div
                    key={task.id}
                    className={`text-xs text-white px-2 py-1 rounded truncate ${getStatusColorClass(task.statusCode)}`}
                    title={task.title}
                  >
                    {task.title}
                  </div>
                ))}
                {tasks.length > 3 && (
                  <div className="text-xs text-gray-500 px-2">+{tasks.length - 3} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Week view
  return (
    <div className="grid grid-cols-7 gap-2">
      {weekDays.map((day) => (
        <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
          {day}
        </div>
      ))}

      {weekViewDays.map((date, index) => {
        const tasks = getTasksForDate(date);
        const isToday = date.toDateString() === new Date().toDateString();

        return (
          <div
            key={index}
            className={`border rounded-lg p-2 cursor-pointer hover:bg-gray-50 transition-colors min-h-[200px] ${
              isToday ? "border-purple-300 border-2" : "border-gray-200"
            }`}
            onClick={() => onDateClick(date)}
          >
            <div className="text-sm font-semibold mb-2">
              {date.getMonth() + 1}/{date.getDate()}
            </div>
            <div className="space-y-1">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className={`text-xs text-white px-2 py-1 rounded truncate ${getStatusColorClass(task.statusCode)}`}
                  title={task.title}
                >
                  {task.title}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
