import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import { AppLayout } from "./components/layout/AppLayout";
import Dashboard from "./pages/dashboard";
import JobsList from "./pages/jobs/index";
import NewJob from "./pages/jobs/new";
import JobDetail from "./pages/jobs/[id]";
import CandidatesList from "./pages/candidates/index";
import NewCandidate from "./pages/candidates/new";
import CandidateDetail from "./pages/candidates/[id]";
import RankingsList from "./pages/rankings/index";

const queryClient = new QueryClient();

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        
        <Route path="/jobs" component={JobsList} />
        <Route path="/jobs/new" component={NewJob} />
        <Route path="/jobs/:id" component={JobDetail} />
        
        <Route path="/candidates" component={CandidatesList} />
        <Route path="/candidates/new" component={NewCandidate} />
        <Route path="/candidates/:id" component={CandidateDetail} />
        
        <Route path="/rankings" component={RankingsList} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
