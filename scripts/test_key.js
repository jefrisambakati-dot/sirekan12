import { createClient } from '@supabase/supabase-js';

const url = 'https://lnayzwkenmqyrgqcomqj.supabase.co';
const baseHeader = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxuYXl6d2tlbm1xeXJncWNvbXFqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDkyMzkwNywiZXhwIjoyMDk2NDk5OTA3fQ';

const chars = ['I', 'l', '1'];

async function test() {
  for (const c1 of chars) {
    for (const c2 of chars) {
      const signature = `W896Q72yU0-VnoHNRkwTKlTJXURRj${c1}vdsj_FvQR7MvA${c2}`;
      const key = `${baseHeader}.${signature}`;
      
      const supabase = createClient(url, key);
      try {
        const { data, error } = await supabase.from('companies').select('id').limit(1);
        if (error) {
          console.log(`c1=${c1}, c2=${c2}: error =`, error.message);
        } else {
          console.log(`✅ SUCCESS! c1=${c1}, c2=${c2}`);
          console.log(`Key: ${key}`);
          return;
        }
      } catch (err) {
        console.log(`c1=${c1}, c2=${c2}: exception =`, err.message);
      }
    }
  }
}

test();
