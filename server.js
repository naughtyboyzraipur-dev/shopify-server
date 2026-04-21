const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

// ✅ Phone format fix
function formatPhone(phone) {
  if (!phone) return null;

  phone = phone.replace(/\D/g, "");

  if (phone.length === 10) return phone;
  if (phone.length === 12 && phone.startsWith("91")) return phone.slice(2);

  return null;
}

// ✅ TEST ROUTE (important debug)
app.get("/test", (req, res) => {
  console.log("🔥 Test route hit");
  res.send("Test OK");
});

// ✅ WEBHOOK
app.post("/webhook", async (req, res) => {
  try {
    console.log("📦 Webhook received:", JSON.stringify(req.body, null, 2));

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

    const fulfillment = data.fulfillments?.[0];
    const tracking = fulfillment?.tracking_number;

    // ❌ IMPORTANT: Shopify sometimes nested structure deta hai
    if (!tracking) {
      console.log("❌ No tracking number yet");
      return res.send("No AWB yet");
    }

    if (!phone) {
      console.log("❌ Invalid phone:", rawPhone);
      return res.send("Invalid phone");
    }

    // ✅ Send WhatsApp message
    const response = await axios.post(
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

    console.log("✅ Message sent:", response.data);

    res.send("Message Sent ✅");

  } catch (err) {
    console.log("❌ ERROR FULL:", err.response?.data || err.message);
    res.status(500).send("Error ❌");
  }
});

// ✅ ROOT ROUTE
app.get("/", (req, res) => {
  res.send("Server running 🚀");
});

app.listen(3000, () => console.log("Server running 🚀"));
