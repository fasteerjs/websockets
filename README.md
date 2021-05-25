# Fasteer Websockets

Websockets in Fasteer.js.

## Getting started

The fastify-websocket plugin is already registered, there is no need to register it manually.
If you want to pass options to it, pass them inside the fastifyWebsocket property:

```ts
app.plugin(
  fasteerWebsockets({
    fastifyWebsocket: {
      // fastify websockets
    },
  })
);
```

### Shorthand route

Fasteer adds a `ws` (and `websocket` as an alias) function to `FastifyInstance` - it's a shorthand function for defining
WebSocket routes. The signature is:

```ts
function ws(
  path: string,
  middlewares?: WebsocketMiddleware | WebsocketMiddleware[],
  opts?: WebsocketRouteOptions,
  handler: (conn: SocketStream, req: FastifyRequest) => any
): FastifyInstance;
```

### Middlewares

Middlewares are executed before the route handler and can end the connection by passing false as their return value.

#### Global Middlewares

They can be registered by passing them into `globalMiddlewares`:

```ts
import { fasteerWebsockets, keepAlive } from "@fasteerjs/websockets";

app.plugin(
  fasteerWebsockets({
    // ...
    globalMiddlewares: [
      // middlewares here
      keepAlive,
    ],
  })
);
```

#### Per-route Middlewares

They can be registered inside of the shorthand, like so:

```ts
import { Fasteer } from "@fasteerjs/fasteer";

const WsController: Fasteer.FCtrl = async app => {
  app.ws("/path", [middleware], async (req, res) => {
    //
  });
};

export default WsController;
```

#### Definining Middlewares

Middlewares are just functions with the following signature:

```ts
function middleware(
  conn: SocketStream,
  req: FastifyRequest,
  app: FasteerInstance
): Promise<boolean>;
```

Additionally, there is a legacy way supporting callbacks, but it is not recommended.

```ts
function middleware(
  conn: SocketStream,
  req: FastifyRequest,
  app: FasteerInstance,
  done: (result: boolean) => void
): unknown;
```

Notice how the middleware returns a boolean - if the boolean returned is `false`, the next middleware won't be called and the connection
will be ended.
