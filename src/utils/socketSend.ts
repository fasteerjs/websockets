import { SocketStream } from "@fastify/websocket";

/**
 * Send a message to the socket. If it's an object, it automatically
 * gets encoded into a JSON, otherwise .toString() is used.
 *
 * @param socket The socket
 * @param payload The payload
 */
const socketSend = (
  socket: { send: SocketStream["socket"]["send"] },
  payload: object | string
): void =>
  socket.send(typeof payload === "object" ? JSON.stringify(payload) : payload);

export { socketSend };

export default socketSend;
