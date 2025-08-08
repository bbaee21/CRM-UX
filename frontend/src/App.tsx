import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import TemplatePage from "./pages/TemplatePage";
import ResearchPage from "./pages/ResearchPage";
import BoardPage from "./pages/BoardPage";

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <main className="min-h-[calc(100vh-56px)]">
        <Routes>
          <Route path="/"           element={<Home />} />
          <Route path="/templates"  element={<TemplatePage />} />
          <Route path="/research"   element={<ResearchPage />} />
          <Route path="/board"      element={<BoardPage />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}