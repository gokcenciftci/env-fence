const port = process.env.PORT || '3000';
const dbUrl = process.env['DATABASE_URL'];

// Secret leak check
const githubToken = 'ghp_123456789012345678901234567890123456';

// Missing env in example check
const fallback = process.env.UNDOCUMENTED_VAR;

console.log(`Port: ${port}, DB: ${dbUrl}, Token: ${!!githubToken}, Fallback: ${fallback}`);
