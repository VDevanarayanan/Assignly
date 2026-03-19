import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from "react-router-dom";
import { auth } from "../config/firebase";
import { signOut } from "firebase/auth";
import TaskModal from "../components/TaskModal";

export default function Delegated() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState(null);

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
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
    setActiveMenuId(null);
  };

  const deleteTask = async (taskId) => {
    if (!window.confirm("Are you sure you want to permanently delete this task you delegated?")) {
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
        fetchData();
      } else {
        alert(data.message || "Failed to delete task");
      }
    } catch (err) {
      console.error(err);
    }
    setActiveMenuId(null);
  };

  // Derive purely the tasks the user CREATED but assigned to someone ELSE
  const delegatedTasks = useMemo(() => {
    if (!user?.email) return [];
    return tasks.filter(t => t.creator === user.email && t.assignee !== user.email);
  }, [tasks, user]);

  const activeDelegations = delegatedTasks.filter(t => t.status !== "COMPLETED");
  const completedThisWeek = delegatedTasks.filter(t => {
    if (t.status !== "COMPLETED" || !t.completedAt) return false;
    const diffTime = new Date().getTime() - new Date(t.completedAt).getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) <= 7;
  });

  const highlightedTask = activeDelegations.length > 0 ? activeDelegations[0] : null;
  const listTasks = highlightedTask ? delegatedTasks.filter(t => t.id !== highlightedTask.id) : delegatedTasks;

  return (
    <div className="flex bg-background-light dark:bg-background-dark font-sans relative overflow-x-hidden min-h-screen">
      <div className={`flex h-full grow flex-col w-full transition-all duration-300 ${isModalOpen ? "blur-sm brightness-95" : ""}`}>
        
        {/* Top Header */}
        <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 dark:border-slate-800 px-6 md:px-10 py-3 bg-white dark:bg-slate-900 sticky top-0 z-40">
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Assignly Delegated</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Welcome back, {user?.name || "User"}!</p>
          </div>
          <div className="flex items-center gap-4 flex-1"></div>
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

        <main className="flex flex-col flex-1 px-4 md:px-10 lg:px-40 py-8 overflow-y-auto w-full">
          
          {/* Navigation Tabs */}
          <div className="mb-4">
            <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar">
              <Link to="/dashboard" className="flex items-center gap-2 border-b-2 border-transparent text-slate-500 hover:text-slate-700 px-6 pb-4 font-medium transition-colors whitespace-nowrap text-sm">
                <span className="material-symbols-outlined text-xl">assignment</span>
                My Tasks
              </Link>
              <Link to="/inbox" className="flex items-center gap-2 border-b-2 border-transparent text-slate-500 hover:text-slate-700 px-6 pb-4 font-medium transition-colors whitespace-nowrap text-sm">
                <span className="material-symbols-outlined text-xl">inbox</span>
                Inbox
                {tasks.filter(t => t.assignee === user?.email && t.status === "PENDING").length > 0 && (
                  <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full font-bold">
                    {tasks.filter(t => t.assignee === user?.email && t.status === "PENDING").length}
                  </span>
                )}
              </Link>
              <Link to="/delegated" className="flex items-center gap-2 border-b-2 border-primary text-primary px-6 pb-4 font-semibold whitespace-nowrap text-sm">
                <span className="material-symbols-outlined text-xl">group</span>
                Delegated
              </Link>
              <Link to="/analytics" className="flex items-center gap-2 border-b-2 border-transparent text-slate-500 hover:text-slate-700 px-6 pb-4 font-medium transition-colors whitespace-nowrap text-sm">
                <span className="material-symbols-outlined text-xl">insights</span>
                Analytics
              </Link>
            </div>
          </div>

          {/* Page Header & Action */}
          <div className="flex flex-wrap items-center justify-between pb-6 pt-4 gap-4">
            <div>
              <h2 className="text-slate-900 dark:text-white text-2xl font-bold tracking-tight">Delegated Tasks</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage tasks you have assigned to your team</p>
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity shadow-lg shadow-primary/30 active:scale-95"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              Delegate Task
            </button>
          </div>

          {/* Highlighted Task (Active) */}
          {highlightedTask && (
            <div className="p-0 mb-6">
              <div className="flex flex-col items-stretch justify-start rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden md:flex-row md:items-start group">
                <div 
                  className="w-full md:w-1/3 bg-center bg-no-repeat aspect-video bg-cover border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800" 
                  style={{backgroundImage: `url("https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2000&auto=format&fit=crop")`}}
                ></div>
                <div className="flex w-full grow flex-col items-stretch justify-center gap-2 py-6 px-6 sm:px-8 relative">
                  
                  {/* Action Menu Hook */}
                  <button 
                    onClick={() => setActiveMenuId(activeMenuId === highlightedTask.id ? null : highlightedTask.id)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <span className="material-symbols-outlined">more_horiz</span>
                  </button>
                  {activeMenuId === highlightedTask.id && (
                    <div className="absolute right-4 top-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg py-2 z-10 w-40 animate-in fade-in slide-in-from-top-2">
                       <button onClick={() => updateTaskStatus(highlightedTask.id, 'ACCEPTED')} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300">Accepted</button>
                       <button onClick={() => updateTaskStatus(highlightedTask.id, 'IN PROGRESS')} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300">In Progress</button>
                       <button onClick={() => updateTaskStatus(highlightedTask.id, 'COMPLETED')} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300">Completed</button>
                       <div className="h-px bg-slate-200 dark:bg-slate-700 my-1"></div>
                       <button onClick={() => deleteTask(highlightedTask.id)} className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 font-medium">Delete Task</button>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <span className={`size-2 rounded-full ${highlightedTask.status === "IN PROGRESS" ? "bg-amber-500" : "bg-blue-500"}`}></span>
                    <p className={`${highlightedTask.status === "IN PROGRESS" ? "text-amber-600 dark:text-amber-400" : "text-blue-600 dark:text-blue-400"} text-xs font-bold uppercase tracking-wider`}>
                      {highlightedTask.status || "Assigned"}
                    </p>
                  </div>
                  <h3 className="text-slate-900 dark:text-white text-xl font-bold leading-tight">{highlightedTask.title}</h3>
                  <div className="flex flex-col gap-4 mt-2">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-full bg-slate-200 dark:bg-slate-800 border-2 border-white dark:border-slate-900 flex items-center justify-center text-xs font-bold text-slate-500 shadow-sm">
                        {highlightedTask.assignee?.substring(0, 2).toUpperCase() || "UN"}
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 text-sm font-medium">Assignee: <span className="text-primary">{highlightedTask.assignee}</span></p>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-sm text-slate-500 italic max-w-sm truncate">{highlightedTask.description}</p>
                      <button className="flex min-w-[100px] cursor-pointer items-center justify-center rounded-xl h-9 px-4 bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-semibold">
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* List of Delegated Tasks */}
          <div className="flex flex-col gap-3">
            {listTasks.length === 0 && !highlightedTask ? (
              <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="size-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-300 mb-4">
                  <span className="material-symbols-outlined text-3xl">group_add</span>
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">No Delegations Yet</h3>
                <p className="text-slate-500 max-w-sm mx-auto mb-6 text-sm">You haven't assigned any tasks to the team. Start delegating to track their progress here.</p>
              </div>
            ) : (
              listTasks.map((task) => {
                const isCompleted = task.status === "COMPLETED";
                const badgeColor = isCompleted ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" : 
                                  task.status === "IN PROGRESS" ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" :
                                  "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400";

                return (
                  <div key={task.id} className={`flex items-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl hover:shadow-md transition-shadow relative ${isCompleted ? 'opacity-75' : ''}`}>
                    <div className="flex-1 flex items-center gap-4 min-w-0">
                      <div className="size-12 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-white dark:border-slate-900 flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-slate-500">{task.assignee?.substring(0, 2).toUpperCase() || "UN"}</span>
                      </div>
                      <div className="flex flex-col truncate">
                        <p className={`text-base font-semibold leading-normal truncate ${isCompleted ? 'text-slate-600 dark:text-slate-400 line-through' : 'text-slate-900 dark:text-white'}`}>{task.title}</p>
                        <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm truncate">Assigned to: <span className="font-medium">{task.assignee}</span></p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 sm:gap-6 shrink-0">
                      <div className="hidden md:flex flex-col items-end">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{isCompleted ? "Status" : "Due Date"}</span>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{isCompleted ? "Done" : (task.dueDate || "No Date")}</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className={`px-2.5 sm:px-3 py-1 rounded-full ${badgeColor} text-[10px] sm:text-xs font-bold whitespace-nowrap`}>
                          {task.status || "ACCEPTED"}
                        </div>
                      </div>
                      
                      {/* Dots Menu */}
                      <div className="relative">
                        <button 
                          onClick={() => setActiveMenuId(activeMenuId === task.id ? null : task.id)}
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
                        >
                          <span className="material-symbols-outlined">more_vert</span>
                        </button>
                        {activeMenuId === task.id && (
                          <div className="absolute right-0 top-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg py-2 z-10 w-40 animate-in fade-in slide-in-from-top-2">
                             <button onClick={() => updateTaskStatus(task.id, 'ACCEPTED')} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300">Accepted</button>
                             <button onClick={() => updateTaskStatus(task.id, 'IN PROGRESS')} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300">In Progress</button>
                             <button onClick={() => updateTaskStatus(task.id, 'COMPLETED')} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300">Completed</button>
                             <div className="h-px bg-slate-200 dark:bg-slate-700 my-1"></div>
                             <button onClick={() => deleteTask(task.id)} className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 font-medium">Delete Task</button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 pb-10">
            <div className="bg-primary/5 dark:bg-primary/10 p-5 rounded-xl border border-primary/10">
              <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Active Delegations</p>
              <p className="text-3xl font-bold text-primary mt-1">{activeDelegations.length}</p>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-900/10 p-5 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
              <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Completed This Week</p>
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{completedThisWeek.length}</p>
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/10 p-5 rounded-xl border border-amber-100 dark:border-amber-900/30">
              <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Tasks Tracked</p>
              <p className="text-3xl font-bold text-amber-600 dark:text-amber-400 mt-1">{delegatedTasks.length}</p>
            </div>
          </div>
        </main>
      </div>

      {/* Embedded strictly-typed Reusable Modal */}
      <TaskModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchData} 
        requireAssignee={true} // Strict requirement for "Delegated" page!
      />
    </div>
  );
}
