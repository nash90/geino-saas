import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import CalendarView from "./pages/CalendarView";
import Projects from "./pages/Projects";
import Invites from "./pages/Invites";
import TasksProgress from "./pages/TasksProgress";
import TaskBoard from "./pages/TaskBoard";

function Router() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path={"/"} component={CalendarView} />
        <Route path={"/projects"} component={Projects} />
        <Route path="/invites" component={Invites} />
        <Route path="/calendar" component={CalendarView} />
        <Route path="/tasks-progress" component={TasksProgress} />
        <Route path="/taskboard" component={TaskBoard} />
        <Route path={"/404"} component={NotFound} />
        {/* Final fallback route */}
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
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
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
