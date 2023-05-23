import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ProductProduct } from 'src/database/destination/product/product';
import { ProductCopyTransformerService } from './product.copy.transformers';
import { AttributeAttributeValue } from 'src/database/destination/attributes';
import { ProductProductVariant } from 'src/database/destination/productVariant/productVariant';
import { AttributeAssignedVariantAttribute } from 'src/database/destination/productVariant/attributes/assignment';
import { AttributeAssignedVariantAttributeValue } from 'src/database/destination/productVariant/attributes/value';

@Injectable()
export class ProductVariantAttributeCopyService {
  private readonly logger = new Logger(ProductVariantAttributeCopyService.name);

  constructor(
    @InjectRepository(AttributeAssignedVariantAttribute)
    private assignedVariantAttributeRepository: Repository<AttributeAssignedVariantAttribute>,
    @InjectRepository(AttributeAssignedVariantAttributeValue)
    private assignedVariantAttributeValueRepository: Repository<AttributeAssignedVariantAttributeValue>,
    @InjectRepository(AttributeAttributeValue)
    private attributeValueRepository: Repository<AttributeAttributeValue>,
    private transformerService: ProductCopyTransformerService,
  ) {}

  /**
   * Copies variant attributes for the copied variants.
   * @param copiedVariants The copied variants.
   * @returns A Promise that resolves when the attribute copying is complete.
   */
  async copyVariantAttributes(
    copiedVariants: ProductProductVariant[],
  ): Promise<void> {
    try {
      this.logger.log('Copying variant attributes for copied variants');

      const copiedAssignments = await this.copyProductAttributeAssignments(
        copiedVariants,
      );
      await this.copyAssignedVariantAttributeValues(copiedAssignments);

      this.logger.log('Variant attribute copying is complete');
    } catch (error) {
      this.logger.error(
        'An error occurred while copying variant attributes for copied variants',
        error,
      );
      throw error;
    }
  }

  /**
   * Copies attribute assignments for the copied variants.
   * @param copiedVariants The copied variants.
   * @returns A Promise that resolves to a mapping between original and copied assignment IDs.
   */
  private async copyProductAttributeAssignments(
    copiedVariants: ProductProductVariant[],
  ): Promise<Map<number, number>> {
    try {
      this.logger.log('Copying attribute assignments for copied variants');

      const copiedAssignments: AttributeAssignedVariantAttribute[] = [];
      const variantIds =
        this.transformerService.getMasterProductVariants(copiedVariants);
      const variantsMapping =
        this.transformerService.getProductVariantMapping(copiedVariants);
      const masterAssignments =
        await this.assignedVariantAttributeRepository.find({
          where: { variantId: In(variantIds) },
        });

      this.logger.log(
        `Retrieved ${masterAssignments.length} attribute assignments`,
      );

      for (const assignment of masterAssignments) {
        const copyAssignment = { ...assignment };
        delete copyAssignment.id;
        copyAssignment.variantId = variantsMapping.get(assignment.variantId);
        copiedAssignments.push(copyAssignment);
      }

      // Save the copied attribute assignments
      const copiedAssignmentsResponse =
        await this.assignedVariantAttributeRepository.save(copiedAssignments);

      // Generate mapping between original and copied assignment IDs
      const assignmentMapping =
        this.transformerService.getVariantAssignmentIdsMapping(
          copiedVariants,
          masterAssignments,
          copiedAssignmentsResponse,
        );

      this.logger.log('Attribute assignments copying is complete');
      return assignmentMapping;
    } catch (error) {
      this.logger.error(
        'An error occurred while copying attribute assignments for copied variants',
        error,
      );
      throw error;
    }
  }

  /**
   * Copies assigned attribute values for the copied attribute assignments.
   * @param assignmentMapping A mapping between original and copied assignment IDs.
   * @returns A Promise that resolves when the copying of assigned attribute values is complete.
   */
  private async copyAssignedVariantAttributeValues(
    assignmentMapping: Map<number, number>,
  ): Promise<void> {
    try {
      this.logger.log(
        'Copying assigned attribute values for copied attribute assignments',
      );

      const assignments = Array.from(assignmentMapping.keys());
      const copyAttributeAssignmentValues: AttributeAssignedVariantAttributeValue[] =
        [];
      const attributeValuesAssigned =
        await this.assignedVariantAttributeValueRepository.find({
          where: { assignmentId: In(assignments) },
        });
      const valueIds = attributeValuesAssigned.map((value) => value.valueId);
      const valuesMapping = await this.copyAttributeValues(valueIds);

      this.logger.log(
        `Retrieved ${attributeValuesAssigned.length} assigned attribute values`,
      );

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

      // Save the copied assigned attribute values
      await this.assignedVariantAttributeValueRepository.save(
        copyAttributeAssignmentValues,
      );

      this.logger.log('Assigned attribute values copying is complete');
    } catch (error) {
      this.logger.error(
        'An error occurred while copying assigned attribute values for copied attribute assignments',
        error,
      );
      throw error;
    }
  }

  /**
   * Copies attribute values.
   * @param valueIds The original attribute value IDs.
   * @returns A Promise that resolves to a mapping between original and copied attribute value IDs.
   */
  private async copyAttributeValues(
    valueIds: number[],
  ): Promise<Map<number, number>> {
    try {
      this.logger.log('Copying attribute values');

      const copiedValues: AttributeAttributeValue[] = [];
      const attributeValues = await this.attributeValueRepository.find({
        where: { id: In(valueIds) },
      });
      const attributeValuesSlugMapping = new Map();

      this.logger.log(`Retrieved ${attributeValues.length} attribute values`);

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

      // Save the copied attribute values
      const copiedValuesResponse = await this.attributeValueRepository.save(
        copiedValues,
      );

      // Generate mapping between original and copied attribute value IDs
      const valuesMapping = this.transformerService.getValuesMapping(
        attributeValuesSlugMapping,
        copiedValuesResponse,
      );

      this.logger.log('Attribute values copying is complete');
      return valuesMapping;
    } catch (error) {
      this.logger.error(
        'An error occurred while copying attribute values',
        error,
      );
      throw error;
    }
  }
}
