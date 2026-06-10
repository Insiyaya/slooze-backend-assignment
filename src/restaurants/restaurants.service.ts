import { ForbiddenException, Injectable } from '@nestjs/common';
import { Role } from '../common/enums/role.enum';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RestaurantsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Returns restaurants the user is allowed to see.
   * Admin: all restaurants.
   * Manager/Member: only restaurants in their country.
   */
  async findAll(user: { role: string; country?: string | null }) {
    const where =
      user.role === Role.ADMIN ? {} : { country: user.country as any };

    return this.prisma.restaurant.findMany({
      where,
      include: { menuItems: { where: { available: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async findById(
    id: string,
    user: { role: string; country?: string | null },
  ) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id },
      include: { menuItems: { where: { available: true } } },
    });

    if (!restaurant) return null;

    // Re-BAC: non-admins cannot access restaurants outside their country
    if (
      user.role !== Role.ADMIN &&
      restaurant.country !== (user.country as any)
    ) {
      throw new ForbiddenException(
        `Access denied. You can only access restaurants in ${user.country}`,
      );
    }

    return restaurant;
  }

  async getMenuItem(menuItemId: string, user: { role: string; country?: string | null }) {
    const item = await this.prisma.menuItem.findUnique({
      where: { id: menuItemId },
      include: { restaurant: true },
    });

    if (!item) return null;

    if (
      user.role !== Role.ADMIN &&
      item.restaurant.country !== (user.country as any)
    ) {
      throw new ForbiddenException(
        `Access denied. You can only access menu items from restaurants in ${user.country}`,
      );
    }

    return item;
  }
}
