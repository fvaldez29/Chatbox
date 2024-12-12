import express from 'express'
import logger from "morgan";
import dotenv from "dotenv";
import { createClient } from "@libsql/client";

import { Server } from "socket.io";
import { createServer } from "node:http";

dotenv.config();

const port = process.env.PORT ?? 3000;

const app = express();
const server = createServer(app);
const io = new Server(server, {
  connectionStateRecovery: {},
});

const db = createClient({
  url: "libsql://my-db-fvaldez29.turso.io",
  authToken: process.env.DB_TOKEN
})
await db.execute(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT,
    username TEXT
  )
`)

io.on("connection", async (socket) => {
  console.log("a user has connected!");

  socket.on("disconnect", () => {
    console.log("an user has disconnected");
  });

  socket.on('chat message', async (msg) => {
    let result
    let username = socket.handshake.auth.username ?? 'anonymous'
    try {


      result = await db.execute({
        sql: 'INSERT INTO messages (content, username) VALUES (:msg, :username)',
        args: { msg, username }
      })
    } catch (e) {
      console.error('error a insertar los datos ', e)
      return;
    }

    io.emit('chat message', msg, result.lastInsertRowid.toString(), username)
  })
  console.log('auth...')
  console.log(socket.handshake.auth)

  if (!socket.recovered) {
    try {
      const results = await db.execute({
        sql: 'SELECT id, content, username FROM messages WHERE id > ?',
        args: [socket.handshake.auth.serverOffset ?? 0]
      })

      results.rows.forEach(row => {
        socket.emit('chat message', row.content, row.id.toString(), row.username)
      })
    } catch (err) {
      console.error(err)
      return;
    }
  }

});

// Usa morgan en modo 'dev' para registrar solicitudes HTTP
app.use(logger("dev"));

// Responde con el archivo HTML cuando el cliente solicita la ruta raíz ('/')
app.get("/", (req, res) => {
  res.sendFile(process.cwd() + "/client/index.html");
});

// Configura el servidor para escuchar en el puerto especificado
server.listen(port, () => {
  console.log(`server listening on port http://localhost:${port}`);
});
