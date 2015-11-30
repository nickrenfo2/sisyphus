/**
 * Created by Nick on 11/4/15.
 */
"use strict";


var socket = io();
socket.on('connect', function () {
            socket.emit('myTest');
});


socket.on('statechange', function (state) {
    
});

var app = angular.module('sisApp',['rzModule', 'ui.bootstrap', 'ngMaterial']);  //normally want this

//var app = angular.module('sisApp',['rzModule', 'ui.bootstrap', 'ngAria', 'ngAnimate', 'ngMaterial'],function($mdThemingProvider) {
//    var blueTheme = $mdThemingProvider.theme('blueTheme', 'default');
//    var bluePalette = $mdThemingProvider.extendPalette('blue', {
//        '500': '#03A9F4'
//    });
//    $mdThemingProvider.definePalette('bluePalette', bluePalette);
//    blueTheme.primaryPalette('bluePalette');
//});  //normally want this


// var app = angular.module('sisApp',[]);  //necessary if logged out




app.controller('MainController',['$http', '$scope','$mdDialog', function ($http, $scope,$mdDialog) {
    var vm = this;
    vm.message="Hello Sisyphus World";
    console.log('MainController running');


    //////////////////////////////////////////////////////
    // declare variables and define data defaults       //
    // before they are updated by db data or user input //
    //////////////////////////////////////////////////////

    var state = {};
        state.status        = 'sleep';
        state.curPlaylist   = 'Playlist -none selected';
        state.curPathInd    = 0;
        state.progress      = 0;
        state.repeat        = false;
        state.paths         = ['Paths -none selected '];
        state.speed         = 1;
        state.lights        = 0;

    var play              =  false,
        pathXOfY          =  "No playlist selected",
        curPlaylist       = "none selected",
        playlistLength    = "0",
        currentPathIndex  = "0",
        sisSerials        = [],
        curSisbot         = 'None selected',
        pathTime          = 300, //default to 5 minutes path drawing time
        controls          = [],  //array used to hold the UI watch list
        updateInterval    = 1,   //seconds per update
        numUpdates        = 0,   // number of updates for this path
        progInterval      = 0,   // percent the progress bar will increase per update
        gatedProgInterval = 0,   //percent increase gated with the play state
        progressKey       = 0;   // timer key

    vm.main = {curSisbot:curSisbot}; //sets the default for Select Sisbot UI
    vm.onoffswitch = false;          //derived from status
    vm.showPlay=true;                //by default play is false, so show the play button
    vm.progress = state.progress;    //update to database value

    var allPlaylists=[];

    getStateFromDb();

    ///////////////////////////////////////////////////////
    // Get the stored state from db to populate controls //
    ///////////////////////////////////////////////////////

    function getStateFromDb() {
        console.log('clientApp: getting state of the sisbot from db');
        $http({
            method: "GET",
            url: 'sis/getState'
        }).then(function (response) {
            state = response.data.state;

            curPlaylist = state.curPlaylist;

            // use curPlaylist and Playlist db
            getPlaylistsFromDb()
        });
    }


    ////////////////////////////////////////////////////////////////////////////
    // get call to server for all playlists to determine paths in curPlaylist //
    ////////////////////////////////////////////////////////////////////////////

    function getPlaylistsFromDb(){
        console.log('clientApp: getting all PlayLists');
        //console.log('looking for playlist :',curPlaylist);
        $http({
            method: "GET",
            url: '/getPlaylists'
        }).then(function(data){
            allPlaylists = data;
            //console.log('clientApp:allPlaylists:');
            //console.log(allPlaylists);
            //console.log('clientApp:allplaylists.data.length: ',allPlaylists.data.length);
            for (var i=0; i<allPlaylists.data.length; i++){
                //console.log ('clientApp:allPlayLists.data[[i]');
                //console.log (allPlaylists.data[i]);
                //console.log (allPlaylists.data[i].name);
                if (allPlaylists.data[i].name == curPlaylist) {
                    //console.log(curPlaylist," =? ",allPlaylists.data[i].name);
                    //console.log('number of paths: ',allPlaylists.data[i].paths.length);
                    for(var j=0;j<allPlaylists.data[i].paths.length;j++){
                        //console.log('path[', j, '] = ',allPlaylists.data[i].paths[j].name);
                        state.paths[j]=allPlaylists.data[i].paths[j].name;
                    }

                }
            }
            //console.log('updated state containing paths:');
            //console.log(state);
            //update view with new path dependents
            vm.nowPlaying = state.paths[state.curPathInd];
            playlistLength = state.paths.length.toString();
            currentPathIndex = (state.curPathInd+1).toString();
            pathXOfY = "Path " + currentPathIndex + " of " + playlistLength;
            vm.pathXOfY = pathXOfY;

            getUserFromDb();
        })
    }


    /////////////////////////////////////////////////////////////////
    // Get user data from db to populate sis serials and curSisbot //
    /////////////////////////////////////////////////////////////////

    function getUserFromDb() {
        console.log('clientApp: getting user data from db');
        $http({
            method: "GET",
            url: 'acct/getUser'
        }).then(function (response) {
            //console.log('clientApp: retrieved user:', response);
            //console.log('clientApp: current user: ',response.data.email);
            //console.log('clientApp: current sisbot: ',response.data.curSisbot);
            //console.log('clientApp: current available sisbots: ',response.data.sisSerials);
            vm.sisSerials = response.data.sisSerials;
            vm.curSisbot = response.data.curSisbot;

            displayUIdata();
        })
    }


        ////////////////////////////////////////////
        // display Sisbot state data to to the UI //
        ////////////////////////////////////////////

        function displayUIdata(){
            console.log('clientApp: displaying state on UI');
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
            vm.showPlay = true;
            vm.onoffswitch = true;
        }

        // playlist //
        vm.curPlaylist = "Select playlist: " + state.curPlaylist;

        // now playing //
        vm.nowPlaying = state.paths[state.curPathInd];

        // repeat playlist//
        vm.repeatVal = state.repeat;

        // path x of y //
        playlistLength = state.paths.length.toString();
        currentPathIndex = (state.curPathInd+1).toString();
        pathXOfY = "Path " + currentPathIndex + " of " + playlistLength;

        vm.pathXOfY = pathXOfY;

        // path progress //
        // -handled by the timer function below
        //var progressBars = [];
        vm.paths=state.paths;

        // Play/Pause
        vm.playPauseClick = function () {
            console.log('saw play/pause click');
            //console.log('play initial state: ', play);
            play = !play;
            vm.showPlay = (play == false);
            //console.log('play new state: ', play);
            //captureUIState(); //because this is not in the watch list
        };

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


            $scope.$apply();
    }


    ///////////////////////////////////////////////////////////////////////////
    // Start progress update timer to update UI progress bar every 1 seconds //
    ///////////////////////////////////////////////////////////////////////////

    //console.log('Starting progress update timer');
    //updateInterval = 1; //seconds per update. Change this to control progress bar behavior.
    //numUpdates = pathTime/updateInterval;
    //progInterval = 100/numUpdates;
    //gatedProgInterval=0;
    //progressKey=setInterval(function(){
    //    if(state.status=="play") {
    //        gatedProgInterval = progInterval;
    //    } else {
    //        gatedProgInterval = 0;
    //    }
    //    state.progress += gatedProgInterval; //keep the state info current
    //    vm.progress = state.progress;        //update the UI
    //    $scope.$apply();
    //    console.log('updating progress: ', vm.progress);
    //},updateInterval*1000);


    vm.getProgClass = function(index){
        //console.log('prog index: ',index);
        if(index < (state.curPathInd)){
            return "completedBar";
        } else if(index == (state.curPathInd)){
            return "currentBar";
        } else {
            return "tbdBar"
        }
    };





    ////////////////////////////////////////
    // UI click on the playlist indicator //
    // sends to the playlist page         //
    ////////////////////////////////////////

    vm.goToPlaylistPage = function(){
        console.log('saw Go To Playlist click');
        window.location.assign('/playlist');
    };


    ///////////////////////////////////////
    // UI click to go to the Manual page //
    ///////////////////////////////////////

    //vm.manualMovement = function(){
    //    console.log('saw Manual Movement click');
    //    window.location.asssign("/manual");
    //};


    ////////////////////////////////////
    // Watch for changes to controls, //
    // -update db  on control changes //
    ////////////////////////////////////

    controls=["main.onoffswitch",
              "main.repeatVal",
              "main.speedSlider.value",
              "main.lightsSlider.value",
              //"main.selected",
              "main.curSisbot"];
    //$scope.$watchGroup(controls, function(oldValue, newValue){
    //    captureUIState();
    //    }
    //);

    vm.sendState = function(){
        captureUIState();
    };

    /////////////////////////////////////////////////////////
    // Capture state on UI button click during development //
    /////////////////////////////////////////////////////////

    //vm.captureUIState=function(){
    //    console.log('saw capture state click');
    //    console.log('******** new switch: ',vm.onoffswitch);
    //    captureUIState();
    //};


    /////////////////////////
    //Have sisbot find home//
    /////////////////////////

    vm.goHome = function(){
        socket.emit('goHome');
    };



    //////////////////////////////////////////////////
    // Capture the state of the user interface (UI) //
    // and send it to the database                  //
    //////////////////////////////////////////////////

    function captureUIState(){
        console.log('********************************');
        console.log('* clientAp: capturing UI state *');
        console.log('********************************');
        console.log('clientAp: curSisbot: ',vm.curSisbot);

        // update the state object from UI inputs

        // determine the status from the on/off and play/pause switches
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

        //test paths array for development only
        //state.paths=["apache1", "circam2s", "foxwarp2", "zowie", "weinerdog"];

        //console.log('clientApp: updating the sisbot and sending this state object for sisbot');
        console.log(state);

        // send new state to the sisbot
        socket.emit('statechange',state);

        // update the state in the Sisbot db
        $http({
            method: "POST",
            url:    "sis/putState",
            data:  state
        }).then(function(response) {
            console.log('clientApp: send state completed');
            console.log(response);
        }).then(function(resp){

            // update the curSisbot in the User db
            var curSisbotObject = {curSisbot: vm.curSisbot};
            console.log('clientApp: update user:curSisbot');
            console.log(curSisbotObject);
            $http({
                method: "POST",  //update the state
                url:    "acct/updateUser",
                data:  curSisbotObject
            }).then(function(resp){
                console.log(resp);
            })
        });
    }


    //////////////////////
    // UI logout button //
    //////////////////////

    // shut down progress timer and log out
    vm.logout = function(){
        console.log('clientApp: saw log out click');
        console.log('shutting down progress update clock')
        clearInterval(progressKey);
        //log out and redirect
        $http.get('/logout').then(function () {
            window.location.href = '/';
        });
    };

    ///////////////////////////////////////////
    // UI changeState button for development //
    // - simulates a state change in the UI  //
    // **remove for normal operation
    ///////////////////////////////////////////

    // send a test statechange message to sisbot
    vm.changeState = function() {
        console.log('clientApp: saw change state click');
        var changes = {
            status:'paused',
            speed:10
        };
        socket.emit('statechange',changes);
    };


    /////////////////////////////////////////////////////////////
    // Received a statechange message from another controller. //
    // Update this database UI.                                //
    /////////////////////////////////////////////////////////////

    socket.on('statechange',function(newState) {
        console.log('clientApp:statechange received from sisbot');
        state = newState;
        console.log(state);
        displayUIdata();
    });

    vm.simulateStateChange = function(){
        console.log('clientApp:simulated statechange received from sisbot');
        state = newState;
        displayUIdata();
    };




    ////////////////////////////////////////////
    // Path Complete received from the sisbot //
    //  - update UI curPathInd, progress      //
    ////////////////////////////////////////////

    // for development only, execute this function un click of the capture state button
    // **remove or comment out for normal operation
    vm.simulatePathComplete=function() {
        console.log('saw click on simulated pathcomplete message');
    ////////////////////////////////////////////////////////////////////////////////////

        // **for normal operation, remove above code and uncomment the line below
        //socket.on('pathcomplete',function() {
        console.log('clientApp:pathcomplete received from sisbot');

        // update current path index and progress

        // Pathcomplete should only happen in play mode. Otherwise disregard.
        if (state.status == 'play') {
            // if not done with playlist start next path
            if (state.curPathInd < (state.paths.length - 1)) {
                state.curPathInd++;
                state.progress = 0;
                //console.log('clientApp:pathcomplete: increment curPathInd: ', state.curPathInd);
            // if repeating, set to the first path
            } else if (state.repeat == true) {
                state.curPathInd = 0;
                state.progress = 0;
                //console.log('clientApp:pathcomplete: zero curPathInd: ', state.curPathInd);
            // otherwise playlist is done, change status to pause and set progress to 100%.
            } else {
                state.status = "pause";
                state.progress = 100;
                //console.log('clientApp:pathcomplete: leave curPathInd alone: ', state.curPathInd);
            }
        }

        // Update the database with new curPathInd and Progress
        console.log('clientApp:pathcomplete: updating db');
        console.log(state);
        $http({
            method: "POST",
            url: "sis/putState",
            data: state
        }).then(function (response) {
            console.log('clientApp:pathcomplete send state completed');
            console.log(response);
        //refresh UI
        }).then(function (resp) {
            console.log('clientApp:pathcomplete: update UI from db');
            getStateFromDb();
        });
        socket.emit('statechange',state);
    };
    //});  // normal close


    var manualHtmlString =
        '<div class="manualWrapper" ng-controller="ManualController as man">' +
            '<div class="manual row">' +
                '<div class="col-xs-4 left">' +
                    '<div id="turnCW" class="turn" ng-mousedown="man.jog(\'theta\',\'pos\')" ng-mouseleave="man.stop();" ng-mouseup="man.stop();">' + '<i class="fa fa-rotate-right"></i></div>' +
                '</div>' +
                '<div class="col-xs-4 mid">' +
                    '<div id="moveOut" class="move" ng-mousedown="man.jog(\'rho\',\'pos\')" ng-mouseleave="man.stop();" ng-mouseup="man.stop();"><i class="fa fa-upload"></i></div>' +
                    '<div id="goHome" class="move" ng-mousedown="man.goHome()"><i class="fa fa-bullseye"></i></div>' +
                    '<div id="moveIn" class="move" ng-mousedown="man.jog(\'rho\',\'neg\')" ng-mouseleave="man.stop();" ng-mouseup="man.stop();"><i class="fa fa-download"></i></div>' +
                '</div>' +
                '<div class="col-xs-4 right">' +
                    '<div id="turnCCW" class="turn" ng-mousedown="man.jog(\'theta\',\'neg\')" ng-mouseleave="man.stop();" ng-mouseup="man.stop();"><i class="fa fa-rotate-left"></i></div>' +
                '</div>' +
            '</div>' +
        '</div>';

    //Angular 2 version of dialog?
    function showAlert() {
        console.log('show alert');
        console.log($mdDialog);
        var alert = $mdDialog.alert({
            title: 'Manual Jog',
            //content: 'This is an example of how easy dialogs can be!',
            content: manualHtmlString,
            ok: 'Close'
        });
        $mdDialog
            .show( alert )
            .finally(function() {
                alert = undefined;
            });
    }

    vm.manualMovement = showAlert;

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
        if(vm.acct.password === vm.acct.confirm){
            $http.post('/acct/register',vm.acct).then(function (resp) {
                console.log(resp.data.message);
                if(resp.data.loggedIn) window.location.href="/";
            });
        }
        else {
            vm.acct.password = "";
            vm.acct.confirm = "";
            $(".login-password").addClass("nomatch");
            $(".reg-password-confirm").addClass("nomatch");
            vm.nomatch = true;
        }
    };

}]);

app.controller('ManualController', [function() {
    var vm = this;


    vm.test = function(){
        console.log('test');
    };


    ////////////////////////////////
    //Send a jog command to sisbot//
    ////////////////////////////////

    vm.jog = function (axis,dir) {
        console.log('sending jog');
        vm.jogging = setInterval(sendJog,40,axis,dir);
    };

    vm.stop = function(){
        console.log('stop jogging');
        clearInterval(vm.jogging);
    };

    function sendJog(axis,dir){
        console.log('jog');
        socket.emit('jog',{axis:axis,dir:dir});
    }



    vm.goHome = function(){
        socket.emit('goHome');
    }

}]);