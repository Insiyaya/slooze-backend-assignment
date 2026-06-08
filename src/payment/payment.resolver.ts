import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import {
  AddPaymentMethodInput,
  PaymentMethodType,
  UpdatePaymentMethodInput,
} from './dto/payment.types';
import { PaymentService } from './payment.service';

@Resolver()
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentResolver {
  constructor(private paymentService: PaymentService) {}

  @Query(() => [PaymentMethodType], { description: "List the current user's payment methods" })
  async myPaymentMethods(
    @CurrentUser() user: any,
  ): Promise<PaymentMethodType[]> {
    return this.paymentService.getMyPaymentMethods(user) as any;
  }

  // All roles can add a payment method (needed to place orders)
  @Mutation(() => PaymentMethodType, { description: 'Add a new payment method' })
  async addPaymentMethod(
    @CurrentUser() user: any,
    @Args('input') input: AddPaymentMethodInput,
  ): Promise<PaymentMethodType> {
    return this.paymentService.addPaymentMethod(user, input) as any;
  }

  // Only Admin can update/modify payment methods per the permission matrix
  @Roles(Role.ADMIN)
  @Mutation(() => PaymentMethodType, { description: 'Update a payment method — Admin only' })
  async updatePaymentMethod(
    @CurrentUser() user: any,
    @Args('input') input: UpdatePaymentMethodInput,
  ): Promise<PaymentMethodType> {
    return this.paymentService.updatePaymentMethod(user, input) as any;
  }

  // Only Admin can delete payment methods
  @Roles(Role.ADMIN)
  @Mutation(() => PaymentMethodType, { description: 'Delete a payment method — Admin only' })
  async deletePaymentMethod(
    @CurrentUser() user: any,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<PaymentMethodType> {
    return this.paymentService.deletePaymentMethod(user, id) as any;
  }
}
