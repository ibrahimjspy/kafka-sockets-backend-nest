import { Module } from '@nestjs/common';
import { AutoSyncGateway } from './Socket.service';

@Module({
  providers: [AutoSyncGateway],
})
export class SocketModule {}
