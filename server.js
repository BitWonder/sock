// server.js
import { Application, Router } from "https://deno.land/x/oak/mod.ts";

// put a room with a key in here that then holds the clients
const rooms = new Map();

const app = new Application();
const router = new Router();
const port = 1027

function time() {
  return `At time: ${new Date().toUTCString()} =>`;
}

// using route to upgrade to stuff
router.get("/connected", async (ctx) => {
  const socket = await ctx.upgrade();
  const username = ctx.request.url.searchParams.get("username");
  if (rooms.has(username)) {
    socket.close(1008, `Username ${username} is already taken`);
    return;
  }
  socket.username = username;
  rooms.set(username, socket);
  //await Deno.writeTextFile("log.txt", `${time()} User ${username} connected to websocket \n`, {append: true});

  // setup actions that take place with websocket onopen, close, message, error
});

router.get("/user", async function (request) {
  const socket = await request.upgrade();

  socket.onmessage = (message) => {
    let users = JSON.parse( Deno.readTextFile("./users.json") );
    users.users.find(message);
    socket.send("true");
  }
});

app.use(router.routes());
app.use(router.allowedMethods());
app.use(async (context) => {
  await context.send({
    root: `${Deno.cwd()}/`,
    index: "website/index.html",
  });
});

//await Deno.writeTextFile("log.txt", `${time()} Started listening on port: ${port} \n`, {append: true});
console.log(`Running on http://localhost:${port}`);
await app.listen({ port });