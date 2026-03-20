import React, { useState } from 'react';

export default function TaskModal({ isOpen, onClose, onSuccess, requireAssignee = false }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignee, setAssignee] = useState("");
  const [deadline, setDeadline] = useState("");
  const [category, setCategory] = useState("Design");
  const [warningMsg, setWarningMsg] = useState("");

  if (!isOpen) return null;

  const todayStr = new Date().toISOString().split('T')[0];

  const handleCreateTask = async (forceRequest = false) => {
    if (!title) return alert("Task title is required");
    
    if (requireAssignee && !assignee.trim()) {
      return alert("An assignee email is strictly required to delegate a task.");
    }
    
    // Prevent manual entry of past dates
    if (deadline) {
      const selectedDate = new Date(deadline);
      const today = new Date(todayStr); // strict calendar date stripped of time
      if (selectedDate < today) {
        return alert("Deadline cannot be in the past.");
      }
    }

    setIsSubmitting(true);
    setWarningMsg("");
    
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("/api/dashboard/task", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ title, description, assignee, deadline, category, forceCreate: forceRequest === true })
      });
      const data = await res.json();
      
      if (!data.success && data.error === 'USER_NOT_FOUND') {
        setWarningMsg(data.message);
        setIsSubmitting(false);
        return;
      }
      
      if (data.success) {
        // Reset local form bounds
        setTitle("");
        setDescription("");
        setAssignee("");
        setDeadline("");
        setCategory("Design");
        setWarningMsg("");
        
        onSuccess(data.task); // Passes the new task for optimistic updates
        onClose();   // Drops the modal wrapper
      } else {
        alert("Failed to create task: " + (data.message || "Unknown error"));
      }
    } catch (err) {
      console.error(err);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      {/* Modal Container */}
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[921px]">
        
        {/* Modal Header */}
        <div className="px-5 sm:px-8 py-5 sm:py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 animate-in slide-in-from-bottom-2">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Create New Task</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Fill in the details to delegate a new assignment.</p>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Modal Body (Scrollable) */}
        <div className="px-5 sm:px-8 py-5 sm:py-6 overflow-y-auto space-y-6">
          {/* Assign To & Deadline Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                Assign to {requireAssignee && <span className="text-red-500">*</span>}
              </label>
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

        {warningMsg && (
          <div className="px-5 sm:px-8 pb-6 animate-in fade-in duration-300">
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex gap-3">
                <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 shrink-0">warning</span>
                <p className="text-amber-800 dark:text-amber-200 text-sm font-medium leading-relaxed">{warningMsg}</p>
              </div>
              <button 
                onClick={() => handleCreateTask(true)}
                className="w-full sm:w-auto whitespace-nowrap px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold rounded-lg shadow-md transition-colors shrink-0"
              >
                Force Delegate
              </button>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="px-5 sm:px-8 py-5 sm:py-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex flex-col-reverse sm:flex-row items-center justify-end gap-3 sm:gap-4">
          <button 
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:bg-transparent bg-slate-100 sm:bg-transparent dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleCreateTask}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-lg">{isSubmitting ? "hourglass_empty" : "send"}</span>
            {isSubmitting ? "Creating..." : "Create Task"}
          </button>
        </div>
      </div>
    </div>
  );
}
