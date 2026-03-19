import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Analytics from "./pages/Analytics";
import Delegated from "./pages/Delegated";
import Inbox from "./pages/Inbox";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/delegated" element={<Delegated />} />
        <Route path="/inbox" element={<Inbox />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;