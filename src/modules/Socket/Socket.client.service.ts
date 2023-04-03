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
  ) {
    let productImportedCount =
      paginationData.batchNumber * paginationData.first;
    if (productImportedCount > paginationData.totalCount) {
      productImportedCount = paginationData.totalCount;
    }
    //connecting web socket server
    const socket = io(SOCKET_ENDPOINT);
    socket.connect();
    socket.on('connect', async () => {
      return await socket.emit(SOCKET_CLIENT_MESSAGE_NAME, {
        totalProducts: paginationData.totalCount,
        imported: productImportedCount,
        eventId,
        ...autoSyncInput,
      });
    });
    socket.on('connect_error', () => {
      this.logger.error('sending progress to socket failed');
    });
  }
}
