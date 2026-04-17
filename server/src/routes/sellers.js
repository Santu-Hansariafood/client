import { Router } from "express";
import Seller from "../models/Seller.js";

const router = Router();

const mapSellerForClient = (seller) => {
  const brokerageByName = {};
  if (Array.isArray(seller.commodities)) {
    seller.commodities.forEach((c) => {
      if (c && c.name && c.brokerage !== undefined) {
        brokerageByName[c.name] = c.brokerage;
      }
    });
  }
  return {
    ...seller,
    brokerageByName,
  };
};

router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page || "0", 10);
    const limit = parseInt(req.query.limit || "0", 10);
    const search = req.query.search || "";
    let mobile = String(req.query.mobile || "").trim();
    const phoneRegex = /^(?:\+91|0)?([6-9]\d{9})$/;
    const phoneMatch = mobile.match(phoneRegex);
    if (phoneMatch) {
      mobile = phoneMatch[1];
    }

    const query = mobile
      ? { "phoneNumbers.value": mobile }
      : search
        ? { sellerName: { $regex: search, $options: "i" } }
        : {};

    if (page > 0 && limit > 0) {
      const items = await Seller.find(query)
        .sort({ sellerName: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

      const total = await Seller.countDocuments(query);

      return res.json({
        data: items.map(mapSellerForClient),
        total,
      });
    }

    const limitVal = limit > 0 ? limit : 0;
    const items = await Seller.find(query)
      .sort({ sellerName: 1 })
      .limit(limitVal)
      .lean();

    res.json(items.map(mapSellerForClient));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const item = await Seller.findById(req.params.id).lean();

    if (!item) {
      return res.status(404).json({ message: "Seller not found" });
    }

    res.json(mapSellerForClient(item));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const seller = await Seller.create(req.body);

    res.status(201).json(seller);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const updated = await Seller.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return res.status(404).json({ message: "Seller not found" });
    }

    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Seller.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: "Seller not found" });
    }

    res.json({ message: "Seller deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
