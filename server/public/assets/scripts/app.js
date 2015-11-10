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




app.controller('MainController',['$http', '$scope', function ($http, $scope) {
    var vm = this;
    vm.message="Hello Sisyphus World";
    console.log('MainController running');


    //////////////////////////////////////////////////////
    // declare variables and define data defaults       //
    // before they are updated by db data or user input //
    //////////////////////////////////////////////////////

    var awake =     0,
        play =      false,
        status =    "sleep",
        playlist =  "playlist-default",
        pathXOfY =  "pathXOfY-default",
        progress =  55,
        repeat =    false,
        speed =     0,
        lights =    0,
        timestamp = 0,
        playlistLength = "0",
        currentPathIndex = "0";

    vm.showPlay=true; //default: when play is false, show the play button

    var state =        {},
        curPlaylist =  'curPlaylist-default',
        curPathInd =   0,
        curPathName =  'curPathName-default',
        paths =        ['path0','path1','path2'];



    ///////////////////////////////////////////////////////
    // Get the stored state from db to populate controls //
    ///////////////////////////////////////////////////////

    function getStateFromDb() {
        console.log('clientApp: getting state of the sisbot from db');
        $http({
            method: "GET",
            url: 'sis/getState'
        }).then(function (response) {
        //    console.log('clientApp: response:');
        //    console.log(response);
            state = response.data.state;

            // unpack status to get control values
            console.log('clientApp: state object');
            console.log(state);

            //keep the state of things not used in interface
            paths       = state.paths;
            curPathName = state.curPathName;
            curPlaylist = state.curPlaylist;
            curPathName = state.curPathName;
            curPathInd  = state.curPathInd;

            // determine value of awake and  play from status data
            if (state.status == 'sleep') {
                awake = 0;
                play = false;
                vm.showPlay = true;
            } else if (state.status == 'play') {
                play = true;
                awake = 1;
                vm.showPlay = false;
            } else {
                play = false;
                awake = 1;
                vm.showPlay=true;
            }

            curPlaylist = state.curPlaylist;
            playlistLength = state.paths.length.toString();
            currentPathIndex = curPathInd.toString();
            pathXOfY = "Path " + currentPathIndex + "/" + playlistLength;
         //   console.log('currentPathIndex: ', currentPathIndex);
         //   console.log('playlistLength: ', playlistLength);
         //   console.log('pathXOfY');
            repeat = state.repeat;
            speed = state.speed;
            lights = state.lights;


            // Front Panel I/O //

            // awake //
            vm.awakeSlider = {
                floor: 0,
                ceil: 1,
                value: awake
            };

            // playlist //
            vm.playlist = curPlaylist;

            // path x of y //
            vm.pathXOfY = pathXOfY;

            // path progress //
            // -md-progress-linear
            vm.progress = progress;

            // play pause
            vm.playPauseClick = function () {
                console.log('saw play/pause click');
                console.log('play initial state: ', play);
                play = !play;
                vm.showPlay = (play == false);
                console.log('play new state: ', play);
                captureUIState(); //because this is not in the watch list
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
        });
    };


    // Always run the getStateFromDb function when this page first starts
    // to get the most current state of the Sisyphus

    getStateFromDb();


    ////////////////////////////////////////
    // UI click on the playlist indicator //
    // sends to the playlist page         //
    ////////////////////////////////////////

    vm.goToPlaylistPage = function(){
        console.log('saw Go To Playlist click');
    };


    ////////////////////////////////////
    // Watch for changes to controls, //
    // -update db  on control changes //
    ////////////////////////////////////

    var controls=["main.awakeSlider.value",
                  "main.repeatVal",
                  "main.speedSlider.value",
                  "main.lightsSlider.value"];
    //$scope.$watchGroup("main.speedSlider.value", function(oldValue, newValue){
    $scope.$watchGroup(controls, function(oldValue, newValue){
    //    console.log('.........................');
    //    console.log('speed updated: ',oldValue);
    //    console.log('.........................');
        captureUIState();
        }
    );

    ///////////////////////////////////////////////////
    // Capture state on UI switch during development //
    ///////////////////////////////////////////////////

    vm.captureState=function(){
        captureUIState();
    };


    //////////////////////////////////////////////////
    // Capture the state of the user interface (UI) //
    // and send it to the database                  //
    //////////////////////////////////////////////////

    function captureUIState(){
        console.log('clientAp: capturing UI state');
        if(vm.awakeSlider.value===0){
            status = "sleep";
        } else if(play==true) {
            status = "play";
        } else {
            status = "pause";
        }
        //console.log('awake slider: ',vm.awakeSlider.value)
        //console.log('play: ',play);
        speed =  vm.speedSlider.value;
        lights = vm.lightsSlider.value;
        //var now = new Date();
        //timestamp = now.getTime();

        console.log('clientAp: Inputs to state');
        console.log('status: ',      status);
     //   console.log('curPlaylist: ', curPlaylist);
     //   console.log('curPathInd: ',  curPathInd);
     //   console.log('curPathName: ', curPathName);
        console.log('repeat: ',      vm.repeatVal);
     //   console.log('paths: ',       paths);
     //   console.log('speed: ',       speed);
     //   console.log('lights: ',      lights);

        //populate state object
        state.status =      status;
        state.curPlaylist = curPlaylist;
        state.curPathInd =  curPathInd;
        state.curPathName = curPathName;
        state.repeat =      vm.repeatVal;
        state.paths =       paths;
        state.speed =       speed;
        state.lights =      lights;


        console.log('clientApp: sending this state object for sisbot');
        console.log(state);
        $http({
            method: "POST",  //update the state
            url:    "sis/putState",
            data:  state
        }).then(function(response) {
            console.log('clientApp: send state completed');
            console.log(response);
        });
    }


    //////////////////////
    // UI logout button //
    //////////////////////

    vm.logout = function(){
        console.log('clientApp: saw log out click but am not going to log out')
        $http.get('/logout').then(function () {
            window.location.href = '/';
        });
    };

    ///////////////////////////////////////////
    // UI changeState button for development //
    ///////////////////////////////////////////

    vm.changeState = function() {
        console.log('clientApp: saw change state click'); // get rid of all this when fully operational
     //   var changes = {
     //       status:'paused',
     //       speed:10
     //   };
     //   socket.emit('statechange',changes);
    };

}]);




/////////////////////////////////////////////////////
// Controller for the login and register functions //
/////////////////////////////////////////////////////

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