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

app.post("/webhook", async (req, res) => {
  try {
    const data = req.body;

    // ✅ Data extract
    const orderId = data.name?.replace("#", "");
    const rawPhone = data.shipping_address?.phone;
    const phone = formatPhone(rawPhone);
    const customerName = data.shipping_address?.first_name;

    const tracking = data.fulfillments?.[0]?.tracking_number;

    // ❌ Safety checks
    if (!tracking) return res.send("No AWB yet ❌");
    if (!phone) return res.send("Invalid phone ❌");

    // ✅ Interakt API call
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
            tracking,        // {{1}} AWB
            orderId,         // {{2}} Order ID
            customerName     // {{3}} Name
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

    console.log("Message sent to:", phone);

    res.send("Message Sent ✅");

  } catch (err) {
    console.log("ERROR:", err.response?.data || err.message);
    res.status(500).send("Error ❌");
  }
});

// ✅ Health check (browser me open karne ke liye)
app.get("/", (req, res) => {
  res.send("Server running 🚀");
});

app.listen(3000, () => console.log("Server running 🚀"));
