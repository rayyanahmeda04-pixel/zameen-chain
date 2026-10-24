import { neon } from '@neondatabase/serverless';

const neonUrl = import.meta.env.VITE_NEON_DATABASE_URL || import.meta.env.VITE_DATABASE_URL;

export const isNeonConfigured = () => {
  return Boolean(
    neonUrl && 
    neonUrl.startsWith('postgres') && 
    !neonUrl.includes('your-neon-database-url')
  );
};

export const sql = isNeonConfigured() ? neon(neonUrl) : null;
