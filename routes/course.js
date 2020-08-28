var express = require("express");
var router = express.Router();
var path = require("path");
var fs = require("fs");
var expried = require("./expried");
const { v1: uuidv1 } = require("uuid");


var MongoClient = require("mongodb").MongoClient;
var url = "mongodb://localhost:27017/";
var DB = 'll_db';

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

function insert_course(item) {
    MongoClient.connect(url, function (err, db) {
        if (err) throw err;
        var dbo = db.db("ll_db");
        var myobj = item;
        dbo.collection("course").insertOne(myobj, function (err, resp) {
            if (err) throw err;
            console.log("1 course inserted");
            db.close();
        });
    });
}

function update_course(course) {
    MongoClient.connect(url, function (err, db) {
        if (err) throw err;
        var dbo = db.db("ll_db");
        delete course._id;
        var myquery = { id: course.id };
        var newvalues = { $set: course };
        dbo.collection("course").updateOne(myquery, newvalues, function (err, res) {
            if (err) throw err;
            console.log("1 course  updated");
            db.close();
        });
    });
}

function delete_course(id) {
    MongoClient.connect(url, function (err, db) {
        if (err) throw err;
        var dbo = db.db(DB);
        var myquery = { id: id };
        dbo.collection("course").deleteOne(myquery, function (err, obj) {
            if (err) throw err;
            console.log("1 course deleted");
            db.close();
        });
    });
}

function query_course(id) {
    return new Promise((resolve, reject) => {
        MongoClient.connect(url, function (err, db) {
            if (err) throw err;
            var dbo = db.db("ll_db");
            var query = { id: id };
            dbo.collection("course").find(query).toArray(function (err, result) {
                if (err) throw err;
                resolve(result[0]);
                db.close();
            });
        });
    })
}

const STT = ()=>{
    var d = new Date();
    var time = {
        fullYear: d.getFullYear()*999999,
        month: (d.getMonth()+1)*99999,
        date: d.getDate()*9999,
        h: d.getHours()*999,
        m: d.getMinutes()*99,
        s: d.getSeconds()
    }
    var time_value = time.fullYear + time.month + time.date + time.h + time.m + time.s;
    // console.log('time value: ', time_value);
    return time_value;
}

router.post('/insert', async (req, res) => {
    const data_token = await query_token_admin(req.body.access_token);
    if (data_token != undefined && data_token != null) {
        const check = expried.handle_expried(data_token.time, data_token.expried);
        if (check == true) {
            const data = req.body;
            const course = {
                id: uuidv1(),
                name: data.name,
                link_register: data.link_register,
                video_list: [],
                stt: STT()
            }
            insert_course(course);
            res.send({ error: false, msg: "Thêm khóa học thành công" });
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
    const data_token = await query_token_admin(req.body.access_token);
    if (data_token != undefined && data_token != null) {
        const check = expried.handle_expried(data_token.time, data_token.expried);
        if (check == true) {
            const data = req.body.course;
            delete data._id;
            update_course(data);
            res.send({ error: false, msg: "Cập nhật khóa học thành công" });
        }
        else {
            res.send({ error: true, msg: 'Mời bạn đăng nhập lại' });
        }
    }
    else{
        res.send({ error: true, msg: 'Mời bạn đăng nhập lại' });
    }

})

router.post('/delete', async (req, res) => {
    console.log(req.body);
    const data_token = await query_token_admin(req.body.access_token);
    // console.log(data_token);
    if (data_token != undefined && data_token!= null) {
        const check = expried.handle_expried(data_token.time, data_token.expried);
        if (check == true) {
            console.log("id: ", req.body.id);
            var id = req.body.id;
            delete_course(id);
            res.send({ error: false, msg: 'Bạn đã xóa thành công' });

        }
        else {
            res.send({ error: true, msg: 'Mời bạn đăng nhập lại' });
        }
    }
    else{
        res.send({ error: true, msg: 'Mời bạn đăng nhập lại' });
    }
})

router.post('/data', async (req, res) => {
    const data_token = await query_token_admin(req.body.access_token);
    if (data_token != undefined && data_token != null) {
        const check = expried.handle_expried(data_token.time, data_token.expried);
        if (check == true) {
           var data = await find_all_course();
           res.send({error: false, courses: data});
        }
        else {
            res.send({ error: true, msg: 'Mời bạn đăng nhập lại' });
        }
    }
    else{
        res.send({ error: true, msg: 'Mời bạn đăng nhập lại' });
    }

})

router.post('/change_index', async (req, res)=>{
    const data_token = await query_token_admin(req.body.access_token);
    if (data_token != undefined && data_token != null) {
        const check = expried.handle_expried(data_token.time, data_token.expried);
        if (check == true) {
            var course = req.body.course;
            var stt = course.stt;
            delete course._id;
            delete course.stt;
            console.log('stt: ', stt, ' - course: ', course);
            MongoClient.connect(url, function (err, db) {
                if (err) throw err;
                var dbo = db.db("ll_db");
                var myquery = { stt: stt };
                var newvalues = { $set: course };
                dbo.collection("course").updateOne(myquery, newvalues, function (err, res) {
                    if (err) throw err;
                    console.log("1 course  updated");
                    db.close();
                });
            });
            res.send({error: false, msg: "Đổi thành công"});
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
