import { FasteerInstance } from "@fasteerjs/fasteer";
import fastifyWebsocket from "@fastify/websocket";
import { PluginOptions } from "./types";
import { decorateWebsocket } from "./websocket";

/**
 * Fasteer Websockets plugin.
 *
 * @param options
 * @returns
 */
const fasteerWebsockets =
  (options?: PluginOptions) => (fasteer: FasteerInstance) => {
    fasteer.fastify.register(
      fastifyWebsocket,
      options ? options.fastifyWebsocket ?? {} : {}
    );

    decorateWebsocket(
      fasteer,
      options && options.globalMiddlewares
        ? Array.isArray(options.globalMiddlewares)
          ? options.globalMiddlewares
          : [options.globalMiddlewares]
        : []
    );
  };

export * from "./middlewares/keepAlive";
export * from "./utils/socketSend";

export { fasteerWebsockets };

export default fasteerWebsockets;
