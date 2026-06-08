import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '../common/enums/role.enum';
import { PrismaService } from '../prisma/prisma.service';
import {
  AddCartItemInput,
  CreateOrderInput,
} from './dto/order.types';

type AuthUser = { id: string; role: string; country?: string | null };

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private async assertRestaurantAccess(restaurantId: string, user: AuthUser) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!restaurant)
      throw new NotFoundException(`Restaurant ${restaurantId} not found`);

    if (
      user.role !== Role.ADMIN &&
      restaurant.country !== (user.country as any)
    ) {
      throw new ForbiddenException(
        `Access denied. You can only interact with restaurants in ${user.country}`,
      );
    }

    return restaurant;
  }

  // ─── Cart Operations ──────────────────────────────────────────────────────

  async getOrCreateCart(userId: string) {
    return this.prisma.cart.upsert({
      where: { userId },
      create: { userId, items: {} },
      update: {},
      include: { items: true },
    });
  }

  async getCart(user: AuthUser) {
    return this.getOrCreateCart(user.id);
  }

  async addToCart(user: AuthUser, input: AddCartItemInput) {
    const menuItem = await this.prisma.menuItem.findUnique({
      where: { id: input.menuItemId },
      include: { restaurant: true },
    });

    if (!menuItem || !menuItem.available)
      throw new NotFoundException('Menu item not found or unavailable');

    // Re-BAC: menu item must belong to user's country
    if (
      user.role !== Role.ADMIN &&
      menuItem.restaurant.country !== (user.country as any)
    ) {
      throw new ForbiddenException(
        `You can only add items from restaurants in ${user.country}`,
      );
    }

    const cart = await this.getOrCreateCart(user.id);

    const existing = await this.prisma.cartItem.findFirst({
      where: { cartId: cart.id, menuItemId: input.menuItemId },
    });

    if (existing) {
      return this.prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + input.quantity },
      });
    }

    return this.prisma.cartItem.create({
      data: {
        cartId: cart.id,
        menuItemId: input.menuItemId,
        quantity: input.quantity,
      },
    });
  }

  async removeFromCart(user: AuthUser, cartItemId: string) {
    const cartItem = await this.prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: { cart: true },
    });

    if (!cartItem || cartItem.cart.userId !== user.id) {
      throw new NotFoundException('Cart item not found');
    }

    return this.prisma.cartItem.delete({ where: { id: cartItemId } });
  }

  async clearCart(userId: string) {
    const cart = await this.prisma.cart.findUnique({ where: { userId } });
    if (!cart) return;
    await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  }

  // ─── Order Operations ─────────────────────────────────────────────────────

  async createOrder(user: AuthUser, input: CreateOrderInput) {
    await this.assertRestaurantAccess(input.restaurantId, user);

    // Fetch all menu items to snapshot prices
    const menuItemIds = input.items.map((i) => i.menuItemId);
    const menuItems = await this.prisma.menuItem.findMany({
      where: { id: { in: menuItemIds }, restaurantId: input.restaurantId },
    });

    if (menuItems.length !== menuItemIds.length) {
      throw new BadRequestException(
        'Some menu items do not belong to the selected restaurant',
      );
    }

    const priceMap = new Map(menuItems.map((m) => [m.id, m.price]));
    const totalAmount = input.items.reduce(
      (sum, item) => sum + (priceMap.get(item.menuItemId) ?? 0) * item.quantity,
      0,
    );

    const order = await this.prisma.order.create({
      data: {
        userId: user.id,
        restaurantId: input.restaurantId,
        totalAmount,
        items: {
          create: input.items.map((item) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            unitPrice: priceMap.get(item.menuItemId) ?? 0,
          })),
        },
      },
      include: { items: true },
    });

    return order;
  }

  async placeOrder(user: AuthUser, orderId: string, paymentMethodId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { restaurant: true },
    });

    if (!order) throw new NotFoundException('Order not found');
    if (order.userId !== user.id)
      throw new ForbiddenException('You can only place your own orders');
    if (order.status !== 'PENDING')
      throw new BadRequestException(`Order is already ${order.status}`);

    // Re-BAC check on the order's restaurant
    if (
      user.role !== Role.ADMIN &&
      order.restaurant.country !== (user.country as any)
    ) {
      throw new ForbiddenException(
        `Access denied. You can only place orders from restaurants in ${user.country}`,
      );
    }

    // Verify the payment method belongs to the user
    const paymentMethod = await this.prisma.paymentMethod.findUnique({
      where: { id: paymentMethodId },
    });

    if (!paymentMethod || paymentMethod.userId !== user.id) {
      throw new BadRequestException('Invalid payment method');
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: { status: 'PLACED', paymentMethodId },
      include: { items: true },
    });
  }

  async cancelOrder(user: AuthUser, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { restaurant: true },
    });

    if (!order) throw new NotFoundException('Order not found');
    if (order.userId !== user.id)
      throw new ForbiddenException('You can only cancel your own orders');
    if (order.status === 'CANCELLED')
      throw new BadRequestException('Order is already cancelled');
    if (order.status === 'DELIVERED')
      throw new BadRequestException('Cannot cancel a delivered order');

    // Re-BAC check
    if (
      user.role !== Role.ADMIN &&
      order.restaurant.country !== (user.country as any)
    ) {
      throw new ForbiddenException(
        `Access denied. You can only cancel orders from restaurants in ${user.country}`,
      );
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: { status: 'CANCELLED' },
      include: { items: true },
    });
  }

  async getMyOrders(user: AuthUser) {
    return this.prisma.order.findMany({
      where: { userId: user.id },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOrder(user: AuthUser, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, restaurant: true },
    });

    if (!order) throw new NotFoundException('Order not found');
    if (order.userId !== user.id)
      throw new ForbiddenException('You can only view your own orders');

    return order;
  }
}
