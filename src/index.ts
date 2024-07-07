import express from "express";
import { env } from "./env";

const app = express();
const port = env.PORT;

app.use(express.static("./public"));
app.use(express.static("./data"));

app.listen(port, () => {
  console.log(`Listening on port ${port}.`);
});
