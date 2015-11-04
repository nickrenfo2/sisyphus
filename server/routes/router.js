var express = require('express');
var path = require('path');
var router = express.Router();
var User = require('../models/User');


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
    console.log(req.body);
    User.create({
        username:req.body.username,
        password:req.body.password,
        sisSerials:[]
    }, function (err,usr) {
        console.log(usr);
        checkSerial(req.body.serial,req.body.sid)
    })
});


function checkSerial(serial,sid){
    //check sisbots for serial, then check sid
}





module.exports = router;