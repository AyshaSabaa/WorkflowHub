const base = process.argv[2] || "http://localhost:3000";

const login = await fetch(`${base}/api/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "aysha@avishkarai.com", password: "hello123" }),
});
console.log("POST /api/auth/login", login.status, await login.text());

const me = await fetch(`${base}/api/auth/me`);
console.log("GET /api/auth/me", me.status, await me.text());
