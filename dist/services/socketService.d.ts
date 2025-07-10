import { Server as SocketIOServer } from 'socket.io';
export declare const setupSocketHandlers: (io: SocketIOServer) => void;
declare module 'socket.io' {
    interface Server {
        emitInventoryUpdate(productId: string, inventory: number): void;
        emitOrderUpdate(userId: string, orderData: any): void;
        emitNotification(userId: string, notification: any): void;
    }
}
//# sourceMappingURL=socketService.d.ts.map