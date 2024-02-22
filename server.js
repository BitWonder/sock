// server.js
import { Application, Router } from "https://deno.land/x/oak/mod.ts";

// cookies
import * as cookie from "https://deno.land/std/http/cookie.ts";

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

function new_user(username, password, first_room) {
  users.set(username, new User(password, [first_room]));
}

function correct_password(username, password) {
  if (users.get(username).password == password) { return true }
  return false;
}

router.get("/login", async (ctx) => {
  const socket = await ctx.upgrade();
  socket.onmessage = (message) => {
    console.log("Message: " + message);
    let stuff = JSON.parse(message);
    if (correct_password(stuff.username, stuff.password)) {
      cooky = cookie.serialize({}, {
        name: stuff.username,
        value: "true"
      })
      ctx.response.headers.set("Set-Cookie", cooky);
      socket.send("true");
    }
    else {
      socket.send("false")
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