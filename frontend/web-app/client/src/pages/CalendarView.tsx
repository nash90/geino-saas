import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MOCK_CALENDAR_TASKS, MOCK_TASKS } from "@/../../shared/const";

export default function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date(2025, 5, 1)); // June 2025
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<"month" | "week">("month");
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const today = new Date();
    const currentDay = today.getDay();
    const diff = currentDay === 0 ? -6 : 1 - currentDay; // Adjust to Monday
    const monday = new Date(today);
    monday.setDate(today.getDate() + diff);
    return monday;
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDayOfWeek = firstDay.getDay();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const prevWeek = () => {
    const newWeekStart = new Date(currentWeekStart);
    newWeekStart.setDate(currentWeekStart.getDate() - 7);
    setCurrentWeekStart(newWeekStart);
  };

  const nextWeek = () => {
    const newWeekStart = new Date(currentWeekStart);
    newWeekStart.setDate(currentWeekStart.getDate() + 7);
    setCurrentWeekStart(newWeekStart);
  };

  const getTasksForDate = (date: Date) => {
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    return MOCK_CALENDAR_TASKS.filter((task: any) => task.date === dateStr);
  };

  const getDayTasks = (day: number) => {
    const date = new Date(year, month, day);
    return getTasksForDate(date);
  };

  const getColorClass = (color: string) => {
    switch (color) {
      case "green":
        return "bg-green-500";
      case "orange":
        return "bg-orange-500";
      case "red":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const completedTasks = MOCK_TASKS.filter((t: any) => t.completed).length;
  const totalTasks = MOCK_TASKS.length;
  const progressPercentage = (completedTasks / totalTasks) * 100;

  const weekDays = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

  const calendarDays = [];
  for (let i = 0; i < startDayOfWeek; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const tasksForSelectedDate = selectedDate ? getTasksForDate(selectedDate) : [];

  // Get current week days for week view
  const getCurrentWeekDays = () => {
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(currentWeekStart);
      day.setDate(currentWeekStart.getDate() + i);
      weekDays.push(day);
    }
    return weekDays;
  };

  const weekViewDays = getCurrentWeekDays();

  const isSameDay = (date1: Date, date2: Date) => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  return (
    <div className="p-6">
      {/* Calendar Header - Full Width */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={viewMode === "month" ? prevMonth : prevWeek}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h2 className="text-xl font-bold">
              {viewMode === "month" ? (
                `${year}年${month + 1}月`
              ) : (
                `${currentWeekStart.getMonth() + 1}月${currentWeekStart.getDate()}日-${(() => {
                  const weekEnd = new Date(currentWeekStart);
                  weekEnd.setDate(currentWeekStart.getDate() + 6);
                  return `${weekEnd.getMonth() + 1}月${weekEnd.getDate()}日`;
                })()}`
              )}
            </h2>
            <Button variant="ghost" size="icon" onClick={viewMode === "month" ? nextMonth : nextWeek}>
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>

          {/* Progress Bar in Center */}
          <div className="flex-1 max-w-md mx-8">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">進捗状況</span>
                <span className="font-bold">
                  {completedTasks}/{totalTasks}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 text-right">{Math.round(progressPercentage)}%</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">プロジェクト選択</span>
              <Select>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="選択してください" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  <SelectItem value="project1">プロジェクト1</SelectItem>
                  <SelectItem value="project2">プロジェクト2</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">タスク種別</span>
              <Select>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="選択してください" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  <SelectItem value="task1">タスク1</SelectItem>
                  <SelectItem value="task2">タスク2</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button
                variant={viewMode === "month" ? "default" : "outline"}
                onClick={() => setViewMode("month")}
              >
                月間表示
              </Button>
              <Button
                variant={viewMode === "week" ? "default" : "outline"}
                onClick={() => setViewMode("week")}
              >
                週間表示
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar and Tasks Section */}
      <div className="flex gap-6">
        {/* Calendar Section */}
        <div className="flex-1 bg-white rounded-lg shadow p-6">
          {viewMode === "month" ? (
            // Monthly View
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
                    onClick={() => setSelectedDate(date)}
                  >
                    <div className="text-sm font-semibold mb-1">{day}</div>
                    <div className="space-y-1">
                      {tasks.map((task: any) => (
                        <div
                          key={task.id}
                          className={`text-xs text-white px-2 py-1 rounded ${getColorClass(task.color)}`}
                        >
                          {task.title}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // Weekly View
            <div>
              <div className="grid grid-cols-7 gap-2">
                {weekDays.map((day) => (
                  <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
                    {day}
                  </div>
                ))}

                {weekViewDays.map((date, index) => {
                  const tasks = getTasksForDate(date);
                  const isToday = date.toDateString() === new Date().toDateString();
                  const isSelected = selectedDate && isSameDay(date, selectedDate);

                  return (
                    <div
                      key={index}
                      className={`border rounded-lg p-2 cursor-pointer hover:bg-gray-50 transition-colors min-h-[200px] ${
                        isSelected ? "border-purple-500 border-2" : isToday ? "border-purple-300 border-2" : "border-gray-200"
                      }`}
                      onClick={() => setSelectedDate(date)}
                    >
                      <div className="text-sm font-semibold mb-2">
                        {date.getMonth() + 1}/{date.getDate()}
                      </div>
                      <div className="space-y-1">
                        {tasks.map((task: any) => (
                          <div
                            key={task.id}
                            className={`text-xs text-white px-2 py-1 rounded ${getColorClass(task.color)}`}
                          >
                            {task.title}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar - Task List */}
        <div className="w-80 bg-white rounded-lg shadow p-6">
          {selectedDate ? (
            <>
              <h3 className="text-lg font-bold mb-4">
                {selectedDate.getMonth() + 1}月{selectedDate.getDate()}日
              </h3>
              <div className="mb-4">
                <p className="font-semibold mb-2">プロジェクト名</p>
              </div>
              <div className="space-y-3">
                {tasksForSelectedDate.length > 0 ? (
                  tasksForSelectedDate.map((task: any) => (
                    <div key={task.id} className="border-b pb-3">
                      <p className="text-sm font-medium">{task.title}</p>
                      <p className="text-xs text-gray-400 mt-1">期限 2025/5/27</p>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="border-b pb-3">
                      <p className="text-sm font-medium">ここにタスクが入ります</p>
                      <p className="text-xs text-gray-400 mt-1">期限 2025/5/27</p>
                    </div>
                    <div className="border-b pb-3">
                      <p className="text-sm font-medium">ここにタスクが入ります</p>
                      <p className="text-xs text-gray-400 mt-1">期限 2025/5/27</p>
                    </div>
                    <div className="border-b pb-3">
                      <p className="text-sm font-medium">ここにタスクが入ります</p>
                      <p className="text-xs text-gray-400 mt-1">期限 2025/5/27</p>
                    </div>
                    <div className="border-b pb-3">
                      <p className="text-sm font-medium">ここにタスクが入ります</p>
                      <p className="text-xs text-gray-400 mt-1">期限 2025/5/27</p>
                    </div>
                    <div className="border-b pb-3">
                      <p className="text-sm font-medium">ここにタスクが入ります</p>
                      <p className="text-xs text-gray-400 mt-1">期限 2025/5/27</p>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-500">日付を選択してください</p>
          )}
        </div>
      </div>
    </div>
  );
}

