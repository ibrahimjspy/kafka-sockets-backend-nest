import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayInit,
  WebSocketServer,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { Logger } from '@nestjs/common';
import { AutoSyncDto } from '../Product/Product.dto';
import { SOCKET_CLIENT_MESSAGE_NAME, SOCKET_NAMESPACE } from 'src/constants';

@WebSocketGateway({
  namespace: SOCKET_NAMESPACE,
})
export class AutoSyncGateway implements OnGatewayInit {
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger(AutoSyncGateway.name);

  afterInit() {
    this.logger.log('Initialized!');
  }

  @SubscribeMessage('autoSync')
  sendMessages(client: Socket, data: AutoSyncDto) {
    this.server.emit(SOCKET_CLIENT_MESSAGE_NAME, {
      ...data,
      client: client.id,
    });
  }
}
