// 5/9/2020
var express = require("express");
var router = express.Router();
var path = require("path");
var fs = require("fs");
var nodemailer = require("nodemailer");
var multer = require("multer");
const { v1: uuidv1 } = require("uuid");
var axios = require('axios');
const expried = require('./expried');




var MongoClient = require("mongodb").MongoClient;
var url = "mongodb://localhost:27017/";

function query_token_admin(access_token) {
    return new Promise((resolve, reject) => {
        MongoClient.connect(url, function (err, db) {
            if (err) throw err;
            var dbo = db.db("ll_db");
            var query = { access_token: access_token };
            dbo.collection("token_admin").find(query).toArray(function (err, result) {
                if (err) throw err;
                resolve(result[0]);
                db.close();
            });
        });
    })
}


router.get("/linksmanage", async (req, res) => {

    const getListLinks = new Promise((resolve, reject) => {
        MongoClient.connect(url, function (err, db) {
            if (err) throw err;
            var dbo = db.db("ll_db");
            dbo.collection("links_manage").find({}).toArray(function (err, result) {
                if (err) throw err;
                resolve(result);
                db.close();
            });
        });
    })

    let data = await getListLinks;
    if (data.length == 0){
        const links = {id: 1, freebook: "", audiobook: "", specialoffer: "", supportPage: "", termsPage: "", webmember: ""};
        MongoClient.connect(url, function (err, db) {
            if (err) throw err;
            var dbo = db.db("ll_db");
            dbo.collection("links_manage").insertOne(links, function (err, resp) {
                if (err) throw err;
                console.log("1 document inserted");
                delete links.id;
                delete links._id;
                res.send(links);
                db.close();
            });
        });
    }
    else{
        const links = data[0];
        delete links.id;
        delete links._id;
        res.send(links);
    }
})


router.post('/linksmanage', async (req, res) => {
    const access_token = req.body.access_token;;
    // console.log(access_token);
    const data_token = await query_token_admin(access_token);
    if (data_token != undefined) {
        const check = expried.handle_expried(data_token.time, data_token.expried);
        if (check == true) {
            MongoClient.connect(url, function (err, db) {
                if (err) throw err;
                var dbo = db.db("ll_db");
                var myquery = { id: 1 };
                var newvalues = { $set: req.body.links };
                dbo.collection("links_manage").updateOne(myquery, newvalues, function (err, resp) {
                    if (err) throw err;
                    console.log("1 document updated");
                    res.send({ error: false, msg: 'Cập nhật thành công' });
                    db.close();
                });
            });
        }
        else {
            res.send({ error: true, msg: 'Mời bạn đăng nhập lại' });
        }
    }
    else{
        res.send({ error: true, msg: 'Mời bạn đăng nhập lại' });
    }
})



module.exports = router;
