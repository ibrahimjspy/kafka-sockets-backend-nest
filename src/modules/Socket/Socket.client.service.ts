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

  /**
   * Delays execution for the specified amount of time.
   * @param ms The delay time in milliseconds.
   * @returns A Promise that resolves after the specified delay.
   */
  private delay(ms: number) {
    return new Promise<void>((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Sends the auto sync progress message with retry functionality.
   * @param totalCount The total count of items being processed.
   * @param completedCount The count of items that have been completed.
   * @param autoSyncInput The auto sync input data.
   * @param eventId The event ID for the progress message.
   * @param retriesLeft The number of retries left.
   * @param retryDelay The delay between retries in milliseconds.
   */
  private async sendAutoSyncProgressWithRetry(
    totalCount: number,
    completedCount: number,
    autoSyncInput: AutoSyncDto,
    eventId: string,
    retriesLeft: number,
    retryDelay: number,
  ) {
    const importedPercentage = Math.round((completedCount / totalCount) * 100);

    const socket = io(SOCKET_ENDPOINT);
    socket.connect();

    try {
      await new Promise<void>((resolve, reject) => {
        socket.on('connect', async () => {
          try {
            await socket.emit(SOCKET_CLIENT_MESSAGE_NAME, {
              totalProducts: totalCount,
              imported: completedCount,
              percentage: importedPercentage,
              eventId,
              ...autoSyncInput,
            });
            resolve();
          } catch (error) {
            reject(error);
          } finally {
            socket.disconnect();
          }
        });

        socket.on('connect_error', () => {
          this.logger.error('Sending progress to socket failed');
          reject(new Error('Sending progress to socket failed'));
        });
      });
    } catch (error) {
      if (retriesLeft > 0) {
        this.logger.log(
          `Retrying progress message, attempts left: ${retriesLeft}`,
        );
        await this.delay(retryDelay);
        await this.sendAutoSyncProgressWithRetry(
          totalCount,
          completedCount,
          autoSyncInput,
          eventId,
          retriesLeft - 1,
          retryDelay,
        );
      } else {
        throw error;
      }
    }
  }

  /**
   * Sends the auto-sync progress message with retry functionality.
   * @param totalCount The total count of items.
   * @param completedCount The count of completed items.
   * @param autoSyncInput The auto-sync input data.
   * @param eventId The event ID.
   * @param maxRetries The maximum number of retries.
   * @param retryDelay The delay between retries in milliseconds.
   */
  async sendAutoSyncProgressV2(
    totalCount: number,
    completedCount: number,
    autoSyncInput: AutoSyncDto,
    eventId: string,
    maxRetries = 3,
    retryDelay = 5000,
  ) {
    await this.sendAutoSyncProgressWithRetry(
      totalCount,
      completedCount,
      autoSyncInput,
      eventId,
      maxRetries,
      retryDelay,
    );
  }
}
