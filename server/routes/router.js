var express = require('express');
var path = require('path');
var router = express.Router();
var User = require('../models/User');
var Sisbot = require('../models/Sisbot');
var passport = require('passport');
//var User = require('../models/User');


router.get('/', function (req,res) {
    if(!req.isAuthenticated())
    res.sendFile(path.join(__dirname,"../public/views/login.html"));
    else
    res.sendFile(path.join(__dirname,"../public/views/index.html"));
});

router.get('/login', function (req,res) {
    res.sendFile(path.join(__dirname,"../public/views/login.html"));
});

router.post('/acct/login', function (req,res,next) {
    console.log('login credentials:');
    console.log(req.body);

    //passport.authenticate('local', {
    //    successRedirect: '/',
    //    failureRedirect: '/login'
    //});

    passport.authenticate('local', function(err, user, info) {
        if (err) {
            return next(err); // will generate a 500 error
        }
        // Generate a JSON response reflecting authentication status
        if (! user) {
            return res.send({ success : false, message : 'authentication failed' });
            //return res.redirect('/');
        }
        req.login(user, function(err) {
            if (err) { return next(err); }
            return res.send({ success : true, message : 'authentication succeeded' });
            //return res.redirect('/');
        });
    })(req, res, next);

    //res.sendStatus(200);
});




router.post('/acct/register', function (req,res) {
    console.log("registering user:",req.body);
    //Create a new user
    User.create({
        email:req.body.email,
        password:req.body.password,
        sisSerials:['test'] //initialize serials
    }, function (err,usr) {
        if(err){
            //something broke, account not created
            console.log('error:',err);
            return res.send({accountStatus: "fail", serialStatus: "fail"})
        }
        console.log(usr);
        var serial = req.body.serial;
        var sid = req.body.sid;
        //Check to see if sisbot exists
        Sisbot.findOne({serial:serial}, function (err,sisbot) {
            //If sisbot doesn't exist, create it
            if (!sisbot){
                Sisbot.create({
                    serial:serial,
                    sid:sid,
                    state:{}
                }, function (err,sis) {
                    if (err) {
                        //if something broke while creating the sisbot
                        console.log('error creating sisbot:', err);
                        return res.send({accountStatus: "success", serialStatus: "fail"})
                    }
                    else {
                        //sisbot created successfully, set the account to be able to control the new sisbot
                        usr.sisSerials = [sis.serial];
                        usr.save();
                        req.login(usr, function (err) {
                            if (err) {console.log('error logging in:',err)}
                            else console.log('logged in successfully');
                        });
                        //});
                        return res.send({accountStatus: "success", serialStatus: "success"})
                    }
                });
            } else { //if sisbot already exists
                if (sid == sisbot.sid) { //make sure user has correct sid
                    console.log('serial and sid match');
                    usr.sisSerials = [serial];
                    usr.save(function (err,usr) { //allow user to control sisbot
                        if (err) console.log('error updating user:',err); //something broke
                    });
                    return res.send({accountStatus: "success", serialStatus: "success"})
                } else { //user does not have correct sid for this serial, thus do not allow them to control it
                    console.log('serial and sid do not match');
                    return res.send({accountStatus: "success", serialStatus: "fail"})
                }
            }
        });
    })
});





module.exports = router;