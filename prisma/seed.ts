import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TEACHERS = [
  // English Department
  { name: 'Mrs. Eleanor Vance', department: 'English Language' },
  { name: 'Mr. David Miller', department: 'English Language' },
  { name: 'Mdm. Sarah Jenkins', department: 'English Language' },
  { name: 'Ms. Fiona Gallagher', department: 'English Language' },

  // Mathematics Department
  { name: 'Dr. Robert Chen', department: 'Mathematics' },
  { name: 'Ms. Chloe Bennett', department: 'Mathematics' },
  { name: 'Mr. Arthur Pendelton', department: 'Mathematics' },
  { name: 'Mdm. Grace Hopper', department: 'Mathematics' },

  // Science Department
  { name: 'Dr. Benjamin Foster', department: 'Science & Discovery' },
  { name: 'Mrs. Hannah Abbott', department: 'Science & Discovery' },
  { name: 'Mr. Marcus Wright', department: 'Science & Discovery' },
  { name: 'Ms. Maya Patel', department: 'Science & Discovery' },

  // Physical Education & Health
  { name: 'Coach James Wilson', department: 'Physical Education' },
  { name: 'Coach Maria Santos', department: 'Physical Education' },
  { name: 'Coach Derek Thorne', department: 'Physical Education' },

  // Visual & Performing Arts
  { name: 'Ms. Lily Montgomery', department: 'Art & Music' },
  { name: 'Mr. Julian Vance', department: 'Art & Music' },
  { name: 'Mdm. Beatrice Thorne', department: 'Art & Music' },

  // Humanities & Social Studies
  { name: 'Mr. Christopher Nolan', department: 'Humanities' },
  { name: 'Mrs. Rachel Green', department: 'Humanities' },
  { name: 'Ms. Olivia Wilde', department: 'Humanities' },

  // Information & Communication Tech
  { name: 'Mr. Timothy Berners', department: 'ICT & Technology' },
  { name: 'Ms. Ada Lovelace', department: 'ICT & Technology' },

  // Mother Tongue & Languages
  { name: 'Mdm. Mei Ling Tan', department: 'Mother Tongue' },
  { name: 'En. Ahmad Ibrahim', department: 'Mother Tongue' },
];

const SUBJECTS_BY_DEPT: Record<string, string[]> = {
  'English Language': ['Primary English', 'Creative Writing', 'Literature & Reading', 'Spelling & Grammar'],
  'Mathematics': ['Primary Math', 'Algebra Fundamentals', 'Geometry & Shapes', 'Math Logic & Puzzles'],
  'Science & Discovery': ['General Science', 'Biology Basics', 'Physical Sciences', 'Environmental Studies'],
  'Physical Education': ['Physical Education', 'Health & Hygiene', 'Gymnastics & Sports', 'Outdoor Games'],
  'Art & Music': ['Visual Art', 'Craft & Design', 'Music & Choir', 'Drama & Speech'],
  'Humanities': ['Social Studies', 'History & Heritage', 'Geography & World'],
  'ICT & Technology': ['Coding Basics', 'Digital Literacy', 'Robotics & Tech'],
  'Mother Tongue': ['Mother Tongue Language', 'Culture & Heritage'],
};

const VENUES = [
  'Classroom 1A',
  'Classroom 1B',
  'Classroom 2A',
  'Classroom 2B',
  'Classroom 3A',
  'Classroom 3B',
  'Classroom 4A',
  'Classroom 4B',
  'Science Lab 1',
  'Science Lab 2',
  'Computer Lab 1',
  'Computer Lab 2',
  'School Hall',
  'Art Room 1',
  'Music Studio',
  'Indoor Sports Hall',
  'School Field',
];

export async function main() {
  console.log('🌱 Starting Evergreen Primary School Database Seeding...');

  // 1. Reset Database
  await prisma.reliefAssignment.deleteMany({});
  await prisma.absence.deleteMany({});
  await prisma.timetableSlot.deleteMany({});
  await prisma.teacher.deleteMany({});
  await prisma.systemSettings.deleteMany({});

  console.log('Cleared existing records.');

  // 2. Create System Settings
  const settings = await prisma.systemSettings.create({
    data: {
      id: 'default',
      maxConsecutivePeriods: 6,
      maxTotalPeriodsPerDay: 7,
    },
  });
  console.log(`⚙️ System Settings initialized: Max Consecutive = ${settings.maxConsecutivePeriods}, Max Daily Total = ${settings.maxTotalPeriodsPerDay}`);

  // 3. Create Teachers
  const createdTeachers = [];
  for (const t of TEACHERS) {
    const teacher = await prisma.teacher.create({
      data: {
        name: t.name,
        department: t.department,
      },
    });
    createdTeachers.push(teacher);
  }
  console.log(`👩‍🏫 Created ${createdTeachers.length} teachers across 8 departments.`);

  // 4. Create 5-day Timetable (Days 1 to 5, Periods 1 to 8)
  let totalSlotsCount = 0;
  let freeSlotsCount = 0;

  for (const teacher of createdTeachers) {
    const deptSubjects = SUBJECTS_BY_DEPT[teacher.department] || ['General Studies'];

    for (let day = 1; day <= 5; day++) {
      // Deterministically create 2-3 free periods per teacher per day so relief works cleanly
      // e.g. based on teacher hash & day index
      for (let period = 1; period <= 8; period++) {
        // Decide if free period: Period 3, 5 or 7 depending on teacher index
        const teacherIdx = createdTeachers.indexOf(teacher);
        const isFree =
          (teacherIdx + day + period) % 3 === 0 ||
          (period === 4 && (teacherIdx + day) % 2 === 0);

        const subject = isFree
          ? 'Free Period'
          : deptSubjects[(period + teacherIdx) % deptSubjects.length];

        const venue = isFree
          ? 'Staff Room'
          : VENUES[(teacherIdx + day + period) % VENUES.length];

        await prisma.timetableSlot.create({
          data: {
            teacherId: teacher.id,
            dayOfWeek: day,
            periodNumber: period,
            subject: subject,
            venue: venue,
            isFreePeriod: isFree,
          },
        });

        totalSlotsCount++;
        if (isFree) freeSlotsCount++;
      }
    }
  }

  console.log(`📅 Created ${totalSlotsCount} timetable slots (${freeSlotsCount} free periods).`);

  // 5. Pre-mark Absences for Today's Date
  const todayStr = new Date().toISOString().split('T')[0]; // e.g. 2026-09-26
  const absentTeacher1 = createdTeachers[0]; // Mrs. Eleanor Vance
  const absentTeacher2 = createdTeachers[4]; // Dr. Robert Chen
  const absentTeacher3 = createdTeachers[8]; // Dr. Benjamin Foster

  const absencesToCreate = [absentTeacher1, absentTeacher2, absentTeacher3];

  for (const t of absencesToCreate) {
    await prisma.absence.create({
      data: {
        teacherId: t.id,
        date: todayStr,
      },
    });
  }

  console.log(`🏥 Pre-marked ${absencesToCreate.length} absent teachers for today (${todayStr}):`);
  absencesToCreate.forEach((t) => console.log(`   - ${t.name} (${t.department})`));

  console.log('✅ Evergreen Primary School Database Seeding Completed Successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Database seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
