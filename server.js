const express = require("express");
const axios = require("axios");

const app = express();

// ✅ Railway important
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Health route (VERY IMPORTANT)
app.get("/", (req, res) => {
  res.send("Server running 🚀");
});

// Phone format
function formatPhone(phone) {
  if (!phone) return null;

  phone = phone.replace(/\D/g, "");

  if (phone.length === 10) return phone;
  if (phone.length === 12 && phone.startsWith("91")) return phone.slice(2);

  return null;
}

// Webhook
app.post("/webhook", async (req, res) => {
  try {
    console.log("🔥 Webhook hit:", req.body);

    const data = req.body;

    const orderId = data.name?.replace("#", "");
    const rawPhone =
      data.shipping_address?.phone ||
      data.customer?.phone;

    const phone = formatPhone(rawPhone);

    const customerName =
      data.shipping_address?.first_name ||
      data.customer?.first_name ||
      "Customer";

    const tracking = data.fulfillments?.[0]?.tracking_number;

    if (!tracking) return res.send("No AWB ❌");
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

    console.log("✅ Message sent:", phone);

    res.send("Done ✅");

  } catch (err) {
    console.log("❌ ERROR:", err.response?.data || err.message);
    res.status(500).send("Error");
  }
});

// START SERVER (IMPORTANT)
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
