import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import StudyClosed from "./pages/StudyClosed";
import Introduction from "./pages/Introduction";
import { TooltipProvider } from "@/components/ui/tooltip";
import Study from "./pages/Study";
import Results from "./pages/Results";
import Information from "./pages/Information";
import Admin from "./pages/Admin";

const queryClient = new QueryClient();

// TooltipProvider noch in Zukunft richtig verwenden für entsprechende Tipps

const App = () => (
  <QueryClientProvider client={queryClient}>   
    <TooltipProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<StudyClosed />} />
          <Route path="/intro" element={<Introduction />} />
          <Route path="/info" element={<Information />} />
          <Route path="/study" element={<Study />} />
          <Route path="/results" element={<Results />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
