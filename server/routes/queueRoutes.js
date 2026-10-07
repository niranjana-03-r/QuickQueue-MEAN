const express = require("express");
const Queue = require("../models/Queue");
const ServiceCentre = require("../models/ServiceCentre");

const router = express.Router();

router.post("/join", async (req, res) => {
  try {
    const { userId, serviceCentreId } = req.body;

    if (!userId || !serviceCentreId) {
      return res.status(400).json({
        message: "User ID and service centre ID are required"
      });
    }

    const serviceCentre = await ServiceCentre.findById(serviceCentreId);

    if (!serviceCentre) {
      return res.status(404).json({
        message: "Service centre not found"
      });
    }

    const existingQueue = await Queue.findOne({
      user: userId,
      serviceCentre: serviceCentreId,
      status: {
        $in: ["Waiting", "Serving"]
      }
    });

    if (existingQueue) {
      return res.status(409).json({
        message: "You have already joined this queue",
        queue: existingQueue
      });
    }

    const lastQueue = await Queue.findOne({
      serviceCentre: serviceCentreId
    }).sort({ tokenNumber: -1 });

    const nextToken = lastQueue
      ? lastQueue.tokenNumber + 1
      : 1;

    const queue = await Queue.create({
      user: userId,
      serviceCentre: serviceCentreId,
      tokenNumber: nextToken,
      status: "Waiting"
    });

    const peopleAhead = await Queue.countDocuments({
      serviceCentre: serviceCentreId,
      status: "Waiting",
      tokenNumber: {
        $lt: nextToken
      }
    });

    const estimatedWaitTime =
      peopleAhead * serviceCentre.avgServiceTime;

    res.status(201).json({
      message: "Queue joined successfully",
      queue: {
        id: queue._id,
        tokenNumber: queue.tokenNumber,
        status: queue.status,
        joinedAt: queue.joinedAt,
        peopleAhead,
        estimatedWaitTime
      }
    });

  } catch (error) {
    res.status(500).json({
      message: "Failed to join queue",
      error: error.message
    });
  }
});


router.get("/my/:userId", async (req, res) => {
  try {
    const queues = await Queue.find({
      user: req.params.userId
    })
      .populate(
        "serviceCentre",
        "name category address avgServiceTime"
      )
      .sort({ joinedAt: -1 });

    const result = await Promise.all(
      queues.map(async (queue) => {

        let peopleAhead = 0;
        let estimatedWaitTime = 0;
        let currentServingToken = null;

        if (
          queue.status === "Waiting" ||
          queue.status === "Serving"
        ) {
          peopleAhead = await Queue.countDocuments({
            serviceCentre: queue.serviceCentre._id,
            status: "Waiting",
            tokenNumber: {
              $lt: queue.tokenNumber
            }
          });

          const servingQueue = await Queue.findOne({
            serviceCentre: queue.serviceCentre._id,
            status: "Serving"
          }).sort({ tokenNumber: 1 });

          currentServingToken = servingQueue
            ? servingQueue.tokenNumber
            : null;

          estimatedWaitTime =
            peopleAhead *
            queue.serviceCentre.avgServiceTime;

          if (queue.status === "Serving") {
            peopleAhead = 0;
            estimatedWaitTime = 0;
          }
        }

        return {
          _id: queue._id,
          tokenNumber: queue.tokenNumber,
          status: queue.status,
          joinedAt: queue.joinedAt,
          completedAt: queue.completedAt,
          peopleAhead,
          estimatedWaitTime,
          currentServingToken,
          serviceCentre: queue.serviceCentre
        };
      })
    );

    res.json(result);

  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch your queues",
      error: error.message
    });
  }
});


router.put("/:id/cancel", async (req, res) => {
  try {
    const queue = await Queue.findById(req.params.id);

    if (!queue) {
      return res.status(404).json({
        message: "Queue entry not found"
      });
    }

    if (queue.status !== "Waiting") {
      return res.status(400).json({
        message: "Only waiting queues can be cancelled"
      });
    }

    queue.status = "Cancelled";
    queue.completedAt = new Date();

    await queue.save();

    res.json({
      message: "Queue cancelled successfully",
      queue
    });

  } catch (error) {
    res.status(500).json({
      message: "Failed to cancel queue",
      error: error.message
    });
  }
});


router.get("/admin/all", async (req, res) => {
  try {
    const queues = await Queue.find({
      status: {
        $in: ["Waiting", "Serving"]
      }
    })
      .populate("user", "name email phone")
      .populate(
        "serviceCentre",
        "name category address avgServiceTime"
      )
      .sort({
        serviceCentre: 1,
        tokenNumber: 1
      });

    res.json(queues);

  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch admin queues",
      error: error.message
    });
  }
});


router.put("/call-next/:serviceCentreId", async (req, res) => {
  try {
    const serviceCentre = await ServiceCentre.findById(
      req.params.serviceCentreId
    );

    if (!serviceCentre) {
      return res.status(404).json({
        message: "Service centre not found"
      });
    }

    const servingQueue = await Queue.findOne({
      serviceCentre: serviceCentre._id,
      status: "Serving"
    });

    if (servingQueue) {
      return res.status(400).json({
        message: `Token ${servingQueue.tokenNumber} is currently serving`
      });
    }

    const nextQueue = await Queue.findOne({
      serviceCentre: serviceCentre._id,
      status: "Waiting"
    }).sort({
      tokenNumber: 1
    });

    if (!nextQueue) {
      return res.status(404).json({
        message: "No waiting customers in this queue"
      });
    }

    nextQueue.status = "Serving";

    await nextQueue.save();

    res.json({
      message: `Token ${nextQueue.tokenNumber} is now serving`,
      queue: nextQueue
    });

  } catch (error) {
    res.status(500).json({
      message: "Failed to call next token",
      error: error.message
    });
  }
});


router.put("/:id/complete", async (req, res) => {
  try {
    const queue = await Queue.findById(req.params.id);

    if (!queue) {
      return res.status(404).json({
        message: "Queue entry not found"
      });
    }

    if (queue.status !== "Serving") {
      return res.status(400).json({
        message: "Only a serving queue can be completed"
      });
    }

    queue.status = "Completed";
    queue.completedAt = new Date();

    await queue.save();

    res.json({
      message: "Queue completed successfully",
      queue
    });

  } catch (error) {
    res.status(500).json({
      message: "Failed to complete queue",
      error: error.message
    });
  }
});


router.put("/:id/skip", async (req, res) => {
  try {
    const queue = await Queue.findById(req.params.id);

    if (!queue) {
      return res.status(404).json({
        message: "Queue entry not found"
      });
    }

    if (
      queue.status !== "Waiting" &&
      queue.status !== "Serving"
    ) {
      return res.status(400).json({
        message: "This queue cannot be skipped"
      });
    }

    queue.status = "Skipped";
    queue.completedAt = new Date();

    await queue.save();

    res.json({
      message: "Queue skipped successfully",
      queue
    });

  } catch (error) {
    res.status(500).json({
      message: "Failed to skip queue",
      error: error.message
    });
  }
});

router.get("/admin/stats", async (req, res) => {
  try {
    const User = require("../models/User");

    const totalUsers = await User.countDocuments();

    const activeQueues = await Queue.countDocuments({
      status: { $in: ["Waiting", "Serving"] }
    });

    const currentlyServing = await Queue.countDocuments({
      status: "Serving"
    });

    const completedQueues = await Queue.countDocuments({
      status: "Completed"
    });

    res.json({
      totalUsers,
      activeQueues,
      currentlyServing,
      completedQueues
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to load admin statistics",
      error: error.message
    });
  }
});
module.exports = router;