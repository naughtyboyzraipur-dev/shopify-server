const express = require("express");
const axios = require("axios");

const app = express();

// ✅ Railway PORT fix
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// ✅ Health check (IMPORTANT for Railway)
app.get("/", (req, res) => {
  res.send("Server running 🚀");
});

// ✅ Test route
app.get("/test", (req, res) => {
  res.send("TEST OK ✅");
});

// ✅ Phone format function
function formatPhone(phone) {
  if (!phone) return null;

  phone = phone.replace(/\D/g, "");

  if (phone.length === 10) return phone;
  if (phone.length === 12 && phone.startsWith("91")) {
    return phone.slice(2);
  }

  return null;
}

// ✅ Webhook
app.post("/webhook", async (req, res) => {
  try {
    console.log("🔥 Webhook received");

    const data = req.body || {};

    const orderId = data.name?.replace("#", "") || "Order";

    const rawPhone =
      data?.shipping_address?.phone ||
      data?.customer?.phone;

    const phone = formatPhone(rawPhone);

    const customerName =
      data?.shipping_address?.first_name ||
      data?.customer?.first_name ||
      "Customer";

    const tracking = data?.fulfillments?.[0]?.tracking_number;

    // ❌ safety checks
    if (!tracking) {
      console.log("No tracking");
      return res.send("No AWB ❌");
    }

    if (!phone) {
      console.log("Invalid phone:", rawPhone);
      return res.send("Invalid phone ❌");
    }

    // ✅ Send WhatsApp
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
            tracking,        // {{1}}
            orderId,         // {{2}}
            customerName     // {{3}}
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

    console.log("✅ Message sent to:", phone);

    res.send("Done ✅");

  } catch (err) {
    console.log("❌ ERROR:", err.response?.data || err.message);
    res.status(500).send("Server Error ❌");
  }
});

// ✅ Start server (IMPORTANT)
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on ${PORT}`);
});
