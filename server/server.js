var express = require('express');
var app = express();
var session = require('express-session');
var path = require('path');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var passport = require('passport');
var localStrategy = require('passport-local').Strategy;
var MongoStore = require('connect-mongo')(session);
var http = require('http').Server(app);
var io = require('socket.io')(http);
var passportSocketIo = require('passport.socketio');


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));
app.use(express.static(path.join(__dirname,"/public")));

var router = require('./routes/router');
app.use('/',router);


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
    fail:function(){console.log('ioAuthFail')}
}));

app.use(passport.initialize());
app.use(passport.session());


passport.use('local', new localStrategy({
        passReqToCallback : true,
        usernameField: 'username'
    },
    function(req, username, password, done){
        User.findOne({ username: username }, function(err, user) {
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


function onAuthorizeSuccess() {
    console.log('ioAuthSuccess');
}

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





var server = app.listen(process.env.PORT || 3000, function () {
    console.log('listening on port:',server.address().port);
});

