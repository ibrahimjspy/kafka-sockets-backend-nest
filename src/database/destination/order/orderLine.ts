import { ORDER_LINE_TABLE } from 'src/database/db.constants';
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: ORDER_LINE_TABLE })
export class OrderLine {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'product_name' })
  productName: string;

  @Column({ name: 'product_sku', nullable: true })
  productSku: string | null;

  @Column()
  quantity: number;

  @Column({ name: 'unit_price_net_amount' })
  unitPriceNetAmount: number;

  @Column({ name: 'unit_price_gross_amount' })
  unitPriceGrossAmount: number;

  @Column({ name: 'is_shipping_required' })
  isShippingRequired: boolean;

  @Column({ name: 'quantity_fulfilled' })
  quantityFulfilled: number;

  @Column({ name: 'variant_id', nullable: true })
  variantId: number | null;

  @Column({ name: 'tax_rate', nullable: true })
  taxRate: number | null;

  @Column({ name: 'translated_product_name' })
  translatedProductName: string;

  @Column()
  currency: string;

  @Column({ name: 'translated_variant_name' })
  translatedVariantName: string;

  @Column({ name: 'variant_name' })
  variantName: string;

  @Column({ name: 'total_price_gross_amount' })
  totalPriceGrossAmount: number;

  @Column({ name: 'total_price_net_amount' })
  totalPriceNetAmount: number;

  @Column({ name: 'unit_discount_amount' })
  unitDiscountAmount: number;

  @Column({ name: 'unit_discount_value' })
  unitDiscountValue: number;

  @Column({ name: 'unit_discount_reason', nullable: true })
  unitDiscountReason: string | null;

  @Column({ name: 'unit_discount_type' })
  unitDiscountType: string;

  @Column({ name: 'undiscounted_total_price_gross_amount' })
  undiscountedTotalPriceGrossAmount: number;

  @Column({ name: 'undiscounted_total_price_net_amount' })
  undiscountedTotalPriceNetAmount: number;

  @Column({ name: 'undiscounted_unit_price_gross_amount' })
  undiscountedUnitPriceGrossAmount: number;

  @Column({ name: 'undiscounted_unit_price_net_amount' })
  undiscountedUnitPriceNetAmount: number;

  @Column({ name: 'is_gift_card' })
  isGiftCard: boolean;

  @Column({ name: 'product_variant_id', nullable: true })
  productVariantId: string | null;

  @Column({ name: 'sale_id', nullable: true })
  saleId: string | null;

  @Column({ name: 'voucher_code', nullable: true })
  voucherCode: string | null;

  @Column({ name: 'order_id' })
  orderId: string;

  // Add any other columns and relations as per your table definition
}
