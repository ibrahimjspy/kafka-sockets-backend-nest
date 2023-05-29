import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class OrderIdDto {
  @ApiProperty({ required: true })
  @IsString()
  orderId: string;
}
export interface SaleorOrderWebhookPayload {
  type: string;
  id: string;
}
