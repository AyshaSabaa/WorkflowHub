/**
 * End-to-end persistence test for task/deal updates.
 * Usage: node scripts/test-persistence.mjs [baseUrl]
 */
const base = process.argv[2] || "http://localhost:3000";

async function request(path, options = {}) {
  const res = await fetch(`${base}${path}`, {
    cache: "no-store",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  return { status: res.status, body };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const login = await request("/api/auth/login", {
  method: "POST",
  body: JSON.stringify({ email: "aysha@avishkarai.com", password: "hello123" }),
});
assert(login.status === 200, `Login failed: ${login.status} ${JSON.stringify(login.body)}`);
const token = login.body.token;

const auth = { Authorization: `Bearer ${token}` };

const boards = await request("/api/boards", { headers: auth });
assert(boards.status === 200, "Failed to list boards");
const board = boards.body.boards?.[0];
assert(board, "No boards found");

const boardDetail = await request(`/api/boards/${board.id}`, { headers: auth });
assert(boardDetail.status === 200, "Failed to load board");
const column = boardDetail.body.board.columns?.[0];
assert(column, "No columns found");

const created = await request("/api/tasks", {
  method: "POST",
  headers: auth,
  body: JSON.stringify({
    title: "Persistence Test Deal",
    customer: "Test Customer",
    amount: 1000,
    boardId: board.id,
    columnId: column.id,
    priority: "MEDIUM",
  }),
});
assert(created.status === 201, `Create failed: ${created.status} ${JSON.stringify(created.body)}`);
const taskId = created.body.task.id;

const updates = [
  { field: "title", value: "Renamed Persistence Deal" },
  { field: "customer", value: "Updated Customer" },
  { field: "amount", value: 25000 },
  { field: "description", value: "Persisted description" },
  { field: "priority", value: "HIGH" },
];

for (const { field, value } of updates) {
  const patch = await request(`/api/tasks/${taskId}`, {
    method: "PATCH",
    headers: auth,
    body: JSON.stringify({ [field]: value }),
  });
  assert(patch.status === 200, `PATCH ${field} failed: ${patch.status} ${JSON.stringify(patch.body)}`);

  const get = await request(`/api/tasks/${taskId}`, { headers: auth });
  assert(get.status === 200, `GET after ${field} failed`);
  const task = get.body.task;
  if (field === "description") {
    assert(task.description === value, `description not persisted: ${task.description}`);
  } else {
    assert(task[field] === value, `${field} not persisted: expected ${value}, got ${task[field]}`);
  }
}

const col2 = boardDetail.body.board.columns[1] || column;
const move = await request(`/api/tasks/${taskId}/move`, {
  method: "PATCH",
  headers: auth,
  body: JSON.stringify({ columnId: col2.id, position: 0 }),
});
assert(move.status === 200, `Move failed: ${move.status} ${JSON.stringify(move.body)}`);

const afterMove = await request(`/api/tasks/${taskId}`, { headers: auth });
assert(afterMove.body.task.columnId === col2.id, "columnId not persisted after move");

await request(`/api/tasks/${taskId}`, { method: "DELETE", headers: auth });

console.log("All persistence checks passed.");
