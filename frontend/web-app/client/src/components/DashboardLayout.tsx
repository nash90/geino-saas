import { Bell, Building2, Calendar, ChevronLeft, FolderKanban, Home, LayoutDashboard, ListTodo, LogOut, Settings, Loader2 } from "lucide-react";
import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { notificationsApi, type Notification } from '@/api/notifications';
import { toast } from 'sonner';
import { tasksApi } from '@/api/tasks';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [location, setLocation] = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const { logout, user, organizations } = useAuth();

  // Bell notification state
  const [bellNotifications, setBellNotifications] = useState<Notification[]>([]);
  const [bellUnreadCount, setBellUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  // Task progress notification state
  const [taskProgressUnreadCount, setTaskProgressUnreadCount] = useState(0);

  // System admin check: systemRoleCode = 1
  const isSystemAdmin = user?.systemRoleCode === 1;
  // Organization Manager: has at least one organization membership
  const isOrganizationManager = organizations.length > 0;

  // Load bell notifications when dropdown opens
  useEffect(() => {
    if (notificationOpen) {
      loadBellNotifications();
    }
  }, [notificationOpen]);

  // Load unread count on mount
  useEffect(() => {
    loadUnreadCount();
    loadTaskProgressUnreadCount();
  }, []);

  const loadBellNotifications = async () => {
    setLoadingNotifications(true);
    try {
      const data = await notificationsApi.list('bell', 20, 0);
      setBellNotifications(data.notifications);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const data = await notificationsApi.getUnreadCount('bell');
      setBellUnreadCount(data.count);
    } catch (error) {
      console.error('Failed to load unread count:', error);
    }
  };

  const loadTaskProgressUnreadCount = async () => {
    try {
      const data = await notificationsApi.getUnreadCount('task_progress');
      setTaskProgressUnreadCount(data.count);
    } catch (error) {
      console.error('Failed to load task progress unread count:', error);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationsApi.markAsRead(notificationId);
      loadBellNotifications();
      loadUnreadCount();
      loadTaskProgressUnreadCount();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead('bell');
      loadBellNotifications();
      loadUnreadCount();
      loadTaskProgressUnreadCount();
      toast.success('すべての通知を既読にしました');
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      toast.error('通知の更新に失敗しました');
    }
  };

  const handleTaskClick = async (taskId: string) => {
    try {
      // Navigate to task detail page
      setLocation(`/taskboard/${taskId}`);
      // Close notification dialog
      setNotificationOpen(false);
    } catch (error) {
      console.error('Failed to navigate to task:', error);
    }
  };

  const menuItems = [
    { path: "/", label: "ホーム", icon: Home },
    { path: "/taskboard", label: "タスクボード", icon: LayoutDashboard },
    { path: "/projects", label: "プロジェクト一覧", icon: FolderKanban },
    // { path: "/invites", label: "招待アカウント一覧", icon: UserPlus },
    { path: "/tasks-progress", label: "進捗ありタスク", icon: ListTodo },
    ...(isSystemAdmin || isOrganizationManager ? [
      { path: "/admin/organizations", label: "組織管理", icon: Building2 },
    ] : []),
    ...(isSystemAdmin ? [
      { path: "/system-admin", label: "システム管理", icon: Settings }
    ] : []),
  ];

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarCollapsed ? "w-20" : "w-64"
        } bg-gradient-to-b from-purple-600 via-pink-500 to-orange-400 text-white transition-all duration-300 flex flex-col`}
      >
        {/* Logo */}
        <div className="p-6 flex items-center justify-between">
          {!sidebarCollapsed && <h1 className="text-2xl font-bold">LOGO</h1>}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="text-white hover:bg-white/20"
          >
            <ChevronLeft className={`transition-transform ${sidebarCollapsed ? "rotate-180" : ""}`} />
          </Button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 px-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            return (
              <Link key={item.path} href={item.path}>
                <div
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg mb-2 transition-colors cursor-pointer ${
                    isActive ? "bg-white/30" : "hover:bg-white/10"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                  {!sidebarCollapsed && item.label === "進捗ありタスク" && taskProgressUnreadCount > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full px-2 py-1">
                      {taskProgressUnreadCount}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-3">
          <Button
            variant="ghost"
            className="w-full text-white hover:bg-white/10 justify-start"
            onClick={async () => {
              await logout();
              setLocation('/login');
            }}
          >
            <LogOut className="w-5 h-5" />
            {!sidebarCollapsed && <span className="ml-3">ログアウト</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b px-6 py-4 flex items-center justify-end gap-4">
          {/* Notification Bell */}
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={() => setNotificationOpen(true)}
          >
            <Bell className="w-5 h-5" />
            {bellUnreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            )}
          </Button>

          {/* User Avatar */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-orange-400 flex items-center justify-center text-white font-bold">
              {user?.firstname?.charAt(0) || '芸'}
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={async () => {
                await logout();
                setLocation('/login');
              }}
            >
              ログアウト
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 bg-gray-50 overflow-auto">{children}</main>
      </div>

      {/* Notification Dialog */}
      <Dialog open={notificationOpen} onOpenChange={setNotificationOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>通知一覧</span>
              {bellUnreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  className="text-blue-600 hover:text-blue-700"
                >
                  すべて既読にする
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {loadingNotifications ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : bellNotifications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                通知はありません
              </div>
            ) : (
              bellNotifications.map((notification) => {
                return (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-lg border cursor-pointer ${
                      notification.readAt ? "bg-gray-50" : "bg-blue-50 border-blue-200"
                    }`}
                    onClick={() => {
                      if (!notification.readAt) {
                        handleMarkAsRead(notification.id);
                      }
                    }}
                  >
                    {/* Line 1: Title | Date Time */}
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-sm font-medium flex-1">{notification.title}</p>
                      <p className="text-xs text-gray-400 whitespace-nowrap">
                        {new Date(notification.createdAt).toLocaleString('ja-JP', {
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>

                    {/* Line 2: Task name link */}
                    {notification.taskId && notification.taskTitle && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Mark as read when clicking task link
                          if (!notification.readAt) {
                            handleMarkAsRead(notification.id);
                          }
                          handleTaskClick(notification.taskId!);
                        }}
                        className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {notification.taskTitle}
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

