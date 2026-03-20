import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Tabs({ tasks, user }) {
  const location = useLocation();
  const currentPath = location.pathname;

  const pendingInboxCount = tasks.filter(t => t.assignee === user?.email && t.status === "PENDING").length;

  return (
    <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar mb-8">
      <Link 
        to="/dashboard" 
        className={`flex items-center gap-2 border-b-2 px-4 sm:px-6 pb-4 whitespace-nowrap text-sm ${currentPath === '/dashboard' ? 'border-primary text-primary font-semibold' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 font-medium transition-colors'}`}
      >
        <span className="material-symbols-outlined text-xl">assignment</span>
        My Tasks
      </Link>
      
      <Link 
        to="/inbox" 
        className={`flex items-center gap-2 border-b-2 px-4 sm:px-6 pb-4 whitespace-nowrap text-sm ${currentPath === '/inbox' ? 'border-primary text-primary font-semibold' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 font-medium transition-colors'}`}
      >
        <span className="material-symbols-outlined text-xl">inbox</span>
        Inbox
        {pendingInboxCount > 0 && (
          <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full font-bold">
            {pendingInboxCount}
          </span>
        )}
      </Link>
      
      <Link 
        to="/delegated" 
        className={`flex items-center gap-2 border-b-2 px-4 sm:px-6 pb-4 whitespace-nowrap text-sm ${currentPath === '/delegated' ? 'border-primary text-primary font-semibold' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 font-medium transition-colors'}`}
      >
        <span className="material-symbols-outlined text-xl">group</span>
        Delegated
      </Link>
      
      <Link 
        to="/analytics" 
        className={`flex items-center gap-2 border-b-2 px-4 sm:px-6 pb-4 whitespace-nowrap text-sm ${currentPath === '/analytics' ? 'border-primary text-primary font-semibold' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 font-medium transition-colors'}`}
      >
        <span className="material-symbols-outlined text-xl">insights</span>
        Analytics
      </Link>
    </div>
  );
}
