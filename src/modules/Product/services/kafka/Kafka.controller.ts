/* eslint-disable @typescript-eslint/no-unused-vars */
import { Controller, Get, Inject, forwardRef } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';
import { ProductService } from '../../Product.service';
import { ProducerService } from './Kafka.producer.service';
import { ProducerRecord } from 'kafkajs';
import { KAFKA_BULK_PRODUCT_CREATE_TOPIC } from 'src/constants';

@Controller()
export class KafkaController {
  constructor(
    @Inject(forwardRef(() => ProductService))
    private readonly productService: ProductService,
    private readonly kafkaProductService: ProducerService,
  ) {}
  private readonly logger = new Logger(KafkaController.name);

  @MessagePattern(KAFKA_BULK_PRODUCT_CREATE_TOPIC)
  autoSyncBulkCreate(@Payload() message) {
    try {
      return this.productService.createBulkProducts(message);
    } catch (error) {
      this.logger.error(error);
    }
  }

  pushProductBatch(@Payload() message: ProducerRecord) {
    return this.kafkaProductService.produce(message);
  }
}
