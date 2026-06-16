import { PrismaClient } from "@prisma/client";
import { UserRole, Priority } from "../src/lib/db-enums";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

const prisma = new PrismaClient();

const OLD_DEMO_EMAILS = [
  "admin@workflowhub.com",
  "manager@workflowhub.com",
  "employee@workflowhub.com",
  "emma@workflowhub.com",
];

const TEAM = [
  { name: "Hasnain", email: "hasnain@avishkarai.com", role: UserRole.EMPLOYEE, canLogin: false },
  { name: "Zeeshan", email: "zeeshan@avishkarai.com", role: UserRole.EMPLOYEE, canLogin: false },
  { name: "Hammad", email: "hammad@avishkarai.com", role: UserRole.EMPLOYEE, canLogin: false },
  { name: "Aysha", email: "aysha@avishkarai.com", role: UserRole.ADMIN, canLogin: true, password: "hello123" },
  { name: "Shivang", email: "shivang@avishkarai.com", role: UserRole.MANAGER, canLogin: true, password: "hello123" },
  { name: "Arpit", email: "arpit@avishkarai.com", role: UserRole.MANAGER, canLogin: true, password: "hello123" },
  { name: "Kiran", email: "kiran@avishkarai.com", role: UserRole.EMPLOYEE, canLogin: false },
  { name: "Tanay", email: "tanay@avishkarai.com", role: UserRole.EMPLOYEE, canLogin: false },
  { name: "Aditya", email: "aditya@avishkarai.com", role: UserRole.EMPLOYEE, canLogin: false },
] as const;

async function cleanup() {
  await prisma.taskTag.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.attachmentVersion.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.task.deleteMany();
  await prisma.column.deleteMany();
  await prisma.board.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.team.deleteMany();
  await prisma.automationRule.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.savedFilter.deleteMany();
  await prisma.auditLog.deleteMany();

  await prisma.user.deleteMany({ where: { email: { in: [...OLD_DEMO_EMAILS] } } });
}

async function main() {
  console.log("Seeding Avishkar AI CRM...");

  await cleanup();

  await prisma.companySettings.upsert({
    where: { id: "default" },
    update: { name: "Avishkar AI" },
    create: { id: "default", name: "Avishkar AI", timezone: "Asia/Kolkata" },
  });

  const users: Record<string, { id: string; name: string }> = {};

  for (const member of TEAM) {
    const passwordHash = member.canLogin
      ? await bcrypt.hash(member.password!, 12)
      : await bcrypt.hash(randomBytes(32).toString("hex"), 12);

    const user = await prisma.user.upsert({
      where: { email: member.email },
      update: {
        name: member.name,
        role: member.role,
        passwordHash,
        isActive: true,
      },
      create: {
        email: member.email,
        name: member.name,
        role: member.role,
        passwordHash,
        department: "Avishkar AI",
        isActive: true,
      },
    });
    users[member.name] = { id: user.id, name: user.name };
  }

  const aysha = users.Aysha;
  const shivang = users.Shivang;
  const allIds = TEAM.map((m) => users[m.name].id);

  const avishkarTeam = await prisma.team.create({
    data: {
      name: "Avishkar AI Team",
      department: "Sales",
      description: "Avishkar AI CRM team",
      members: { create: allIds.map((userId) => ({ userId })) },
    },
  });

  const tags = await Promise.all([
    prisma.tag.upsert({ where: { name: "Bug" }, update: {}, create: { name: "Bug", color: "#ef4444" } }),
    prisma.tag.upsert({ where: { name: "Feature" }, update: {}, create: { name: "Feature", color: "#3b82f6" } }),
    prisma.tag.upsert({ where: { name: "Urgent" }, update: {}, create: { name: "Urgent", color: "#f59e0b" } }),
  ]);

  const salesStages = [
    { name: "Prospect", slug: "prospect", color: "#3b82f6", position: 0 },
    { name: "Initial Contact", slug: "initial_contact", color: "#f97316", position: 1 },
    { name: "Demo & Discussion", slug: "demo_discussion", color: "#8b5cf6", position: 2 },
    { name: "Documentation", slug: "documentation", color: "#eab308", position: 3 },
    { name: "Deal Closed", slug: "deal_closed", color: "#22c55e", position: 4 },
  ];

  const defaultStages = [
    { name: "To Do", color: "#6366f1", position: 0 },
    { name: "In Progress", color: "#f59e0b", position: 1 },
    { name: "Review", color: "#8b5cf6", position: 2 },
    { name: "Done", color: "#22c55e", position: 3 },
  ];

  const boardConfigs = [
    { name: "Sales Pipeline", department: "Sales", teamId: avishkarTeam.id },
    { name: "Delivery Sprint", department: "Delivery", teamId: avishkarTeam.id },
  ];

  const salesDeals = [
    { title: "Enterprise CRM rollout", customer: "Nova Systems", amount: 500000, priority: Priority.HIGH, col: 0 },
    { title: "AI workflow automation", customer: "Meridian Corp", amount: 1500000, priority: Priority.HIGH, col: 1 },
    { title: "Annual support renewal", customer: "Pinnacle Ltd", amount: 250000, priority: Priority.MEDIUM, col: 2 },
    { title: "Mobile app delivery", customer: "Vertex Group", amount: 800000, priority: Priority.HIGH, col: 3 },
    { title: "Cloud migration project", customer: "Summit Tech", amount: 1000000, priority: Priority.MEDIUM, col: 4 },
  ];

  const taskTemplates = [
    { title: "Client discovery call", customer: "Nova Systems", amount: 250000, priority: Priority.HIGH, col: 1 },
    { title: "Sprint planning", customer: "Internal", amount: null, priority: Priority.MEDIUM, col: 0 },
    { title: "Integration review", customer: null, amount: null, priority: Priority.CRITICAL, col: 1 },
    { title: "Proposal deck update", customer: "Meridian Corp", amount: 150000, priority: Priority.MEDIUM, col: 2 },
    { title: "Documentation pass", customer: null, amount: null, priority: Priority.LOW, col: 0 },
    { title: "Onboarding workshop", customer: "Vertex Group", amount: 1000000, priority: Priority.HIGH, col: 3 },
  ];

  for (const cfg of boardConfigs) {
    const isSales = cfg.name === "Sales Pipeline";
    const board = await prisma.board.create({
      data: {
        name: cfg.name,
        department: cfg.department,
        teamId: cfg.teamId,
        description: `${cfg.name} — Avishkar AI`,
        columns: { create: isSales ? salesStages : defaultStages },
      },
      include: { columns: true },
    });

    const deals = isSales ? salesDeals : taskTemplates;
    for (let i = 0; i < deals.length; i++) {
      const t = deals[i];
      const column = board.columns[t.col];
      const assigneeId = allIds[i % allIds.length];
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + (i % 3 === 0 ? -2 : i + 5));

      const task = await prisma.task.create({
        data: {
          title: t.title,
          description: `Description for: ${t.title}`,
          customer: t.customer ?? null,
          amount: t.amount ?? null,
          priority: t.priority ?? Priority.MEDIUM,
          status: column.slug ?? column.name,
          boardId: board.id,
          columnId: column.id,
          assigneeId,
          creatorId: aysha.id,
          teamId: cfg.teamId,
          dueDate,
          position: i,
          ...(column.slug === "deal_closed" || column.name === "Done" ? { completedAt: new Date() } : {}),
          tags: { create: [{ tagId: tags[i % tags.length].id }] },
        },
      });

      await prisma.activityLog.create({
        data: { taskId: task.id, userId: aysha.id, action: "TASK_CREATED", message: `${aysha.name} created "${task.title}"` },
      });

      if (i % 2 === 0) {
        await prisma.comment.create({
          data: { taskId: task.id, authorId: assigneeId, content: "Making good progress.", mentions: [] },
        });
      }
    }
  }

  await prisma.automationRule.createMany({
    data: [
      { name: "Auto-assign critical", description: "Assign critical tasks to Shivang", trigger: "TASK_CREATED", action: "ASSIGN_USER", conditions: { priority: "CRITICAL" }, config: { userId: shivang.id } },
      { name: "Due date reminder", trigger: "DUE_DATE_APPROACHING", action: "SEND_NOTIFICATION", conditions: { hoursBefore: 24 }, config: { message: "Task due tomorrow" } },
      { name: "Overdue escalation", trigger: "OVERDUE", action: "ESCALATE", conditions: {}, config: { escalateTo: aysha.id } },
      { name: "Status change notify", trigger: "STATUS_CHANGED", action: "SEND_NOTIFICATION", conditions: {}, config: {} },
    ],
  });

  await prisma.auditLog.create({
    data: { userId: aysha.id, action: "SEED", entityType: "System", details: { message: "Avishkar AI CRM seeded" } },
  });

  console.log("Done!");
  console.log("Login users:");
  console.log("  aysha@avishkarai.com");
  console.log("  shivang@avishkarai.com");
  console.log("  arpit@avishkarai.com");
  console.log("Team members:", TEAM.map((m) => m.name).join(", "));
}

main().catch(console.error).finally(() => prisma.$disconnect());
