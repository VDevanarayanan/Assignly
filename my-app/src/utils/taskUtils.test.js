import { describe, it, expect } from 'vitest';
import { isCompletedThisWeek } from './taskUtils';

describe('isCompletedThisWeek', () => {
  const MOCK_CURRENT_DATE = new Date('2026-03-20T12:00:00Z');

  it('returns false if the task is not explicitly marked as COMPLETED', () => {
    const task = { status: 'PENDING', completedAt: '2026-03-19T12:00:00Z' };
    expect(isCompletedThisWeek(task, MOCK_CURRENT_DATE)).toBe(false);
  });

  it('returns true if the task was completed exactly today', () => {
    const task = { status: 'COMPLETED', completedAt: '2026-03-20T10:00:00Z' };
    expect(isCompletedThisWeek(task, MOCK_CURRENT_DATE)).toBe(true);
  });

  it('returns true if the task was completed 6 days ago', () => {
    const task = { status: 'COMPLETED', completedAt: '2026-03-14T12:00:00Z' };
    expect(isCompletedThisWeek(task, MOCK_CURRENT_DATE)).toBe(true);
  });

  it('returns false if the task was completed 8 days ago', () => {
    const task = { status: 'COMPLETED', completedAt: '2026-03-11T12:00:00Z' };
    expect(isCompletedThisWeek(task, MOCK_CURRENT_DATE)).toBe(false);
  });

  it('correctly falls back to updatedAt if completedAt is utterly missing', () => {
    const task = { status: 'COMPLETED', updatedAt: '2026-03-15T12:00:00Z' }; // 5 days ago
    expect(isCompletedThisWeek(task, MOCK_CURRENT_DATE)).toBe(true);
  });

  it('correctly falls back to task ID parse if both tracking dates are missing', () => {
    // 2026-03-18T12:00:00Z in Unix Epoch MS
    const mockId = new Date('2026-03-18T12:00:00Z').getTime().toString(); 
    const task = { status: 'COMPLETED', id: mockId };
    expect(isCompletedThisWeek(task, MOCK_CURRENT_DATE)).toBe(true);
  });

  it('safely handles missing task payload entirely', () => {
    expect(isCompletedThisWeek(undefined, MOCK_CURRENT_DATE)).toBe(false);
  });

  it('handles corrupted invalid date strings gracefully', () => {
    const task = { status: 'COMPLETED', completedAt: 'not-a-valid-date-string' };
    expect(isCompletedThisWeek(task, MOCK_CURRENT_DATE)).toBe(false);
  });
});
