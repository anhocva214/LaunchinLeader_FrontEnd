const express = require("express");
const router = express.Router();
const crypto = require('crypto-js');
const { v1: uuidv1 } = require("uuid");
const expried = require("./expried");
const { Logger } = require("mongodb");

const MongoClient = require("mongodb").MongoClient;
const url = "mongodb://localhost:27017/";
const DB = 'll_db';

router.get('/connect', (reeq, res)=>{
    res.send("Connected success");
})

const decode = (message)=>{
    // Lấy danh sách byte đã mã hóa
    var bytes = crypto.AES.decrypt(message, '1221');
    // Chuyển sang chuỗi gốc
    var message_decode = bytes.toString(crypto.enc.Utf8);
    return message_decode
}


// Đăng nhập admin
router.post('/admin', async (req, res)=>{
    const data_client = req.body;

    const create_token_admin =  (token)=>{
        return new Promise((resolve, reject)=>{
            MongoClient.connect(url, function(err, db) {
                if (err) throw err;
                var dbo = db.db(DB);
                var myobj = token;
                dbo.collection("token_admin").insertOne(myobj, function(err, res) {
                  if (err) throw err;
                  console.log("1 token admin inserted");
                  resolve(true);
                  db.close();
                });
            });
        })
    }

    const get_all_token_admin = ()=>{
        return new Promise((resolve)=>{
            MongoClient.connect(url, function(err, db) {
                if (err) throw err;
                var dbo = db.db(DB);
                dbo.collection("token_admin").find({}).toArray(function(err, result) {
                    if (err) throw err;
                    // console.log(result);
                    resolve(result)
                    db.close();
                });
            });
        })
    }

    const update_token_admin = (token)=>{
        return new Promise((resolve)=>{
            MongoClient.connect(url, function(err, db) {
                if (err) throw err;
                var dbo = db.db(DB);
                var myquery = { id: 1 };
                var newvalues = { $set: token };
                dbo.collection("token_admin").updateOne(myquery, newvalues, function(err, res) {
                  if (err) throw err;
                  console.log("1 token admin updated");
                  db.close();
                });
            });
        })
    }

    if (data_client.username == 'launchingleader' && data_client.password == 'launchingleader'){
        
        const token = {
            time: expried.create_time(),
            expried: 30*60,
            access_token: uuidv1(),
            id: 1
        }
        // console.log(token);
        var data_token_admin = await get_all_token_admin();
        // console.log(data_token_admin);
        if (data_token_admin.length == 0){
            create_token_admin(token);
        }
        else{
            update_token_admin(token);
        }
        // console.log(token);
        const data_response = {
            status: true,
            msg: 'Đăng nhập thành công',
            access_token: token.access_token,
            expried: token.expried
        }
        res.status(200).send(data_response);
    }
    else{
        const data_response = {
            status: false,
            msg: 'Đăng nhập thất bại'
        }
        res.status(200).send(data_response);
    }
})

// Xác thực admin
router.post('/accuracy_admin', async (req, res)=>{
    const data_client = req.body;
    // console.log(data_client);
    const query_info_token = (access_token)=>{
        return new Promise((resolve, reject)=>{
            MongoClient.connect(url, function(err, db) {
                if (err) throw err;
                var dbo = db.db(DB);
                var query = { access_token: access_token };
                dbo.collection("token_admin").find(query).toArray(function(err, result) {
                  if (err) throw err;
                  resolve(result);
                  db.close();
                });
            });
        })
    }

    const info_token = await query_info_token(data_client.access_token);
    // console.log(info_token);
    if (info_token.length > 0){
        if (expried.handle_expried(info_token[0].time, info_token[0].expried)==true){
            res.status(200).send({
                status: true,
                msg: "Xác thực thành công"
            });
        }
        else{
            res.status(200).send(false);
        }
    }
    else{
        res.status(200).send(false);
    }
    
})

// Đăng xuát admin
router.post('/logout_admin', (req, res)=>{
    const access_token = req.body.access_token;
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db(DB);
        var myquery = { access_token: access_token };
        dbo.collection("token_admin").deleteOne(myquery, function(err, obj) {
          if (err){
              console.log(err);
              res.send(200).send({status: false, msg: "Đăng xuất thất bại"});
          };
          console.log("1 token admin deleted");
          res.status(200).send({status: true, msg: "Đăng xuất thành công"});
          db.close();
        });
    });
})

const query_account_member = (email)=>{
    return new Promise((resolve, rejetc)=>{
        MongoClient.connect(url, function(err, db) {
            if (err) throw err;
            var dbo = db.db(DB);
            var query = { email: email };
            dbo.collection("account_member").find(query).toArray(function(err, result) {
              if (err) throw err;
              resolve(result[0]);
              db.close();
            });
        });
    })
}

const get_data_token_member = (id)=>{
    return new Promise((resolve, reject)=>{
        MongoClient.connect(url, function(err, db) {
            if (err) throw err;
            var dbo = db.db(DB);
            var query = { id: id };
            dbo.collection("token_member").find(query).toArray(function(err, result) {
              if (err) throw err;
              resolve(result);
              db.close();
            });
        });
    })
}

const insert_token_member = (token)=>{
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db(DB);
        var myobj = token;
        dbo.collection("token_member").insertOne(myobj, function(err, res) {
          if (err) throw err;
          console.log("1 token member inserted");
          db.close();
        });
    });
}

const update_token_member = (token)=>{
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db(DB);
        var myquery = { id: token.id };
        var newvalues = { $set: token };
        dbo.collection("token_member").updateOne(myquery, newvalues, function(err, res) {
          if (err) throw err;
          console.log("1 document updated");
          db.close();
        });
    }); 
}

// Đăng nhập webmember
router.post('/member', async (req, res)=>{
    const email = req.body.email;
    const password = req.body.password;
    const result = await query_account_member(email);

    if (result){
        if (decode(result.password) == password){
            const token = {
                time: expried.create_time(),
                expried: 60*30,
                access_token: uuidv1(),
                id: result.id
            }
            const check_id = await get_data_token_member(result.id);
            if (check_id.length == 0){
                // insert
                insert_token_member(token);
            }
            else{
                // update
                update_token_member(token);
            }
            res.send({error: false, msg: "Đăng nhập thành công", token: {access_token: token.access_token, max_age: token.expried}});
        }
        else{
            res.send({error: true, msg: "Mật khẩu không đúng"})
        }
    }
    else{
        res.send({error: true, msg: 'Email không tồn tại'});
    }
})

router.post('/authentication_member', async (req, res)=>{
    const data_client = req.body;
    // console.log(data_client);
    const data_token_member = (access_token)=>{
        return new Promise((resolve, reject)=>{
            MongoClient.connect(url, function(err, db) {
                if (err) throw err;
                var dbo = db.db(DB);
                var query = { access_token: access_token };
                dbo.collection("token_member").find(query).toArray(function(err, result) {
                  if (err) throw err;
                  resolve(result);
                  db.close();
                });
            });
        })
    }

    const info_token = await data_token_member(data_client.access_token);
    console.log(info_token);
    if (info_token.length > 0){
        if (expried.handle_expried(info_token[0].time, info_token[0].expried)==true){
            res.status(200).send({
                error: false,
                msg: "Xác thực thành công"
            });
        }
        else{
            res.status(200).send({error: true});
        }
    }
    else{
        res.status(200).send({error: true});
    }
})

module.exports = router;
