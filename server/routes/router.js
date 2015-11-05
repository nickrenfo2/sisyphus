var express = require('express');
var path = require('path');
var router = express.Router();
var User = require('../models/User');
var Sisbot = require('../models/Sisbot');


router.get('/', function (req,res) {
    if(!req.isAuthenticated())
    res.sendFile(path.join(__dirname,"../public/views/login.html"));
    else
    res.sendFile(path.join(__dirname,"../public/views/index.html"));
});

router.get('/login', function (req,res) {
    res.sendFile(path.join(__dirname,"../public/views/login.html"));
});

router.post('/acct/login', function (req,res) {
    console.log('login credentials:');
    console.log(req.body);
    passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: '/login'
    });
    res.sendStatus(200);
});




router.post('/acct/register', function (req,res) {
    console.log("registering user:",req.body);
    User.create({
        email:req.body.email,
        password:req.body.password,
        sisSerials:['test']
    }, function (err,usr) {
        if(err){
            console.log('error:',err);
            return res.send({accountStatus: "fail", serialStatus: "fail"})
        }
        console.log(usr);
        if (checkSerial(req.body.serial,req.body.sid)) {
            usr.sisSerials = [req.body.serial];
            return res.send({accountStatus: "success", serialStatus: "success"})
        } else {

            return res.send({accountStatus: "success", serialStatus: "fail"})
        }
    })
});

//Check that a given sid matches that of a sisbot with the given serial number
function checkSerial(serial,sid){
    //check sisbots for serial, then check sid
    Sisbot.findOne({serial:serial}, function (err,sisbot) {
        if (!sisbot || err){
            console.log("no sisbot found or error happened");
        } else {
            console.log("found sisbot:", sisbot);
            if(sisbot.sid == sid)
                return true;
            else return false;
        }
    });

}





module.exports = router;