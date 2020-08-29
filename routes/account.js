var express = require("express");
var router = express.Router();
var crypto = require('crypto-js');
// var path = require("path");
// var fs = require("fs");
var nodemailer = require("nodemailer");
// var multer = require("multer");
const { v1: uuidv1 } = require("uuid");
const expried = require('./expried');


var MongoClient = require("mongodb").MongoClient;
var url = "mongodb://localhost:27017/";

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: "tackecon1551@gmail.com",
        pass: "anho2001vnnt",
    },
});

const decode = (message) => {
    // Lấy danh sách byte đã mã hóa
    var bytes = crypto.AES.decrypt(message, '1221');
    // Chuyển sang chuỗi gốc
    var message_decode = bytes.toString(crypto.enc.Utf8);
    return message_decode
}

const encode = (text) => {
    // Mã hóa mật khẩu
    var code = crypto.AES.encrypt(text, '1221').toString();
    return code;
}


function query_token_member(access_token) {
    return new Promise((resolve, reject) => {
        MongoClient.connect(url, function (err, db) {
            if (err) throw err;
            var dbo = db.db("ll_db");
            var query = { access_token: access_token };
            dbo.collection("token_member").find(query).toArray(function (err, result) {
                if (err) throw err;
                resolve(result[0]);
                db.close();
            });
        });
    })
}

function findAll_account_member() {
    return new Promise((resolve, reject) => {
        MongoClient.connect(url, function (err, db) {
            if (err) throw err;
            var dbo = db.db("ll_db");
            dbo.collection("account_member").find({}).toArray(function (err, result) {
                if (err) throw err;
                resolve(result)
                db.close();
            });
        });
    })
}

function update_account_member(member) {
    MongoClient.connect(url, function (err, db) {
        if (err) throw err;
        var dbo = db.db("ll_db");
        var myquery = { id: member.id };
        delete member._id;
        var newvalues = { $set: member };
        dbo.collection("account_member").updateOne(myquery, newvalues, function (err, res) {
            if (err) throw err;
            console.log("1 account_member updated");
            db.close();
        });
    });
}

function query_account_email(email) {
    return new Promise((resolve, reject) => {
        MongoClient.connect(url, function (err, db) {
            if (err) throw err;
            var dbo = db.db("ll_db");
            var query = { email: email };
            dbo.collection("account_member").find(query).toArray(function (err, result) {
                if (err) throw err;
                resolve(result[0]);
                db.close();
            });
        });
    });
};


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

function query_member_from_id(id){
    return new Promise((resolve, reject) => {
        MongoClient.connect(url, function (err, db) {
            if (err) throw err;
            var dbo = db.db("ll_db");
            var query = { id: id };
            dbo.collection("account_member").find(query).toArray(function (err, result) {
                if (err) throw err;
                resolve(result[0]);
                db.close();
            });
        });
    })
}

function find_all_course() {
    return new Promise((resolve, reject) => {
        MongoClient.connect(url, function (err, db) {
            if (err) throw err;
            var dbo = db.db("ll_db");
            dbo.collection("course").find({}).toArray(function (err, result) {
                if (err) throw err;
                resolve(result);
                db.close();
            });
        });
    })
}


router.get('/', (req, res) => {
    res.send("ok");
})

router.post('/data_member', async (req, res) => {
    const access_token = req.body.access_token;
    const data_token = await query_token_admin(access_token);
    if (data_token != undefined) {
        const check = expried.handle_expried(data_token.time, data_token.expried);
        if (check == true) {
            var data_member = await findAll_account_member();
            var data = [];
            data_member.forEach((value) => {
                var item = {
                    id: value.id,
                    fullname: value.fullname,
                    email: value.email,
                    course_registered: value.course_registered,
                    time: value.time
                }
                data.push(item);
            })

            res.send({ error: false, data: data });
        }
        else {
            res.send({ error: true, data: [] });
        }
    }
})

// Forget password ----->>> set new password
router.post("/reset_password_member", async (req, res) => {
    const uuid = uuidv1();
    const password = uuid.split("-")[0];
    const email = req.body.email;
    const update_item = {
        password: encode(password)
    }

    const result = await query_account_email(email);

    if (result) {
        update_account_member(result.id, update_item);

        var mailOptions = {
            from: "Launching Leader",
            to: req.body.email,
            subject: "Launching Leader gửi mật khẩu mới",
            text: "Mật khẩu: " + password,
        };

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
                res.send({ error: true, msg: "Gửi mật khẩu thất bại" });
            } else {
                console.log("Email sent: " + info.response);
                res.send({ error: false, msg: "Mật khẩu mới đã gửi đến email của bạn" });
            };
        });
    }
    else {
        res.send({ error: true, msg: "Email của bạn không tồn tại" });
    }

})


router.post('/course/', async (req, res)=>{
    const data_token = await query_token_member(req.body.access_token);
    if (data_token != undefined && data_token != null) {
        const check = expried.handle_expried(data_token.time, data_token.expried);
        if (check == true) {
            var result_member = await query_member_from_id(data_token.id);
            var data_course = await find_all_course();
            var course = [];
            data_course.forEach((value)=>{
                var check = result_member.course_registered.filter(item => item == value.id);
                if (check.length != 0){
                    course.push({name: value.name, link_register: value.link_register, video_list: value.video_list, registered: true});
                }
                else{
                    var video_list = [...value.video_list];
                    for (var i=0; i<video_list.length; i++){
                        video_list[i].link_youtube = "";
                    }
                    course.push({name: value.name, link_register: value.link_register, video_list: video_list, registered: false});
                }
            })
            delete result_member._id;
            result_member.password = decode(result_member.password);
            res.send({error: false, member: result_member, course: course});
        }
        else {
            res.send({ error: true, msg: 'Mời bạn đăng nhập lại' });
        }
    }
    else{
        res.send({ error: true, msg: 'Mời bạn đăng nhập lại' });
    }
})


router.post('/update', async (req, res) => {
    const access_token = req.body.access_token;
    const data_token = await query_token_admin(access_token);
    if (data_token != undefined) {
        const check = expried.handle_expried(data_token.time, data_token.expried);
        if (check == true) {
            update_account_member(req.body.member);
            res.send({ error: false, msg: 'Cập nhât thành công' });
        }
        else {
            res.send({ error: true, msg: 'Mời bạn đăng nhập lại' });
        }
    }
    else{
        res.send({ error: true, msg: 'Mời bạn đăng nhập lại' });
    }


})

router.post('/update_info', async (req, res) => {
    const access_token = req.body.access_token;
    const data_token = await query_token_member(access_token);
    if (data_token != undefined) {
        const check = expried.handle_expried(data_token.time, data_token.expried);
        if (check == true) {
            if (req.body.member.password){
                req.body.member.password = encode(req.body.member.password);
            }
            update_account_member(req.body.member);
            res.send({ error: false, msg: 'Cập nhât thành công' });
        }
        else {
            res.send({ error: true, msg: 'Mời bạn đăng nhập lại' });
        }
    }
    else{
        res.send({ error: true, msg: 'Mời bạn đăng nhập lại' });
    }


})

router.post('/remove', async (req, res) => {
    const access_token = req.body.access_token;;
    console.log(access_token);
    const data_token = await query_token_admin(access_token);
    if (data_token != undefined) {
        const check = expried.handle_expried(data_token.time, data_token.expried);
        if (check == true) {
            MongoClient.connect(url, function(err, db) {
                if (err) throw err;
                var dbo = db.db("ll_db");
                var myquery = { id: req.body.id };
                dbo.collection("account_member").deleteOne(myquery, function(err, obj) {
                  if (err) {
                      console.log(err);
                      res.send({ error: true, msg: 'Xóa tài khoản thất bại'});
                  }
                  res.send({error: false, msg: "Xóa tài khoản thành công"})
                  console.log("1 document deleted");
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
