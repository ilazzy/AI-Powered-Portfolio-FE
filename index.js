var express = require("express");
var path = require("path");
var app = express();

app.use(express.static("public")); // Serve static files from 'public' folder

app.get("/", function (req, res) {
  res.send(`
    <html>
      <body style="text-align: center; font-family: sans-serif;">
        <img src="/cat-laughing-4.jpg" alt="Image" style="max-width: 46%; height: auto;" />
        <h1>Lavda Iqbal</h1>
      </body>
    </html>
  `);
});

app.listen(3000, function () {
  console.log("Listening on port 3000...");
});
