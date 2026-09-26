'use client';

import React, { useState } from 'react';
import { seedDatabaseAction } from '@/lib/seedAction';
import { useToast } from '@/components/Toast';
import { Database, RefreshCw } from 'lucide-react';

export function SeedButton({ onComplete }: { onComplete: () => void }) {
  const { showToast } = useToast();
  const [isSeeding, setIsSeeding] = useState<boolean>(false);

  const handleSeed = async () => {
    if (
      !confirm(
        'Re-seed Neon database with Evergreen Primary School dummy data (25 teachers, 5-day timetable, pre-marked absences)?'
      )
    )
      return;

    setIsSeeding(true);
    try {
      const res = await seedDatabaseAction();
      if (res.success) {
        showToast('Neon database re-seeded successfully!', 'success');
        onComplete();
      } else {
        showToast(res.error || 'Seeding failed.', 'error');
      }
    } catch (err) {
      showToast('Error seeding database.', 'error');
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <button
      onClick={handleSeed}
      disabled={isSeeding}
      className="px-3.5 py-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 font-semibold text-xs transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
      title="Seed database with dummy data"
    >
      <Database className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
      {isSeeding ? (
        <>
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          Seeding DB...
        </>
      ) : (
        'Reset & Seed Demo DB'
      )}
    </button>
  );
}
