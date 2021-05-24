import { Fasteer } from "@fasteerjs/fasteer"
import fastifyWebsocket, {
  SocketStream,
  WebsocketPluginOptions,
} from "fastify-websocket"
import WebSocket from "ws"

/**
 * Send a message to the WebSocket.
 *
 * @param socket Socket-like object containing the send function
 * @param payload Payload to send. If an object is passed it is stringified.
 */
const socketSend = (
  socket: { send: SocketStream["socket"]["send"] },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: Record<string, any> | string
): void =>
  socket.send(typeof payload === "object" ? JSON.stringify(payload) : payload)

/**
 * In some cases the connection may time out after a certain time
 * (eg. 30s by default when using Nginx as reverse proxy).
 *
 * This middleware sends an empty "keep-alive" message every 10 seconds
 * to the client in order to maintain the connection.
 *
 * This function returns the NodeJS.Timeout, so if at any point the keep-alive message
 * should stop being stopped, a clearInterval() function can be called.
 *
 * "Legends say that there will once be a connection longer than how long I will live here"
 *  - Mia
 *
 * @param conn The socket stream
 * @returns The interval
 */
const keepAlive = (conn: SocketStream): NodeJS.Timeout => {
  // Send a keep-alive message every 10s
  const interval = setInterval(() => {
    if (conn.socket.readyState === WebSocket.OPEN) socketSend(conn.socket, "")
  }, 1000 * 10)

  conn.on("end", () => interval && clearInterval(interval))

  return interval
}

const fasteerWebsockets =
  (options?: { fastifyWebsocket?: WebsocketPluginOptions }) =>
  (fasteer: Fasteer.Fasteer) => {
    fasteer.fastify.register(
      fastifyWebsocket,
      options ? options.fastifyWebsocket ?? {} : {}
    )
  }

export { keepAlive, socketSend, fasteerWebsockets }
export default fasteerWebsockets
