import { Bell, Building2, Calendar, ChevronLeft, FolderKanban, Home, LayoutDashboard, ListTodo, LogOut, Settings, UserPlus } from "lucide-react";
import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { MOCK_NOTIFICATIONS } from "@/../../shared/const";
import { useAuth } from "@/contexts/AuthContext";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [location, setLocation] = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const { logout, user, organizations } = useAuth();

  // System admin check: systemRoleCode = 1
  const isSystemAdmin = user?.systemRoleCode === 1;
  // Organization Manager: has at least one organization membership
  const isOrganizationManager = organizations.length > 0;

  const menuItems = [
    { path: "/", label: "ホーム", icon: Home },
    { path: "/taskboard", label: "タスクボード", icon: LayoutDashboard },
    { path: "/projects", label: "プロジェクト一覧", icon: FolderKanban },
    { path: "/invites", label: "招待アカウント一覧", icon: UserPlus },
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
          {menuItems.map((item, index) => {
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
                  {!sidebarCollapsed && item.label === "進捗ありタスク" && (
                    <span className="ml-auto bg-yellow-400 text-purple-900 text-xs font-bold rounded px-2 py-1">
                      5
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
            {MOCK_NOTIFICATIONS.filter((n: any) => !n.read).length > 0 && (
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
            <DialogTitle>通知一覧</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {MOCK_NOTIFICATIONS.map((notification: any) => (
              <div
                key={notification.id}
                className={`p-3 rounded-lg border ${
                  notification.read ? "bg-gray-50" : "bg-blue-50 border-blue-200"
                }`}
              >
                <p className="text-sm font-medium">{notification.message}</p>
                <p className="text-xs text-gray-500 mt-1">{notification.timestamp}</p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

