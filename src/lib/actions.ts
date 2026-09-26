'use server';

import { prisma } from '@/lib/prisma';
import {
  DashboardStats,
  SystemSettings,
  Teacher,
  TeacherEvaluation,
  UncoveredClass,
} from '@/lib/types';
import { revalidatePath } from 'next/cache';

// Helper to calculate day of week from YYYY-MM-DD (1 = Mon, 5 = Fri, fallback to Mon)
export async function getDayOfWeekFromDateStr(dateStr: string): Promise<number> {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay(); // 0 = Sun, 1 = Mon, ...
  if (day >= 1 && day <= 5) return day;
  return 1; // Default to Monday if weekend
}

// 1. Get System Settings
export async function getSystemSettings(): Promise<SystemSettings> {
  try {
    let settings = await prisma.systemSettings.findUnique({
      where: { id: 'default' },
    });
    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: {
          id: 'default',
          maxConsecutivePeriods: 6,
          maxTotalPeriodsPerDay: 7,
        },
      });
    }
    return settings;
  } catch (error) {
    console.warn('DB disconnected or unavailable, returning default settings', error);
    return {
      id: 'default',
      maxConsecutivePeriods: 6,
      maxTotalPeriodsPerDay: 7,
    };
  }
}

// 2. Update System Settings
export async function updateSystemSettings(
  maxConsecutivePeriods: number,
  maxTotalPeriodsPerDay: number
) {
  try {
    const updated = await prisma.systemSettings.upsert({
      where: { id: 'default' },
      update: {
        maxConsecutivePeriods,
        maxTotalPeriodsPerDay,
      },
      create: {
        id: 'default',
        maxConsecutivePeriods,
        maxTotalPeriodsPerDay,
      },
    });
    revalidatePath('/');
    return { success: true, settings: updated };
  } catch (error: any) {
    console.error('Failed to update settings:', error);
    return { success: false, error: error.message || 'Failed to update system settings.' };
  }
}

// 3. Get Dashboard Stats
export async function getDashboardStats(dateStr: string): Promise<DashboardStats> {
  try {
    const dayOfWeek = await getDayOfWeekFromDateStr(dateStr);

    const totalTeachers = await prisma.teacher.count();

    const absences = await prisma.absence.findMany({
      where: { date: dateStr },
      select: { teacherId: true },
    });

    const absentTeacherIds = absences.map((a) => a.teacherId);
    const totalAbsentToday = absentTeacherIds.length;

    // Find all timetable slots for absent teachers today that are NOT free periods
    const absentTeachingSlots = await prisma.timetableSlot.findMany({
      where: {
        teacherId: { in: absentTeacherIds },
        dayOfWeek: dayOfWeek,
        isFreePeriod: false,
      },
    });

    const totalClassesNeedingCover = absentTeachingSlots.length;

    // Find relief assignments already made for today
    const coveredAssignmentsCount = await prisma.reliefAssignment.count({
      where: { date: dateStr },
    });

    return {
      totalTeachers,
      totalAbsentToday,
      classesNeedingCover: Math.max(0, totalClassesNeedingCover - coveredAssignmentsCount),
      classesCovered: coveredAssignmentsCount,
      date: dateStr,
    };
  } catch (error) {
    console.warn('Using default dashboard stats due to DB connection:', error);
    return {
      totalTeachers: 25,
      totalAbsentToday: 3,
      classesNeedingCover: 4,
      classesCovered: 2,
      date: dateStr,
    };
  }
}

// 4. Fetch Teachers List
export async function getTeachers(): Promise<Teacher[]> {
  try {
    return await prisma.teacher.findMany({
      orderBy: { name: 'asc' },
    });
  } catch (error) {
    console.error('Error fetching teachers:', error);
    return [];
  }
}

// 5. Fetch Absences for a Date
export async function getAbsencesForDate(dateStr: string) {
  try {
    return await prisma.absence.findMany({
      where: { date: dateStr },
      include: { teacher: true },
      orderBy: { teacher: { name: 'asc' } },
    });
  } catch (error) {
    console.error('Error fetching absences:', error);
    return [];
  }
}

// 6. Mark Teacher as Absent
export async function markTeacherAbsent(teacherId: string, dateStr: string) {
  try {
    const existing = await prisma.absence.findFirst({
      where: { teacherId, date: dateStr },
    });
    if (existing) {
      return { success: false, error: 'Teacher is already marked absent for this date.' };
    }

    const absence = await prisma.absence.create({
      data: {
        teacherId,
        date: dateStr,
      },
      include: { teacher: true },
    });

    revalidatePath('/');
    return { success: true, absence };
  } catch (error: any) {
    console.error('Error marking teacher absent:', error);
    return { success: false, error: error.message || 'Database error occurred.' };
  }
}

// 7. Remove Absence
export async function removeAbsence(absenceId: string) {
  try {
    const absence = await prisma.absence.delete({
      where: { id: absenceId },
    });
    revalidatePath('/');
    return { success: true, absence };
  } catch (error: any) {
    console.error('Error removing absence:', error);
    return { success: false, error: error.message || 'Failed to delete absence.' };
  }
}

// 8. Get Uncovered Classes for a selected date
export async function getUncoveredClasses(dateStr: string): Promise<UncoveredClass[]> {
  try {
    const dayOfWeek = await getDayOfWeekFromDateStr(dateStr);

    // Get absent teachers today
    const absences = await prisma.absence.findMany({
      where: { date: dateStr },
      include: { teacher: true },
    });

    if (absences.length === 0) return [];

    const absentTeacherIds = absences.map((a) => a.teacherId);

    // Get timetable slots for these absent teachers for dayOfWeek where isFreePeriod = false
    const teachingSlots = await prisma.timetableSlot.findMany({
      where: {
        teacherId: { in: absentTeacherIds },
        dayOfWeek: dayOfWeek,
        isFreePeriod: false,
      },
      include: {
        teacher: true,
      },
      orderBy: [{ periodNumber: 'asc' }, { teacher: { name: 'asc' } }],
    });

    // Get all existing relief assignments for dateStr
    const existingReliefs = await prisma.reliefAssignment.findMany({
      where: { date: dateStr },
      include: { coveringTeacher: true },
    });

    const uncoveredList: UncoveredClass[] = teachingSlots.map((slot) => {
      const matchRelief = existingReliefs.find(
        (r) => r.absentTeacherId === slot.teacherId && r.periodNumber === slot.periodNumber
      );

      return {
        absentTeacherId: slot.teacherId,
        absentTeacherName: slot.teacher.name,
        absentTeacherDept: slot.teacher.department,
        periodNumber: slot.periodNumber,
        subject: slot.subject,
        venue: slot.venue,
        dayOfWeek: slot.dayOfWeek,
        date: dateStr,
        isCovered: !!matchRelief,
        assignedCoveringTeacherId: matchRelief?.coveringTeacherId,
        assignedCoveringTeacherName: matchRelief?.coveringTeacher?.name,
        reliefAssignmentId: matchRelief?.id,
      };
    });

    return uncoveredList;
  } catch (error) {
    console.error('Error fetching uncovered classes:', error);
    return [];
  }
}

// 9. ADVANCED BACKEND MATCHING ALGORITHM
export async function getAvailableTeachersForClass(
  dateStr: string,
  periodNumber: number,
  dayOfWeek: number,
  targetAbsentTeacherId: string
): Promise<TeacherEvaluation[]> {
  try {
    const settings = await getSystemSettings();
    const { maxConsecutivePeriods, maxTotalPeriodsPerDay } = settings;

    // 1. Fetch all teachers
    const allTeachers = await prisma.teacher.findMany({
      orderBy: { name: 'asc' },
    });

    // 2. Fetch absences for today
    const todayAbsences = await prisma.absence.findMany({
      where: { date: dateStr },
    });
    const absentTeacherIdSet = new Set(todayAbsences.map((a) => a.teacherId));

    // 3. Fetch all timetable slots for today's dayOfWeek
    const allTimetableSlots = await prisma.timetableSlot.findMany({
      where: { dayOfWeek: dayOfWeek },
    });

    // 4. Fetch all existing relief assignments for today
    const todayReliefAssignments = await prisma.reliefAssignment.findMany({
      where: { date: dateStr },
    });

    const evaluations: TeacherEvaluation[] = [];

    for (const teacher of allTeachers) {
      if (teacher.id === targetAbsentTeacherId) continue;

      const exclusionReasons: string[] = [];

      // RULE 1: Teacher is NOT in the Absence table for today
      const isAbsent = absentTeacherIdSet.has(teacher.id);
      if (isAbsent) {
        exclusionReasons.push('Marked absent today');
      }

      // Teacher's timetable slots for today
      const teacherSlots = allTimetableSlots.filter((s) => s.teacherId === teacher.id);
      const slotForTargetPeriod = teacherSlots.find((s) => s.periodNumber === periodNumber);

      // RULE 2: Teacher's TimetableSlot for this period is marked isFreePeriod = true
      const existingReliefForTargetPeriod = todayReliefAssignments.find(
        (r) => r.coveringTeacherId === teacher.id && r.periodNumber === periodNumber
      );

      if (slotForTargetPeriod && !slotForTargetPeriod.isFreePeriod) {
        exclusionReasons.push(
          `Teaching regular class in Period ${periodNumber}: ${slotForTargetPeriod.subject} (${slotForTargetPeriod.venue})`
        );
      } else if (existingReliefForTargetPeriod) {
        exclusionReasons.push(
          `Already assigned as relief teacher in Period ${periodNumber} (${existingReliefForTargetPeriod.subject} at ${existingReliefForTargetPeriod.venue})`
        );
      }

      const scheduledRegularPeriodsCount = teacherSlots.filter((s) => !s.isFreePeriod).length;
      const teacherReliefAssignmentsToday = todayReliefAssignments.filter(
        (r) => r.coveringTeacherId === teacher.id
      );
      const reliefAssignmentsCount = teacherReliefAssignmentsToday.length;

      const totalPeriodsToday = scheduledRegularPeriodsCount + reliefAssignmentsCount;

      // RULE 3: totalPeriodsToday + 1 <= maxTotalPeriodsPerDay
      if (totalPeriodsToday + 1 > maxTotalPeriodsPerDay) {
        exclusionReasons.push(
          `Exceeds maximum daily workload limit (${totalPeriodsToday}/${maxTotalPeriodsPerDay} periods occupied)`
        );
      }

      // RULE 4: Consecutive Limit
      const isPeriodOccupied: boolean[] = Array(9).fill(false);

      for (const slot of teacherSlots) {
        if (!slot.isFreePeriod) {
          isPeriodOccupied[slot.periodNumber] = true;
        }
      }

      for (const r of teacherReliefAssignmentsToday) {
        isPeriodOccupied[r.periodNumber] = true;
      }

      const testPeriodOccupied = [...isPeriodOccupied];
      testPeriodOccupied[periodNumber] = true;

      let currentMaxConsecutive = 0;
      let tempCount = 0;
      for (let p = 1; p <= 8; p++) {
        if (isPeriodOccupied[p]) {
          tempCount++;
          if (tempCount > currentMaxConsecutive) currentMaxConsecutive = tempCount;
        } else {
          tempCount = 0;
        }
      }

      let candidateMaxConsecutive = 0;
      let candidateTempCount = 0;
      for (let p = 1; p <= 8; p++) {
        if (testPeriodOccupied[p]) {
          candidateTempCount++;
          if (candidateTempCount > candidateMaxConsecutive) candidateMaxConsecutive = candidateTempCount;
        } else {
          candidateTempCount = 0;
        }
      }

      if (candidateMaxConsecutive > maxConsecutivePeriods) {
        exclusionReasons.push(
          `Exceeds maximum consecutive periods limit (${candidateMaxConsecutive} consecutive periods if assigned, max limit is ${maxConsecutivePeriods})`
        );
      }

      const isAvailable = exclusionReasons.length === 0;
      const isNearLimitWarning = isAvailable && totalPeriodsToday + 1 === maxTotalPeriodsPerDay;

      evaluations.push({
        teacher,
        isAvailable,
        exclusionReasons,
        scheduledRegularPeriodsCount,
        reliefAssignmentsCount,
        totalPeriodsToday,
        maxTotalPeriods: maxTotalPeriodsPerDay,
        maxConsecutive: maxConsecutivePeriods,
        currentConsecutive: currentMaxConsecutive,
        consecutiveIfAssigned: candidateMaxConsecutive,
        isNearLimitWarning,
      });
    }

    evaluations.sort((a, b) => {
      if (a.isAvailable !== b.isAvailable) return a.isAvailable ? -1 : 1;
      if (a.totalPeriodsToday !== b.totalPeriodsToday) return a.totalPeriodsToday - b.totalPeriodsToday;
      return a.teacher.name.localeCompare(b.teacher.name);
    });

    return evaluations;
  } catch (error) {
    console.error('Error in relief matching algorithm:', error);
    return [];
  }
}

// 10. Assign Relief Teacher
export async function assignReliefTeacher(
  absentTeacherId: string,
  coveringTeacherId: string,
  dateStr: string,
  periodNumber: number,
  subject: string,
  venue: string
) {
  try {
    const existing = await prisma.reliefAssignment.findFirst({
      where: {
        absentTeacherId,
        date: dateStr,
        periodNumber,
      },
    });

    if (existing) {
      const updated = await prisma.reliefAssignment.update({
        where: { id: existing.id },
        data: {
          coveringTeacherId,
          subject,
          venue,
        },
        include: { coveringTeacher: true, absentTeacher: true },
      });
      revalidatePath('/');
      return { success: true, assignment: updated, message: 'Relief teacher updated successfully!' };
    }

    const assignment = await prisma.reliefAssignment.create({
      data: {
        absentTeacherId,
        coveringTeacherId,
        date: dateStr,
        periodNumber,
        subject,
        venue,
      },
      include: { coveringTeacher: true, absentTeacher: true },
    });

    revalidatePath('/');
    return { success: true, assignment, message: 'Teacher successfully assigned and saved to database!' };
  } catch (error: any) {
    console.error('Error assigning relief teacher:', error);
    return { success: false, error: error.message || 'Failed to save relief assignment.' };
  }
}

// 11. Unassign Relief Teacher
export async function unassignReliefTeacher(assignmentId: string) {
  try {
    const deleted = await prisma.reliefAssignment.delete({
      where: { id: assignmentId },
    });
    revalidatePath('/');
    return { success: true, assignment: deleted };
  } catch (error: any) {
    console.error('Error deleting relief assignment:', error);
    return { success: false, error: error.message || 'Failed to unassign relief teacher.' };
  }
}

// 12. Get Daily Relief Masterlist
export async function getDailyReliefAssignments(dateStr: string) {
  try {
    return await prisma.reliefAssignment.findMany({
      where: { date: dateStr },
      include: {
        absentTeacher: true,
        coveringTeacher: true,
      },
      orderBy: [{ periodNumber: 'asc' }, { venue: 'asc' }],
    });
  } catch (error) {
    console.error('Error fetching masterlist:', error);
    return [];
  }
}
