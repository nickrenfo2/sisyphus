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

router.get('/playlist', function (req, res) {
    if(!req.isAuthenticated())
    res.sendFile(path.join(__dirname,"../public/views/login.html"));
    else
    res.sendFile(path.join(__dirname,"../public/views/playlist.html"));
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
    var serial = req.body.serial;
    var sid = req.body.sid;
    //User.create({
    //    email:req.body.email,
    //    password:req.body.password,
    //    sisSerials:['test'] //initialize serials
    //}, function (err,usr) {
    //    if(err){
    //        //something broke, account not created
    //        console.log('error:',err);
    //        return res.send({accountStatus: "fail", serialStatus: "fail"})
    //    }
    //    console.log(usr);
    //    //Check to see if sisbot exists
    //    Sisbot.findOne({serial:serial}, function (err,sisbot) {
    //        //If sisbot doesn't exist...
    //        if (!sisbot){
    //            //Sisbot.create({
    //            //    serial:serial,
    //            //    sid:sid,
    //            //    state:{}
    //            //}, function (err,sis) {
    //            //    if (err) {
    //            //        //if something broke while creating the sisbot
    //            //        console.log('error creating sisbot:', err);
    //            //        return res.send({accountStatus: "success", serialStatus: "fail"})
    //            //    }
    //            //    else {
    //            //        //sisbot created successfully, set the account to be able to control the new sisbot
    //            //        usr.sisSerials = [sis.serial];
    //            //        usr.save();
    //            //        req.login(usr, function (err) {
    //            //            if (err) {console.log('error logging in:',err)}
    //            //            else console.log('logged in successfully');
    //            //        });
    //            //        //});
    //            //        return res.send({accountStatus: "success", serialStatus: "success"})
    //            //    }
    //            //});
    //            return res.send({accountSuccess:false,serialSuccess:false,message:'No sisbot with provided serial number was found'});
    //        } else { //if sisbot already exists
    //            if (sid == sisbot.sid) { //make sure user has correct sid
    //                console.log('serial and sid match');
    //                usr.sisSerials = [serial];
    //                usr.save(function (err,usr) { //allow user to control sisbot
    //                    if (err) console.log('error updating user:',err); //something broke
    //                });
    //                return res.send({accountStatus: "success", serialStatus: "success"})
    //            } else { //user does not have correct sid for this serial, thus do not allow them to control it
    //                console.log('serial and sid do not match');
    //                return res.send({accountStatus: "success", serialStatus: "fail"})
    //            }
    //        }
    //    });
    //})

    Sisbot.findOne({serial:serial}, function (err,sisbot) {
        var returnMsg = {
            accountSuccess:false,
            sisbotSuccess:false,
            message:'',
            loggedIn:false
        };
        if (err) {
            console.log('error finding sisbot:',err);
            returnMsg.message = "Error finding sisbot";
            returnMsg.code = -1;
            return res.send(returnMsg);
        } else if (!sisbot){
            returnMsg.message = "Serial and sid do not match any records";
            returnMsg.code = 0;
            return res.send(returnMsg);
        } else if (sid == sisbot.sid){
            User.create({
                email:req.body.email,
                password:req.body.password,
                sisSerials:[''], //initialize serials
                curSisbot:''  //initialize current bot
            }, function (err,usr) {
                if (err) {
                    console.log('error creating user:',err);
                    returnMsg.message = "Error creating account";
                    returnMsg.code = -2;
                    return res.send(returnMsg);
                } else {
                    if (sisbot.sid == sid){
                        usr.sisSerials = [serial];
                        usr.curSisbot = serial;
                        usr.save(function (err) {
                            if (err){
                                returnMsg.accountSuccess = true;
                                returnMsg.message = "Error adding sisbot to account";
                                returnMsg.code = 1;
                                return res.send(returnMsg);
                            } else {
                                req.login(usr, function (err) {
                                    if (err) {console.log('error logging in:',err)}
                                    else console.log('logged in successfully');
                                });
                                returnMsg.accountSuccess = true;
                                returnMsg.sisbotSuccess = true;
                                returnMsg.message = "Account created successfully. Sisbot added to account.";
                                returnMsg.code = 2;
                                returnMsg.loggedIn = true;
                                return res.send(returnMsg);
                            }
                        });
                    }
                }
            })
        } else {
            returnMsg.message = "Serial and sid do not match any records";
            returnMsg.code = 0;
            return res.send(returnMsg);
        }
    })
});





//retrieve the state of a sisbot
router.get('/sis/getState', function (req,res) {
    console.log("router: /sis/getState");
    Sisbot.findOne({serial: req.user.curSisbot},function (err, sisbot) {
            if (err) console.log(err);
            res.send(sisbot);
            console.log("router: /sys/getState:returning sisbot");
            console.log(sisbot);
        });
});




//update the state of a sisbot
router.post('/sis/putState', function (req,res) {
    console.log("router: updating state: req.body:");
    console.log(req.body);

    var newState = req.body;
    console.log('router: email: ',req.user.email);
    console.log('router: password: ',req.user.password);
    console.log('router: sisSerials: ',req.user.sisSerials)
    console.log('router: current sysbot: ', req.user.curSisbot);
    console.log('router: updating to newState:');
    console.log(newState);
    Sisbot.findOneAndUpdate({serial: req.user.curSisbot}, {$set: {state: newState}},
        function (err) {
            if (err) console.log(err);
            res.sendStatus(200);
            console.log("router: finished updating state");
        });
});





router.get('/logout', function (req,res) {
    console.log("logging out:",req.user);
    req.logout();
    //res.sendFile(path.join(__dirname,"../public/views/login.html"));
    res.redirect('/test');
});

router.get('/test', function (req,res) {
    res.send('test');
});



module.exports = router;