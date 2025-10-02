// Database setup helper - shows console instructions
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  console.log(`
🏠 Moving Home Planner - Database Setup Required

It looks like your database tables haven't been created yet!

To set up your database:

1. 🌐 Go to: https://supabase.com/dashboard/project/jlnumgeggvpnhkassmho/sql
2. 📁 Open the file 'create_tables.sql' in this project
3. 📋 Copy the entire contents
4. 📝 Paste it into the Supabase SQL Editor
5. ▶️ Click "Run" to execute
6. 🔄 Refresh this page

The app will run with mock data until the database is set up.
  `);
}

export {};
