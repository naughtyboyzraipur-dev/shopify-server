const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

// Phone format fix
function formatPhone(phone) {
  if (!phone) return null;

  phone = phone.replace(/\D/g, "");

  if (phone.length === 10) return phone;
  if (phone.length === 12 && phone.startsWith("91")) return phone.slice(2);

  return null;
}

// ROOT (important for Railway)
app.get("/", (req, res) => {
  res.send("Server running 🚀");
});

// TEST ROUTE
app.get("/test", (req, res) => {
  res.send("Test OK ✅");
});

// WEBHOOK
app.post("/webhook", async (req, res) => {
  try {
    console.log("📦 Webhook received");

    const data = req.body;

    const orderId = data.name?.replace("#", "") || "0000";

    const rawPhone =
      data.shipping_address?.phone ||
      data.customer?.phone;

    const phone = formatPhone(rawPhone);

    const customerName =
      data.shipping_address?.first_name ||
      data.customer?.first_name ||
      "Customer";

    const tracking = data.fulfillments?.[0]?.tracking_number;

    if (!tracking) return res.send("No AWB yet ❌");
    if (!phone) return res.send("Invalid phone ❌");

    await axios.post(
      "https://api.interakt.ai/v1/public/message/",
      {
        countryCode: "+91",
        phoneNumber: phone,
        type: "Template",
        template: {
          name: "order_dispatch",
          languageCode: "en",
          bodyValues: [
            tracking,
            orderId,
            customerName
          ]
        }
      },
      {
        headers: {
          Authorization: "Basic VUw2MVpVdnNaM3UzZHpsdDhYQmZENVhKcVV2QzdoTUw2bmhfTV9JdkFIdzo=",
          "Content-Type": "application/json"
        }
      }
    );

    console.log("✅ Message sent");

    res.send("Message Sent ✅");

  } catch (err) {
    console.log("❌ ERROR:", err.response?.data || err.message);
    res.status(500).send("Error ❌");
  }
});

// 🔥 IMPORTANT (Railway fix)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on ${PORT} 🚀`);
});
