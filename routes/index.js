// 5/9/2020
var express = require("express");
var router = express.Router();
var path = require("path");
var fs = require("fs");
var nodemailer = require("nodemailer");
var multer = require("multer");
const { v1: uuidv1 } = require("uuid");
var flatCache = require('flat-cache')
var base64Img = require('base64-img');
var axios = require('axios');
var cache = require('memory-cache');




var MongoClient = require("mongodb").MongoClient;
var url = "mongodb://localhost:27017/";




module.exports = router;
