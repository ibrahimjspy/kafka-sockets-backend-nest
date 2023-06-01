import { Body, Controller, Logger, Post } from '@nestjs/common';
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
  async inventorySync(@Body() orderEvent) {
    try {
      await this.kafkaProductService.produce({
        topic: KAFKA_INVENTORY_SYNC_TOPIC,
        messages: [
          {
            value: JSON.stringify(orderEvent),
          },
        ],
      });
      return 'inventory sync message received';
    } catch (error) {}
  }

  // Deprecated this webhook will be replaced with product/checkin
  @Post('product/check/in')
  async productCheckIn(@Body() productInput) {
    try {
      this.logger.log('product check in webhook called', productInput);
      await this.kafkaProductService.produce({
        topic: KAFKA_PRODUCT_CHECK_IN_TOPIC,
        messages: [
          {
            value: JSON.stringify(productInput),
          },
        ],
      });
      return 'product check in sync message received';
    } catch (error) {
      this.logger.error(error);
    }
  }

  @Post('product/checkin')
  async productCheckInV2(@Body() productInput) {
    try {
      this.logger.log('product check in webhook called', productInput);
      await this.kafkaProductService.produce({
        topic: KAFKA_PRODUCT_CHECK_IN_TOPIC,
        messages: [
          {
            value: JSON.stringify(productInput),
          },
        ],
      });
      return 'product check in sync message received';
    } catch (error) {
      this.logger.error(error);
    }
  }
}
