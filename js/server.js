import express from "express";
import bodyParser from "body-parser";
import crypto from "crypto";

const app = express();
app.use(bodyParser.json());

const XENDIT_WEBHOOK_TOKEN = "YOUR_WEBHOOK_TOKEN";

/* ================= WEBHOOK ================= */
app.post("/xendit/webhook", (req, res) => {

  const signature = req.headers["x-callback-token"];
  if (signature !== XENDIT_WEBHOOK_TOKEN) {
    return res.status(403).send("Invalid token");
  }

  const data = req.body;

  if (data.status === "PAID") {
    console.log("✅ Payment confirmed:", {
      id: data.id,
      amount: data.amount,
      email: data.payer_email,
      plan: data.description
    });

    // TODO:
    // - simpan ke DB
    // - kirim email admin
    // - kirim auto-reply user
  }

  res.status(200).send("OK");
});

app.listen(3000, () => {
  console.log("Webhook server running on port 3000");
});
