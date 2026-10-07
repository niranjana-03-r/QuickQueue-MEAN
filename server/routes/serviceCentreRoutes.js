const express = require("express");
const ServiceCentre = require("../models/ServiceCentre");
const Queue = require("../models/Queue");

const router = express.Router();

function calculateDistance(lat1, lon1, lat2, lon2) {
  const earthRadius = 6371;

  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);

  const c =
    2 * Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return earthRadius * c;
}


router.get("/", async (req, res) => {
  try {
    const centres = await ServiceCentre
      .find()
      .sort({ name: 1 });

    res.json(centres);

  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch service centres",
      error: error.message
    });
  }
});


router.get("/nearby", async (req, res) => {
  try {
    const { lat, lon } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({
        message: "Latitude and longitude are required"
      });
    }

    const userLat = Number(lat);
    const userLon = Number(lon);

    if (isNaN(userLat) || isNaN(userLon)) {
      return res.status(400).json({
        message: "Invalid latitude or longitude"
      });
    }

    const centres = await ServiceCentre.find();

    const nearbyCentres = centres.map((centre) => {

      const distance = calculateDistance(
        userLat,
        userLon,
        centre.lat,
        centre.lon
      );

      return {
        ...centre.toObject(),
        distance: Number(distance.toFixed(2))
      };
    });

    nearbyCentres.sort(
      (a, b) => a.distance - b.distance
    );

    res.json(nearbyCentres);

  } catch (error) {
    res.status(500).json({
      message: "Failed to find nearby service centres",
      error: error.message
    });
  }
});


router.get("/:id", async (req, res) => {
  try {
    const centre = await ServiceCentre.findById(
      req.params.id
    );

    if (!centre) {
      return res.status(404).json({
        message: "Service centre not found"
      });
    }

    const waitingCount = await Queue.countDocuments({
      serviceCentre: centre._id,
      status: "Waiting"
    });

    const servingQueue = await Queue.findOne({
      serviceCentre: centre._id,
      status: "Serving"
    }).sort({ tokenNumber: 1 });

    const estimatedWaitTime =
      waitingCount * centre.avgServiceTime;

    res.json({
      ...centre.toObject(),
      currentQueue: waitingCount,
      currentServingToken: servingQueue
        ? servingQueue.tokenNumber
        : null,
      estimatedWaitTime
    });

  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch service centre details",
      error: error.message
    });
  }
});


router.post("/", async (req, res) => {
  try {
    const centre = await ServiceCentre.create(
      req.body
    );

    res.status(201).json({
      message: "Service centre added successfully",
      centre
    });

  } catch (error) {
    res.status(400).json({
      message: "Failed to add service centre",
      error: error.message
    });
  }
});


router.put("/:id", async (req, res) => {
  try {
    const centre = await ServiceCentre.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!centre) {
      return res.status(404).json({
        message: "Service centre not found"
      });
    }

    res.json({
      message: "Service centre updated successfully",
      centre
    });

  } catch (error) {
    res.status(400).json({
      message: "Failed to update service centre",
      error: error.message
    });
  }
});


router.delete("/:id", async (req, res) => {
  try {
    const centre = await ServiceCentre.findById(
      req.params.id
    );

    if (!centre) {
      return res.status(404).json({
        message: "Service centre not found"
      });
    }

    const activeQueues = await Queue.countDocuments({
      serviceCentre: centre._id,
      status: {
        $in: ["Waiting", "Serving"]
      }
    });

    if (activeQueues > 0) {
      return res.status(400).json({
        message:
          "Cannot delete a service centre with active queues"
      });
    }

    await ServiceCentre.findByIdAndDelete(
      req.params.id
    );

    res.json({
      message: "Service centre deleted successfully"
    });

  } catch (error) {
    res.status(500).json({
      message: "Failed to delete service centre",
      error: error.message
    });
  }
});


module.exports = router;