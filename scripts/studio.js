const { config } = require('dotenv');
const { execSync } = require('child_process');
const path = require('path');

// Load .env file
config({ path: path.join(__dirname, '..', '.env') });

// Get DATABASE_URL
const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('ERROR: DATABASE_URL not found in .env file');
  process.exit(1);
}

// Run prisma studio with the URL
try {
  execSync(`npx prisma studio --url="${dbUrl}"`, { stdio: 'inherit' });
} catch (error) {
  process.exit(error.status || 1);
}
