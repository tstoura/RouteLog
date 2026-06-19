import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { Request } from 'express'
import { AuthService, JwtPayload } from '../auth.service'

/**
 * Guard that verifies the JWT Bearer token on protected endpoints.
 * Apply with @UseGuards(JwtAuthGuard) on a controller or individual route handler.
 * On success, attaches the decoded payload to `request.user` so controllers can access `req.user.sub`.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request & { user?: JwtPayload }>()
    const token = this.extractBearerToken(request)

    if (!token) {
      throw new UnauthorizedException('No authorization token provided.')
    }

    // verifyToken throws UnauthorizedException on invalid/expired token.
    const payload = this.authService.verifyToken(token)
    request.user = payload
    return true
  }

  private extractBearerToken(request: Request): string | null {
    const authHeader = request.headers['authorization']
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null
    return authHeader.slice(7).trim() || null
  }
}
