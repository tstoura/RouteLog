import { Module } from '@nestjs/common'

// Named "climbing-routes" to avoid confusion with NestJS HTTP route terminology.
// Corresponds to the "routes" module in the implementation plan.
//
// Phase 5 will add: ClimbingRoutesController (GET /climbing-routes, POST /climbing-routes),
// ClimbingRoutesService (normalized_name generation, exact-duplicate 409 block),
// CreateRouteDto, and SearchRoutesDto.
//
// Exact duplicates are blocked: same normalized_name + mountain_or_area + climbing_field
// returns 409 Conflict with the existing route in the response body.
// Fuzzy/near-duplicate detection is deferred to a future phase.
@Module({})
export class ClimbingRoutesModule {}
