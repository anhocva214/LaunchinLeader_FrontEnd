const express = require("express");
const router = express.Router();
const crypto = require('crypto-js');
const { v1: uuidv1 } = require("uuid");
const expried = require("./expried");
var nodemailer = require("nodemailer");
// var multer = require("multer");

const MongoClient = require("mongodb").MongoClient;
const url = "mongodb://localhost:27017/";
const DB = 'll_db';

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: "tackecon1551@gmail.com",
        pass: "anho2001vnnt",
    },
});

const decode = (message)=>{
    // Lấy danh sách byte đã mã hóa
    var bytes = crypto.AES.decrypt(message, '1221');
    // Chuyển sang chuỗi gốc
    var message_decode = bytes.toString(crypto.enc.Utf8);
    return message_decode
}

router.get('/connect', (reeq, res)=>{
    res.send("Connected success");
})

// Xác minh email
router.post('/email_verification', (req, res) => {

    function query_account_email() {
        return new Promise((resolve, reject) => {
            MongoClient.connect(url, function (err, db) {
                if (err) throw err;
                var dbo = db.db("ll_db");
                var query = { email: req.body.email };
                dbo.collection("account_member").find(query).toArray(function (err, result) {
                    if (err) throw err;
                    // console.log(result);
                    if (result.length > 0) {
                        resolve(true);
                    }
                    else {
                        resolve(false);
                    }
                    db.close();
                });
            });
        });
    };

    function query_code_verification_email() {
        return new Promise((resolve, reject) => {
            MongoClient.connect(url, function (err, db) {
                if (err) throw err;
                var dbo = db.db("ll_db");
                var query = { email: req.body.email };
                dbo.collection("verification_email").find(query).toArray(function (err, result) {
                    if (err) throw err;
                    // console.log(result);
                    if (result.length > 0) {
                        resolve(true);
                    }
                    else {
                        resolve(false);
                    }
                    db.close();
                });
            });
        });
    }

    function insert_code_verification_email() {
        return new Promise((resolve, reject) => {
            var code = uuidv1();
            code = code.split("-")[0];
            MongoClient.connect(url, function (err, db) {
                if (err) throw err;
                var dbo = db.db("ll_db");
                var myobj = { email: req.body.email, code: code };
                dbo.collection("verification_email").insertOne(myobj, function (err, res) {
                    if (err) throw err;
                    console.log("1 verification email code inserted");
                    resolve(code)
                    db.close();
                });
            });
        })

    }

    function update_code_verification_email() {
        return new Promise((resolve, reject) => {
            var code = uuidv1();
            code = code.split("-")[0];
            MongoClient.connect(url, function (err, db) {
                if (err) throw err;
                var dbo = db.db("ll_db");
                var myquery = { email: req.body.email };
                var newvalues = { $set: { code: code } };
                dbo.collection("verification_email").updateOne(myquery, newvalues, function (err, res) {
                    if (err) throw err;
                    console.log("1 verification email code updated");
                    resolve(code)
                    db.close();
                });
            });
        })
    }

    async function asyncCall() {
        var result_query_email = await query_account_email();
        if (result_query_email == true) {
            res.send({ error: true, msg: "Email đã tồn tại" })
        }
        else {
            var code = "";
            const query_code = await query_code_verification_email();
            if (query_code == true) {
                code = await update_code_verification_email();
            }
            else {
                code = await insert_code_verification_email();
            }

            var mailOptions = {
                from: "Launching Leader",
                to: req.body.email,
                subject: "Gửi mã xác nhận đăng ký tài khoản website thành viên Launching Leader",
                text: "Mã xác nhận:" + code,
            };

            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    console.log(error);
                    res.status(500).send({ error: true, msg: "Lỗi đăng ký" });
                } else {
                    console.log("Email sent: " + info.response);
                    res.send({ error: false, msg: "Mã xác nhận đã gửi đến email của bạn" });
                };
            });
        }
    };

    if (req.body.email != null || req.body.email != undefined) {
        asyncCall();
    }
    else {
        res.send({ error: true, msg: "Bạn chưa điền email" })
    }

})

// Register webmembwr
router.post("/member", (req, res) => {
    const id = uuidv1();
    var account = req.body;
    account.course_registered = [];
    account.id = id;
    account.time = expried.create_time();
    var code = req.body.code;
    delete account.code;


    // Mã hóa mật khẩu
    account.password = crypto.AES.encrypt(account.password, '1221').toString();

    // // Lấy danh sách byte đã mã hóa
    // var bytes = crypto.AES.decrypt(message, '1221');
    // // Chuyển sang chuỗi gốc
    // var message_decode = bytes.toString(crypto.enc.Utf8);
    // console.log(message_decode);

    function query_code_verification_email() {
        return new Promise((resolve, reject) => {
            MongoClient.connect(url, function (err, db) {
                if (err) throw err;
                var dbo = db.db("ll_db");
                var query = { code: code };
                dbo.collection("verification_email").find(query).toArray(function (err, result) {
                    if (err) throw err;
                    // console.log(result);
                    if (result.length > 0) {
                        resolve(true);
                    }
                    else {
                        resolve(false);
                    }
                    db.close();
                });
            });
        });
    }

    function delete_code_verification_email() {
        MongoClient.connect(url, function (err, db) {
            if (err) throw err;
            var dbo = db.db("ll_db");
            var myquery = { code: code };
            dbo.collection("verification_email").deleteOne(myquery, function (err, obj) {
                if (err) throw err;
                console.log("1 verification email code deleted");
                db.close();
            });
        });
    }

    function insert_account() {
        MongoClient.connect(url, function (err, db) {
            if (err) throw err;
            var dbo = db.db("ll_db");
            var myobj = account;
            dbo.collection("account_member").insertOne(myobj, function (err, res) {
                if (err) throw err;
                console.log("1 account member inserted");
                db.close();
            });
        });
    }

    if (account.fullname !== undefined && account.email !== undefined && account.password !== undefined) {
        async function asyncCall() {
            var result = await query_code_verification_email();
            if (result == true) {
                insert_account();
                delete_code_verification_email();
                res.send({ error: false, msg: "Đăng ký thành công" });
            }
            else{
                res.send({ error: true, msg: "Mã xác nhận không đúng" });
            }
        }
        asyncCall();
    }
    else { res.send({ error: true, msg: "Bạn cần điền đầy đủ thông tin" }) }

});



module.exports = router;
