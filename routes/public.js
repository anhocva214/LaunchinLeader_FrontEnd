var express = require("express");
var router = express.Router();
var path = require("path");
var fs = require("fs");
var crypto = require('crypto-js');
var multer = require("multer");
var mkdirp = require('mkdirp');

var MongoClient = require("mongodb").MongoClient;
var url = "mongodb://localhost:27017/";

function query_token_login_dashboard(token) {
  return new Promise((resolve, reject) => {
    MongoClient.connect(url, function (err, db) {
      if (err) throw err;
      var dbo = db.db("ll_db");
      var query = { token: token };
      dbo.collection("token_login_dashboard").find(query).toArray(function (err, result) {
        if (err) throw err;
        if (result.length > 0) {
          resolve(true);
        }
        else {
          resolve(false);
        }
        db.close();
      });
    });
  })
}

function query_token_login_member(token) {
  return new Promise((resolve, reject) => {
    MongoClient.connect(url, function (err, db) {
      if (err) throw err;
      var dbo = db.db("ll_db");
      var query = { access_token: token };
      dbo.collection("token_login_member").find(query).toArray(function (err, result) {
        if (err) throw err;
        if (result.length > 0) {
          resolve(true);
        }
        else {
          resolve(false);
        }
        db.close();
      });
    });
  })
}

router.get('/image/:nameimage', (req, res) => {
  const image = path.join(__dirname, '../public/img/' + req.params.nameimage);
  fs.open(image, "r", (err, fd) => {
    if (err) {
      res.setHeader('Cache-Control', 'max-age=31536000');
      res.sendFile(path.join(__dirname, '../public/img/404.jpg'));
    }
    else {
      res.setHeader('Cache-Control', 'max-age=31536000');
      res.sendFile(path.join(__dirname, '../public/img/' + req.params.nameimage));
    }
  });
})


router.post("/uploadvideos/:course_name/:id/:token", function (req, res) {
  console.log(req.params);

  async function asyncCall() {
    var query_token = await query_token_login_dashboard(req.params.token);
    if (query_token == true) {
      // thực thi code

      var id = req.params.id;
      var storage = multer.diskStorage({
        destination: function (req, file, cb) {
          cb(null, "public/videos");
        },
        filename: function (req, file, cb) {
          console.log(file);
          cb(null, id + path.extname(file.originalname));
        },
      });

      var upload = multer({
        storage: storage,
        fileFilter: function (req, file, callback) {
          var ext = path.extname(file.originalname);
          if (
            ext !==
            ".mp4" /*&& ext !== '.jpg' && ext !== '.gif' && ext !== '.jpeg'*/
          ) {
            return callback(
          /*res.end('Only video are allowed')*/ null,
              false
            );
          }
          callback(null, true);
        },
      }).single("file");

      upload(req, res, function (err) {
        if (err instanceof multer.MulterError) {
          return res.status(500).json(err);
        } else if (err) {
          return res.status(500).json(err);
        }
        return res.status(200).send(req.file);
      });

    }
    else {
      res.send(false)
    }
  }
  asyncCall();



});

router.post("/delete_video", (req, res) => {
  async function asyncCall() {
    var query_token = await query_token_login_dashboard(req.body.token);
    if (query_token == true) {
      fs.readdir("./public/videos/", (err, files) => {
        if (err) throw err;
        files.forEach((file_name, index) => {
          if (file_name === req.body.video_name.substr(1, req.body.video_name.length)) {
            fs.unlink(
              path.resolve("./public/videos/" + req.body.video_name),
              function (err) {
                if (err) throw err;
                console.log("File deleted!");
              }
            );
          }
        });
      });
      res.send(true)
    }
    else {
      res.send(false)
    }
  }
  asyncCall();

});

router.get('/videos/:name/:token', (req, res) => {
  console.log(req.params.token);
  async function asyncCall() {
    var query_token_dashboard = await query_token_login_dashboard(req.params.token);
    var query_token_member = await query_token_login_member(req.params.token);
    if (query_token_dashboard == true || query_token_member == true) {
      const video = path.join(__dirname, '../public/videos/' + req.params.name + '.mp4');
      fs.open(video, "r", (err, fd) => {
        if (err) {
          res.setHeader('Cache-Control', 'max-age=31536000');
          res.sendFile(path.join(__dirname, '../public/img/404.jpg'));
        }
        else {
          res.setHeader('Cache-Control', 'max-age=31536000');
          res.sendFile(path.join(__dirname, '../public/videos/' + req.params.name + '.mp4'));
        }
      });
    }
    else {
      res.send(false)
    }
  }
  asyncCall();
})


module.exports = router;
