var express = require('express');
var app = express();
var session = require('express-session');
var path = require('path');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var passport = require('passport');
var localStrategy = require('passport-local').Strategy;
var MongoStore = require('connect-mongo')(session);
var Sisbot = require('./models/Sisbot');

var http = require('http').createServer(app);
var io = require('socket.io').listen(http);

var passportSocketIo = require('passport.socketio');
var User = require('./models/User');




app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));
app.use(express.static(path.join(__dirname,"/public")));



var connString = 'mongodb://localhost:27017/sisyphus';
mongoose.connect(connString);


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
                        curPlaylistTitle:"",
                        curPlaylist:"",
                        curPathInd:0,
                        playlists:[""],
                        repeat:true,
                        paths:[""],
                        speed:100,
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

    socket.on('myConn',function(sisbot) {
        console.log('sisbot connected',sisbot);

        Sisbot.findOne({serial:sisbot.serial}, function (err,bot) {
            bot.socketid = socket.id;
            bot.sid = sisbot.sid;
            bot.save();
            //io.sockets.connected[socket.id].emit('test')
        })
    });

    socket.on('statechange', function (changes) {
        var usr = socket.request.user;
        console.log('state changed by user',usr.email,'for bot',usr.curSisbot);
        Sisbot.findOne({serial:usr.curSisbot}, function (err,bot) {
            console.log(bot);
            io.sockets.connected[bot.socketid].emit('statechange');
        });
    });
});


var server = http.listen(process.env.PORT || 3000, function () {
    console.log('listening on port:',server.address().port);
});



//var Sisbot = require('./models/Sisbot');
//
//var mySis = new Sisbot();
//mySis.serial = '123ABD';
//mySis.sid = '1234';
//mySis.state = {};
//
//console.log(mySis);
//mySis.save(function (err) {
//    console.log('something');
//    if (err) console.log(err);
//    else console.log('all good in tha hood');
//});