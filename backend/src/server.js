require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");
const app = require("./app");
const connectDB = require("./config/db");
const assignmentController = require("./controllers/assignment.controller");

// DB
connectDB();

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: process.env.FRONTEND_ORIGIN || "*" }
});

app.set("io", io);

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);
  socket.on("joinStaff", (staffId) => {
    socket.join(`staff_${staffId}`);
  });
  socket.on("leaveStaff", (staffId) => {
    socket.leave(`staff_${staffId}`);
  });
});

// Periodically update assignment statuses and broadcast changes
setInterval(async () => {
  const result = await assignmentController.updateStatuses();
  if (result) {
    // after updating DB statuses, fetch active assignments and emit to relevant staff
    try {
      const Assignment = require("./models/Assignment");
      const active = await Assignment.find({ status: "Current", isActive: true });
      const ioInstance = app.get("io");
      active.forEach((a) => {
        ioInstance && ioInstance.to(`staff_${a.staffId}`).emit("assignmentStatus", a);
      });
    } catch (e) {
      console.error("Error broadcasting statuses", e);
    }
  }
}, 60 * 1000); // every minute

server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
