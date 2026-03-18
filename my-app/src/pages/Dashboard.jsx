import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../config/firebase";
import { signOut } from "firebase/auth";

export default function Dashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignee, setAssignee] = useState("");
  const [deadline, setDeadline] = useState("");
  const [category, setCategory] = useState("Design");

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

  const handleCreateTask = async () => {
    if (!title) return alert("Task title is required");
    setIsSubmitting(true);
    
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:5001/dashboard/task", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ title, description, assignee, deadline, category })
      });
      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        setTitle("");
        setDescription("");
        setAssignee("");
        setDeadline("");
        setCategory("Design");
        fetchData(); // Refresh tasks
      } else {
        alert("Failed to create task");
      }
    } catch (err) {
      console.error(err);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 min-h-screen relative overflow-x-hidden">
      
      {/* Dashboard Background (Blurred under modal) */}
      <div className={`layout-container flex h-full grow flex-col transition-all duration-300 ${isModalOpen ? "blur-sm brightness-95" : ""}`}>
        
        {/* Top Navigation */}
        <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 dark:border-slate-800 px-6 md:px-10 py-3 bg-white dark:bg-background-dark sticky top-0 z-40">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-4 text-primary">
              <span className="material-symbols-outlined text-3xl">flag</span>
              <h2 className="text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em]">Assignly</h2>
            </div>
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
              <a className="flex items-center gap-2 border-b-2 border-transparent text-slate-500 hover:text-slate-700 px-6 pb-4 font-medium transition-colors whitespace-nowrap" href="#">
                <span className="material-symbols-outlined text-xl">group</span>
                Delegated
              </a>
              <a className="flex items-center gap-2 border-b-2 border-transparent text-slate-500 hover:text-slate-700 px-6 pb-4 font-medium transition-colors whitespace-nowrap" href="#">
                <span className="material-symbols-outlined text-xl">insights</span>
                Analytics
              </a>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-3 mb-8 overflow-x-auto no-scrollbar">
            <button className="flex items-center gap-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-medium hover:bg-slate-50 transition-colors">
              <span>Status: All</span>
              <span className="material-symbols-outlined text-sm">expand_more</span>
            </button>
            <button className="flex items-center gap-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-medium hover:bg-slate-50 transition-colors">
              <span>Priority</span>
              <span className="material-symbols-outlined text-sm">expand_more</span>
            </button>
            <button className="flex items-center gap-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-medium hover:bg-slate-50 transition-colors">
              <span>Category</span>
              <span className="material-symbols-outlined text-sm">expand_more</span>
            </button>
          </div>

          {/* Task List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tasks.map((task, i) => (
              <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold px-2.5 py-1 rounded-lg">
                      {task.status?.toUpperCase() || "PENDING"}
                    </span>
                    <button className="text-slate-400 hover:text-slate-600">
                      <span className="material-symbols-outlined">more_horiz</span>
                    </button>
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
        </main>
      </div>

      {/* Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          {/* Modal Container */}
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[921px]">
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 animate-in slide-in-from-bottom-2">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Create New Task</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Fill in the details to delegate a new assignment.</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="px-8 py-6 overflow-y-auto space-y-6">
              {/* Assign To & Deadline Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Assign to</label>
                  <div className="relative group">
                    <input 
                      value={assignee}
                      onChange={(e) => setAssignee(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-slate-900 dark:text-slate-100" 
                      placeholder="colleague@company.com" 
                      type="email" 
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Deadline</label>
                  <div className="relative group">
                    <input 
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-slate-900 dark:text-slate-100" 
                      type="date" 
                    />
                  </div>
                </div>
              </div>

              {/* Task Title */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  Task title <span className="text-red-500">*</span>
                </label>
                <input 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-slate-900 dark:text-slate-100" 
                  placeholder="e.g. Q4 Financial Report Revamp" 
                  type="text" 
                />
              </div>

              {/* Description */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Description</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-slate-900 dark:text-slate-100 resize-none" 
                  placeholder="Break down the goals and expectations..." 
                  rows="3"
                ></textarea>
              </div>

              {/* Category */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Category</label>
                <div className="relative">
                  <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-slate-900 dark:text-slate-100 appearance-none"
                  >
                    <option value="Design">Design</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Product">Product</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Strategy">Strategy</option>
                    <option value="General">General</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
                </div>
              </div>

              {/* Optional Message */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  Personal message
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-500 uppercase tracking-wider">Optional</span>
                </label>
                <input 
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-slate-900 dark:text-slate-100" 
                  placeholder="Add a quick note for the assignee..." 
                  type="text" 
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-8 py-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-4">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2.5 rounded-xl font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateTask}
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl font-bold bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-lg">{isSubmitting ? "hourglass_empty" : "send"}</span>
                {isSubmitting ? "Creating..." : "Create Task"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}