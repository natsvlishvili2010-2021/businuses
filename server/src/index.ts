import express from "express";
import cors from "cors";

const app = express();
app.use(express.json());

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "*";
app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));

const PORT = Number(process.env.PORT) || 5000;

app.get("/", (req, res) => {
  res.send("Hello from server");
});

// დამატეთ თქვენი routes, services, email/slack აქ

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
