import express from "express";
import cors from "cors";
import itemsRouter from "./routes/items.routes";
import selectedRouter from "./routes/selected.routes";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
  });
});

app.use("/api/items", itemsRouter);
app.use("/api/selected", selectedRouter);

export default app;
