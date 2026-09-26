'use client';

import React, { useState, useEffect } from 'react';
import { UncoveredClass, TeacherEvaluation } from '@/lib/types';
import {
  getUncoveredClasses,
  getAvailableTeachersForClass,
  assignReliefTeacher,
  unassignReliefTeacher,
} from '@/lib/actions';
import { useToast } from '@/components/Toast';
import {
  Sparkles,
  MapPin,
  Clock,
  BookOpen,
  UserCheck,
  AlertTriangle,
  XCircle,
  Filter,
  CheckCircle2,
  Calendar,
  UserX,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

interface SmartReliefInterfaceProps {
  selectedDate: string;
  onRefresh: () => void;
}

export function SmartReliefInterface({ selectedDate, onRefresh }: SmartReliefInterfaceProps) {
  const { showToast } = useToast();
  const [uncoveredClasses, setUncoveredClasses] = useState<UncoveredClass[]>([]);
  const [selectedClass, setSelectedClass] = useState<UncoveredClass | null>(null);
  const [evaluations, setEvaluations] = useState<TeacherEvaluation[]>([]);
  const [showAllTeachers, setShowAllTeachers] = useState<boolean>(false);
  const [isLoadingClasses, setIsLoadingClasses] = useState<boolean>(true);
  const [isLoadingTeachers, setIsLoadingTeachers] = useState<boolean>(false);
  const [assigningTeacherId, setAssigningTeacherId] = useState<string | null>(null);

  // Load uncovered classes when date changes
  useEffect(() => {
    let isMounted = true;
    async function fetchClasses() {
      setIsLoadingClasses(true);
      try {
        const classes = await getUncoveredClasses(selectedDate);
        if (isMounted) {
          setUncoveredClasses(classes);
          // Auto select first class if none selected or if previously selected is invalid
          if (classes.length > 0) {
            setSelectedClass((prev) => {
              const match = classes.find(
                (c) => c.absentTeacherId === prev?.absentTeacherId && c.periodNumber === prev?.periodNumber
              );
              return match || classes[0];
            });
          } else {
            setSelectedClass(null);
            setEvaluations([]);
          }
        }
      } catch (err) {
        console.error('Failed to load uncovered classes:', err);
      } finally {
        if (isMounted) setIsLoadingClasses(false);
      }
    }
    fetchClasses();
    return () => {
      isMounted = false;
    };
  }, [selectedDate]);

  // Load available teachers when selected class changes
  useEffect(() => {
    let isMounted = true;
    if (!selectedClass) {
      setEvaluations([]);
      return;
    }

    async function fetchTeachers() {
      setIsLoadingTeachers(true);
      try {
        if (selectedClass) {
          const evals = await getAvailableTeachersForClass(
            selectedClass.date,
            selectedClass.periodNumber,
            selectedClass.dayOfWeek,
            selectedClass.absentTeacherId
          );
          if (isMounted) {
            setEvaluations(evals);
          }
        }
      } catch (err) {
        console.error('Failed to evaluate available teachers:', err);
      } finally {
        if (isMounted) setIsLoadingTeachers(false);
      }
    }

    fetchTeachers();
    return () => {
      isMounted = false;
    };
  }, [selectedClass]);

  const handleAssign = async (teacherEval: TeacherEvaluation) => {
    if (!selectedClass) return;

    setAssigningTeacherId(teacherEval.teacher.id);
    try {
      const res = await assignReliefTeacher(
        selectedClass.absentTeacherId,
        teacherEval.teacher.id,
        selectedClass.date,
        selectedClass.periodNumber,
        selectedClass.subject,
        selectedClass.venue
      );

      if (res.success) {
        showToast(
          `Successfully assigned ${teacherEval.teacher.name} to Period ${selectedClass.periodNumber} (${selectedClass.venue}) and saved to database!`,
          'success'
        );
        // Refresh local data & parent
        const updatedClasses = await getUncoveredClasses(selectedDate);
        setUncoveredClasses(updatedClasses);
        const match = updatedClasses.find(
          (c) =>
            c.absentTeacherId === selectedClass.absentTeacherId &&
            c.periodNumber === selectedClass.periodNumber
        );
        if (match) setSelectedClass(match);
        onRefresh();
      } else {
        showToast(res.error || 'Failed to assign relief teacher.', 'error');
      }
    } catch (err) {
      showToast('An unexpected error occurred during assignment.', 'error');
    } finally {
      setAssigningTeacherId(null);
    }
  };

  const handleUnassign = async (reliefAssignmentId: string, coveringName: string) => {
    if (!confirm(`Unassign ${coveringName} from this relief period?`)) return;

    try {
      const res = await unassignReliefTeacher(reliefAssignmentId);
      if (res.success) {
        showToast(`Relief assignment removed for ${coveringName}.`, 'info');
        const updatedClasses = await getUncoveredClasses(selectedDate);
        setUncoveredClasses(updatedClasses);
        if (selectedClass) {
          const match = updatedClasses.find(
            (c) =>
              c.absentTeacherId === selectedClass.absentTeacherId &&
              c.periodNumber === selectedClass.periodNumber
          );
          if (match) setSelectedClass(match);
        }
        onRefresh();
      } else {
        showToast(res.error || 'Failed to unassign teacher.', 'error');
      }
    } catch (err) {
      showToast('Failed to unassign relief teacher.', 'error');
    }
  };

  const availableTeachers = evaluations.filter((e) => e.isAvailable);
  const displayedEvaluations = showAllTeachers ? evaluations : availableTeachers;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white/80 dark:bg-slate-900/80 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm backdrop-blur-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Smart AI Matching Tool
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            Automated Teacher Relief Scheduling
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Select a period needing coverage on the left to match available teachers based on workload limits.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-xl text-slate-600 dark:text-slate-300">
          <Calendar className="w-4 h-4 text-indigo-500" />
          <span>Active Date: <strong className="text-slate-900 dark:text-white">{selectedDate}</strong></span>
        </div>
      </div>

      {/* Two-Panel Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT PANEL: Classes Needing Coverage (5 Columns) */}
        <div className="lg:col-span-5 bg-white/80 dark:bg-slate-900/80 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden backdrop-blur-md flex flex-col">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                Classes Needing Coverage
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {uncoveredClasses.length} period slots found for absent staff
              </p>
            </div>
            <span className="px-2.5 py-1 bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-xs font-bold rounded-lg font-mono">
              {uncoveredClasses.filter((c) => !c.isCovered).length} Uncovered
            </span>
          </div>

          {isLoadingClasses ? (
            <div className="p-12 text-center text-slate-400">
              <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              Loading absent periods from database...
            </div>
          ) : uncoveredClasses.length === 0 ? (
            <div className="p-12 text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3 opacity-80" />
              <h4 className="text-slate-900 dark:text-white font-semibold text-sm">
                All Classes Covered!
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                There are no absent teacher periods requiring relief for {selectedDate}.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[600px] overflow-y-auto">
              {uncoveredClasses.map((item) => {
                const isSelected =
                  selectedClass?.absentTeacherId === item.absentTeacherId &&
                  selectedClass?.periodNumber === item.periodNumber;

                return (
                  <div
                    key={`${item.absentTeacherId}-P${item.periodNumber}`}
                    onClick={() => setSelectedClass(item)}
                    className={`p-4 cursor-pointer transition-all duration-200 border-l-4 ${
                      isSelected
                        ? 'bg-indigo-50/90 dark:bg-indigo-950/50 border-l-indigo-600 dark:border-l-indigo-400'
                        : item.isCovered
                        ? 'bg-slate-50/30 dark:bg-slate-900/30 border-l-emerald-500 hover:bg-slate-100/50 dark:hover:bg-slate-800/40'
                        : 'bg-white dark:bg-slate-900 border-l-rose-500 hover:bg-rose-50/40 dark:hover:bg-rose-950/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-md bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-mono font-bold text-xs">
                          Period {item.periodNumber}
                        </span>
                        <span className="text-xs font-semibold text-slate-900 dark:text-white">
                          {item.subject}
                        </span>
                      </div>

                      {item.isCovered ? (
                        <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                          <CheckCircle2 className="w-3 h-3" />
                          Covered
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 animate-pulse">
                          Needs Cover
                        </span>
                      )}
                    </div>

                    {/* VENUE EMPHASIS - Prominently displayed so covering teacher knows where to report */}
                    <div className="my-2.5 flex items-center justify-between bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 px-3 py-1.5 rounded-lg text-emerald-800 dark:text-emerald-300">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span className="text-xs font-semibold uppercase tracking-wider">Venue:</span>
                        <span className="text-xs font-extrabold font-mono tracking-tight">
                          {item.venue}
                        </span>
                      </div>
                      <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-600 dark:text-emerald-400">
                        REPORT HERE
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <UserX className="w-3.5 h-3.5 text-rose-400" />
                        <span>Absent: <strong>{item.absentTeacherName}</strong> ({item.absentTeacherDept})</span>
                      </div>
                      {item.isCovered && item.assignedCoveringTeacherName && (
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                          Relief: {item.assignedCoveringTeacherName}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT PANEL: Available Teachers List & Backend Match Results (7 Columns) */}
        <div className="lg:col-span-7 bg-white/80 dark:bg-slate-900/80 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden backdrop-blur-md">
          {selectedClass ? (
            <div>
              {/* Header section for selected class */}
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-indigo-900 to-slate-900 text-white">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2.5 py-0.5 rounded-md bg-amber-400 text-slate-950 font-mono font-extrabold text-xs">
                        Period {selectedClass.periodNumber}
                      </span>
                      <span className="text-xs text-indigo-200 uppercase font-semibold tracking-wider">
                        {selectedClass.subject}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      Matching Available Teachers
                    </h3>
                  </div>

                  {/* VENUE BADGE EMPHASIS */}
                  <div className="flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/40 px-3 py-2 rounded-xl text-emerald-300">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                    <div>
                      <span className="text-[10px] text-emerald-300/80 uppercase font-mono block leading-none">
                        Target Venue
                      </span>
                      <span className="text-sm font-bold font-mono text-white">
                        {selectedClass.venue}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Already assigned banner if applicable */}
                {selectedClass.isCovered && selectedClass.assignedCoveringTeacherName && (
                  <div className="mt-4 p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-xl flex items-center justify-between text-xs text-emerald-200">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>
                        Currently assigned to <strong>{selectedClass.assignedCoveringTeacherName}</strong>
                      </span>
                    </div>
                    {selectedClass.reliefAssignmentId && (
                      <button
                        onClick={() =>
                          handleUnassign(
                            selectedClass.reliefAssignmentId!,
                            selectedClass.assignedCoveringTeacherName!
                          )
                        }
                        className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold transition-colors"
                      >
                        Unassign Teacher
                      </button>
                    )}
                  </div>
                )}

                {/* Filter / Toggle Bar */}
                <div className="mt-4 pt-4 border-t border-indigo-800/60 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-emerald-400 font-mono">
                      {availableTeachers.length} Available
                    </span>
                    <span className="text-indigo-300/60">•</span>
                    <span className="text-slate-300">
                      {evaluations.length - availableTeachers.length} Unavailable
                    </span>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={showAllTeachers}
                      onChange={(e) => setShowAllTeachers(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-700 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-slate-900"
                    />
                    <span className="text-indigo-200 font-medium">Show all teachers (with exclusion reasons)</span>
                  </label>
                </div>
              </div>

              {/* List of Teachers */}
              <div className="p-6">
                {isLoadingTeachers ? (
                  <div className="py-12 text-center text-slate-400">
                    <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    Evaluating workload limits & timetable slots in Neon database...
                  </div>
                ) : displayedEvaluations.length === 0 ? (
                  <div className="py-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                    <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto mb-3 opacity-80" />
                    <h4 className="text-slate-900 dark:text-white font-semibold text-sm">
                      No Available Teachers Match Workload Rules
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                      All other teachers are either teaching another class, marked absent, or would exceed maximum daily total/consecutive workload limits.
                    </p>
                    <button
                      onClick={() => setShowAllTeachers(true)}
                      className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-colors"
                    >
                      Show Unavailable Teachers & Exclusion Details
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {displayedEvaluations.map((item) => (
                      <div
                        key={item.teacher.id}
                        className={`p-4 rounded-xl border transition-all duration-200 ${
                          item.isAvailable
                            ? item.isNearLimitWarning
                              ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800/60 hover:border-amber-400'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 shadow-sm'
                            : 'bg-slate-50/50 dark:bg-slate-950/40 border-slate-200/60 dark:border-slate-800/40 opacity-75'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          {/* Left Details */}
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2.5">
                              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                                {item.teacher.name}
                              </h4>
                              <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                                {item.teacher.department}
                              </span>

                              {/* Availability Status Pill */}
                              {item.isAvailable ? (
                                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-bold border border-emerald-300 dark:border-emerald-800">
                                  ✓ Available
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 text-xs font-bold border border-rose-300 dark:border-rose-800">
                                  ✕ Excluded
                                </span>
                              )}
                            </div>

                            {/* SOFT WARNING FEATURE BADGE */}
                            {item.isNearLimitWarning && (
                              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 text-xs font-semibold">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                                <span>
                                  Soft Warning: Assigning this period reaches maximum daily limit ({item.totalPeriodsToday + 1}/{item.maxTotalPeriods} periods occupied)
                                </span>
                              </div>
                            )}

                            {/* Workload Stats */}
                            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-1 font-mono">
                              <span>
                                Today's Workload: <strong className="text-slate-800 dark:text-slate-200">{item.totalPeriodsToday}/{item.maxTotalPeriods}</strong> periods ({item.scheduledRegularPeriodsCount} regular, {item.reliefAssignmentsCount} relief)
                              </span>
                              <span>•</span>
                              <span>
                                Consecutive: <strong className="text-slate-800 dark:text-slate-200">{item.consecutiveIfAssigned}/{item.maxConsecutive}</strong> max
                              </span>
                            </div>

                            {/* Exclusion Reasons if not available */}
                            {!item.isAvailable && item.exclusionReasons.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {item.exclusionReasons.map((reason, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 px-2.5 py-1 rounded-md"
                                  >
                                    <XCircle className="w-3.5 h-3.5 shrink-0" />
                                    <span>{reason}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Right Action Button */}
                          <div className="shrink-0 w-full sm:w-auto">
                            {item.isAvailable ? (
                              <button
                                onClick={() => handleAssign(item)}
                                disabled={assigningTeacherId === item.teacher.id}
                                className={`w-full sm:w-auto px-4 py-2.5 rounded-xl font-semibold text-xs transition-all duration-200 shadow-md flex items-center justify-center gap-2 ${
                                  selectedClass.assignedCoveringTeacherId === item.teacher.id
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                                    : item.isNearLimitWarning
                                    ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20'
                                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20'
                                }`}
                              >
                                {assigningTeacherId === item.teacher.id ? (
                                  'Saving to DB...'
                                ) : selectedClass.assignedCoveringTeacherId === item.teacher.id ? (
                                  <>
                                    <CheckCircle2 className="w-4 h-4" />
                                    Assigned (Click to reassign)
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="w-4 h-4" />
                                    Assign Teacher
                                  </>
                                )}
                              </button>
                            ) : (
                              <button
                                disabled
                                className="w-full sm:w-auto px-4 py-2.5 rounded-xl font-semibold text-xs bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed text-center"
                              >
                                Unavailable
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-16 text-center text-slate-400">
              <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
              <h4 className="text-slate-900 dark:text-white font-semibold text-base">
                Select a Class Needing Coverage
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                Click on any period slot on the left panel to trigger the backend matching algorithm and evaluate available relief staff.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
