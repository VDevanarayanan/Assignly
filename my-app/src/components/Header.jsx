import React, { useMemo, useState, useEffect, useRef } from 'react';
import { auth } from "../config/firebase";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";

export default function Header({ title, user, tasks }) {
  const navigate = useNavigate();
  const [showNotifs, setShowNotifs] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem("token");
    navigate("/");
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifs(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const pendingTasks = useMemo(() => {
    if (!user?.email || !tasks) return [];
    return tasks.filter(t => t.assignee === user.email && t.status === "PENDING" && t.createdBy !== user.email);
  }, [tasks, user]);

  const notifications = useMemo(() => {
    if (!user?.email || !tasks) return [];
    let notifs = [];

    const incomingTasks = tasks.filter(t => t.assignee === user.email && t.status === "PENDING" && t.createdBy !== user.email);
    for (const t of incomingTasks) {
      notifs.push({
        id: `inc_${t.id}`,
        type: 'incoming',
        user: t.createdBy,
        taskTitle: t.title,
        timestamp: parseInt(t.id),
        dateStr: new Date(parseInt(t.id)).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'})
      });
    }

    const delegatedTasks = tasks.filter(t => t.createdBy === user.email && t.assignee !== user.email && t.unreadStatusUpdate);
    for (const t of delegatedTasks) {
      const stamp = t.updatedAt ? new Date(t.updatedAt).getTime() : parseInt(t.id);
      let action = "updated"; let type = "comment";
      
      if (t.status === "ACCEPTED") { action = "accepted"; type = "accepted"; }
      if (t.status === "REJECTED") { action = "rejected"; type = "rejected"; }
      if (t.status === "IN PROGRESS") { action = "started working on"; type = "progress"; }
      if (t.status === "COMPLETED") { action = "completed"; type = "completed"; }
      
      notifs.push({
        id: `del_${t.id}_${stamp}`,
        type,
        user: t.assignee,
        taskTitle: t.title,
        action,
        timestamp: stamp,
        dateStr: new Date(stamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'})
      });
    }

    const newlyJoinedTasks = tasks.filter(t => t.createdBy === user.email && t.assignee !== user.email && t.joinedAt);
    for (const t of newlyJoinedTasks) {
      const stamp = new Date(t.joinedAt).getTime();
      notifs.push({
        id: `join_${t.id}_${stamp}`,
        type: 'joined',
        user: t.assignee,
        taskTitle: t.title,
        action: 'created an account and received your task',
        timestamp: stamp,
        dateStr: new Date(stamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'})
      });
    }

    return notifs.sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);
  }, [tasks, user]);

  return (
    <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 dark:border-slate-800 px-4 md:px-10 py-4 bg-white dark:bg-slate-900 sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center size-10 sm:size-12 rounded-xl bg-primary text-white shadow-lg shadow-primary/30 rotate-3">
          <span className="material-symbols-outlined text-2xl sm:text-3xl leading-none">task_alt</span>
        </div>
        <div className="flex flex-col">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white leading-tight">{title}</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Welcome back, {user?.name ? user.name.split(" ")[0] : "User"}!</p>
        </div>
      </div>
      
      <div className="flex items-center gap-4 flex-1"></div>
      
      <div className="flex items-center gap-4">
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setShowNotifs(!showNotifs)}
            className="flex size-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors relative"
          >
            <span className="material-symbols-outlined text-xl">notifications</span>
            {pendingTasks.length > 0 && (
              <span className="absolute top-0 right-0 size-2.5 bg-red-500 rounded-full border border-white dark:border-slate-900"></span>
            )}
          </button>
          
          {showNotifs && (
            <div className="absolute right-[-16px] sm:right-0 mt-2 w-[calc(100vw-2rem)] sm:w-96 max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                <h3 className="font-bold text-slate-800 dark:text-white">Recent Notifications</h3>
                <span className="text-xs text-primary font-bold cursor-pointer hover:underline" onClick={() => setShowNotifs(false)}>Close</span>
              </div>
              <div className="max-h-[60vh] overflow-y-auto no-scrollbar">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-sm">Inbox zero! No new notifications to review.</div>
                ) : (
                  notifications.map((notif) => {
                    if (notif.type === "incoming") {
                      return (
                        <div key={notif.id} className="flex gap-3 p-4 border-b border-slate-100 dark:border-slate-800 bg-primary/5 relative hover:bg-primary/10 transition-colors cursor-pointer text-left">
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
                          <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0">
                            <span className="material-symbols-outlined text-[20px] font-variation-fill">assignment_late</span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <p className="text-xs font-medium leading-tight text-slate-600 dark:text-slate-300 whitespace-normal">
                              <span className="font-bold text-slate-900 dark:text-white">{notif.user}</span> assigned a new task to you: <span className="text-primary font-bold">{notif.taskTitle}</span>
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{notif.dateStr}</p>
                          </div>
                        </div>
                      );
                    }
                    if (notif.type === "accepted" || notif.type === "completed") {
                      return (
                        <div key={notif.id} className="flex gap-3 p-4 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer text-left">
                          <div className="size-10 rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-[20px] font-variation-fill">check_circle</span>
                          </div>
                          <div className="flex flex-col gap-1 flex-1 min-w-0">
                            <p className="text-xs font-medium leading-tight text-slate-600 dark:text-slate-300 whitespace-normal">
                              <span className="font-bold text-slate-900 dark:text-white">{notif.user}</span> {notif.action} your task: <span className="font-medium text-primary">{notif.taskTitle}</span>
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{notif.dateStr}</p>
                          </div>
                        </div>
                      );
                    }
                    if (notif.type === "progress") {
                      return (
                        <div key={notif.id} className="flex gap-3 p-4 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer text-left">
                          <div className="size-10 rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-[20px] font-variation-fill">sync</span>
                          </div>
                          <div className="flex flex-col gap-1 flex-1 min-w-0">
                            <p className="text-xs font-medium leading-tight text-slate-600 dark:text-slate-300 whitespace-normal">
                              <span className="font-bold text-slate-900 dark:text-white">{notif.user}</span> {notif.action}: <span className="font-medium text-primary">{notif.taskTitle}</span>
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{notif.dateStr}</p>
                          </div>
                        </div>
                      );
                    }
                    if (notif.type === "rejected") {
                      return (
                        <div key={notif.id} className="flex gap-3 p-4 border-b border-slate-100 dark:border-slate-800 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors cursor-pointer text-left">
                          <div className="size-10 rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-[20px] font-variation-fill">cancel</span>
                          </div>
                          <div className="flex flex-col gap-1 flex-1 min-w-0">
                            <p className="text-xs font-medium leading-tight text-slate-600 dark:text-slate-300 whitespace-normal">
                              <span className="font-bold text-red-600 dark:text-red-400">{notif.user}</span> {notif.action} your task: <span className="font-medium line-through">{notif.taskTitle}</span>
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{notif.dateStr}</p>
                          </div>
                        </div>
                      );
                    }
                    if (notif.type === "joined") {
                      return (
                        <div key={notif.id} className="flex gap-3 p-4 border-b border-slate-100 dark:border-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-colors cursor-pointer text-left">
                          <div className="size-10 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-[20px] font-variation-fill">person_add</span>
                          </div>
                          <div className="flex flex-col gap-1 flex-1 min-w-0">
                            <p className="text-xs font-medium leading-tight text-slate-600 dark:text-slate-300 whitespace-normal">
                              <span className="font-bold text-emerald-600 dark:text-emerald-400">{notif.user}</span> {notif.action}: <span className="font-medium text-primary">{notif.taskTitle}</span>
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{notif.dateStr}</p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })
                )}
              </div>
            </div>
          )}
        </div>

        <button 
          className="px-4 py-2 text-sm font-bold text-slate-700 dark:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-full transition-colors hidden sm:block"
          onClick={handleLogout}
        >
          Sign Out
        </button>
      </div>
    </header>
  );
}
