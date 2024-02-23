// server.js
import { Application, Router } from "https://deno.land/x/oak/mod.ts";
import { Request } from "https://deno.land/x/oak@v13.2.5/request.ts";

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

function new_user(username, password) {
  users.set(username, new User(password, []));
}

function correct_password(username, password) {
  if ( users.has(username) ) {
    if (users.get(username).password == password) { return true }
  }
  return false;
}

router.post("/login", async (context) => {
  let req = context.request;
  console.log(req)
  console.log(req.ip)
  console.log(req.json())
  const body = await req.body({type: 'json'});
  if (!req.hasBody) {
    context.response.status = 400;
    context.response.body = { message: "No data provided" };
    return;
  }
  const info = body.value;

  if (correct_password(info.username, info.password)) {
    const maxAge = 3600; // Max age of the cookie in seconds (e.g., 1 hour)

      // Construct the cookie object
    const cookieObj = {
      name: "user_for_random_chat_room",
      value: `{username: ${stuff.username}}`,
      maxAge: maxAge,
      httpOnly: true, // Only accessible through HTTP requests, not JavaScript
      path: "/", // The path on the server where the cookie is valid
    };

      // Serialize the cookie object
    const serializedCookie = cookie.serialize(cookieObj);

      // Set the cookie in the response headers
    context.response.cookie("user_for_random_chat_room", serializedCookie);
    context.response.status(200).json({ success: true });
  } else {
    context.response.status(401).json({ success: false, message: "Incorrect username or password" });
  }
});

router.get("/signup", async (ctx) => {
  const socket = await ctx.upgrade();
  socket.onmessage = (message) => {
    console.log("Message: " + message.data);
    let stuff = JSON.parse(message.data);
    new_user(stuff.username, stuff.password);
    socket.send("true")
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