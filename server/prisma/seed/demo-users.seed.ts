import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

/**
 * Demo users, club, and memberships seed — Phase 11A Auth preparation.
 *
 * ── PURPOSE ──────────────────────────────────────────────────────────────────
 * Creates a realistic set of demo identities for local development and Auth MVP
 * testing.  These are NOT production data.  Credentials are intentionally weak
 * and documented here for convenience.
 *
 * ── IDEMPOTENCY ──────────────────────────────────────────────────────────────
 * Every write uses upsert keyed on a stable unique field (email for users,
 * name for clubs, [userId, clubId] for memberships).  Re-running the seed
 * never creates duplicates and never overwrites a manually-changed password.
 *
 * ── DEMO CREDENTIALS ─────────────────────────────────────────────────────────
 * member@example.com       / password123   systemRole = "user"
 * admin@example.com        / password123   systemRole = "user", club_admin
 * superadmin@example.com   / password123   systemRole = "super_admin"
 *
 * ── SECURITY NOTE ────────────────────────────────────────────────────────────
 * Passwords are hashed with bcrypt (cost factor 10).
 * Plain-text passwords are NEVER stored or logged.
 */

const BCRYPT_ROUNDS = 10

const DEMO_CLUB_NAME = 'ΕΟΣ Πατρών'
const DEMO_CLUB_SHORT = 'ΕΟΣ Π.'

type DemoUser = {
  email: string
  firstName: string
  lastName: string
  password: string
  systemRole: 'user' | 'super_admin'
  preferredActivity?: string
}

const DEMO_USERS: DemoUser[] = [
  {
    email: 'member@example.com',
    firstName: 'Demo',
    lastName: 'Member',
    password: 'password123',
    systemRole: 'user',
    preferredActivity: 'climbing',
  },
  {
    email: 'admin@example.com',
    firstName: 'Demo',
    lastName: 'Admin',
    password: 'password123',
    systemRole: 'user',
    preferredActivity: 'climbing',
  },
  {
    email: 'superadmin@example.com',
    firstName: 'Demo',
    lastName: 'SuperAdmin',
    password: 'password123',
    systemRole: 'super_admin',
  },
]

export async function seedDemoUsers(prisma: PrismaClient): Promise<void> {
  console.log('  demo-users: seeding club, users, and memberships…')

  // ── 1. Find-or-create demo club ──────────────────────────────────────────
  // Club has no unique-name constraint, so we use findFirst to avoid duplicates.
  // createMany({ skipDuplicates }) is not applicable here (no unique key on name).
  let club = await prisma.club.findFirst({ where: { name: DEMO_CLUB_NAME } })
  if (!club) {
    club = await prisma.club.create({
      data: { name: DEMO_CLUB_NAME, shortName: DEMO_CLUB_SHORT },
    })
    console.log(`  demo-users: club "${club.name}" created (${club.id})`)
  } else {
    console.log(`  demo-users: club "${club.name}" already exists (${club.id})`)
  }

  // ── 2. Upsert users ───────────────────────────────────────────────────────
  // Note: upsert does NOT update the passwordHash if the user already exists,
  // so manually changed passwords in an existing dev DB are preserved.
  const upsertedUsers: Record<string, string> = {}

  for (const u of DEMO_USERS) {
    const passwordHash = await bcrypt.hash(u.password, BCRYPT_ROUNDS)

    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        // Only update non-auth fields on re-seed.
        // Do NOT update passwordHash so local overrides are preserved.
        firstName: u.firstName,
        lastName: u.lastName,
        systemRole: u.systemRole,
        preferredActivity: u.preferredActivity ?? null,
      },
      create: {
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        passwordHash,
        systemRole: u.systemRole,
        preferredActivity: u.preferredActivity ?? null,
        onboardingCompleted: false,
      },
    })

    upsertedUsers[u.email] = user.id
    console.log(`  demo-users: user "${u.email}" (${user.id}) systemRole=${u.systemRole}`)
  }

  // ── 3. Upsert memberships ─────────────────────────────────────────────────
  // member@example.com  → member of ΕΟΣ Πατρών
  // admin@example.com   → club_admin of ΕΟΣ Πατρών
  // superadmin           → no club membership (system-level role is enough)

  const membershipDefs = [
    { email: 'member@example.com',  role: 'member' },
    { email: 'admin@example.com',   role: 'club_admin' },
  ]

  for (const m of membershipDefs) {
    const userId = upsertedUsers[m.email]
    if (!userId) continue

    await prisma.clubMembership.upsert({
      where: { userId_clubId: { userId, clubId: club.id } },
      update: { role: m.role },
      create: {
        userId,
        clubId: club.id,
        role: m.role,
      },
    })

    console.log(`  demo-users: membership ${m.email} → ${DEMO_CLUB_NAME} (${m.role})`)
  }

  console.log('  demo-users: done.')
}
