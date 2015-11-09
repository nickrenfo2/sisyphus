/**
 * Created by Nick on 11/4/15.
 */
"use strict"


var socket = io();
socket.on('connect', function () {
            socket.emit('myTest');
});

var app = angular.module('sisApp',['rzModule', 'ui.bootstrap', 'ngMaterial']);  //normally want this
//var app = angular.module('sisApp',[]);  //necessary if logged out




app.controller('MainController',['$http', function ($http) {
    var vm = this;
    vm.message="Hello Sisyphus World";
    console.log('MainController running');



    //declare variables and define data defaults
    //before they are updated by db data or user input
    var awake =     1,
        play =      false,
        status =    "sleep",
        playlist =  "playlist",
        pathXOfY =  "pathXOfY",
        progress =  55,
        repeat =    false,
        speed =     0,
        lights =    0,
        timestamp = 0;

    var serial = "sisbot1",
        sisbotData={},
        state =  {},
        curPlayListTitle = 'curPlayListTitle-default',
        curPlayList =      'curPlaylist-default',
        curPathInd =       0,
        curPathTitle =     'curPathTitle-default',
        playlists =        'playlists-default',
        paths =            ['path0','path1','path2'];

    vm.showPlay=true;


    //get most recent stored state from db to populate controls
    function getState(){
        console.log('clientApp: getting state of the sisbot from db')
        $http({
            method: "POST",  //really a get with params in request body
            url: 'sis/getState',
            data: {serial : serial}
        }).then(function(response) {
            console.log(response);
            state = response.data.state;
        });

        // unpack status to get control values
        console.log('clientApp: current state object');
        console.log(state);
        // determine value of awake and  play from status data
        if (state.status=='sleep'){
            awake=0;
            play=false;
        }else if(state.status=='play') {
            play = true;
            awake = 1;
        } else {
            play = 'false';
            awake = 1;
        }

        playlist = state.curPlaylist;
        pathXOfY = "Path " + state.curPathInd.toString() + "/" + state.paths.length.toString()
        repeat =   state.repeat;
        speed =    state.speed;
        lights =   state.lights;
    }
    //getState();

// Front Panel I/O //

    // awake //
    vm.awakeSlider = {
        floor: 0,
        ceil: 1,
        value: awake
    };


    // playlist //
    vm.playlist = "playlist";

    // path x of y //
    vm.pathXOfY = "pathXOfY";


    // path progress //
    // -md-progress-linear
    vm.progress = progress;



    // play pause
    vm.playPauseClick=function(){
        console.log('saw play/pause click');
        console.log('play initial state: ',play);
        play=!play;
        vm.showPlay = (play==false);
        console.log('play new state: ',play);
    };


    // repeat //
    vm.repeatVal = repeat;

    // speed slider //
    vm.speedSlider = {
        floor: 0,
        ceil: 10,
        value: speed
    };


    // lights slider //
    vm.lightsSlider = {
        floor: 0,
        ceil: 10,
        value: lights
    };





    vm.captureState=function(){
        if(vm.awakeSlider.value===0){
            status = "sleep";
        } else if(play==true) {
            status = "play";
        } else {
            status = "pause";
        }
        console.log('clientAp: saw capture state click');
        //console.log('awake slider: ',vm.awakeSlider.value)
        //console.log('play: ',play);
        speed =  vm.speedSlider.value;
        lights = vm.lightsSlider.value;
        var now = new Date();
        timestamp = now.getTime();

        console.log('.......................');
        console.log('status: ',status);
        console.log('curPlayListTitle: ',curPlayListTitle);
        console.log('curPlaylist: ',     curPlayList);
        console.log('curPathInd: ',      curPathInd);
        console.log('curPathTitle: ',    curPathTitle);
        console.log('playlists: ',       playlists);
        console.log('repeat: ',          vm.repeatVal);
        console.log('paths: ',           paths);
        console.log('speed: ',           speed);
        console.log('lights: ',          lights);
        console.log('timestamp: ',       timestamp);

        //populate state object
        state.status =           status;
        state.curPlaylistTitle = curPlayListTitle;
        state.curPlaylist =      curPlayList;
        state.curPathInd =       curPathInd;
        state.curPathTitle =     curPathTitle;
        state.playlists =        playlists;
        state.repeat =           repeat;
        state.paths =            paths;
        state.speed =            speed;
        state.lights =           lights;
        state.timestamp =        timestamp;

        sisbotData.serial = serial;
        sisbotData.state = state;

        console.log('clientApp: sending state for sisbot# ',serial);
        console.log(sisbotData);
        $http({
            method: "POST",  //update the state
            url:    "sis/putState",
            data:  {data : sisbotData}
        }).then(function(response) {
            console.log('clientApp: send state completed:');
            console.log(response);
        });

    };


    vm.logout = function(){
        console.log('clientApp: saw log out click but am not going to log out')
        $http.get('/logout').then(function () {
            window.location.href = '/';
        });
    };

    vm.changeState = function() {
        console.log('clientApp: saw change state click'); // comment out when fully operational
     //   var changes = {
     //       status:'paused',
     //       speed:10
     //   };


     //   socket.emit('statechange',changes);
    }
}]);




app.controller('LoginController',['$http',function ($http) {
    var vm = this;

    vm.itworks = "Hello World";

    vm.login = function(){
        console.log(vm.acct);
        $http.post('/acct/login',vm.acct).then(function (resp) {
            console.log(resp.data);
            if (resp.data.success){
                window.location.href="/";
            }
        });
    };

    vm.register = function(){
        console.log('register...');
        console.log(vm.acct);
        $http.post('/acct/register',vm.acct).then(function (resp) {
            //if(resp.data.accountSuccess)
            //    console.log('account created');
            //if(resp.data.sisbotSuccess)
            //    console.log('sisbot added');
            console.log(resp.data.message);
            if(resp.data.loggedIn) window.location.href="/";
        });
    };

}]);