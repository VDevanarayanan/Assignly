/**
 * Determines if a task was completed within the last 7 days.
 * 
 * @param {Object} task - The assigned task object.
 * @param {Date} [currentDate=new Date()] - The reference date object. Default is `new Date()`.
 * @returns {boolean} - Returns true if the task was completed within the rolling 7 day window.
 */
export const isCompletedThisWeek = (task, currentDate = new Date()) => {
  if (!task || task.status !== "COMPLETED") return false;

  const getCompletionDate = () => {
    if (task.completedAt) return new Date(task.completedAt);
    if (task.updatedAt) return new Date(task.updatedAt);
    const idNum = parseInt(task.id);
    return isNaN(idNum) ? new Date() : new Date(idNum);
  };

  const completionDateObj = getCompletionDate();
  
  if (isNaN(completionDateObj.getTime())) {
    return false; // Safely handle completely corrupt dates
  }

  const diffTime = currentDate.getTime() - completionDateObj.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24); 

  // Must be completed in the past, and within 7 days.
  return diffDays >= 0 && diffDays <= 7;
};
