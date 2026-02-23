import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://wavdoirdpqzdunvlgkpl.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'sb_publishable_N1uguwXOmouLzXIyTSUgUw_UCIqDMEb';

export const supabase = createClient(supabaseUrl, supabaseKey);
