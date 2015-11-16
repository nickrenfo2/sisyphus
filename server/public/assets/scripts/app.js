/**
 * Created by Nick on 11/4/15.
 */
"use strict";


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

    var state = {};
        state.status        = 'sleep';
        state.curPlaylist   = 'curPlaylist-default';
        state.curPathInd    = 0;
        state.progress      = 0;
        state.repeat        = false;
        state.paths         = ['paths-default'];
        state.speed         = 1;
        state.lights        = 0;

    var play             =  false,
        pathXOfY         =  "pathXOfY-default",
        playlistLength   = "0",
        currentPathIndex = "0",
        sisSerials       = [],
        curSisbot        = 'curSisbot',
        pathTime         = 300,  //default to 5 minutes path drawing time
        controls         =[];

    vm.main = {curSisbot:curSisbot}; //sets the default for Select Sisbot UI
    vm.onoffswitch = false;          //derived from status
    vm.showPlay=true;                //by default play is false, so show the play button
    vm.progress = state.progress;    //update to database value

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

            // get state data to to the UI
            console.log('clientApp: state object');
            console.log(state);

            // determine value of onoffswitch and  play & vm.showPlay(icon) from status data
            if (state.status == 'sleep') {
                vm.onoffswitch = false;
                play = false;
                vm.showPlay = true;
            } else if (state.status == 'play') {
                play = true;
                vm.showPlay = false;
                vm.onoffswitch = true;
            } else { //state.status == 'pause'
                play = false;
                vm.showPlay=true;
                vm.onoffswitch = true;
            }

            // playlist //
            vm.curPlaylist = "Select playlist: "+state.curPlaylist;

            // path x of y //
            playlistLength = state.paths.length.toString();
            currentPathIndex = (state.curPathInd+1).toString();
            pathXOfY = "Path " + currentPathIndex + " of " + playlistLength;

            vm.pathXOfY = pathXOfY;

            // path progress //
            // -md-progress-linear
            //vm.progress = state.progress;

            // Play/Pause
            vm.playPauseClick = function () {
                console.log('saw play/pause click');
                console.log('play initial state: ', play);
                play = !play;
                vm.showPlay = (play == false);
                console.log('play new state: ', play);
                captureUIState(); //because this is not in the watch list
            };

            // repeat //
            vm.repeatVal = state.repeat;

            // speed slider //
            vm.speedSlider = {
                floor: 1,
                ceil: 10,
                value: state.speed
            };

            // lights slider //
            vm.lightsSlider = {
                floor: 0,
                ceil: 10,
                value: state.lights
            };

            // list of available sisbots as a dropdown list is handled below in getUserFromDb //
        });
    }


    function getUserFromDb() {
        console.log('clientApp: getting user data from db');;
        $http({
            method: "GET",
            url: 'acct/getUser'
        }).then(function (response) {
            console.log('clientApp: retrieved user:', response);
            console.log('clientApp: current user: ',response.data.email);
            console.log('clientApp: current sisbot: ',response.data.curSisbot);
            console.log('clientApp: current available sisbots: ',response.data.sisSerials);
            sisSerials = response.data.sisSerials;
            curSisbot = response.data.curSisbot;
            vm.sisSerials = sisSerials;
            vm.curSisbot = curSisbot;
        })
    }

    // Always run the getStateFromDb function when this page first starts
    // to get the most current state of the Sisyphus

    getStateFromDb();
    getUserFromDb();



    ///////////////////////////////////////////////////////////////////////////
    // Start progress update timer to update UI progress bar every 5 seconds //
    ///////////////////////////////////////////////////////////////////////////

    console.log('Starting progress update timer');
    var numUpdates = pathTime/5;
    var progInterval = 100/numUpdates;
    var gatedProgInterval=0;
    var progressKey=setInterval(function(){
        if(state.status=="play") {
            gatedProgInterval = progInterval;
        } else {
            gatedProgInterval = 0;
        }
        state.progress += gatedProgInterval; //keep the state info current
        vm.progress = state.progress;        //update the UI
        $scope.$apply();
        //console.log('status: ',state.status);
        //console.log('pathTime: ', pathTime, ' numUpdates: ', numUpdates, ' gatedProgInterval: ', gatedProgInterval);
        console.log('updating progress: ', vm.progress);
    },5000);








    ////////////////////////////////////////
    // UI click on the playlist indicator //
    // sends to the playlist page         //
    ////////////////////////////////////////

    vm.goToPlaylistPage = function(){
        console.log('saw Go To Playlist click');
        //window.location.assign('/playlist');  //verify this address
    };


    ////////////////////////////////////
    // Watch for changes to controls, //
    // -update db  on control changes //
    ////////////////////////////////////

    controls=["main.onoffswitch",
              "main.repeatVal",
              "main.speedSlider.value",
              "main.lightsSlider.value",
              "main.selected",
              "main.curSisbot"];
    $scope.$watchGroup(controls, function(oldValue, newValue){
        captureUIState();
        }
    );

    ///////////////////////////////////////////////////
    // Capture state on UI switch during development //
    ///////////////////////////////////////////////////

    vm.captureUIState=function(){
        console.log('saw capture state click');
        console.log('******** new switch: ',vm.onoffswitch);
        captureUIState();
    };


    //////////////////////////////////////////////////
    // Capture the state of the user interface (UI) //
    // and send it to the database                  //
    //////////////////////////////////////////////////

    function captureUIState(){
        console.log('clientAp: capturing UI state');
        console.log('clientAp: curSisbot: ',vm.curSisbot);

        //populate state object
        if(vm.onoffswitch == false){
            state.status = "sleep";
        } else if(play==true) {
            state.status = "play";
        } else {
            state.status = "pause";
        }

        state.repeat        = vm.repeatVal;
        state.speed         = vm.speedSlider.value;
        state.lights        = vm.lightsSlider.value;

        console.log('clientApp: sending this state object for sisbot');
        console.log(state);
        //update the state
        $http({
            method: "POST",
            url:    "sis/putState",
            data:  state
        }).then(function(response) {
            console.log('clientApp: send state completed');
            console.log(response);
        }).then(function(resp){
            //update the curSisbot in the user
            var curSisbotObject = {curSisbot: vm.curSisbot};
            console.log('clientApp: update user:curSisbot');
            console.log(curSisbotObject);
            $http({
                method: "POST",  //update the state
                url:    "acct/updateUser",
                data:  curSisbotObject
            }).then(function(resp){
                console.log(resp);
                //send new state to the sisbot
                socket.emit('statechange, state');
            })
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
    // - simulates a state change in the UI  //
    ///////////////////////////////////////////

    vm.changeState = function() {
        console.log('clientApp: saw change state click'); // get rid of all this when fully operational
        var changes = {
            status:'paused',
            speed:10
        };
        socket.emit('statechange',changes);
    };


    ////////////////////////////////////////////
    // Path Complete received from the sisbot //
    //  - update UI curPathInd, progress      //
    ////////////////////////////////////////////

    socket.on('pathcomplete',function() {
        console.log('clientApp:pathcomplete received from sisbot');
        console.log('clientApp:pathcomplete playlist length: ', state.paths.length);
        console.log('clientApp:pathcomplete curPathInd: ', state.curPathInd);

        // update current path index and progress

        // if play and not done with playlist start next path
        if (state.status == 'play') {
            if (state.curPathInd < (state.paths.length - 1)) {
                state.curPathInd++;
                state.progress = 0;
                console.log('clientApp:pathcomplete: increment curPathInd: ', state.curPathInd);
            } else if (state.repeat == true) {
                state.curPathInd = 0;
                state.progress = 0;
                console.log('clientApp:pathcomplete: zero curPathInd: ', state.curPathInd);
            } else {
                state.status = "pause";
                state.progress = 100;
                console.log('clientApp:pathcomplete: leave curPathInd alone: ', state.curPathInd);
            }
        }

        //Update the database with new curPathInd and Progress
        // - then update the UI from the database
        console.log('clientApp:pathcomplete: updating db');
        console.log(state);
        $http({
            method: "POST",
            url:    "sis/putState",
            data:  state
        }).then(function(response) {
            console.log('clientApp:pathcomplete send state completed');
            console.log(response);

        }).then(function(resp)
        { console.log('clientApp:pathcomplete: update UI from db');
          getStateFromDb();
        });


    });

}]);

// replace changes data with full state data/object



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