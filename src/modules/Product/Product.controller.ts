import { Body, Controller, Logger, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ProductService } from './Product.service';
import { AutoSyncDto } from './Product.dto';

// endpoints to trigger data bulk imports
@Controller()
@ApiTags('auto-sync-product-api')
export class ProductController {
  private readonly logger = new Logger(ProductController.name);

  constructor(private readonly productService: ProductService) {}
  @Post('api/v1/auto/sync')
  async autoSync(@Body() autoSyncInput: AutoSyncDto) {
    return this.productService.autoSync(autoSyncInput);
  }
}
