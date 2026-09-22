// === CONFIGURATION ===
// 1. Create a free project at https://supabase.com
// 2. Go to Project Settings > API
// 3. Copy URL and anon public key here
// 4. Run the SQL from supabase-schema.sql in SQL Editor
// 5. Create Storage bucket "task-photos" (public)
// 6. Create Telegram bot via @BotFather and put its username below (without @)

const SUPABASE_URL = 'https://twtsbcoujalvnbghztyy.supabase.co';          // e.g. https://xxxxx.supabase.co
const SUPABASE_ANON_KEY = 'sb_publishable_Td6Oo_5YKMIyook2NC_w_Q_1Y5ZYE_c'; // starts with eyJ...

// Telegram BOT username (without @) — users will write to the bot 24/7
// Example: if bot is @BishkekGigsBot then write BishkekGigsBot
const BOT_TELEGRAM = 'bishkektasksbot';

// Bishkek center coordinates
const BISHKEK_CENTER = [42.8746, 74.5698];
const DEFAULT_ZOOM = 12;
