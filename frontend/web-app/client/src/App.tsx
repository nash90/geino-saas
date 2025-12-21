import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import DashboardLayout from "./components/DashboardLayout";
import CalendarView from "./pages/CalendarView";
import Projects from "./pages/Projects";
// import Invites from "./pages/Invites";
import TasksProgress from "./pages/TasksProgress";
import TaskBoard from "./pages/TaskBoard";
import TaskDetail from "./pages/TaskDetail";
import SystemAdmin from "./pages/SystemAdmin";
import OrganizationsList from "./pages/admin/OrganizationsList";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    window.location.href = '/login';
    return null;
  }

  return <Component />;
}

function Router() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Switch>
      {/* Public routes - accessible without authentication */}
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      
      {/* Protected routes - require authentication */}
      {user ? (
        <>
          <Route path="/">
            {() => (
              <DashboardLayout>
                <CalendarView />
              </DashboardLayout>
            )}
          </Route>
          <Route path="/projects">
            {() => (
              <DashboardLayout>
                <Projects />
              </DashboardLayout>
            )}
          </Route>
          {/* <Route path="/invites">
            {() => (
              <DashboardLayout>
                <Invites />
              </DashboardLayout>
            )}
          </Route> */}
          <Route path="/calendar">
            {() => (
              <DashboardLayout>
                <CalendarView />
              </DashboardLayout>
            )}
          </Route>
          <Route path="/tasks-progress">
            {() => (
              <DashboardLayout>
                <TasksProgress />
              </DashboardLayout>
            )}
          </Route>
          <Route path="/taskboard">
            {() => (
              <DashboardLayout>
                <TaskBoard />
              </DashboardLayout>
            )}
          </Route>
          <Route path="/taskboard/:taskId">
            {() => (
              <DashboardLayout>
                <TaskDetail />
              </DashboardLayout>
            )}
          </Route>
          <Route path="/system-admin">
            {() => (
              <DashboardLayout>
                <SystemAdmin />
              </DashboardLayout>
            )}
          </Route>
          <Route path="/admin/organizations">
            {() => (
              <DashboardLayout>
                <OrganizationsList />
              </DashboardLayout>
            )}
          </Route>
          <Route path="/404" component={NotFound} />
        </>
      ) : (
        /* Redirect to login for all other routes when not authenticated */
        <Route path="/:rest*">
          {() => {
            window.location.href = '/login';
            return null;
          }}
        </Route>
      )}
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
