import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth } from '../config/firebase';
import { signOut } from 'firebase/auth';

export default function Analytics() {
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/");
    try {
      const res = await fetch("http://localhost:5001/dashboard", {
        headers: { Authorization: `Bearer ${token}` }
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
      navigate("/");
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem("token");
    navigate("/");
  };

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === "COMPLETED").length;
  const pendingTasks = totalTasks - completedTasks;
  const productivityScore = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  const categoryCounts = tasks.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + 1;
    return acc;
  }, {});

  const sortedCategories = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]);
  const colors = [
    { bg: "bg-primary", border: "border-primary" },
    { bg: "bg-emerald-500", border: "border-emerald-500" },
    { bg: "bg-amber-500", border: "border-amber-500" },
    { bg: "bg-violet-500", border: "border-violet-500" },
    { bg: "bg-rose-500", border: "border-rose-500" },
    { bg: "bg-blue-500", border: "border-blue-500" }
  ];

  const topCategories = sortedCategories.map(([name, count], index) => ({
    name,
    count,
    percentage: Math.round((count / totalTasks) * 100),
    color: colors[index % colors.length]
  }));

  // Create SVG segments for the dynamic pie chart
  let cumulativePercent = 0;
  const segments = topCategories.map((cat, i) => {
    const dashArray = `${cat.percentage} ${100 - cat.percentage}`;
    // Negative offset to perfectly rotate the slices accurately in the SVG viewBox
    const dashOffset = -cumulativePercent;
    cumulativePercent += cat.percentage;
    return { ...cat, dashArray, dashOffset };
  });

  return (
    <div className="flex bg-background-light dark:bg-background-dark font-sans relative overflow-x-hidden min-h-screen">
      <div className="flex h-full grow flex-col w-full">
        {/* Top Navigation */}
        <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 dark:border-slate-800 px-6 md:px-10 py-3 bg-white dark:bg-background-dark sticky top-0 z-40">
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Assignly Analytics</h1>
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

        <main className="flex flex-col flex-1 px-4 md:px-10 lg:px-40 py-8 overflow-y-auto">
          {/* Tabs */}
          <div className="mb-8">
            <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar">
              <Link to="/dashboard" className="flex items-center gap-2 border-b-2 border-transparent text-slate-500 hover:text-slate-700 px-6 pb-4 font-medium transition-colors whitespace-nowrap">
                <span className="material-symbols-outlined text-xl">assignment</span>
                My Tasks
              </Link>
              <a className="flex items-center gap-2 border-b-2 border-transparent text-slate-500 hover:text-slate-700 px-6 pb-4 font-medium transition-colors whitespace-nowrap" href="#">
                <span className="material-symbols-outlined text-xl">inbox</span>
                Inbox
                <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs px-2 py-0.5 rounded-full">12</span>
              </a>
              <a className="flex items-center gap-2 border-b-2 border-transparent text-slate-500 hover:text-slate-700 px-6 pb-4 font-medium transition-colors whitespace-nowrap" href="#">
                <span className="material-symbols-outlined text-xl">group</span>
                Delegated
              </a>
              <Link to="/analytics" className="flex items-center gap-2 border-b-2 border-primary text-primary px-6 pb-4 font-semibold whitespace-nowrap">
                <span className="material-symbols-outlined text-xl">insights</span>
                Analytics
              </Link>
            </div>
          </div>

          {/* Breadcrumbs/Title */}
          <div className="flex flex-col mb-6">
            <h1 className="text-slate-900 dark:text-white text-2xl font-bold">Analytics Dashboard</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Performance insights for {user?.name ? `${user.name}'s workspace` : "your workspace"}</p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white dark:bg-slate-900 flex flex-col gap-2 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex justify-between items-start">
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Total Tasks</p>
                <span className="material-symbols-outlined text-primary text-xl">assignment</span>
              </div>
              <p className="text-slate-900 dark:text-white text-3xl font-bold">{totalTasks}</p>
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-emerald-500 text-sm">trending_up</span>
                <p className="text-emerald-500 text-xs font-bold">Lifetime count</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 flex flex-col gap-2 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex justify-between items-start">
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Completed</p>
                <span className="material-symbols-outlined text-emerald-500 text-xl">check_circle</span>
              </div>
              <p className="text-slate-900 dark:text-white text-3xl font-bold">{completedTasks}</p>
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-emerald-500 text-sm">trending_up</span>
                <p className="text-emerald-500 text-xs font-bold">Successfully finished</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 flex flex-col gap-2 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex justify-between items-start">
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Pending</p>
                <span className="material-symbols-outlined text-amber-500 text-xl">pending_actions</span>
              </div>
              <p className="text-slate-900 dark:text-white text-3xl font-bold">{pendingTasks}</p>
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-amber-500 text-sm">trending_flat</span>
                <p className="text-amber-500 text-xs font-bold">Currently queued</p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 flex flex-col gap-2 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex justify-between items-start">
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Productivity Score</p>
                <span className="material-symbols-outlined text-primary text-xl">bolt</span>
              </div>
              <p className="text-slate-900 dark:text-white text-3xl font-bold">{productivityScore}%</p>
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-emerald-500 text-sm">trending_up</span>
                <p className="text-emerald-500 text-xs font-bold">Completion rate</p>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Line Chart Placeholder (Static layout matching the mockup exactly) */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-slate-900 dark:text-white font-bold">Tasks Completed Over Time</h3>
                <select className="bg-slate-100 dark:bg-slate-800 border-none text-xs rounded-lg px-2 py-1 focus:ring-primary outline-none text-slate-800 dark:text-slate-200 cursor-pointer text-center">
                  <option>Last 7 Days</option>
                  <option>Last 30 Days</option>
                </select>
              </div>
              <div className="w-full h-64 flex items-end justify-between gap-2 px-2">
                <div className="w-full bg-primary/20 rounded-t-lg h-[40%] relative group cursor-pointer hover:bg-primary/40 transition-colors">
                  <div className="hidden group-hover:block absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded">12</div>
                </div>
                <div className="w-full bg-primary/20 rounded-t-lg h-[60%] relative group cursor-pointer hover:bg-primary/40 transition-colors"></div>
                <div className="w-full bg-primary/20 rounded-t-lg h-[45%] relative group cursor-pointer hover:bg-primary/40 transition-colors"></div>
                <div className="w-full bg-primary/40 rounded-t-lg h-[85%] relative group cursor-pointer hover:bg-primary/60 transition-colors"></div>
                <div className="w-full bg-primary/20 rounded-t-lg h-[30%] relative group cursor-pointer hover:bg-primary/40 transition-colors"></div>
                <div className="w-full bg-primary/20 rounded-t-lg h-[70%] relative group cursor-pointer hover:bg-primary/40 transition-colors"></div>
                <div className="w-full bg-primary rounded-t-lg h-[95%] relative group cursor-pointer transition-colors"></div>
              </div>
              <div className="flex justify-between mt-4 text-[10px] text-slate-400 font-medium">
                <span>MON</span><span>TUE</span><span>WED</span><span>THU</span><span>FRI</span><span>SAT</span><span>SUN</span>
              </div>
            </div>

            {/* Dynamic Pie Chart */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
              <h3 className="text-slate-900 dark:text-white font-bold mb-6">Category Distribution</h3>
              <div className="flex-1 flex items-center justify-center relative">
                
                {/* SVG implementation for perfectly dynamic CSS donut chart */}
                <div className="w-48 h-48 relative">
                  <svg viewBox="0 0 32 32" className="w-full h-full -rotate-90 rounded-full">
                    {/* Background track */}
                    <circle pathLength="100" r="16" cx="16" cy="16" fill="transparent" strokeWidth="4" className="stroke-slate-100 dark:stroke-slate-800" />
                    
                    {/* SVG dynamically generated segments overlapping based purely on pure stroke-dasharray math */}
                    {segments.map((seg, i) => (
                      <circle
                        key={i}
                        r="16"
                        cx="16"
                        cy="16"
                        pathLength="100"
                        className={`fill-transparent ${seg.color.border.replace('border-', 'stroke-')} transition-all duration-500`}
                        strokeWidth="8"
                        strokeDasharray={seg.dashArray}
                        strokeDashoffset={seg.dashOffset}
                      />
                    ))}
                  </svg>
                  
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-slate-800 dark:text-white">{totalTasks}</span>
                    <span className="text-[10px] text-slate-400 uppercase tracking-tighter">Total Tasks</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 space-y-3">
                {topCategories.length === 0 ? (
                  <div className="text-center text-sm font-medium text-slate-400">No categorised tasks found.</div>
                ) : (
                  topCategories.map((cat, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className={`size-2.5 rounded-full ${cat.color.bg}`}></div>
                        <span className="text-slate-600 dark:text-slate-400 font-medium">{cat.name}</span>
                      </div>
                      <span className="font-bold text-slate-800 dark:text-white">{cat.percentage}%</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Insights Section */}
          <div className="bg-primary/5 dark:bg-primary/10 rounded-2xl p-8 border border-primary/20">
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-primary">lightbulb</span>
              <h2 className="text-slate-900 dark:text-white text-xl font-bold">Smart Insights</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-slate-900 p-5 rounded-xl flex gap-4 items-start shadow-sm hover:shadow-md transition-shadow cursor-default">
                <div className="p-3 bg-primary/10 rounded-lg text-primary shrink-0">
                  <span className="material-symbols-outlined">schedule</span>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white mb-1">Morning Productivity Peak</h4>
                  <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">You complete 65% of your high-priority tasks between 8 AM and 11 AM. Consider scheduling your most complex work during this block.</p>
                </div>
              </div>
              
              <div className="bg-white dark:bg-slate-900 p-5 rounded-xl flex gap-4 items-start shadow-sm hover:shadow-md transition-shadow cursor-default">
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 shrink-0">
                  <span className="material-symbols-outlined">trending_up</span>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white mb-1">Top Category: {topCategories[0]?.name || "N/A"}</h4>
                  <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                    {topCategories[0] ? `Your "${topCategories[0].name}" category is booming. You've actively created ${topCategories[0].count} tasks representing ${topCategories[0].percentage}% of your workflow.` : "Create more tasks to see insights."}
                  </p>
                </div>
              </div>
              
              <div className="bg-white dark:bg-slate-900 p-5 rounded-xl flex gap-4 items-start shadow-sm hover:shadow-md transition-shadow cursor-default">
                <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600 shrink-0">
                  <span className="material-symbols-outlined">warning</span>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white mb-1">Pipeline Growing</h4>
                  <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">You currently hold {pendingTasks} unresolved tasks pending in your pipeline. It might be time to review your immediate deadlines.</p>
                </div>
              </div>
              
              <div className="bg-white dark:bg-slate-900 p-5 rounded-xl flex gap-4 items-start shadow-sm hover:shadow-md transition-shadow cursor-default">
                <div className="p-3 bg-violet-100 dark:bg-violet-900/30 rounded-lg text-violet-600 shrink-0">
                  <span className="material-symbols-outlined">auto_awesome</span>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white mb-1">Productivity Standing</h4>
                  <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                    {productivityScore > 0 ? `You currently have a robust ${productivityScore}% productivity standing across ${totalTasks} lifetime tasks. Keep up the tremendous momentum!` : `Complete your first task to unlock your productivity scoring engine!`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>

        <footer className="px-6 md:px-10 lg:px-40 py-6 border-t border-slate-200 dark:border-slate-800 text-center">
          <p className="text-slate-400 text-xs text-medium">© 2026 Assignly Analytics. All rights reserved. Real-time data sync active.</p>
        </footer>
      </div>
    </div>
  );
}
