import { Module } from '@nestjs/common';
import { RestaurantsResolver } from './restaurants.resolver';
import { RestaurantsService } from './restaurants.service';

@Module({
  providers: [RestaurantsService, RestaurantsResolver],
})
export class RestaurantsModule {}
