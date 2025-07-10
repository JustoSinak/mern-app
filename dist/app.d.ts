import { Application } from 'express';
import { Server as SocketIOServer } from 'socket.io';
declare const app: Application;
declare const server: import("http").Server<typeof import("http").IncomingMessage, typeof import("http").ServerResponse>;
declare const io: SocketIOServer<import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, any>;
export { app, server, io };
//# sourceMappingURL=app.d.ts.map