'use client';

import React, { useState } from 'react';
import { SystemSettings } from '@/lib/types';
import { updateSystemSettings } from '@/lib/actions';
import { useToast } from '@/components/Toast';
import { Sliders, ShieldCheck, Clock, Zap, Save, CheckCircle2 } from 'lucide-react';

interface WorkloadSettingsProps {
  settings: SystemSettings;
  onRefresh: () => void;
}

export function WorkloadSettings({ settings, onRefresh }: WorkloadSettingsProps) {
  const { showToast } = useToast();
  const [maxConsecutive, setMaxConsecutive] = useState<number>(settings.maxConsecutivePeriods);
  const [maxTotal, setMaxTotal] = useState<number>(settings.maxTotalPeriodsPerDay);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await updateSystemSettings(maxConsecutive, maxTotal);
      if (res.success) {
        showToast('Workload limits updated successfully in Neon database!', 'success');
        onRefresh();
      } else {
        showToast(res.error || 'Failed to update settings.', 'error');
      }
    } catch (err) {
      showToast('An error occurred while saving settings.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-900/80 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm backdrop-blur-md flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              System Policy Settings
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            Teacher Workload Policy & Limits
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            These parameters govern the backend matching algorithm to ensure fair, anti-burnout relief distribution.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Form Controls */}
        <div className="lg:col-span-2 bg-white/80 dark:bg-slate-900/80 p-8 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm backdrop-blur-md">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Field 1: Max Consecutive Periods */}
            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                  <Zap className="w-4 h-4 text-amber-500" />
                  Maximum Consecutive Teaching Periods
                </label>
                <span className="px-3 py-1 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-mono font-bold text-sm rounded-lg border border-amber-300 dark:border-amber-800">
                  {maxConsecutive} Periods max
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Prevents scheduling a teacher for more than {maxConsecutive} consecutive periods in a row (combining regular classes and relief assignments).
              </p>
              <input
                type="range"
                min={2}
                max={8}
                step={1}
                value={maxConsecutive}
                onChange={(e) => setMaxConsecutive(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1 font-mono">
                <span>2 periods</span>
                <span>4 periods</span>
                <span>6 periods (Default)</span>
                <span>8 periods</span>
              </div>
            </div>

            {/* Field 2: Max Total Periods Per Day */}
            <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                  <Clock className="w-4 h-4 text-indigo-500" />
                  Maximum Total Periods Per Day
                </label>
                <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 font-mono font-bold text-sm rounded-lg border border-indigo-300 dark:border-indigo-800">
                  {maxTotal} Periods max
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Caps the total workload (regular timetable classes + relief assignments) for any single school day.
              </p>
              <input
                type="range"
                min={3}
                max={8}
                step={1}
                value={maxTotal}
                onChange={(e) => setMaxTotal(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1 font-mono">
                <span>3 periods</span>
                <span>5 periods</span>
                <span>7 periods (Default)</span>
                <span>8 periods</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-3.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSaving ? (
                'Saving Settings to Neon DB...'
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save System Workload Policy
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Live Backend Enforcement Summary */}
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-6 rounded-2xl border border-indigo-800/50 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="w-6 h-6 text-indigo-400" />
              <h3 className="text-lg font-bold text-indigo-100">Live Enforcement Rules</h3>
            </div>

            <p className="text-xs text-indigo-200/80 leading-relaxed mb-6">
              When an administrator assigns a relief teacher, the backend matching algorithm automatically validates:
            </p>

            <ul className="space-y-4 text-xs">
              <li className="flex items-start gap-3 bg-indigo-950/60 p-3.5 rounded-xl border border-indigo-800/40">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-white block mb-0.5">Rule 1: Absence Filter</span>
                  Teacher is not in the absence list for today.
                </div>
              </li>
              <li className="flex items-start gap-3 bg-indigo-950/60 p-3.5 rounded-xl border border-indigo-800/40">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-white block mb-0.5">Rule 2: Free Period Check</span>
                  Teacher has a free period in regular timetable for that slot.
                </div>
              </li>
              <li className="flex items-start gap-3 bg-indigo-950/60 p-3.5 rounded-xl border border-indigo-800/40">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-white block mb-0.5">Rule 3: Daily Cap ({maxTotal} max)</span>
                  Total periods will not exceed {maxTotal} periods/day.
                </div>
              </li>
              <li className="flex items-start gap-3 bg-indigo-950/60 p-3.5 rounded-xl border border-indigo-800/40">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-white block mb-0.5">Rule 4: Consecutive Cap ({maxConsecutive} max)</span>
                  Consecutive teaching run will not exceed {maxConsecutive} periods.
                </div>
              </li>
            </ul>
          </div>

          <div className="mt-6 pt-4 border-t border-indigo-800/40 text-[11px] text-indigo-300/70 text-center font-mono">
            Evergreen Primary School • Policy ID: SystemSettings.default
          </div>
        </div>
      </div>
    </div>
  );
}
