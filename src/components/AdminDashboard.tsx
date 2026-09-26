'use client';

import React, { useState } from 'react';
import { Teacher, DashboardStats, Absence } from '@/lib/types';
import { markTeacherAbsent, removeAbsence } from '@/lib/actions';
import { useToast } from '@/components/Toast';
import {
  Users,
  UserX,
  AlertTriangle,
  CheckCircle,
  PlusCircle,
  Trash2,
  Calendar,
  Building2,
} from 'lucide-react';

interface AdminDashboardProps {
  stats: DashboardStats;
  teachers: Teacher[];
  absences: Absence[];
  selectedDate: string;
  onDateChange: (date: string) => void;
  onRefresh: () => void;
}

export function AdminDashboard({
  stats,
  teachers,
  absences,
  selectedDate,
  onDateChange,
  onRefresh,
}: AdminDashboardProps) {
  const { showToast } = useToast();
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleMarkAbsent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacherId) {
      showToast('Please select a teacher to mark absent.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await markTeacherAbsent(selectedTeacherId, selectedDate);
      if (res.success) {
        showToast(`Teacher marked absent for ${selectedDate} and saved to database!`, 'success');
        setSelectedTeacherId('');
        onRefresh();
      } else {
        showToast(res.error || 'Failed to mark teacher absent.', 'error');
      }
    } catch (err) {
      showToast('An unexpected error occurred.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveAbsence = async (absenceId: string, teacherName: string) => {
    if (!confirm(`Are you sure you want to remove ${teacherName} from today's absence list?`)) return;

    try {
      const res = await removeAbsence(absenceId);
      if (res.success) {
        showToast(`Absence for ${teacherName} removed successfully!`, 'success');
        onRefresh();
      } else {
        showToast(res.error || 'Failed to remove absence.', 'error');
      }
    } catch (err) {
      showToast('An unexpected error occurred.', 'error');
    }
  };

  // Filter teachers who are not already marked absent
  const absentTeacherIds = new Set(absences.map((a) => a.teacherId));
  const availableToMarkAbsent = teachers.filter((t) => !absentTeacherIds.has(t.id));

  return (
    <div className="space-y-8">
      {/* Date Header & Controller */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/70 dark:bg-slate-900/70 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-semibold tracking-wide uppercase text-indigo-600 dark:text-indigo-400">
              Evergreen Primary School
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
            School Relief Planning Dashboard
          </h2>
        </div>

        <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
          <Calendar className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date:</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="bg-transparent text-sm font-semibold text-slate-900 dark:text-white focus:outline-none cursor-pointer"
          />
        </div>
      </div>

      {/* Live DB Stats Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Total Absent */}
        <div className="relative overflow-hidden bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/30 p-6 rounded-2xl border border-amber-200/80 dark:border-amber-800/50 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                Total Absent Today
              </p>
              <h3 className="text-4xl font-extrabold text-amber-900 dark:text-amber-100 mt-2">
                {stats.totalAbsentToday}
              </h3>
              <p className="text-xs text-amber-600/80 dark:text-amber-400/80 mt-1">
                Out of {stats.totalTeachers} total teaching staff
              </p>
            </div>
            <div className="p-3 bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-2xl">
              <UserX className="w-8 h-8" />
            </div>
          </div>
        </div>

        {/* Card 2: Classes Needing Cover */}
        <div className="relative overflow-hidden bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/40 dark:to-pink-950/30 p-6 rounded-2xl border border-rose-200/80 dark:border-rose-800/50 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-rose-700 dark:text-rose-400">
                Classes Needing Cover
              </p>
              <h3 className="text-4xl font-extrabold text-rose-900 dark:text-rose-100 mt-2">
                {stats.classesNeedingCover}
              </h3>
              <p className="text-xs text-rose-600/80 dark:text-rose-400/80 mt-1">
                Unassigned relief periods
              </p>
            </div>
            <div className="p-3 bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-2xl">
              <AlertTriangle className="w-8 h-8" />
            </div>
          </div>
        </div>

        {/* Card 3: Classes Covered */}
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/30 p-6 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/50 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                Classes Covered
              </p>
              <h3 className="text-4xl font-extrabold text-emerald-900 dark:text-emerald-100 mt-2">
                {stats.classesCovered}
              </h3>
              <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80 mt-1">
                Assigned to relief teachers
              </p>
            </div>
            <div className="p-3 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl">
              <CheckCircle className="w-8 h-8" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Mark Absent Form + Today's Absence List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Mark Teacher Absent Form */}
        <div className="bg-white/80 dark:bg-slate-900/80 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm backdrop-blur-md">
          <div className="flex items-center gap-2 mb-4">
            <PlusCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Mark Teacher as Absent
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
            Register a teacher's absence for {selectedDate}. This automatically flags all their scheduled classes for relief assignment.
          </p>

          <form onSubmit={handleMarkAbsent} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Select Absent Teacher
              </label>
              <select
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="">-- Choose Teacher --</option>
                {availableToMarkAbsent.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.department})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !selectedTeacherId}
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                'Saving to Database...'
              ) : (
                <>
                  <UserX className="w-4 h-4" />
                  Mark Teacher Absent
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: List of Today's Absences */}
        <div className="lg:col-span-2 bg-white/80 dark:bg-slate-900/80 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Today's Absent Staff Roster ({absences.length})
              </h3>
            </div>
            <span className="text-xs px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
              Date: {selectedDate}
            </span>
          </div>

          {absences.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3 opacity-80" />
              <p className="text-slate-700 dark:text-slate-300 font-medium text-sm">
                No absent teachers recorded for this date.
              </p>
              <p className="text-xs text-slate-400 mt-1">
                All staff are present or no absences marked yet.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200/60 dark:border-slate-800 rounded-xl overflow-hidden">
              {absences.map((absence) => (
                <div
                  key={absence.id}
                  className="flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-800/30 hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold text-sm border border-amber-300 dark:border-amber-800">
                      {absence.teacher?.name.charAt(0) || 'T'}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                        {absence.teacher?.name || 'Unknown Teacher'}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {absence.teacher?.department || 'Department N/A'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      handleRemoveAbsence(absence.id, absence.teacher?.name || 'Teacher')
                    }
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-all"
                    title="Remove absence"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
