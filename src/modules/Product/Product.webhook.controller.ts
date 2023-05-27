import { Body, Controller, Logger, Post } from '@nestjs/common';
import { OrderIdDto } from './Product.webhook.dtos';
import { ProducerService } from './services/kafka/Kafka.producer.service';
import { KafkaController } from './services/kafka/Kafka.controller';
import { KAFKA_INVENTORY_SYNC_TOPIC } from 'src/constants';

@Controller('webhook')
export class ProductWebhooksController {
  constructor(private readonly kafkaProductService: ProducerService) {}
  private readonly logger = new Logger(KafkaController.name);

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
}
