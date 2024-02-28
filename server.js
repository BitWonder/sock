import { Application, Router } from "https://deno.land/x/oak/mod.ts";

// put a room with a key in here that then holds the clients
const database = await Deno.openKv();

if (database.get("rooms") == null) {
  database.set("rooms", [])
}

const rooms = new Map();

const app = new Application();
const router = new Router();
const port = 1027;

class User {
  constructor(password, rooms) {
    this.password = password;
    this.rooms = rooms;
  }
}

async function new_user(username, password) {
  await database.set([username], new User(password, []));
}

router.get("/login", async (ctx) => {
  console.log(database);
  const socket = await ctx.upgrade();

  socket.onmessage = async (message) => {
    let pass = (await database.get([message.data])).value.password;
    socket.send(pass);
    console.log(database);
  };
});

router.get("/signup", async (ctx) => {
  const socket = await ctx.upgrade();
  socket.onmessage = (message) => {
    console.log("Message: " + message.data);
    let stuff = JSON.parse(message.data);
    new_user(stuff.username, stuff.password);
    socket.send("true");
    console.log(database);
  };
});

router.get("/rooms", async (ctx) => {
  const socket = await ctx.upgrade();
  socket.onmessage = async (message) => {
    let rooms = JSON.stringify((await database.get([message.data])).value.rooms);
    console.log("Room request from: " + message.data + "\n sending: " + rooms);
    socket.send(rooms);
    console.log(database);
  };
});

router.get("/new_room", async (ctx) => {
  const socket = await ctx.upgrade();
  socket.onmessage = async (message) => {
    let make = JSON.parse(message.data);
    console.log(make);
    if (database.get("rooms").includes(make.room)) {
      console.log("Room Already Make");
      socket.send("Room Has Already Been Made!");
      return
    } else {
      console.log("Making Room");
      let user = await database.get([make.username]);
      let password = user.value.password;
      let rooms_of_user_list = user.value.rooms;
      if (!rooms_of_user_list) {
        rooms_of_user_list = []
      }
      rooms_of_user_list.push(make.room);
      await database.set([make.username], new User(password, rooms_of_user_list));
      socket.send("Room Made!");
      console.log(database);
      database.get("rooms").push(make.room)
    }
  };
});

router.get("/join_room", async (ctx) => {
  const socket = await ctx.upgrade();
  socket.onmessage = async (message) => {
    let make = JSON.parse(message.data);
    console.log(make);
    if (!database.get("rooms").includes(make.room)) {
      console.log("Could Not Find Room");
      socket.send("Room Does Not Exist");
    } else {
      console.log("Joining Room");
      let user = await database.get([make.username]);
      let password = user.value.password;
      let rooms_of_user_list = user.value.rooms;
      if (!rooms_of_user_list) {
        rooms_of_user_list = []
      }
      rooms_of_user_list.push(make.room);
      await database.set([make.username], new User(password, rooms_of_user_list));
      socket.send("Joined Room Successfully!");
      console.log(database);
    }
  };
});

router.get("/delete_room", async (ctx) => {
  const socket = await ctx.upgrade();
  socket.onmessage = async (message) => {
    let make = JSON.parse(message.data);
    console.log(make);
    console.log("Delete Room");
    let user = await database.get([make.username]);
    let password = user.value.password;
    let rooms_of_user_list = user.value.rooms;
    let index = rooms_of_user_list.indexOf(make.room);
    if (index > -1) { // only splice array when item is found
      rooms_of_user_list.splice(index, 1); // 2nd parameter means remove one item only
    }
    await database.set([make.username], new User(password, rooms_of_user_list));
    socket.send("Room Deleted!");
    console.log(database);
  }
});

router.get("/chat", async (ctx) => {
  const socket = await ctx.upgrade();
  const username = ctx.request.url.searchParams.get("username");
  const room = ctx.request.url.searchParams.get("room");
  console.log("Username: " + username);
  console.log("Room: " + room);
  socket.onopen = () => {
    if (!rooms.has(room)) {
      if (database.get(`chats_rooms_${room}`) != null) {
        rooms.set(room, database.get(`chats_rooms_${room}`))
      }
      rooms.set(room, []);
      database.set(`chats_rooms_${room}`, [{username: username, socket: socket}])
    }
    let current_list = rooms.get(room);
    console.log(current_list);
    current_list.push({ username: username, socket: socket });
    rooms.set(room, current_list);
    database.set(`chats_rooms_${room}`, current_list)
    for (let client of rooms.get(room)) {
      client.socket.send(
        JSON.stringify({
          type: "new-user",
          username: room,
          image: "",
          message: `Say Hello To: ${username}`,
        })
      );
    }
    console.log(database);
  };

  socket.onmessage = (message) => {
    console.log(message.data);
    let data = JSON.parse(message.data);
    console.log(database);
    for (let client of rooms.get(room)) {
      client.socket.send(
        JSON.stringify({
          type: "message",
          username: username,
          image: data.image,
          message: data.message,
        })
      );
    }
  };

  socket.onclose = () => {
    console.log(`${username} has left ${room}`);
    let users = rooms.get(room);
    const index = users.findIndex(user => user.username === username && user.socket === socket);
    console.log(index);
    if (index > -1) {
      users.splice(index, 1);
    }
    database.set(`chats_rooms_${room}`, users)
    console.log(rooms.get(room));
    for (let client of users) {
      client.socket.send(
          JSON.stringify({
          type: "left-user",
          username: `${room}`,
          image: "",
          message: `Say Bye To: ${username}`,
        })
      );
    }
  };
});

app.use(router.routes());
app.use(router.allowedMethods());
app.use(async (context) => {
  await context.send({
    root: `${Deno.cwd()}/`,
    index: "./index.html",
  });
});

console.log("Server is running");
await app.listen({ port });
