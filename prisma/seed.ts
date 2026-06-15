import { PrismaClient, UserRole, Priority } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding...");

  await prisma.companySettings.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default", name: "Avishkar AI", timezone: "Asia/Kolkata" },
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin@workflowhub.com" },
    update: {},
    create: {
      email: "admin@workflowhub.com",
      passwordHash: await bcrypt.hash("admin123", 12),
      name: "Alex Admin",
      role: UserRole.ADMIN,
      department: "Operations",
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: "manager@workflowhub.com" },
    update: {},
    create: {
      email: "manager@workflowhub.com",
      passwordHash: await bcrypt.hash("demo123", 12),
      name: "Sarah Manager",
      role: UserRole.MANAGER,
      department: "Sales",
    },
  });

  const employee = await prisma.user.upsert({
    where: { email: "employee@workflowhub.com" },
    update: {},
    create: {
      email: "employee@workflowhub.com",
      passwordHash: await bcrypt.hash("demo123", 12),
      name: "Mike Employee",
      role: UserRole.EMPLOYEE,
      department: "Engineering",
    },
  });

  const emp2 = await prisma.user.upsert({
    where: { email: "emma@workflowhub.com" },
    update: {},
    create: {
      email: "emma@workflowhub.com",
      passwordHash: await bcrypt.hash("demo123", 12),
      name: "Emma Wilson",
      role: UserRole.EMPLOYEE,
      department: "Marketing",
    },
  });

  const salesTeam = await prisma.team.create({
    data: {
      name: "Sales Team",
      department: "Sales",
      members: { create: [{ userId: manager.id }, { userId: admin.id }] },
    },
  });

  const engTeam = await prisma.team.create({
    data: {
      name: "Engineering",
      department: "Engineering",
      members: { create: [{ userId: employee.id }] },
    },
  });

  const tags = await Promise.all([
    prisma.tag.upsert({ where: { name: "Bug" }, update: {}, create: { name: "Bug", color: "#ef4444" } }),
    prisma.tag.upsert({ where: { name: "Feature" }, update: {}, create: { name: "Feature", color: "#3b82f6" } }),
    prisma.tag.upsert({ where: { name: "Urgent" }, update: {}, create: { name: "Urgent", color: "#f59e0b" } }),
  ]);

  const existingSalesBoard = await prisma.board.findFirst({ where: { name: "Sales Pipeline" } });
  if (existingSalesBoard) {
    await prisma.task.deleteMany({ where: { boardId: existingSalesBoard.id } });
    await prisma.column.deleteMany({ where: { boardId: existingSalesBoard.id } });
    await prisma.board.delete({ where: { id: existingSalesBoard.id } });
  }

  const boardConfigs = [
    { name: "Sales Pipeline", department: "Sales", teamId: salesTeam.id },
    { name: "Engineering Sprint", department: "Engineering", teamId: engTeam.id },
    { name: "Marketing Campaigns", department: "Marketing" },
    { name: "IT Support", department: "IT" },
  ];

  const taskTemplates = [
    { title: "Follow up with Acme Corp", customer: "Acme Corp", amount: 250000, priority: Priority.HIGH, col: 1, assignee: manager.id },
    { title: "Prepare Q2 sales report", customer: "Internal", amount: null, priority: Priority.MEDIUM, col: 0, assignee: admin.id },
    { title: "Fix authentication bug", customer: null, amount: null, priority: Priority.CRITICAL, col: 1, assignee: employee.id },
    { title: "Design landing page", customer: "Zenith Labs", amount: 150000, priority: Priority.MEDIUM, col: 2, assignee: emp2.id },
    { title: "Update API docs", customer: null, amount: null, priority: Priority.LOW, col: 0, assignee: employee.id },
    { title: "Client onboarding - TechStart", customer: "TechStart Pvt Ltd", amount: 1000000, priority: Priority.HIGH, col: 3, assignee: manager.id },
  ];

  const salesDeals = [
    { title: "Website Development", customer: "ABC Pvt Ltd", amount: 500000, priority: Priority.HIGH, col: 0, assignee: manager.id },
    { title: "CRM Implementation", customer: "XYZ Industries", amount: 1500000, priority: Priority.HIGH, col: 1, assignee: manager.id },
    { title: "Annual Support Contract", customer: "Global Tech", amount: 250000, priority: Priority.MEDIUM, col: 2, assignee: admin.id },
    { title: "Mobile App Project", customer: "StartupHub", amount: 800000, priority: Priority.HIGH, col: 3, assignee: manager.id },
    { title: "Cloud Migration", customer: "DataFlow Inc", amount: 1000000, priority: Priority.MEDIUM, col: 4, assignee: admin.id },
  ];

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

  for (const cfg of boardConfigs) {
    const isSales = cfg.name === "Sales Pipeline";
    const board = await prisma.board.create({
      data: {
        name: cfg.name,
        department: cfg.department,
        teamId: cfg.teamId,
        description: `${cfg.name} workflow board`,
        columns: { create: isSales ? salesStages : defaultStages },
      },
      include: { columns: true },
    });

    const deals = isSales ? salesDeals : taskTemplates;
    for (let i = 0; i < deals.length; i++) {
      const t = deals[i];
      const column = board.columns[t.col];
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
          assigneeId: t.assignee,
          creatorId: admin.id,
          teamId: cfg.teamId,
          dueDate,
          position: i,
          ...(column.slug === "deal_closed" || column.name === "Done" ? { completedAt: new Date() } : {}),
          tags: { create: [{ tagId: tags[i % tags.length].id }] },
        },
      });

      await prisma.activityLog.create({
        data: { taskId: task.id, userId: admin.id, action: "TASK_CREATED", message: `${admin.name} created "${task.title}"` },
      });

      if (i % 2 === 0) {
        await prisma.comment.create({
          data: { taskId: task.id, authorId: t.assignee, content: "Making good progress.", mentions: [] },
        });
      }
    }
  }

  await prisma.automationRule.createMany({
    data: [
      { name: "Auto-assign critical", description: "Assign critical tasks to manager", trigger: "TASK_CREATED", action: "ASSIGN_USER", conditions: { priority: "CRITICAL" }, config: { userId: manager.id } },
      { name: "Due date reminder", trigger: "DUE_DATE_APPROACHING", action: "SEND_NOTIFICATION", conditions: { hoursBefore: 24 }, config: { message: "Task due tomorrow" } },
      { name: "Overdue escalation", trigger: "OVERDUE", action: "ESCALATE", conditions: {}, config: { escalateTo: admin.id } },
      { name: "Status change notify", trigger: "STATUS_CHANGED", action: "SEND_NOTIFICATION", conditions: {}, config: {} },
    ],
  });

  await prisma.auditLog.create({
    data: { userId: admin.id, action: "SEED", entityType: "System", details: { message: "Database seeded" } },
  });

  console.log("Done! Login: admin@workflowhub.com / admin123");
}

main().catch(console.error).finally(() => prisma.$disconnect());
