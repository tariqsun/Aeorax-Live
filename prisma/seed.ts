import { PrismaClient, Role, CollegeStatus, NodeStatus, NodePoolType, RoomStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting Aeorax Live database seeding...");

  // 1. Clean existing records safely
  await prisma.auditLog.deleteMany();
  await prisma.quotaLedger.deleteMany();
  await prisma.recording.deleteMany();
  await prisma.session.deleteMany();
  await prisma.room.deleteMany();
  await prisma.user.deleteMany();
  await prisma.node.deleteMany();
  await prisma.nodePool.deleteMany();
  await prisma.college.deleteMany();

  // 2. Create Super Admin User
  const passwordHash = await bcrypt.hash("AdminPassword123!", 10);
  const superAdmin = await prisma.user.create({
    data: {
      email: "superadmin@aeoraxlive.com",
      name: "Global Super Admin",
      role: Role.SUPER_ADMIN,
      passwordHash,
      isActive: true,
    },
  });
  console.log(`✅ Super Admin created: ${superAdmin.email}`);

  // 3. Create Demo Colleges
  const oxford = await prisma.college.create({
    data: {
      name: "Oxford International College",
      slug: "oxford-intl",
      contactEmail: "admin@oxford-intl.edu",
      contactPhone: "+44 1865 000111",
      status: CollegeStatus.ACTIVE,
      apiKey: "key_oxford_live_9a8b7c",
      apiSecret: "sec_oxford_bbb_secret_998877",
      maxConcurrentRooms: 15,
      maxParticipantsPerRoom: 100,
      maxTotalParticipants: 600,
      recordingStorageLimitBytes: BigInt(214748364800), // 200 GB
      recordingRetentionDays: 120,
    },
  });

  const beaconhouse = await prisma.college.create({
    data: {
      name: "Beaconhouse National Institute",
      slug: "beaconhouse",
      contactEmail: "tech@beaconhouse.edu.pk",
      contactPhone: "+92 42 111 000 222",
      status: CollegeStatus.ACTIVE,
      apiKey: "key_beaconhouse_live_112233",
      apiSecret: "sec_beaconhouse_bbb_secret_445566",
      maxConcurrentRooms: 8,
      maxParticipantsPerRoom: 100,
      maxTotalParticipants: 300,
      recordingStorageLimitBytes: BigInt(107374182400), // 100 GB
      recordingRetentionDays: 90,
    },
  });
  console.log(`✅ Colleges created: ${oxford.name}, ${beaconhouse.name}`);

  // 4. Create College Admin & Teachers
  const oxfordAdmin = await prisma.user.create({
    data: {
      collegeId: oxford.id,
      name: "Dr. Alistair Finch",
      email: "finch@oxford-intl.edu",
      role: Role.COLLEGE_ADMIN,
      passwordHash,
      isActive: true,
    },
  });

  const oxfordTeacher = await prisma.user.create({
    data: {
      collegeId: oxford.id,
      name: "Prof. Sarah Jenkins",
      email: "jenkins@oxford-intl.edu",
      role: Role.TEACHER,
      passwordHash,
      isActive: true,
    },
  });
  console.log(`✅ College Staff created for ${oxford.name}`);

  // 5. Create Virtual Classrooms
  const room1 = await prisma.room.create({
    data: {
      collegeId: oxford.id,
      creatorId: oxfordTeacher.id,
      name: "Advanced Artificial Intelligence & Neural Networks",
      slug: "cs401-ai",
      attendeePw: "ap123",
      moderatorPw: "mp123",
      maxParticipants: 100,
      recordEnabled: true,
      status: RoomStatus.IDLE,
    },
  });

  const room2 = await prisma.room.create({
    data: {
      collegeId: oxford.id,
      creatorId: oxfordTeacher.id,
      name: "Organic Chemistry Laboratory Lecture",
      slug: "chem201-lab",
      attendeePw: "ap456",
      moderatorPw: "mp456",
      maxParticipants: 80,
      recordEnabled: true,
      status: RoomStatus.RUNNING,
    },
  });
  console.log(`✅ Virtual Classrooms created: ${room1.name}, ${room2.name}`);

  // 6. Create Shared Node Pool & BBB Nodes
  const sharedPool = await prisma.nodePool.create({
    data: {
      name: "Primary Shared BBB Pool",
      type: NodePoolType.SHARED,
      description: "Default high-availability BigBlueButton node cluster for standard colleges",
    },
  });

  const node1 = await prisma.node.create({
    data: {
      poolId: sharedPool.id,
      name: "BBB Node 01",
      fqdn: "node1.nesthost.net",
      ipAddress: "13.140.140.224",
      status: NodeStatus.READY,
      cpuCores: 8,
      ramGb: 16,
      diskGb: 100,
      bbbVersion: "3.0.39",
      scaleliteRegistered: true,
      activeMeetingsCount: 8,
      activeParticipantsCount: 240,
      cpuUsagePercent: 48.2,
      lastHeartbeatAt: new Date(),
    },
  });

  const node2 = await prisma.node.create({
    data: {
      poolId: sharedPool.id,
      name: "BBB Node 02",
      fqdn: "node2.nesthost.net",
      ipAddress: "13.140.140.237",
      status: NodeStatus.READY,
      cpuCores: 8,
      ramGb: 16,
      diskGb: 100,
      bbbVersion: "3.0.39",
      scaleliteRegistered: true,
      activeMeetingsCount: 11,
      activeParticipantsCount: 310,
      cpuUsagePercent: 62.7,
      lastHeartbeatAt: new Date(),
    },
  });
  console.log(`✅ BBB Nodes registered: ${node1.fqdn}, ${node2.fqdn}`);

  console.log("🚀 Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
