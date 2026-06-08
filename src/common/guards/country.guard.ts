import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Role } from '../enums/role.enum';

export const COUNTRY_CHECK_KEY = 'countryCheck';

/**
 * Re-BAC guard: ensures Managers and Members can only act on data from
 * their own country. Admins bypass this check entirely.
 *
 * Resolver methods opt-in by calling @CountryCheck() and passing the
 * target country as an argument named `country` (or via a `restaurantId`
 * that is resolved before guard evaluation via the context).
 */
@Injectable()
export class CountryGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiresCheck = this.reflector.getAllAndOverride<boolean>(
      COUNTRY_CHECK_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiresCheck) return true;

    const gqlCtx = GqlExecutionContext.create(context);
    const user = gqlCtx.getContext().req.user;

    // Admins have global access
    if (user.role === Role.ADMIN) return true;

    // For non-admins, user.country must be set
    if (!user.country) {
      throw new ForbiddenException('User has no country assigned');
    }

    const args = gqlCtx.getArgs();
    const targetCountry: string | undefined =
      args.country ?? args.input?.country;

    // If no country filter is in args, the service layer enforces country scope
    // This guard only blocks explicit cross-country requests
    if (targetCountry && targetCountry !== user.country) {
      throw new ForbiddenException(
        `Access denied. You can only access data for ${user.country}`,
      );
    }

    return true;
  }
}

import { SetMetadata } from '@nestjs/common';
export const CountryCheck = () => SetMetadata(COUNTRY_CHECK_KEY, true);
