import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AttributeAssignedProductAttribute } from 'src/database/destination/product/attributes/assignment';
import { AttributeAssignedProductAttributeValue } from 'src/database/destination/product/attributes/value';
import { ProductProduct } from 'src/database/destination/product/product';
import { ProductCopyTransformerService } from './product.copy.transformers';
import { AttributeAttributeValue } from 'src/database/destination/attributes';

@Injectable()
export class ProductAttributeCopyService {
  constructor(
    @InjectRepository(AttributeAssignedProductAttribute)
    private assignedProductAttributeRepository: Repository<AttributeAssignedProductAttribute>,
    @InjectRepository(AttributeAssignedProductAttributeValue)
    private assignedProductAttributeValueRepository: Repository<AttributeAssignedProductAttributeValue>,
    @InjectRepository(AttributeAttributeValue)
    private attributeValueRepository: Repository<AttributeAttributeValue>,
    private transformerService: ProductCopyTransformerService,
  ) {}

  /**
   * Copies product attributes for the copied products.
   * @param copiedProducts The copied products.
   * @returns A Promise that resolves when the attribute copying is complete.
   */
  async copyProductAttributes(copiedProducts: ProductProduct[]): Promise<void> {
    const copiedAssignments = await this.copyProductAttributeAssignments(
      copiedProducts,
    );
    await this.copyAssignedProductAttributeValues(copiedAssignments);
  }

  /**
   * Copies attribute assignments for the copied products.
   * @param copiedProducts The copied products.
   * @returns A Promise that resolves to a mapping between original and copied assignment IDs.
   */
  private async copyProductAttributeAssignments(
    copiedProducts: ProductProduct[],
  ): Promise<Map<number, number>> {
    const copiedAssignments = [];
    const productIds =
      this.transformerService.getMasterProducts(copiedProducts);
    const productMapping =
      this.transformerService.getProductMapping(copiedProducts);
    const masterAssignments =
      await this.assignedProductAttributeRepository.find({
        where: { productId: In(productIds) },
      });

    for (const assignment of masterAssignments) {
      const copyAssignment = { ...assignment };
      delete copyAssignment.id;
      copyAssignment.productId = productMapping.get(assignment.productId);
      copiedAssignments.push(copyAssignment);
    }

    const copiedAssignmentsResponse =
      await this.assignedProductAttributeRepository.save(copiedAssignments);
    return this.transformerService.getAssignmentIdsMapping(
      copiedProducts,
      masterAssignments,
      copiedAssignmentsResponse,
    );
  }

  /**
   * Copies assigned attribute values for the copied attribute assignments.
   * @param assignmentMapping A mapping between original and copied assignment IDs.
   * @returns A Promise that resolves when the copying of assigned attribute values is complete.
   */
  private async copyAssignedProductAttributeValues(
    assignmentMapping: Map<number, number>,
  ): Promise<void> {
    const assignments = Array.from(assignmentMapping.keys());
    const copyAttributeAssignmentValues = [];
    const attributeValuesAssigned =
      await this.assignedProductAttributeValueRepository.find({
        where: { assignmentId: In(assignments) },
      });
    const valueIds = attributeValuesAssigned.map((value) => value.valueId);
    const valuesMapping = await this.copyAttributeValues(valueIds);

    for (const attributeAssignedValue of attributeValuesAssigned) {
      const copyAttributeValueAssigned = { ...attributeAssignedValue };
      const assignmentId = assignmentMapping.get(
        attributeAssignedValue.assignmentId,
      );
      copyAttributeValueAssigned.assignmentId = assignmentId;
      const valueId = valuesMapping.get(attributeAssignedValue.valueId);
      copyAttributeValueAssigned.valueId = valueId;
      delete copyAttributeValueAssigned.id;
      copyAttributeAssignmentValues.push(copyAttributeValueAssigned);
    }

    await this.assignedProductAttributeValueRepository.save(
      copyAttributeAssignmentValues,
    );
  }

  /**
   * Copies attribute values.
   * @param valueIds The IDs of the attribute values to copy.
   * @returns A Promise that resolves to a mapping between original and copied attribute value IDs.
   */
  private async copyAttributeValues(
    valueIds: number[],
  ): Promise<Map<number, number>> {
    const copiedValues = [];
    const attributeValues = await this.attributeValueRepository.find({
      where: { id: In(valueIds) },
    });
    const attributeValuesSlugMapping: Map<string, number> = new Map();

    for (const attributeValue of attributeValues) {
      const copyAttributeValue = { ...attributeValue };
      const slug = this.transformerService.getProductSlug({
        slug: attributeValue.slug,
      } as ProductProduct);
      copyAttributeValue.slug = slug;
      attributeValuesSlugMapping.set(slug, attributeValue.id);
      delete copyAttributeValue.id;
      copiedValues.push(copyAttributeValue);
    }

    const copiedValuesResponse: AttributeAttributeValue[] =
      await this.attributeValueRepository.save(copiedValues);
    return this.transformerService.getValuesMapping(
      attributeValuesSlugMapping,
      copiedValuesResponse,
    );
  }
}
