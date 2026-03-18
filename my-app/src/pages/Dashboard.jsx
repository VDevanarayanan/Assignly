import { useEffect, useState } from "react";
import "../styles/Dashboard.css";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/");
      return;
    }

    const fetchData = async () => {
      const res = await fetch("http://localhost:5000/dashboard", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (data.success) {
        setUser(data.user);
        setTasks(data.tasks);
      } else {
        navigate("/");
      }
    };

    fetchData();
  }, [navigate]);

  return (
    <div className="dashboard">
      <header className="topbar">
        <div className="logo">
          <div className="logo-box">✓</div>
          <h2>Assignly</h2>
        </div>

        <div className="user">
          <p>{user?.name}</p>
        </div>
      </header>

      <main className="content">
        <h1>Good morning, {user?.name}</h1>
        <p>You have {tasks.length} tasks today.</p>

        <div className="task-grid">
          {tasks.map((task, i) => (
            <div key={i} className="task-card">
              <h3>{task.title}</h3>
              <p>{task.description}</p>
              <span>{task.status}</span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}