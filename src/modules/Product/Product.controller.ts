import { Controller, Get, Logger } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ProductService } from './Product.service';

// endpoints to trigger data bulk imports
@Controller()
@ApiTags('auto-sync-product-api')
export class ProductController {
  private readonly logger = new Logger(ProductController.name);

  constructor(private readonly productService: ProductService) {}
  @Get()
  async app() {
    return;
  }
}
