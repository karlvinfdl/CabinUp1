// api/logements.js
import jsonServer from "json-server";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const server = jsonServer.create();
const router = jsonServer.router(path.join(__dirname, "../mock/db.json"));
const middlewares = jsonServer.defaults();

server.use(middlewares);
server.use(router);

export default server;
