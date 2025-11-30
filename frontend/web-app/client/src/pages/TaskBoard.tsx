import { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Upload, X, Calendar, Edit, Copy, Download } from "lucide-react";

type TaskType = "hold" | "todo" | "inProgress" | "done";

interface Task {
  id: string;
  title: string;
  description: string;
  type: string;
  assignees: string[];
  deadline: string;
  status: TaskType;
  color: "red" | "orange" | "green";
  images?: string[];
  comments?: Comment[];
}

interface Comment {
  id: string;
  author: string;
  text: string;
  file?: string;
  timestamp: string;
}

const INITIAL_TASKS: Task[] = [
  {
    id: "1",
    title: "ここにタスクが入ります",
    description: "ここにタスク詳細が入ります。ここにタスク詳細が入ります。ここにタスク詳細が入ります。",
    type: "タスク種別A",
    assignees: ["YH", "AS"],
    deadline: "2025/5/27",
    status: "hold",
    color: "red",
    images: [],
    comments: [],
  },
  {
    id: "2",
    title: "ここにタスクが入ります",
    description: "ここにタスク詳細が入ります。ここにタスク詳細が入ります。",
    type: "タスク種別B",
    assignees: ["YH", "AS"],
    deadline: "2025/5/27",
    status: "hold",
    color: "orange",
    images: [],
    comments: [],
  },
  {
    id: "3",
    title: "ここにタスクが入ります",
    description: "ここにタスク詳細が入ります。",
    type: "タスク種別A",
    assignees: ["YH", "AS"],
    deadline: "2025/5/27",
    status: "hold",
    color: "green",
    images: [],
    comments: [],
  },
  {
    id: "4",
    title: "ここにタスクが入ります",
    description: "ここにタスク詳細が入ります。ここにタスク詳細が入ります。ここにタスク詳細が入ります。",
    type: "タスク種別A",
    assignees: ["YH", "AS"],
    deadline: "2025/5/27",
    status: "todo",
    color: "red",
    images: [],
    comments: [],
  },
  {
    id: "5",
    title: "ここにタスクが入ります",
    description: "ここにタスク詳細が入ります。",
    type: "タスク種別B",
    assignees: ["YH", "AS"],
    deadline: "2025/5/27",
    status: "todo",
    color: "orange",
    images: [],
    comments: [],
  },
  {
    id: "6",
    title: "ここにタスクが入ります",
    description: "ここにタスク詳細が入ります。",
    type: "タスク種別A",
    assignees: ["YH", "AS"],
    deadline: "2025/5/27",
    status: "todo",
    color: "green",
    images: [],
    comments: [],
  },
  {
    id: "7",
    title: "ここにタスクが入ります",
    description: "ここにタスク詳細が入ります。ここにタスク詳細が入ります。ここにタスク詳細が入ります。",
    type: "タスク種別A",
    assignees: ["YH", "AS"],
    deadline: "2025/5/27",
    status: "inProgress",
    color: "red",
    images: [],
    comments: [],
  },
  {
    id: "8",
    title: "ここにタスクが入ります",
    description: "ここにタスク詳細が入ります。",
    type: "タスク種別B",
    assignees: ["YH", "AS"],
    deadline: "2025/5/27",
    status: "inProgress",
    color: "orange",
    images: [],
    comments: [],
  },
  {
    id: "9",
    title: "ここにタスクが入ります",
    description: "ここにタスク詳細が入ります。ここにタスク詳細が入ります。ここにタスク詳細が入ります。",
    type: "タスク種別A",
    assignees: ["YH", "AS"],
    deadline: "2025/5/27",
    status: "done",
    color: "red",
    images: [],
    comments: [],
  },
  {
    id: "10",
    title: "ここにタスクが入ります",
    description: "ここにタスク詳細が入ります。",
    type: "タスク種別B",
    assignees: ["YH", "AS"],
    deadline: "2025/5/27",
    status: "done",
    color: "orange",
    images: [],
    comments: [],
  },
  {
    id: "11",
    title: "ここにタスクが入ります",
    description: "ここにタスク詳細が入ります。",
    type: "タスク種別A",
    assignees: ["YH", "AS"],
    deadline: "2025/5/27",
    status: "done",
    color: "green",
    images: [],
    comments: [],
  },
];

function TaskCard({ task, onClick }: { task: Task; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const borderColorClass =
    task.color === "red"
      ? "border-red-500"
      : task.color === "orange"
      ? "border-orange-500"
      : "border-green-500";

  const badgeColorClass =
    task.type === "タスク種別A"
      ? "bg-green-100 text-green-700"
      : "bg-orange-100 text-orange-700";

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`bg-white rounded-lg shadow p-4 border-l-4 ${borderColorClass} cursor-pointer hover:shadow-md transition-shadow`}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-sm flex-1">{task.title}</h3>
        <span className={`text-xs px-2 py-1 rounded ${badgeColorClass} ml-2 whitespace-nowrap`}>
          {task.type}
        </span>
      </div>
      <p className="text-xs text-gray-600 mb-3">{task.description}</p>
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {task.assignees.map((assignee, index) => (
            <div
              key={index}
              className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-medium"
            >
              {assignee}
            </div>
          ))}
        </div>
        <span className="text-xs text-gray-500">期限 {task.deadline}</span>
      </div>
    </div>
  );
}

function Column({
  title,
  icon,
  tasks,
  columnId,
  onAddTask,
  onTaskClick,
}: {
  title: string;
  icon: string;
  tasks: Task[];
  columnId: TaskType;
  onAddTask: () => void;
  onTaskClick: (task: Task) => void;
}) {
  const { setNodeRef } = useDroppable({
    id: columnId,
  });

  return (
    <div ref={setNodeRef} className="bg-gray-50 rounded-lg p-4 min-h-[500px]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <h2 className="font-bold text-gray-700">{title}</h2>
          <span className="text-sm text-gray-500">{tasks.length}</span>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onAddTask}>
          <Plus className="h-4 w-4" />
        </Button>
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

function TaskCreateDialog({
  open,
  onOpenChange,
  columnId,
  onCreateTask,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columnId: TaskType | null;
  onCreateTask: (task: Omit<Task, "id">) => void;
}) {
  const [title, setTitle] = useState("");
  const [taskType, setTaskType] = useState("タスク種別A");
  const [assignee, setAssignee] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");

  const handleCreate = () => {
    if (!title || !columnId) return;

    const newTask: Omit<Task, "id"> = {
      title,
      description,
      type: taskType,
      assignees: assignee ? [assignee] : [],
      deadline,
      status: columnId,
      color: "red",
      images: [],
      comments: [],
    };

    onCreateTask(newTask);
    setTitle("");
    setTaskType("タスク種別A");
    setAssignee("");
    setDescription("");
    setDeadline("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>新規タスク作成</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>タスク名</Label>
            <Input
              placeholder="タイトルテキストが入ります"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <Label>タスク種別</Label>
            <Select value={taskType} onValueChange={setTaskType}>
              <SelectTrigger>
                <SelectValue placeholder="種別" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="タスク種別A">タスク種別A</SelectItem>
                <SelectItem value="タスク種別B">タスク種別B</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>担当者</Label>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <Select value={assignee} onValueChange={setAssignee}>
              <SelectTrigger>
                <SelectValue placeholder="ユーザー名" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="YH">YH</SelectItem>
                <SelectItem value="AS">AS</SelectItem>
                <SelectItem value="近藤">近藤</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>タスク詳細</Label>
            <Textarea
              placeholder="ここにタスク詳細が入ります"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>
          <div>
            <Button variant="outline" className="w-full">
              <Upload className="h-4 w-4 mr-2" />
              アップロード
            </Button>
          </div>
          <div>
            <Label>期限設定</Label>
            <div className="flex gap-2">
              <div className="flex-1 flex gap-2">
                <Input
                  type="date"
                  placeholder="期限入力"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
                <Button variant="ghost" size="icon">
                  <X className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Calendar className="h-4 w-4" />
                </Button>
              </div>

            </div>
          </div>
          <Button onClick={handleCreate} className="w-full">
            作成
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TaskDetailDialog({
  open,
  onOpenChange,
  task,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
}) {
  const [comment, setComment] = useState("");

  if (!task) return null;

  const statusLabel =
    task.status === "hold"
      ? "Hold"
      : task.status === "todo"
      ? "To do"
      : task.status === "inProgress"
      ? "進行中"
      : "完了";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] sm:max-w-[90vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">{task.title}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-6">
          {/* Left side */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Select defaultValue={task.status}>
                <SelectTrigger className="w-[150px] bg-orange-50 border-orange-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hold">Hold</SelectItem>
                  <SelectItem value="todo">To do</SelectItem>
                  <SelectItem value="inProgress">進行中</SelectItem>
                  <SelectItem value="done">完了</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" className="bg-green-50 text-green-700">
                承認
              </Button>
              <div className="ml-auto flex gap-2">
                <Button variant="ghost" size="icon">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <h3 className="font-bold mb-2">{task.title}</h3>
              <p className="text-sm text-gray-600">{task.description}</p>
            </div>

            <div className="flex items-center gap-2">
              {task.assignees.map((assignee, index) => (
                <div
                  key={index}
                  className="w-8 h-8 rounded-full bg-indigo-600 text-white text-sm flex items-center justify-center font-medium"
                >
                  {assignee}
                </div>
              ))}
              <span className="text-sm">近藤</span>
              <span className="ml-auto text-sm text-gray-500">期限 {task.deadline}</span>
            </div>

            <div>
              <h4 className="font-bold mb-2">画像</h4>
              <div className="bg-gray-200 rounded-lg p-8 flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <div className="text-4xl mb-2">🖼️</div>
                  <p className="text-sm">画像プレビュー</p>
                </div>
              </div>
              <Button variant="link" className="mt-2">
                <Download className="h-4 w-4 mr-2" />
                ダウンロード
              </Button>
            </div>
          </div>

          {/* Right side - Comments */}
          <div className="space-y-4">
            <h3 className="font-bold">コメント</h3>
            <Textarea
              placeholder="@コメント入力"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
            />
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1">
                <Upload className="h-4 w-4 mr-2" />
                アップロード
              </Button>
              <Button>送信</Button>
            </div>

            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="border-b pb-3">
                  <div className="text-xs text-gray-500 mb-1">2025/5/16 00:00</div>
                  <div className="flex items-start gap-2">
                    <div className="w-8 h-8 rounded-full bg-orange-500 text-white text-sm flex items-center justify-center font-medium">
                      近藤
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">修正をお願いします修正をお願いします修正をお願いします</p>
                      <Button variant="link" size="sm" className="p-0 h-auto text-xs">
                        file.jpg
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function TaskBoard() {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedColumnId, setSelectedColumnId] = useState<TaskType | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeTask = tasks.find((t) => t.id === active.id);
    if (!activeTask) return;

    // Check if dropped over a column or another task
    let targetColumnId: TaskType | null = null;

    // If dropped directly on a column
    if (["hold", "todo", "inProgress", "done"].includes(over.id as string)) {
      targetColumnId = over.id as TaskType;
    } else {
      // If dropped on another task, find that task's column
      const overTask = tasks.find((t) => t.id === over.id);
      if (overTask) {
        targetColumnId = overTask.status;
      }
    }

    if (targetColumnId && activeTask.status !== targetColumnId) {
      setTasks((tasks) =>
        tasks.map((t) => (t.id === active.id ? { ...t, status: targetColumnId } : t))
      );
    }
  };

  const handleAddTask = (columnId: TaskType) => {
    setSelectedColumnId(columnId);
    setCreateDialogOpen(true);
  };

  const handleCreateTask = (newTask: Omit<Task, "id">) => {
    const task: Task = {
      ...newTask,
      id: Date.now().toString(),
    };
    setTasks([...tasks, task]);
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setDetailDialogOpen(true);
  };

  const holdTasks = tasks.filter((t) => t.status === "hold");
  const todoTasks = tasks.filter((t) => t.status === "todo");
  const inProgressTasks = tasks.filter((t) => t.status === "inProgress");
  const doneTasks = tasks.filter((t) => t.status === "done");

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-4">
        <h1 className="text-xl font-bold">ここにプロジェクト名が入ります</h1>
        <Select defaultValue="project1">
          <SelectTrigger className="w-[300px]">
            <SelectValue placeholder="ここにプロジェクト名..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="project1">ここにプロジェクト名...</SelectItem>
            <SelectItem value="project2">プロジェクト2</SelectItem>
            <SelectItem value="project3">プロジェクト3</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div id="hold" className="min-h-[500px]">
            <Column
              title="Hold"
              icon="📋"
              tasks={holdTasks}
              columnId="hold"
              onAddTask={() => handleAddTask("hold")}
              onTaskClick={handleTaskClick}
            />
          </div>
          <div id="todo" className="min-h-[500px]">
            <Column
              title="To do"
              icon="📝"
              tasks={todoTasks}
              columnId="todo"
              onAddTask={() => handleAddTask("todo")}
              onTaskClick={handleTaskClick}
            />
          </div>
          <div id="inProgress" className="min-h-[500px]">
            <Column
              title="進行中"
              icon="⚡"
              tasks={inProgressTasks}
              columnId="inProgress"
              onAddTask={() => handleAddTask("inProgress")}
              onTaskClick={handleTaskClick}
            />
          </div>
          <div id="done" className="min-h-[500px]">
            <Column
              title="完了"
              icon="✅"
              tasks={doneTasks}
              columnId="done"
              onAddTask={() => handleAddTask("done")}
              onTaskClick={handleTaskClick}
            />
          </div>
        </div>

        <DragOverlay>
          {activeTask ? (
            <div className="bg-white rounded-lg shadow-lg p-4 border-l-4 border-gray-400 opacity-90">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-sm flex-1">{activeTask.title}</h3>
                <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700 ml-2">
                  {activeTask.type}
                </span>
              </div>
              <p className="text-xs text-gray-600 mb-3">{activeTask.description}</p>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <TaskCreateDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        columnId={selectedColumnId}
        onCreateTask={handleCreateTask}
      />

      <TaskDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        task={selectedTask}
      />
    </div>
  );
}

