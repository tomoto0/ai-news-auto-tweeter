import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import NewsFeed from "./pages/NewsFeed";
import TweetHistory from "./pages/TweetHistory";
import Schedule from "./pages/Schedule";
import AccountsManager from "./pages/AccountsManager";
import AccountSchedule from "./pages/AccountSchedule";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/settings" component={Settings} />
      <Route path="/news" component={NewsFeed} />
      <Route path="/history" component={TweetHistory} />
      <Route path="/schedule" component={Schedule} />
      <Route path="/accounts" component={AccountsManager} />
      <Route path="/accounts/schedule" component={AccountSchedule} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
