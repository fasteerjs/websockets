import { FastifyInstance, FastifyRequest } from "fastify";
import { RouteGenericInterface } from "fastify/types/route";
import { FasteerInstance } from "@fasteerjs/fasteer";
import {
  WebsocketMiddleware,
  WebsocketMiddlewarePromise,
  WebSocketRouteOptions,
} from "./types";
import { SocketStream } from "fastify-websocket";
import util from "util";

const decorateWebsocket = (
  fasteer: FasteerInstance,
  globalMiddlewares: WebsocketMiddleware[] = []
) => {
  const shorthand = websocket(fasteer, globalMiddlewares);

  fasteer.fastify.decorate("ws", shorthand);
  fasteer.fastify.decorate("websocket", shorthand);
};

const handleMiddldeware = async (
  conn: SocketStream,
  req: FastifyRequest,
  fasteer: FasteerInstance,
  middleware: WebsocketMiddleware
): Promise<boolean> => {
  if (!util.types.isAsyncFunction(middleware)) {
    return new Promise<boolean>(resolve =>
      middleware(conn, req, fasteer, resolve)
    );
  }

  return await (middleware as WebsocketMiddlewarePromise)(conn, req, fasteer);
};

const middlewares = async (
  conn: SocketStream,
  req: FastifyRequest,
  fasteer: FasteerInstance,
  middlewares: WebsocketMiddleware[]
): Promise<boolean> => {
  for (const middleware of middlewares) {
    const passes = await handleMiddldeware(conn, req, fasteer, middleware);

    // If the middleware returns false it means that no next step should be taken.
    if (!passes) {
      conn.end();
      return false;
    }
  }

  return true;
};

/**
 * A route shorthand to define a WebSocket endpoint.
 * It applies the keep-alive pre-handler by default and emits `wsConnection` to the main emitter.
 *
 * @param app The fastify instance
 * @param opts Route options
 * @returns The fastify instance
 */
const websocket =
  (app: FasteerInstance, globalMiddlewares: WebsocketMiddleware[]) =>
  <RouteGeneric extends RouteGenericInterface = RouteGenericInterface>(
    url: string,
    middleware?: WebsocketMiddleware | WebsocketMiddleware[],
    opts?: WebSocketRouteOptions,
    handler?: WebSocketRouteOptions["wsHandler"]
  ): FastifyInstance =>
    app.fastify.route<RouteGeneric>({
      url,
      method: "GET",
      handler:
        // If a httpHandler is provided, use that,
        // otherwise use the default one.
        opts && opts.httpHandler
          ? opts.httpHandler
          : (_, res) => {
              res.send({
                success: false,
                error: {
                  kind: "USER_INPUT",
                  message: "This is a WS endpoint",
                },
              });
            },
      async wsHandler(conn, req) {
        app.emit("preWsConnection", conn, req);

        if (globalMiddlewares.length >= 1) {
          // Global Middlewares are handled first, that's why they
          // are called separately.
          if (!(await middlewares(conn, req, app, globalMiddlewares))) return;
        }

        // Per-Route Middlewares, can be specified inside of the route shorthand.
        const routeMiddlewares = middleware
          ? Array.isArray(middleware)
            ? middleware
            : [middleware]
          : [];

        if (routeMiddlewares.length >= 1) {
          if (!(await middlewares(conn, req, app, routeMiddlewares))) return;
        }

        app.emit("wsConnection", conn, req);

        conn.on("end", () => app.emit("wsConnectionEnd", req));

        handler?.call(this, conn, req);
      },
    });

export { websocket, decorateWebsocket };
