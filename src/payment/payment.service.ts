import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddPaymentMethodInput, UpdatePaymentMethodInput } from './dto/payment.types';

type AuthUser = { id: string; role: string };

@Injectable()
export class PaymentService {
  constructor(private prisma: PrismaService) {}

  async getMyPaymentMethods(user: AuthUser) {
    return this.prisma.paymentMethod.findMany({
      where: { userId: user.id },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async addPaymentMethod(user: AuthUser, input: AddPaymentMethodInput) {
    // If setting as default, unset all others first
    if (input.isDefault) {
      await this.prisma.paymentMethod.updateMany({
        where: { userId: user.id },
        data: { isDefault: false },
      });
    }

    return this.prisma.paymentMethod.create({
      data: {
        userId: user.id,
        type: input.type as any,
        provider: input.provider,
        last4: input.last4,
        isDefault: input.isDefault ?? false,
      },
    });
  }

  /**
   * Update a payment method — Admin only per the permission matrix.
   * The resolver enforces the role restriction; this service just handles the logic.
   */
  async updatePaymentMethod(user: AuthUser, input: UpdatePaymentMethodInput) {
    const method = await this.prisma.paymentMethod.findUnique({
      where: { id: input.id },
    });

    if (!method) throw new NotFoundException('Payment method not found');

    // Users can only modify their own payment methods
    if (method.userId !== user.id) {
      throw new ForbiddenException('You can only modify your own payment methods');
    }

    if (input.isDefault) {
      await this.prisma.paymentMethod.updateMany({
        where: { userId: user.id, id: { not: input.id } },
        data: { isDefault: false },
      });
    }

    return this.prisma.paymentMethod.update({
      where: { id: input.id },
      data: {
        ...(input.type && { type: input.type as any }),
        ...(input.provider && { provider: input.provider }),
        ...(input.isDefault !== undefined && { isDefault: input.isDefault }),
      },
    });
  }

  async deletePaymentMethod(user: AuthUser, id: string) {
    const method = await this.prisma.paymentMethod.findUnique({ where: { id } });

    if (!method) throw new NotFoundException('Payment method not found');
    if (method.userId !== user.id) {
      throw new ForbiddenException('You can only delete your own payment methods');
    }

    const usedInOrder = await this.prisma.order.findFirst({
      where: { paymentMethodId: id, status: { in: ['PENDING', 'PLACED'] } },
    });

    if (usedInOrder) {
      throw new BadRequestException(
        'Cannot delete a payment method used in an active order',
      );
    }

    return this.prisma.paymentMethod.delete({ where: { id } });
  }
}
