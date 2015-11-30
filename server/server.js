var express = require('express');
var app = express();
var session = require('express-session');
var path = require('path');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var passport = require('passport');
var localStrategy = require('passport-local').Strategy;
var MongoStore = require('connect-mongo')(session);
var async = require('async');


var Sisbot = require('./models/Sisbot');
var Path = require('./models/Path');
var Playlist = require('./models/Playlist');

var http = require('http').createServer(app);
var io = require('socket.io').listen(http);

var passportSocketIo = require('passport.socketio');
var User = require('./models/User');




app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));
app.use(express.static(path.join(__dirname,"/public")));



//var connString = 'mongodb://sisadmin:BoulderHillRoll@ds053894.mongolab.com:53894/sisyphus';
var connString = 'mongodb://localhost:27017/sisyphus';
mongoose.connect(connString);



var pl = new Playlist();
pl.name = 'testpl';
pl.title = 'testpltitle';
pl.paths = ['test1','test2','test3'];
//pl.save();


app.use(session({
    secret: 'secret',
    key: 'user',
    resave: true,
    saveUninitialized: false,
    cookie: { maxAge: null, secure: false, httpOnly:false },
    store:new MongoStore({mongooseConnection:mongoose.connection})
}));

io.use(passportSocketIo.authorize({
    //cookieParser:
    key:'user',
    secret:'secret',
    store:new MongoStore({mongooseConnection:mongoose.connection}),
    success:onAuthorizeSuccess,
    fail:onAuthorizeFail
}));

app.use(passport.initialize());
app.use(passport.session());


passport.use('local', new localStrategy({
        passReqToCallback : true,
        usernameField: 'email'
    },
    function(req, username, password, done){
        User.findOne({ email: username }, function(err, user) {
            if (err) throw err;
            if (!user)
                return done(null, false, {message: 'Incorrect username or password.'});

            // test a matching password
            user.comparePassword(password, function(err, isMatch) {
                if (err) throw err;
                if(isMatch)
                    return done(null, user);
                else
                    done(null, false, { message: 'Incorrect username or password.' });
            });
        });
    }
));
passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    User.findById(id, function(err,user){
        if(err) done(err);
        done(null,user);
    });
});


function onAuthorizeSuccess(data,accept) {
    console.log('ioAuthSuccess');
    accept();
}

function onAuthorizeFail(data,message,error,accept){
    console.log('ioAuthFail');
    var serial = data._query.serial;
    var qry = data._query;
    if(serial && serial!='undefined'){
        Sisbot.findOne({serial:serial}, function (err,sisbot) {
            if (err) console.log('error authenticating sisbot:',err);
            else if (!sisbot) {
                Sisbot.create({
                    serial:serial,
                    sid:'0000',
                    state:{
                        status:'sleep',
                        curPlaylist:"default",
                        curPathInd:0,
                        repeat:true,
                        paths:["home","e100"],
                        speed:5,
                        lights:5
                    },
                    socketid:""
                },function(err){
                    if (err) console.log('error registering new sisbot:',err);
                    accept();
                });
            }
            else accept();
        })
    }
}


var router = require('./routes/router');
app.use('/',router);

//SOCKET IO CONNECTION STUFF
io.on('connection', function (socket) {
    console.log('a user connected:',socket.id);

    socket.on('myConn',function(sisbot) { //Sisbot has connected and is sending its info
        console.log('sisbot connected');

        Sisbot.findOne({serial:sisbot.serial}, function (err,bot) {
            bot.socketid = socket.id; //updating socketid so it can recieve commands
            bot.sid = sisbot.sid; //make sure SID is up-to-date
            bot.playlists = sisbot.playlists;
            bot.save(); //commit changes
            //console.log(sisbot.paths);
            function getPaths(callback){
                console.log('checking paths');
                var pathTasklist = {};
                for (var i=0;i<sisbot.paths.length;i++){
                    var myPath = sisbot.paths[i];
                    //console.log(myPath);
                    pathTasklist[myPath]=(getPathFunction(myPath,sisbot.serial));
                }

                async.parallel(pathTasklist, function (err,getPath) {
                    if (err)callback(err);
                    console.log('pathTasklist done');
                    for (var path in getPath){
                        if (getPath[path]) {
                            console.log('get path', path);
                            io.sockets.connected[socket.id].emit('getPath', path);
                        }
                    }
                    callback(null);
                });
            }

            function getPls(callback) {
                console.log('checking playlists');
                var plTasklist = {};
                for (i=0;i<bot.playlists.length;i++){
                    var myPl = bot.playlists[i];
                    plTasklist[myPl]=(getPlaylistFunction(myPl,sisbot.serial));
                }
                async.parallel(plTasklist,function(err,getPl){
                    if (err) callback(err);
                    console.log('plTasklist done');
                    for (var pl in getPl) {
                        if (getPl[pl]) {
                            console.log('get pl',pl);
                            io.sockets.connected[socket.id].emit('getPlaylist', pl);
                        }
                    }
                    callback(null);
                });
            }

            async.series([getPaths,getPls],function(err){
                if (err) console.log(err);
                console.log('paths and pls done');
            });

        })
    });


    socket.on('statechange', function (state) { //generic state change event
        var usr = socket.request.user;
        console.log('state changed by user',usr.email,'for bot',usr.curSisbot);

        //Sisbot.findOneAndUpdate({serial: usr.curSisbot}, {$set: {state: state}},
        //    function (err) {
        //        if (err) console.log(err);
        //        res.sendStatus(200);
        //        //console.log("router: finished updating state");
        //    });
        sendEventToSisbot(socket.request.user.curSisbot,'statechange',state); //Send event to sisbot
        passportSocketIo.filterSocketsByUser(io, function(user){ //Send event to all users currently commanding this sisbot
            return user.curSisbot===usr.curSisbot;

        }).forEach(function(socket){
            socket.emit('statechange',state);
        });
    });

    socket.on('jog', function (dir) {
        //console.log('jog recieved');
        sendEventToSisbot(socket.request.user.curSisbot,'jog',dir);
    });

    socket.on('pathcomplete', function(){
        console.log('server: received pathcomplete from sisbot');
        passportSocketIo.filterSocketsByUser(io, function(user){
            return user.curSisbot===socket.handshake.query.serial;

        }).forEach(function(socket){
            socket.emit('pathcomplete');
        });
        //User.find({curSisbot:socket.handshake.query.serial}, function(err, users){
        //   for(var i=0;i<users.length;i++){
        //       io.sockets.connected[users[i].socketid].emit('pathcomplete');
        //   }
        //});
    });

    //TODO Sanitize playlist inputs
    socket.on('getPlaylist', function (playlist) {
        console.log('Received playlist:',playlist);
        playlist.public = true;
        playlist.sisbots = [socket.handshake.query.serial];

        var pathIdTasks = [];
        for (var i=0;i<playlist.paths.length;i++){
            //Path.findOne({name: playlist.paths[i].name}, function (err, path) {
            //    if (err)console.log(err);
            //    if(!path)return false;
            //    //playlist.paths[i].pathid = path._id;
            //    console.log(i);
            //    console.log(playlist.paths);
            //});
            pathIdTasks.push(getPathIdFunction(playlist.paths[i].name));
        }
        async.parallel(pathIdTasks, function (err, pathIds) {
            for (i=0;i<pathIds.length;i++){
                var path = pathIds[i];
                if(!path)console.log(playlist.paths[i].name,'missing');// playlist.paths[i].pathid="home";
                else {
                    //if (!path) //console.log('path',playlist.paths[i],' not found');
                    //else {
                    console.log(playlist.paths[i].name,'adding path id');
                    playlist.paths[i].pathid = path._id;
                    //}
                }
            }
            Playlist.create(playlist, function (err) {
                if (err) console.log(err);
            });
        });

    });

    //TODO Sanitize path inputs
    socket.on('getPath', function (pathObj) {
        pathObj.path = '';
        //console.log(socket);
        //pathObj.sisbots = [socket.handshake.query.serial];
        console.log('Received path',pathObj.name);
        Path.create(pathObj, function (err,newpath) {
            if (err) console.log(err);
            //console.log('path added:',newpath);
        })
    });

    socket.on('goHome', function () {
        //console.log('go home');
        sendEventToSisbot(socket.request.user.curSisbot,'goHome');
    });

    socket.on('disconnect', function () {
        var serial = socket.handshake.query.serial;
        if (serial){ //Disconnection is from a sisbot
            Sisbot.findOne({serial:serial}, function (err,bot) {
                bot.socketid = '';
                bot.save();
            });
        } else { //Disconnection is from a user

        }
    });

});

//This will return a function that will determine whether or not the server should request and add the playlist from the connecting sisbot
function getPlaylistFunction(playlist,serial){
    return function(callback){
        Playlist.find({name:playlist}, function (err,pls) {
            //console.log('searching for playlist', playlist);
            var getPl = true;
            if (pls.length ==0) return callback(err,true); //if there are no playlists with the name, get the playlist
            for (var i=0;i<pls.length;i++) {
                var pl = pls[i];
                if (pl.sisbots && pl.sisbots.indexOf(serial)>=0) {
                    //console.log('sisbot has already added playlist',playlist);
                    getPl = false;
                    break;
                }
                if (pl.public) {
                    console.log('public pl with name',playlist,'exists.');
                    getPl = false;
                    break;
                }
            }
            callback(err,getPl);
        });
        //console.log('search for pl:',playlist);
        //callback(null, "something1");
    }
}

//This will return a function that will determine whether or not the server should request and add the path from the connecting sisbot
function getPathFunction(pathName,serial){
    return function(callback){
        var getPath = true;
        Path.findOne({name: pathName}, function (err, path) {
            if (err) return callback(err,path);
            if(path) getPath = false;
            //else console.log('did not find path',pathName);
            //console.log('found path',pathName);
            //console.log(path);
            //console.log("searching for path",path);
            //var getPath = true;
            //for (var i=0;i<paths.length;i++) {
            //    var myPath = paths[i];
            //    if (myPath.sisbots && myPath.sisbots.indexOf(serial)>=0) {
            //        console.log('sisbot has already added path', myPath.name);
            //        getPath = false;
            //        break;
            //    }
            //}

            callback(err,getPath);
        });
    }
}

function getPathIdFunction(pathname){
    return function(callback){
        Path.findOne({name:pathname}, function (err,path) {
            if(path)console.log('found path',pathname);
            else console.log('path missing',pathname);
            //console.log(path);
            callback(err,path);
        })
    }
}

function sendEventToSisbot(serial,event,data){
    Sisbot.findOne({serial:serial}, function (err,bot) {
        //console.log(bot);
        if(bot.socketid) {
            //console.log('socket id:',bot.socketid);
            io.sockets.connected[bot.socketid].emit(event, data);
        } else {
            console.log('Sisbot',serial,'not connected');
        }
    });
}

var server = http.listen(process.env.PORT || 3000, function () {
    console.log('listening on port:',server.address().port);
});


/////////////////////////////////////////////////////
// Uncomment this to add a sisbot to the registry //
/////////////////////////////////////////////////////

//var Sisbot = require('./models/Sisbot');
//
//var mySis = new Sisbot();
//mySis.serial = '456ABE';
//mySis.sid = '12345';
//mySis.state = {};
//
//console.log(mySis);
//mySis.save(function (err) {
//    console.log('something');
//    if (err) console.log(err);
//    else console.log('all good in tha hood');
//});
