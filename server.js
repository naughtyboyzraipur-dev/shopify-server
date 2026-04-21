const express = require("express");
const axios = require("axios");

const app = express();

// ⚠️ RAW body required for Shopify
app.use(express.raw({ type: "application/json" }));

// 🔥 TEST ROUTE
app.get("/test", (req, res) => {
  res.send("TEST OK ✅");
});

// ✅ Phone format fix
function formatPhone(phone) {
  if (!phone) return null;

  phone = phone.replace(/\D/g, "");

  if (phone.length === 10) return phone;
  if (phone.length === 12 && phone.startsWith("91")) return phone.slice(2);

  return null;
}

app.post("/webhook", async (req, res) => {
  try {
    console.log("🔥 Webhook hit");

    const data = JSON.parse(req.body.toString());

    const orderId = data.name?.replace("#", "");
    const rawPhone =
      data.shipping_address?.phone ||
      data.customer?.phone;

    const phone = formatPhone(rawPhone);

    const customerName =
      data.shipping_address?.first_name ||
      data.customer?.first_name ||
      "Customer";

    const fulfillment = data.fulfillments?.[0];
    const tracking = fulfillment?.tracking_number;

    console.log("DATA:", orderId, phone, tracking);

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

    console.log("✅ Message sent");

    res.send("OK");

  } catch (err) {
    console.log("❌ ERROR:", err.message);
    res.status(200).send("Error handled"); // ⚠️ important
  }
});

// 🚀 PORT FIX (VERY IMPORTANT FOR RAILWAY)
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);
});
