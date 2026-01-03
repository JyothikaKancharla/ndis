
const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/staff", require("./routes/staff.routes"));
app.use("/api/supervisor", require("./routes/supervisor.routes"));

module.exports = app;
