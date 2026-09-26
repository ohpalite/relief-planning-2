'use client';

import React, { useState, useEffect } from 'react';
import { ReliefAssignment } from '@/lib/types';
import { getDailyReliefAssignments, unassignReliefTeacher } from '@/lib/actions';
import { useToast } from '@/components/Toast';
import {
  FileSpreadsheet,
  Printer,
  MapPin,
  Calendar,
  UserCheck,
  UserX,
  Trash2,
  CheckCircle2,
  Building2,
} from 'lucide-react';

interface ReliefMasterlistProps {
  selectedDate: string;
  onRefresh: () => void;
}

export function ReliefMasterlist({ selectedDate, onRefresh }: ReliefMasterlistProps) {
  const { showToast } = useToast();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchMasterlist() {
      setIsLoading(true);
      try {
        const data = await getDailyReliefAssignments(selectedDate);
        if (isMounted) setAssignments(data);
      } catch (err) {
        console.error('Failed to load masterlist:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    fetchMasterlist();
    return () => {
      isMounted = false;
    };
  }, [selectedDate]);

  const handleUnassign = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove relief assignment for ${name}?`)) return;

    try {
      const res = await unassignReliefTeacher(id);
      if (res.success) {
        showToast(`Relief assignment for ${name} removed.`, 'info');
        const data = await getDailyReliefAssignments(selectedDate);
        setAssignments(data);
        onRefresh();
      } else {
        showToast(res.error || 'Failed to unassign teacher.', 'error');
      }
    } catch (err) {
      showToast('Error removing relief assignment.', 'error');
    }
  };

  const exportToCSV = () => {
    if (assignments.length === 0) {
      showToast('No relief assignments to export.', 'info');
      return;
    }

    const headers = [
      'Period',
      'Venue',
      'Subject',
      'Covering Teacher',
      'Covering Dept',
      'Absent Teacher',
      'Date',
    ];

    const rows = assignments.map((item) => [
      `Period ${item.periodNumber}`,
      `"${item.venue.replace(/"/g, '""')}"`,
      `"${item.subject.replace(/"/g, '""')}"`,
      `"${item.coveringTeacher?.name || ''}"`,
      `"${item.coveringTeacher?.department || ''}"`,
      `"${item.absentTeacher?.name || ''}"`,
      item.date,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Evergreen_Primary_Relief_Masterlist_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('CSV masterlist downloaded successfully!', 'success');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Header Bar */}
      <div className="bg-white/80 dark:bg-slate-900/80 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm backdrop-blur-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:shadow-none print:border-none print:bg-transparent print:p-0">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400 print:hidden" />
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Evergreen Primary School
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            Daily Relief Masterlist
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Official summary of all assigned relief teachers and reported venues for {selectedDate}.
          </p>
        </div>

        {/* Export & Print Action Buttons */}
        <div className="flex items-center gap-3 print:hidden">
          <button
            onClick={exportToCSV}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-all duration-200 shadow-md shadow-emerald-600/20 flex items-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-all duration-200 shadow-md flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Print Masterlist
          </button>
        </div>
      </div>

      {/* Masterlist Data Table */}
      <div className="bg-white/80 dark:bg-slate-900/80 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden backdrop-blur-md print:border-slate-300 print:shadow-none">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            Loading daily relief assignments...
          </div>
        ) : assignments.length === 0 ? (
          <div className="p-16 text-center">
            <CheckCircle2 className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <h3 className="text-slate-900 dark:text-white font-semibold text-sm">
              No Relief Assignments Recorded for {selectedDate}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Use the Smart Relief Assignment interface to assign teachers to uncovered periods.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4 font-mono">Period</th>
                  <th className="py-3.5 px-4">Reporting Venue</th>
                  <th className="py-3.5 px-4">Subject</th>
                  <th className="py-3.5 px-4">Assigned Relief Teacher</th>
                  <th className="py-3.5 px-4">Absent Staff Covered</th>
                  <th className="py-3.5 px-4 text-right print:hidden">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs text-slate-900 dark:text-slate-100 font-medium">
                {assignments.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Period */}
                    <td className="py-4 px-4 font-mono font-bold">
                      <span className="px-2.5 py-1 rounded-md bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900">
                        Period {item.periodNumber}
                      </span>
                    </td>

                    {/* VENUE EMPHASIS - Prominently highlighted glowing badge */}
                    <td className="py-4 px-4 font-mono font-extrabold">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 font-mono text-xs">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        {item.venue}
                      </span>
                    </td>

                    {/* Subject */}
                    <td className="py-4 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      {item.subject}
                    </td>

                    {/* Assigned Covering Teacher */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white block">
                            {item.coveringTeacher?.name || 'Unknown Teacher'}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            {item.coveringTeacher?.department}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Absent Teacher Covered */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <UserX className="w-4 h-4 text-rose-400 shrink-0" />
                        <div>
                          <span className="text-slate-700 dark:text-slate-300 font-medium block">
                            {item.absentTeacher?.name || 'Unknown'}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {item.absentTeacher?.department}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Action */}
                    <td className="py-4 px-4 text-right print:hidden">
                      <button
                        onClick={() =>
                          handleUnassign(
                            item.id,
                            item.coveringTeacher?.name || 'Relief Teacher'
                          )
                        }
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
                        title="Remove assignment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
