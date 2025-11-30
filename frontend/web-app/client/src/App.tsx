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
import Invites from "./pages/Invites";
import TasksProgress from "./pages/TasksProgress";
import TaskBoard from "./pages/TaskBoard";
import Login from "./pages/Login";
import Register from "./pages/Register";

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
  const { user } = useAuth();

  return (
    <Switch>
      {/* Public routes */}
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      
      {/* Protected routes */}
      {user ? (
        <DashboardLayout>
          <Switch>
            <Route path="/" component={CalendarView} />
            <Route path="/projects" component={Projects} />
            <Route path="/invites" component={Invites} />
            <Route path="/calendar" component={CalendarView} />
            <Route path="/tasks-progress" component={TasksProgress} />
            <Route path="/taskboard" component={TaskBoard} />
            <Route path="/404" component={NotFound} />
            <Route component={NotFound} />
          </Switch>
        </DashboardLayout>
      ) : (
        <Route component={Login} />
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
