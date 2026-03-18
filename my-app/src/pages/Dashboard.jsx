import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../config/firebase";
import { signOut } from "firebase/auth";

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
      try {
        const res = await fetch("http://localhost:5001/dashboard", {
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
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
  }, [navigate]);

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 min-h-screen">
      <div className="layout-container flex h-full grow flex-col">
        {/* Top Navigation */}
        <header className="flex items-center justify-between whitespace-nowrap border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-background-dark px-6 md:px-10 py-3 sticky top-0 z-50">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2 text-primary">
              <div className="size-8 bg-primary rounded-lg flex items-center justify-center text-white">
                <span className="material-symbols-outlined text-2xl">tab</span>
              </div>
              <h2 className="text-slate-900 dark:text-white text-xl font-bold leading-tight tracking-tight">Assignly</h2>
            </div>
            <label className="hidden md:flex flex-col min-w-72 h-10">
              <div className="flex w-full flex-1 items-stretch rounded-xl h-full group">
                <div className="text-slate-400 group-focus-within:text-primary flex border-none bg-slate-100 dark:bg-slate-800 items-center justify-center pl-4 rounded-l-xl">
                  <span className="material-symbols-outlined text-xl">search</span>
                </div>
                <input
                  className="form-input flex w-full min-w-0 flex-1 border-none bg-slate-100 dark:bg-slate-800 focus:outline-none focus:ring-0 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 px-4 rounded-r-xl text-sm font-normal"
                  placeholder="Search tasks, people or projects..."
                />
              </div>
            </label>
          </div>
          <div className="flex flex-1 justify-end gap-4 items-center">
            <button className="relative flex size-10 cursor-pointer items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-2 right-2.5 size-2 bg-red-500 rounded-full border-2 border-white dark:border-background-dark"></span>
            </button>
            <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-700 mx-2"></div>
            <div className="flex items-center gap-3 cursor-pointer group" onClick={handleLogout}>
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{user?.name || "User"}</p>
                <p className="text-xs text-slate-500">Sign Out</p>
              </div>
              <div
                className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 border-2 border-white dark:border-slate-800 shadow-sm"
                data-alt="Professional user profile avatar"
                style={{
                  backgroundImage:
                    'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDtb9g2nzc6HKaitpQcSfAU7a7HTnqVJKOfj78m09paAT0tNB-aOacR9d4aJ92ZVPuYgi51XVk-LiRmpcReDrtf99lqbkJSz2IVW9NIsmrWvAGCDAqftPRj4hWQbdInGOzkUTjt5uZ6F0kxVzz6d0-lt5HycGOlDA8FlMqekaXcZvslUDN4f5PayLmK_nJJBWHM_vfuDVwsVx_9szTogs_afGourOnB9_8_5kZ344QrHBCfdCwbdJxbP93GjdEHAhXHgc7mpdzoIqY")',
                }}
              ></div>
            </div>
          </div>
        </header>

        <main className="max-w-[1200px] mx-auto w-full px-4 md:px-10 py-8">
          {/* Tabs & Header */}
          <div className="flex flex-col gap-6 mb-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Good morning, {user?.name || "User"}</h1>
                <p className="text-slate-500 mt-1">You have {tasks.length} tasks to complete today.</p>
              </div>
              <button className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-semibold shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all active:scale-95">
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
                    <span className="bg-primary/10 text-primary text-xs font-bold px-2.5 py-1 rounded-lg">
                      {task.status.toUpperCase()}
                    </span>
                    <button className="text-slate-400 hover:text-slate-600">
                      <span className="material-symbols-outlined">more_horiz</span>
                    </button>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{task.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed mb-4">{task.description}</p>
                </div>
                <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4 mt-6">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <span className="material-symbols-outlined text-lg">calendar_today</span>
                    <span className="text-xs font-medium">Oct 24, 2023</span>
                  </div>
                  <div className="flex -space-x-2">
                    <div
                      className="size-7 rounded-full border-2 border-white dark:border-slate-900 bg-slate-200 bg-cover"
                      style={{
                        backgroundImage:
                          'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCJaQFOWcwfVaZRnmfZZSJ8xgtEOhF_XZwbwTYsEaYhaJF1Ale_6ZDydBi1_UQ7c1vUQOY8fMKaXlTvlp0BQtnu35O-uflsyYxSh9fqd-d4Mw_Yx-3iYULlPo814eWKldtGzuXz-TKNPnnWML06A_yG8HG_1khNTAYgUfwI6edHWrd_xbIL_ABOTp2Bqwyn-rnnW1Qw_QTTU_jKQFNY4MyACvYCA39pbr4lVMGvitz9cXaXQjcgkcmKl8l-fjp15yc7k4U9jaFz4D4")',
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}

            {/* Empty/Placeholder Task Card */}
            <div className="group border-2 border-dashed border-slate-200 dark:border-slate-800 p-6 rounded-xl hover:border-primary/50 transition-colors flex flex-col items-center justify-center text-center cursor-pointer min-h-[220px]">
              <div className="size-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 group-hover:text-primary mb-3">
                <span className="material-symbols-outlined text-2xl">add</span>
              </div>
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Create a new task</p>
              <p className="text-xs text-slate-400 mt-1">Add details, deadlines and assignees</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}