import { MOCK_TASKS } from "@/../../shared/const";
import { Checkbox } from "@/components/ui/checkbox";

export default function TasksProgress() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">進捗ありタスク</h1>
      <div className="bg-white rounded-lg shadow">
        <div className="divide-y">
          {MOCK_TASKS.map((task: any) => (
            <div key={task.id} className="p-4 flex items-center gap-4 hover:bg-gray-50">
              <Checkbox checked={task.completed} />
              <div className="flex-1">
                <h3 className="font-semibold">{task.title}</h3>
                <p className="text-sm text-gray-500">
                  {task.projectName} · 期限: {task.deadline}
                </p>
              </div>
              <div className="text-sm text-gray-400">{task.deadline}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
