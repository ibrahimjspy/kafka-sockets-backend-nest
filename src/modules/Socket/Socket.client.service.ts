import { Controller, Logger } from '@nestjs/common';
import io from 'socket.io-client';
import { AutoSyncDto, PaginationDto } from '../Product/Product.dto';
import { SOCKET_CLIENT_MESSAGE_NAME, SOCKET_ENDPOINT } from 'src/constants';
@Controller()
export class SocketClientService {
  private readonly logger = new Logger(SocketClientService.name);
  async sendAutoSyncProgress(
    paginationData: PaginationDto,
    autoSyncInput: AutoSyncDto,
    eventId: string,
    completedCount,
  ) {
    const productImportedCount =
      paginationData.batchNumber * paginationData.first;
    const totalProducts = paginationData.totalCount;
    const importedProducts =
      productImportedCount - (paginationData.first - completedCount);
    const importedPercentage = Math.round(
      (importedProducts / totalProducts) * 100,
    );
    //connecting web socket server
    const socket = io(SOCKET_ENDPOINT);
    socket.connect();
    socket.on('connect', async () => {
      return await socket.emit(SOCKET_CLIENT_MESSAGE_NAME, {
        totalProducts: totalProducts,
        imported: importedProducts,
        percentage: importedPercentage,
        eventId,
        ...autoSyncInput,
      });
    });
    socket.on('connect_error', () => {
      this.logger.error('sending progress to socket failed');
    });
  }

  async sendAutoSyncProgressV2(
    totalCount,
    completedCount,
    autoSyncInput: AutoSyncDto,
    eventId: string,
  ) {
    const importedPercentage = Math.round((completedCount / totalCount) * 100);
    //connecting web socket server
    const socket = io(SOCKET_ENDPOINT);
    socket.connect();
    socket.on('connect', async () => {
      return await socket.emit(SOCKET_CLIENT_MESSAGE_NAME, {
        totalProducts: totalCount,
        imported: completedCount,
        percentage: importedPercentage,
        eventId,
        ...autoSyncInput,
      });
    });
    socket.on('connect_error', () => {
      this.logger.error('sending progress to socket failed');
    });
  }
}
