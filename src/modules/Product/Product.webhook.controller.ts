import { Body, Controller, Logger, Post } from '@nestjs/common';
import { OrderIdDto } from './Product.webhook.dtos';
import { ProducerService } from './services/kafka/Kafka.producer.service';
import {
  KAFKA_INVENTORY_SYNC_TOPIC,
  KAFKA_PRODUCT_CHECK_IN_TOPIC,
} from 'src/constants';
import { InventoryService } from './services/Inventory/Inventory.service';

@Controller('webhook')
export class ProductWebhooksController {
  constructor(
    private readonly kafkaProductService: ProducerService,
    private readonly inventoryService: InventoryService,
  ) {}
  private readonly logger = new Logger(ProductWebhooksController.name);

  @Post('inventory/sync')
  async inventorySync(@Body() orderInput: OrderIdDto) {
    try {
      return await this.kafkaProductService.produce({
        topic: KAFKA_INVENTORY_SYNC_TOPIC,
        messages: [
          {
            value: JSON.stringify({
              orderId: orderInput.orderId,
            }),
          },
        ],
      });
    } catch (error) {}
  }

  @Post('product/check/in')
  async productCheckIn(@Body() productInput) {
    try {
      this.logger.log('product check in webhook called', productInput);
      return await this.kafkaProductService.produce({
        topic: KAFKA_PRODUCT_CHECK_IN_TOPIC,
        messages: [
          {
            value: JSON.stringify(productInput),
          },
        ],
      });
    } catch (error) {
      this.logger.error(error);
    }
  }
}
