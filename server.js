// server.js
import { Application, Router } from "https://deno.land/x/oak/mod.ts";

// put a room with a key in here that then holds the clients
const rooms = new Map();

const users = new Map();

const app = new Application();
const router = new Router();
const port = 1027

class User {
  constructor(password, rooms) {
    this.password = password
    this.rooms = rooms
  }
}

function new_user(username, password) {
  users.set(username, new User(password, []));
}

router.get("/login", async (ctx) => {
  const socket = await ctx.upgrade();

  socket.onmessage = (message) => {
    let pass = users.get(message.data).password;
    socket.send(pass);
  }
})

router.get("/signup", async (ctx) => {
  const socket = await ctx.upgrade();
  socket.onmessage = (message) => {
    console.log("Message: " + message.data);
    let stuff = JSON.parse(message.data);
    new_user(stuff.username, stuff.password);
    socket.send("true")
  }
})

router.get("/rooms", async (ctx) => {
  const socket = await ctx.upgrade();
  socket.onmessage = (message) => {
    let rooms = JSON.stringify(users.get(message.data).rooms);
    console.log("Room request from" + message.data + "\n sending: " + rooms)
    socket.send(rooms);
  }
})

router.get("/new_room", async (ctx) => {
  const socket = await ctx.upgrade();
  socket.onmessage = (message) => {
    let make = JSON.parse(message.data);
    if (rooms.has(make.room)) {
      socket.send("Room Has Already Been Made!");
    } else {
      rooms.set(make.room, [])
      let password = users.get(make.username).password;
      let rooms = users.get(make.username).rooms
      rooms.append(make.room)
      users.set(make.username, new User(password, rooms))
      socket.send("Room Made!");
    }
  }
})

app.use(router.routes());
app.use(router.allowedMethods());
app.use(async (context) => {
  await context.send({
    root: `${Deno.cwd()}/`,
    index: "./index.html",
  });
});

console.log("running")
await app.listen({ port });