// assets/js/supabase.js
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://xuczvudiupfntxxmsbiu.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_lA9GPzxFXn_1kbovhdFG6Q_NqtEJ9NE";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
