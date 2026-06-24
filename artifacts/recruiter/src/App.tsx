import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import Dashboard from "./pages/dashboard";
import JobsList from "./pages/jobs";
import JobDetail from "./pages/job-detail";
import JobForm from "./pages/job-form";
import CandidatesList from "./pages/candidates";
import CandidateDetail from "./pages/candidate-detail";
import CandidateForm from "./pages/candidate-form";
import Pipeline from "./pages/pipeline";
import { Layout } from "./components/layout";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/jobs" component={JobsList} />
        <Route path="/jobs/new" component={JobForm} />
        <Route path="/jobs/:id" component={JobDetail} />
        <Route path="/candidates" component={CandidatesList} />
        <Route path="/candidates/new" component={CandidateForm} />
        <Route path="/candidates/:id" component={CandidateDetail} />
        <Route path="/pipeline" component={Pipeline} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
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
