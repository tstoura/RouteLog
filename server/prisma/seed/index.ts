import { PrismaClient } from '@prisma/client'
import { seedGradeMappings } from './grade-mappings.seed'
import { seedDemoUsers } from './demo-users.seed'
import { seedClimbingRoutes } from './climbing-routes.seed'

const prisma = new PrismaClient()

async function main() {
  console.log('Seed: starting…')

  // Phase 3: French → UIAA grade mappings (reference data for scoring).
  await seedGradeMappings(prisma)

  // Phase 11A: Demo club, users, and memberships for Auth MVP development.
  await seedDemoUsers(prisma)

  // Climbing route catalog — 10 routes recovered from the original mock data.
  await seedClimbingRoutes(prisma)

  console.log('Seed: done.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
