import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from "react-router-dom";
import { auth } from "../config/firebase";
import { signOut } from "firebase/auth";
import TaskModal from "../components/TaskModal";

export default function Dashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [activeMenuId, setActiveMenuId] = useState(null);
  
  // Filter & Sort State
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterCategory, setFilterCategory] = useState("All");
  const [sortUrgentFirst, setSortUrgentFirst] = useState(false);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchData = async () => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/");
    try {
      const res = await fetch("http://localhost:5001/dashboard", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        setTasks(data.tasks);
      } else {
        navigate("/");
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }
    fetchData();
  }, [navigate]);

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem("token");
    navigate("/");
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:5001/dashboard/task/${taskId}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        fetchData(); // Refresh tasks
      }
    } catch (err) {
      console.error(err);
    }
    setActiveMenuId(null);
  };

  const deleteTask = async (taskId) => {
    if (!window.confirm("Are you sure you want to permanently delete this completed task?")) {
      setActiveMenuId(null);
      return;
    }
    
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:5001/dashboard/task/${taskId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        fetchData(); // Refresh tasks
      } else {
        alert(data.message || "Failed to delete task");
      }
    } catch (err) {
      console.error(err);
    }
    setActiveMenuId(null);
  };

  // Legacy inline creation function migrated directly into `<TaskModal />`.

  const filteredAndSortedTasks = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Strict origin guard: only ingest tasks where the current user is technically the assignee. (Excludes out-bound Delegated tasks)
    const dashboardExclusiveTasks = tasks.filter(t => t.assignee === user?.email);

    // Dynamically calculate urgency based on local calendar
    let result = dashboardExclusiveTasks.map(t => {
      let taskObj = { ...t };
      if (taskObj.rawDeadline && taskObj.status !== "COMPLETED") {
        const d = new Date(taskObj.rawDeadline);
        // Calculate difference in milliseconds and then days
        const diffTime = d.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays >= 0 && diffDays <= 5) {
          taskObj.priority = "Urgent";
        } else {
          taskObj.priority = "Normal";
        }
      }
      return taskObj;
    });

    if (filterStatus !== "All") {
      result = result.filter(t => t.status === filterStatus);
    }

    if (filterCategory !== "All") {
      result = result.filter(t => t.category === filterCategory);
    }

    if (sortUrgentFirst) {
      result.sort((a, b) => {
        if (a.priority === "Urgent" && b.priority !== "Urgent") return -1;
        if (a.priority !== "Urgent" && b.priority === "Urgent") return 1;
        return 0;
      });
    }

    return result;
  }, [tasks, filterStatus, filterCategory, sortUrgentFirst]);


  return (
    <div className="flex h-screen bg-background-light dark:bg-background-dark font-sans relative">
      
      {/* Dashboard Background (Blurred under modal) */}
      <div className={`layout-container flex h-full grow flex-col transition-all duration-300 ${isModalOpen ? "blur-sm brightness-95" : ""}`}>
        
        {/* Top Navigation */}
        <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 dark:border-slate-800 px-6 md:px-10 py-3 bg-white dark:bg-background-dark sticky top-0 z-40">
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Dashboard</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Welcome back, {user?.name || "User"}!</p>
          </div>
          <div className="flex items-center gap-4 flex-1">
            {/* SEARCH BAR REMOVED AS REQUESTED */}
          </div>
          <div className="flex items-center gap-4">
            <button className="flex size-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors">
              <span className="material-symbols-outlined text-xl">notifications</span>
            </button>
            <button 
              className="px-4 py-2 text-sm font-bold text-slate-700 dark:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-full transition-colors"
              onClick={handleLogout}
            >
              Sign Out
            </button>
          </div>
        </header>

        <main className="max-w-[1200px] mx-auto w-full px-4 md:px-10 py-8">
          {/* Tabs & Header */}
          <div className="flex flex-col gap-6 mb-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Good morning, {user?.name || "Alex"}</h1>
                <p className="text-slate-500 mt-1">You have {tasks.length} tasks to complete today.</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-semibold shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all active:scale-95"
              >
                <span className="material-symbols-outlined text-lg">add</span>
                <span>New Task</span>
              </button>
            </div>

            <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar">
              <a className="flex items-center gap-2 border-b-2 border-primary text-primary px-6 pb-4 font-semibold whitespace-nowrap" href="#">
                <span className="material-symbols-outlined text-xl">assignment</span>
                My Tasks
              </a>
              <a className="flex items-center gap-2 border-b-2 border-transparent text-slate-500 hover:text-slate-700 px-6 pb-4 font-medium transition-colors whitespace-nowrap" href="#">
                <span className="material-symbols-outlined text-xl">inbox</span>
                Inbox
                <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs px-2 py-0.5 rounded-full">12</span>
              </a>
              <Link to="/delegated" className="flex items-center gap-2 border-b-2 border-transparent text-slate-500 hover:text-slate-700 px-6 pb-4 font-medium transition-colors whitespace-nowrap">
                <span className="material-symbols-outlined text-xl">group</span>
                Delegated
              </Link>
              <Link to="/analytics" className="flex items-center gap-2 border-b-2 border-transparent text-slate-500 hover:text-slate-700 px-6 pb-4 font-medium transition-colors whitespace-nowrap">
                <span className="material-symbols-outlined text-xl">insights</span>
                Analytics
              </Link>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-8 overflow-x-auto no-scrollbar">
            {/* Status Dropdown */}
            <div className="relative shrink-0">
              <select 
                value={filterStatus} 
                onChange={e => setFilterStatus(e.target.value)}
                className="flex items-center gap-2 pl-4 pr-10 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors appearance-none outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 cursor-pointer"
              >
                <option value="All">Status: All</option>
                <option value="ACCEPTED">Accepted</option>
                <option value="IN PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>

            {/* Category Dropdown */}
            <div className="relative shrink-0">
              <select 
                value={filterCategory} 
                onChange={e => setFilterCategory(e.target.value)}
                className="flex items-center gap-2 pl-4 pr-10 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors appearance-none outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 cursor-pointer"
              >
                <option value="All">Category: All</option>
                <option value="Design">Design</option>
                <option value="Engineering">Engineering</option>
                <option value="Product">Product</option>
                <option value="Marketing">Marketing</option>
                <option value="Strategy">Strategy</option>
                <option value="General">General</option>
              </select>
            </div>

            {/* Priority Sort Button */}
            <button 
              onClick={() => setSortUrgentFirst(!sortUrgentFirst)}
              className={`flex items-center gap-2 pl-4 pr-4 py-2 border rounded-xl text-sm font-medium transition-colors shrink-0 ${sortUrgentFirst ? 'bg-red-50 border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700'}`}
            >
              <span>{sortUrgentFirst ? 'Urgent First' : 'Priority: All'}</span>
              <span className="material-symbols-outlined text-sm">{sortUrgentFirst ? 'arrow_upward' : 'expand_more'}</span>
            </button>
          </div>

          {/* Task List or Empty State */}
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 mt-10 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
              <div className="size-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 mb-6 shadow-inner">
                <span className="material-symbols-outlined text-4xl">inventory_2</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">No tasks left!</h3>
              <p className="text-slate-500 max-w-sm mx-auto mb-8">You have completely cleared your queue for today. Enjoy your free time or delegate a new assignment.</p>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all hover:-translate-y-0.5"
              >
                <span className="material-symbols-outlined">add_task</span>
                Create New Task
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAndSortedTasks.map((task, i) => (
                <div key={task.id || i} className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-4 relative">
                      <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold px-2.5 py-1 rounded-lg">
                        {task.status?.toUpperCase() || "ACCEPTED"}
                      </span>
                      <button 
                        onClick={() => setActiveMenuId(activeMenuId === task?.id ? null : task?.id)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <span className="material-symbols-outlined">more_horiz</span>
                      </button>
                      
                      {/* Status Dropdown */}
                      {activeMenuId === task?.id && task?.id && (
                        <div className="absolute right-0 top-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg py-2 z-10 w-40 animate-in fade-in slide-in-from-top-2">
                          <button onClick={() => updateTaskStatus(task.id, 'ACCEPTED')} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors">Accepted</button>
                          <button onClick={() => updateTaskStatus(task.id, 'IN PROGRESS')} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors">In Progress</button>
                          <button onClick={() => updateTaskStatus(task.id, 'COMPLETED')} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors">Completed</button>
                          
                          {task.status === "COMPLETED" && (
                            <>
                              <div className="h-px bg-slate-200 dark:bg-slate-700 my-1"></div>
                              <button onClick={() => deleteTask(task.id)} className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors font-medium">Delete Task</button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{task.title}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed mb-4">{task.description}</p>
                    <div className="flex flex-wrap gap-2 mb-6">
                      <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs px-2.5 py-1 rounded-full font-medium">
                        {task.category || "General"}
                      </span>
                      {task.priority === "Urgent" && (
                        <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs px-2.5 py-1 rounded-full font-medium">
                          Urgent
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4 mt-6">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <span className={`material-symbols-outlined text-lg ${task.status === 'IN PROGRESS' ? 'text-primary' : ''}`}>calendar_today</span>
                      <span className="text-xs font-medium">{task.dueDate}</span>
                    </div>
                    <div className="flex -space-x-2">
                      <div className="size-7 rounded-full border-2 border-white dark:border-slate-900 bg-slate-200 bg-cover flex items-center justify-center text-[10px] font-bold text-slate-500">
                        {task.assignee ? task.assignee.substring(0, 2).toUpperCase() : "UN"}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Empty/Placeholder Task Card */}
              <div 
                onClick={() => setIsModalOpen(true)}
                className="group border-2 border-dashed border-slate-200 dark:border-slate-800 p-6 rounded-xl hover:border-primary/50 transition-colors flex flex-col items-center justify-center text-center cursor-pointer min-h-[220px]"
              >
                <div className="size-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 group-hover:text-primary mb-3">
                  <span className="material-symbols-outlined text-2xl">add</span>
                </div>
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Create a new task</p>
                <p className="text-xs text-slate-400 mt-1">Add details, deadlines and assignees</p>
              </div>
            </div>
          )}
        </main>
      </div>

      <TaskModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchData} 
      />
    </div>
  );
}