export const COOKIE_NAME = "app_session_id";
export const ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365;

export const APP_TITLE = "芸能SaaS - プロジェクト管理システム";
export const APP_LOGO = "/logo.svg";

// モックデータ
export const MOCK_TASKS = [
  { id: 1, title: "ここにタスクが入ります", deadline: "2025/5/27", projectName: "プロジェクト名", completed: false },
  { id: 2, title: "ここにタスクが入ります", deadline: "2025/5/27", projectName: "プロジェクト名", completed: true },
  { id: 3, title: "ここにタスクが入ります", deadline: "2025/5/27", projectName: "プロジェクト名", completed: false },
  { id: 4, title: "ここにタスクが入ります", deadline: "2025/5/27", projectName: "プロジェクト名", completed: true },
  { id: 5, title: "ここにタスクが入ります", deadline: "2025/5/27", projectName: "プロジェクト名", completed: false },
];

export const MOCK_PROJECTS = [
  { 
    id: 1, 
    title: "ここにプロジェクト名が入ります", 
    schedule: "20/30",
    description: "これはプロジェクトの概要です。最初の40文字が一覧に表示されます。詳細はポップアップで確認できます。",
    startDate: "2025-05-01",
    endDate: "2025-06-30",
    members: ["田中 翔太", "佐藤 美咲"]
  },
  { 
    id: 2, 
    title: "ここにプロジェクト名が入ります", 
    schedule: "20/30",
    description: "プロジェクトの詳細な説明がここに入ります。",
    startDate: "2025-05-15",
    endDate: "2025-07-15",
    members: ["田中 翔太"]
  },
  { 
    id: 3, 
    title: "ここにプロジェクト名が入ります", 
    schedule: "20/30",
    description: "新しいプロジェクトの概要説明です。",
    startDate: "2025-06-01",
    endDate: "2025-08-31",
    members: ["佐藤 美咲", "鈴木 健太"]
  },
];

export const MOCK_NOTIFICATIONS = [
  { id: 1, message: "◯◯さんがコメントしました", timestamp: "2025/5/27 10:30", read: false },
  { id: 2, message: "◯◯さんがコメントしました", timestamp: "2025/5/27 10:30", read: false },
  { id: 3, message: "◯◯さんがコメントしました", timestamp: "2025/5/27 10:30", read: true },
];

export const MOCK_CALENDAR_TASKS = [
  { id: 1, title: "タスクが入ります", date: "2025-06-01", color: "green" },
  { id: 2, title: "タスクが入ります", date: "2025-06-05", color: "orange" },
  { id: 3, title: "タスクが入ります", date: "2025-06-07", color: "green" },
  { id: 4, title: "タスクが入ります", date: "2025-06-08", color: "orange" },
  { id: 5, title: "タスクが入ります", date: "2025-06-08", color: "red" },
  { id: 6, title: "タスクが入ります", date: "2025-06-09", color: "green" },
  { id: 7, title: "タスクが入ります", date: "2025-06-12", color: "orange" },
  { id: 8, title: "タスクが入ります", date: "2025-06-15", color: "red" },
  { id: 9, title: "タスクが入ります", date: "2025-06-18", color: "green" },
  { id: 10, title: "タスクが入ります", date: "2025-06-19", color: "orange" },
];
