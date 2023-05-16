import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SyncMappings } from '../mapping';

@Injectable()
export class SyncMappingsRepository {
  @InjectRepository(SyncMappings)
  private readonly repository: Repository<SyncMappings>;

  /**
   * @description -- this method returns sync mappings against an event id
   */
  public async getSyncedProducts(eventId: string) {
    return await this.repository.find({
      where: { event_type: eventId },
    });
  }
}
