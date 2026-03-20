import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from "react-router-dom";
import Header from "../components/Header";
import Tabs from "../components/Tabs";

export default function Inbox() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

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


  const respondToTask = async (taskId, newStatus) => {
    if (isProcessing) return;
    setIsProcessing(true);
    
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
      } else {
        alert("Failed to update task status.");
      }
    } catch (err) {
      console.error(err);
    }
    setIsProcessing(false);
  };

  const dismissNotification = async (taskId) => {
    if (isProcessing) return;
    setIsProcessing(true);
    
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:5001/dashboard/task/${taskId}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ clearJoinedAt: true })
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      } else {
        alert("Failed to dismiss notification.");
      }
    } catch (err) {
      console.error(err);
    }
    setIsProcessing(false);
  };

  const pendingTasks = useMemo(() => {
    if (!user?.email) return [];
    return tasks.filter(t => t.assignee === user.email && t.status === "PENDING" && t.creator !== user.email);
  }, [tasks, user]);

  const joinedNotifications = useMemo(() => {
    if (!user?.email) return [];
    return tasks.filter(t => t.creator === user.email && t.assignee !== user.email && t.joinedAt);
  }, [tasks, user]);

  return (
    <div className="flex bg-background-light dark:bg-background-dark font-sans relative overflow-x-hidden min-h-screen">
      <div className="flex h-full grow flex-col w-full transition-all duration-300">
        
        <Header title="Assignly" user={user} tasks={tasks} />

        <main className="flex flex-col flex-1 px-4 md:px-10 lg:px-40 py-8 overflow-y-auto w-full">
          
          {/* Navigation Tabs */}
          <Tabs tasks={tasks} user={user} />

          <div className="flex flex-col pb-6 pt-4 gap-1">
            <h2 className="text-slate-900 dark:text-white text-2xl font-bold tracking-tight">Incoming Tasks</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Review assignments delegated to you by colleagues.</p>
          </div>

          {/* Inbox Payload Grid */}
          <div className="flex flex-col gap-4">
            {pendingTasks.length === 0 && joinedNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="size-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-300 mb-4 shadow-inner">
                  <span className="material-symbols-outlined text-3xl">check_circle</span>
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">You're All Caught Up!</h3>
                <p className="text-slate-500 max-w-sm mx-auto text-sm">There are no pending task delegations or notifications waiting for you right now.</p>
              </div>
            ) : (
              <>
                {joinedNotifications.map((task, i) => (
                  <div key={`join-${task.id}`} style={{ animationDelay: `${i * 100}ms` }} className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/50 p-6 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 animate-slide-in relative grid grid-cols-1 gap-6 items-center group">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                          Account Created
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-emerald-900 dark:text-emerald-100">{task.title}</h3>
                      <p className="text-emerald-700 dark:text-emerald-300 text-sm leading-relaxed max-w-2xl">
                        <span className="font-bold">{task.assignee}</span> has successfully signed up for Assignly. They have automatically received your delegated task.
                      </p>
                    </div>
                  </div>
                ))}

                {pendingTasks.map((task, i) => (
                  <div key={task.id} style={{ animationDelay: `${(i + joinedNotifications.length) * 100}ms` }} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 animate-slide-in relative grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 items-center group">
                    
                    {/* Task Data */}
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                          {task.category || "General"}
                        </span>
                        {task.dueDate && (
                          <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-xs font-semibold">
                            <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                            Due {task.dueDate}
                          </div>
                        )}
                      </div>
                      
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">{task.title}</h3>
                      <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed max-w-2xl">{task.description}</p>
                      
                      <div className="flex items-center gap-3 mt-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <div className="size-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
                          <span className="text-xs font-bold text-slate-500">{task.creator?.substring(0, 2).toUpperCase() || "XX"}</span>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">
                          Delegated by <span className="font-semibold text-slate-700 dark:text-slate-300">{task.creator}</span>
                        </p>
                      </div>
                    </div>

                    {/* Actions Column */}
                    <div className="flex flex-row md:flex-col gap-3 justify-end sm:justify-start w-full md:w-48 border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 pt-4 md:pt-0 md:pl-6">
                      <button 
                        onClick={() => respondToTask(task.id, "ACCEPTED")}
                        disabled={isProcessing}
                        className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-sm">check</span>
                        Accept
                      </button>
                      <button 
                        onClick={() => respondToTask(task.id, "REJECTED")}
                        disabled={isProcessing}
                        className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-sm">close</span>
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
