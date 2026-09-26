'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  DashboardStats,
  SystemSettings,
  Teacher,
  Absence,
} from '@/lib/types';
import {
  getDashboardStats,
  getSystemSettings,
  getTeachers,
  getAbsencesForDate,
} from '@/lib/actions';
import { AdminDashboard } from '@/components/AdminDashboard';
import { SmartReliefInterface } from '@/components/SmartReliefInterface';
import { ReliefMasterlist } from '@/components/ReliefMasterlist';
import { WorkloadSettings } from '@/components/WorkloadSettings';
import { SeedButton } from '@/components/SeedButton';
import {
  LayoutDashboard,
  Sparkles,
  FileSpreadsheet,
  Sliders,
  GraduationCap,
  Database,
  RefreshCw,
} from 'lucide-react';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'smart-relief' | 'masterlist' | 'settings'>(
    'dashboard'
  );

  // Today's date string YYYY-MM-DD
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  const [stats, setStats] = useState<DashboardStats>({
    totalTeachers: 25,
    totalAbsentToday: 3,
    classesNeedingCover: 4,
    classesCovered: 2,
    date: selectedDate,
  });

  const [settings, setSettings] = useState<SystemSettings>({
    id: 'default',
    maxConsecutivePeriods: 6,
    maxTotalPeriodsPerDay: 7,
  });

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  const loadAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [sData, stData, tData, aData] = await Promise.all([
        getDashboardStats(selectedDate),
        getSystemSettings(),
        getTeachers(),
        getAbsencesForDate(selectedDate),
      ]);

      setStats(sData);
      setSettings(stData);
      setTeachers(tData);
      setAbsences(aData as any);
    } catch (err) {
      console.error('Error loading page data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData, refreshTrigger]);

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans">
      {/* TOP NAVIGATION HEADER */}
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18 py-3">
            {/* Logo / Title */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg font-extrabold tracking-tight text-white flex items-center gap-2">
                  Evergreen Primary School
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono border border-emerald-500/30">
                    Neon Postgres Sync
                  </span>
                </h1>
                <p className="text-xs text-slate-400">
                  School Relief Planning & Substitute Scheduling System
                </p>
              </div>
            </div>

            {/* Quick Actions & DB Seed */}
            <div className="flex items-center gap-3">
              <SeedButton onComplete={handleRefresh} />
              <button
                onClick={handleRefresh}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="Refresh page data"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex space-x-2 border-t border-slate-800/60 pt-2 pb-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs transition-all duration-200 whitespace-nowrap ${
                activeTab === 'dashboard'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Admin Dashboard
            </button>

            <button
              onClick={() => setActiveTab('smart-relief')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs transition-all duration-200 whitespace-nowrap relative ${
                activeTab === 'smart-relief'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              Smart Relief Matcher
              {stats.classesNeedingCover > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-rose-500 text-white font-mono text-[10px] animate-pulse">
                  {stats.classesNeedingCover}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('masterlist')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs transition-all duration-200 whitespace-nowrap ${
                activeTab === 'masterlist'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              Daily Masterlist & Export
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs transition-all duration-200 whitespace-nowrap ${
                activeTab === 'settings'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Sliders className="w-4 h-4" />
              Workload Settings
            </button>
          </nav>
        </div>
      </header>

      {/* MAIN CONTENT CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <AdminDashboard
            stats={stats}
            teachers={teachers}
            absences={absences}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            onRefresh={handleRefresh}
          />
        )}

        {activeTab === 'smart-relief' && (
          <SmartReliefInterface
            selectedDate={selectedDate}
            onRefresh={handleRefresh}
          />
        )}

        {activeTab === 'masterlist' && (
          <ReliefMasterlist
            selectedDate={selectedDate}
            onRefresh={handleRefresh}
          />
        )}

        {activeTab === 'settings' && (
          <WorkloadSettings
            settings={settings}
            onRefresh={handleRefresh}
          />
        )}
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500 font-mono">
        Evergreen Primary School Relief Planning System • Vercel & Neon Serverless Postgres Ready
      </footer>
    </div>
  );
}
