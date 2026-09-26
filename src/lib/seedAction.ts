'use server';

import { main as runSeed } from '../../prisma/seed';
import { revalidatePath } from 'next/cache';

export async function seedDatabaseAction() {
  try {
    await runSeed();
    revalidatePath('/');
    return { success: true, message: 'Database successfully seeded with Evergreen Primary School data!' };
  } catch (error: any) {
    console.error('Seed action failed:', error);
    return { success: false, error: error.message || 'Failed to seed database.' };
  }
}
