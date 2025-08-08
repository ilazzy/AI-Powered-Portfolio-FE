var express = require("express");
var path = require("path");
var app = express();

// app.use(express.static("public")); // Serve static files from 'public' folder

app.get("/", function (req, res) {
  const ip1 = req.headers["x-forwarded-for"];
  const ip2 = req.socket.remoteAddress;
  // const { message, sender } = req.body;
  res.status(200).json({ip1,ip2});
});

app.listen(3000, function () {
  console.log("Listening on port 3000...");
});
