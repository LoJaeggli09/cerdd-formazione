import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://auhdigviqegvfgccqeqx.supabase.co';
const supabaseKey = 'sb_publishable_E77w7MQ8ElCcpUMV8y5uxw_rFh2lOQ3';

export const supabase = createClient(supabaseUrl, supabaseKey);
