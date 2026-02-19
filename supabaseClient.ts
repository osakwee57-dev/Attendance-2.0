
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://aioodbiknjbacgqkmtjn.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpb29kYmlrbmpiYWNncWttdGpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNjczMjksImV4cCI6MjA4Njg0MzMyOX0.i9S0zmYEn1VaMZRB7fefzPWqmgUHlKWTmi1l0Kkemds';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
