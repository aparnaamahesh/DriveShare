const express = require("express");
const path = require("path");
const net = require("node:net");
const connectDB = require("./db");

const app = express();
const DEFAULT_PORT = Number(process.env.PORT) || 5000;

function getNextAvailablePort(startPort = DEFAULT_PORT, maxAttempts = 20) {
  return new Promise((resolve, reject) => {
    const tryPort = (port, attemptsLeft) => {
      const tester = net.createServer();

      tester.once("error", err => {
        if (err.code === "EADDRINUSE" && attemptsLeft > 0) {
          return tryPort(port + 1, attemptsLeft - 1);
        }

        reject(err);
      });

      tester.once("listening", () => {
        tester.close(() => resolve(port));
      });

      tester.listen(port);
    };

    tryPort(startPort, maxAttempts);
  });
}

app.use(express.json());

/* =========================================================
   LOGIN
   ========================================================= */

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const db = await connectDB();

    const user = await db.collection("users").findOne({
      email,
      password
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid login"
      });
    }

    res.json({
      id: user._id,
      name: user.name,
      email: user.email
    });
  } catch (err) {
    console.error("Login error:", err);

    res.status(500).json({
      message: "Server error"
    });
  }
});

/* =========================================================
   SIGNUP
   ========================================================= */

app.post("/api/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const db = await connectDB();

    const existingUser = await db.collection("users").findOne({
      email
    });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists"
      });
    }

    await db.collection("users").insertOne({
      name,
      email,
      password
    });

    res.json({
      message: "Signup successful"
    });
  } catch (err) {
    console.error("Signup error:", err);

    res.status(500).json({
      message: "Server error"
    });
  }
});

/* =========================================================
   GET ALL RIDES
   ========================================================= */

app.get("/api/rides", async (req, res) => {
  try {
    const db = await connectDB();

    const rides = await db
      .collection("rides")
      .find()
      .toArray();

    res.json(rides);
  } catch (err) {
    console.error("Get rides error:", err);

    res.status(500).json({
      message: "Server error"
    });
  }
});

/* =========================================================
   GET ONE RIDE
   ========================================================= */

app.get("/api/rides/:id", async (req, res) => {
  try {
    const { ObjectId } = require("mongodb");

    const db = await connectDB();

    const ride = await db.collection("rides").findOne({
      _id: new ObjectId(req.params.id)
    });

    if (!ride) {
      return res.status(404).json({
        message: "Ride not found"
      });
    }

    res.json(ride);
  } catch (err) {
    console.error("Get ride error:", err);

    res.status(500).json({
      message: "Server error"
    });
  }
});

/* =========================================================
   CREATE RIDE
   ========================================================= */

app.post("/api/rides", async (req, res) => {
  try {
    const {
      from,
      to,
      date,
      time,
      seats,
      owner
    } = req.body;

    const db = await connectDB();

    const ride = {
      from,
      to,
      date,
      time,
      seats: Number(seats),
      owner,
      requests: []
    };

    const result = await db
      .collection("rides")
      .insertOne(ride);

    res.json({
      message: "Ride created",
      ride: {
        ...ride,
        _id: result.insertedId
      }
    });
  } catch (err) {
    console.error("Create ride error:", err);

    res.status(500).json({
      message: "Server error"
    });
  }
});

/* =========================================================
   EDIT RIDE
   ========================================================= */

app.put("/api/rides/:id", async (req, res) => {
  try {
    const { ObjectId } = require("mongodb");

    const {
      from,
      to,
      date,
      time,
      seats
    } = req.body;

    const db = await connectDB();

    const result = await db.collection("rides").updateOne(
      {
        _id: new ObjectId(req.params.id)
      },
      {
        $set: {
          from,
          to,
          date,
          time,
          seats: Number(seats)
        }
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        message: "Ride not found"
      });
    }

    res.json({
      message: "Ride updated successfully"
    });
  } catch (err) {
    console.error("Edit ride error:", err);

    res.status(500).json({
      message: "Server error"
    });
  }
});

/* =========================================================
   DELETE RIDE
   ========================================================= */

app.delete("/api/rides/:id", async (req, res) => {
  try {
    const { ObjectId } = require("mongodb");

    const rideId = new ObjectId(req.params.id);

    const db = await connectDB();

    const result = await db.collection("rides").deleteOne({
      _id: rideId
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        message: "Ride not found"
      });
    }

    // Delete all requests belonging to this ride
    await db.collection("joinRequests").deleteMany({
      rideId: rideId
    });

    res.json({
      message: "Ride deleted successfully"
    });
  } catch (err) {
    console.error("Delete ride error:", err);

    res.status(500).json({
      message: "Server error"
    });
  }
});

/* =========================================================
   REQUEST TO JOIN
   ========================================================= */

app.post("/api/rides/:id/request", async (req, res) => {
  try {
    const { ObjectId } = require("mongodb");
    const { user } = req.body;

    const db = await connectDB();

    const rideId = new ObjectId(req.params.id);

    const ride = await db.collection("rides").findOne({
      _id: rideId
    });

    if (!ride) {
      return res.status(404).json({
        message: "Ride not found"
      });
    }

    if (ride.seats <= 0) {
      return res.status(400).json({
        message: "No seats available"
      });
    }

    // Prevent duplicate pending/accepted requests
    const existingRequest = await db
      .collection("joinRequests")
      .findOne({
        rideId,
        user,
        status: {
          $in: ["PENDING", "ACCEPTED"]
        }
      });

    if (existingRequest) {
      return res.status(400).json({
        message: "You have already requested this ride"
      });
    }

    await db.collection("joinRequests").insertOne({
      rideId,
      user,
      status: "PENDING"
    });

    res.json({
      message: "Request sent"
    });
  } catch (err) {
    console.error("Request ride error:", err);

    res.status(500).json({
      message: "Server error"
    });
  }
});

/* =========================================================
   GET REQUESTS FOR A RIDE
   ========================================================= */

app.get("/api/rides/:id/requests", async (req, res) => {
  try {
    const { ObjectId } = require("mongodb");

    const db = await connectDB();

    const requests = await db
      .collection("joinRequests")
      .find({
        rideId: new ObjectId(req.params.id)
      })
      .toArray();

    res.json(requests);
  } catch (err) {
    console.error("Get ride requests error:", err);

    res.status(500).json({
      message: "Server error"
    });
  }
});

/* =========================================================
   GET REQUEST STATUS FOR A USER
   ========================================================= */

app.get("/api/requests/:user", async (req, res) => {
  try {
    const db = await connectDB();

    const requests = await db
      .collection("joinRequests")
      .find({
        user: req.params.user
      })
      .toArray();

    // Attach ride information to each request
    const result = [];

    for (const request of requests) {
      const ride = await db.collection("rides").findOne({
        _id: request.rideId
      });

      result.push({
        ...request,
        ride: ride
          ? {
              from: ride.from,
              to: ride.to,
              date: ride.date,
              time: ride.time,
              owner: ride.owner
            }
          : null
      });
    }

    res.json(result);
  } catch (err) {
    console.error("Get request status error:", err);

    res.status(500).json({
      message: "Server error"
    });
  }
});

/* =========================================================
   ACCEPT REQUEST
   ========================================================= */

app.put("/api/rides/:id/accept", async (req, res) => {
  try {
    const { ObjectId } = require("mongodb");
    const { user } = req.body;

    const db = await connectDB();

    const rideId = new ObjectId(req.params.id);

    const ride = await db.collection("rides").findOne({
      _id: rideId
    });

    if (!ride) {
      return res.status(404).json({
        message: "Ride not found"
      });
    }

    const request = await db.collection("joinRequests").findOne({
      rideId,
      user,
      status: "PENDING"
    });

    if (!request) {
      return res.status(404).json({
        message: "Request not found"
      });
    }

    if (ride.seats <= 0) {
      return res.status(400).json({
        message: "No seats available"
      });
    }

    await db.collection("joinRequests").updateOne(
      {
        _id: request._id
      },
      {
        $set: {
          status: "ACCEPTED"
        }
      }
    );

    await db.collection("rides").updateOne(
      {
        _id: rideId
      },
      {
        $inc: {
          seats: -1
        }
      }
    );

    res.json({
      message: "Request accepted"
    });
  } catch (err) {
    console.error("Accept request error:", err);

    res.status(500).json({
      message: "Server error"
    });
  }
});

/* =========================================================
   REJECT REQUEST
   ========================================================= */

app.put("/api/rides/:id/reject", async (req, res) => {
  try {
    const { ObjectId } = require("mongodb");
    const { user } = req.body;

    const db = await connectDB();

    const rideId = new ObjectId(req.params.id);

    const ride = await db.collection("rides").findOne({
      _id: rideId
    });

    if (!ride) {
      return res.status(404).json({
        message: "Ride not found"
      });
    }

    const request = await db.collection("joinRequests").findOne({
      rideId,
      user,
      status: "PENDING"
    });

    if (!request) {
      return res.status(404).json({
        message: "Request not found"
      });
    }

    await db.collection("joinRequests").updateOne(
      {
        _id: request._id
      },
      {
        $set: {
          status: "REJECTED"
        }
      }
    );

    res.json({
      message: "Request rejected"
    });
  } catch (err) {
    console.error("Reject request error:", err);

    res.status(500).json({
      message: "Server error"
    });
  }
});

/* =========================================================
   SERVE REACT
   ========================================================= */

app.use(
  express.static(
    path.join(__dirname, "client/dist")
  )
);

app.get("*", (req, res) => {
  res.sendFile(
    path.join(
      __dirname,
      "client/dist/index.html"
    )
  );
});

/* =========================================================
   START SERVER
   ========================================================= */

async function startServer(port = DEFAULT_PORT) {
  await connectDB();

  const availablePort =
    await getNextAvailablePort(port);

  app.listen(availablePort, () => {
    console.log(
      `DriveShare running at http://localhost:${availablePort}`
    );
  });
}

if (require.main === module) {
  startServer().catch(err => {
    console.error(
      "Failed to start server:",
      err
    );

    process.exit(1);
  });
}

module.exports = {
  app,
  getNextAvailablePort,
  startServer
};
