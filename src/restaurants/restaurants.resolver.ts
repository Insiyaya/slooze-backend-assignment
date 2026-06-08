import { UseGuards } from '@nestjs/common';
import { Args, ID, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { MenuItemType, RestaurantType } from './dto/restaurant.types';
import { RestaurantsService } from './restaurants.service';

@Resolver()
@UseGuards(JwtAuthGuard, RolesGuard)
export class RestaurantsResolver {
  constructor(private restaurantsService: RestaurantsService) {}

  // All roles can view restaurants — country scope enforced in service
  @Query(() => [RestaurantType], { description: 'List restaurants visible to the current user' })
  async restaurants(@CurrentUser() user: any): Promise<RestaurantType[]> {
    return this.restaurantsService.findAll(user) as any;
  }

  @Query(() => RestaurantType, { nullable: true, description: 'Get a specific restaurant by ID' })
  async restaurant(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: any,
  ): Promise<RestaurantType | null> {
    return this.restaurantsService.findById(id, user) as any;
  }

  @Query(() => MenuItemType, { nullable: true, description: 'Get a specific menu item by ID' })
  async menuItem(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: any,
  ): Promise<MenuItemType | null> {
    return this.restaurantsService.getMenuItem(id, user) as any;
  }
}
