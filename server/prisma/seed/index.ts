import { PrismaClient } from '@prisma/client'
import { seedGradeMappings } from './grade-mappings.seed'

const prisma = new PrismaClient()

async function main() {
  console.log('Seed: starting…')

  // Phase 3: French → UIAA grade mappings (reference data for scoring).
  await seedGradeMappings(prisma)

  // Clubs are NOT seeded with placeholder data.
  // Add real club data here only when provided by the project owner.

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
