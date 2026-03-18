import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from "react-router-dom";
import { auth } from "../config/firebase";
import { signOut } from "firebase/auth";

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

  const handleCreateTask = async () => {
    if (!title) return alert("Task title is required");
    
    // Prevent manual entry of past dates
    if (deadline) {
      const selectedDate = new Date(deadline);
      const today = new Date(todayStr); // strict calendar date stripped of time
      if (selectedDate < today) {
        return alert("Deadline cannot be in the past.");
      }
    }

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

  const filteredAndSortedTasks = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Dynamically calculate urgency based on local calendar
    let result = tasks.map(t => {
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

  // For the date picker: prevent selecting past dates by setting the active minimum Date
  const todayStr = new Date().toISOString().split('T')[0];

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
              <a className="flex items-center gap-2 border-b-2 border-transparent text-slate-500 hover:text-slate-700 px-6 pb-4 font-medium transition-colors whitespace-nowrap" href="#">
                <span className="material-symbols-outlined text-xl">group</span>
                Delegated
              </a>
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
                      min={todayStr}
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