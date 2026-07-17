const port = process.env.PORT || '3000';
const dbUrl = process.env['DATABASE_URL'];
const apiKey = process.env.API_KEY;

console.log(`Port: ${port}, DB: ${dbUrl}, API Key loaded: ${!!apiKey}`);
