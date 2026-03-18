import { useState } from "react";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

function App() {
  const [page, setPage] = useState("login");

  return page === "login" ? (
    <Login setPage={setPage} />
  ) : (
    <Signup setPage={setPage} />
  );
}

export default App;