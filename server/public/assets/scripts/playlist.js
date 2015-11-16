/**
 * Created by johnvang on 11/5/15.
 */
$(function(){

    var allPlaylists = [];
    var selectedPlaylist = [];
    var pathlist = [];
    var currentItem = "";
    var stateUpdates = {};
        stateUpdates.curPlaylist = {};
        stateUpdates.curPathInd = "0";
        stateUpdates.paths = [];

    var myFlipster = $('.flipster').flipster();


    //get call to server for all playlists
    $.get("/getPlaylists", {withCredentials:true}, function(data){
        allPlaylists = data;
        //console.log(allPlaylists);
        for (var i=0; i<allPlaylists.length; i++){
            var playlist = allPlaylists[i].name;
            var menuItem = "<option value='" + playlist + "'>" + playlist + "</option>";
            $(".playlist-select").append(menuItem);
        }
    });

    //this function calls the flipster function and it's config
    function genCoverflow() {
        $('.flipster').flipster({
            itemContainer: 'ul',
            itemSelector: 'li',
            start: 0,
            fadeIn: 400,
            loop: true,
            autoplay: false,
            pauseOnHover: true,
            style: 'carousel',
            spacing: -0.6,
            click: true,
            keyboard: true,
            scrollwheel: true,
            touch: true,
            nav: false,
            buttons: false,
            buttonPrev: 'Previous',
            buttonNext: 'Next',
            onItemSwitch: function onChangeFunction(newItem, oldItem) {
                getnewItem(newItem);
            }
        });
    }

    //gets index of current path displayed on coverflow
    function getnewItem(newItem){
        currentItem = $(newItem).find("img").attr("id");
        stateUpdates.curPathInd = currentItem;
        console.log(currentItem);
    }


    //gets the list of paths from the selected playlist in dropdown menu
    $('.playlist-select').change(function() {
        $(".flipster").remove();
        var selected = $(".playlist-select option:selected").text();
        //console.log(selected);
        for (var i=0; i<allPlaylists.length; i++){
            if(selected === allPlaylists[i].name){
                //console.log(allPlaylists[i].paths);
                selectedPlaylist = allPlaylists[i];
                stateUpdates.curPlaylist = allPlaylists[i];
                console.log(selectedPlaylist);
            }
        }
        pathlist = getPathList();
        //console.log(pathlist);
        getPaths();
    });


    //returns array of local img source urls for paths
    getPathList = function(){
        //console.log(selectedPlaylist);
        var newPathlist = [];
        stateUpdates.paths = [];
        for(var i=0; i<selectedPlaylist.paths.length; i++){
            var path = '/assets/images/' + selectedPlaylist.paths[i].name + '.png';
            newPathlist.push(path);
            stateUpdates.paths.push(selectedPlaylist.paths[i].name);
        }
        return newPathlist;
    };

    //appends path img src urls to DOM
    function getPaths(){
        $(".appendFlipster").append("<div class='flipster'></div>");
        var tempUl = $('<ul/>').addClass('items').appendTo('.flipster');
        for(var i=0; i<pathlist.length; i++){
            var $path =  "<li><img id=\"" + i + "\" src=\"" + pathlist[i] + "\" onerror=\"src='/assets/images/noPic.png'\"/></li>";
            //console.log($path);
            tempUl.append($path);
        }
        genCoverflow();
    }

    $(".startHere-button").click(function(){

        console.log(stateUpdates);
    });

    $(".startBeginning-button").click(function(){
        stateUpdates.curPathInd = "0";
        myFlipster.flipster('jump', 0);
        console.log(stateUpdates);
    });


    //vm.selected = "Choose Playlist";
    //vm.submit = function(){
    //    var selected = vm.selected;
    //    console.log("selected: " + selected);
    //    //this loop extracts the selected playlist (array of individual paths) from allPlaylists
    //    for(var i=0; i<vm.allPlaylists.length; i++){
    //        if(vm.allPlaylists[i].name === selected){
    //            console.log(vm.allPlaylists[i].paths);
    //            selectedPlaylist = vm.allPlaylists[i];
    //        }
    //    }
    //    getPaths(selectedPlaylist);
    //    //vm.pathlist = vm.getPathList();
    //    //console.log('pathlist:',vm.pathlist);
    //};






//Flipster Control Methods
//    var myFlipster = $('.my-flipster').flipster(); // It's best to store the element as a variable for easy reference.
//
//    myFlipster.flipster('next'); // Next item
//    myFlipster.flipster('prev'); // Previous item
//    myFlipster.flipster('jump', 0); // Jump to a specific index
//    myFlipster.flipster('jump', $('.my-item')); // Jump to a specific item
//    myFlipster.flipster('play'); // Resume autoplay
//    myFlipster.flipster('play', 5000); // Set autoplay duration
//    myFlipster.flipster('pause'); // Pause the autoplay
//    myFlipster.flipster('index'); // If items are added or removed, you can tell Flipster to reindex
//

});


//var app = angular.module('sisApp',[]);
//
//
//app.controller('PlaylistController',['$http', function ($http) {
//    var vm = this;
//    vm.allPlaylists = [];
//    vm.pathsInPlaylist = [];
//    vm.selectedPlaylist = [];
//    vm.pathlist = [];
//
//
//    //get call to server for all playlists
//    $http.get('/getPlaylists', {withCredentials: true}).then(function(response){
//        vm.allPlaylists = response.data;
//        console.log(vm.allPlaylists);
//    }, function(err){
//        console.log('you got an error' + err);
//    });
//
//    vm.selected = "Choose Playlist";
//    vm.submit = function(){
//        var selected = vm.selected;
//        console.log("selected: " + selected);
//        //this loop extracts the selected playlist (array of individual paths) from allPlaylists
//        for(var i=0; i<vm.allPlaylists.length; i++){
//            if(vm.allPlaylists[i].name === selected){
//                console.log(vm.allPlaylists[i].paths);
//                selectedPlaylist = vm.allPlaylists[i];
//            }
//        }
//        getPaths(selectedPlaylist);
//        //vm.pathlist = vm.getPathList();
//        //console.log('pathlist:',vm.pathlist);
//    };
//
//
//    function getPaths(selectedPlaylist){
//        console.log(selectedPlaylist);
//        for(var i=0; i<selectedPlaylist.paths.length; i++){
//            var $path = "<li><img src='/assets/images/" + selectedPlaylist.paths[i].name + ".png'><li>";
//            console.log($path);
//            $(".items").append($path);
//        }
//    }
//    //takes in selectedPlaylists, extracts paths, converts paths into src url
//    //vm.getPathList = function(){
//    //    console.log('in getPathList function');
//    //    console.log(vm.selectedPlaylist);
//    //    var newPathlist = [];
//    //    for(var i=0; i<vm.selectedPlaylist.paths.length; i++){
//    //        var path = '/assets/images/' + vm.selectedPlaylist.paths[i].name + '.png';
//    //        console.log(path);
//    //        newPathlist.push(path);
//    //    }
//    //    return newPathlist;
//    //};
//
//
//
//    //vm.pathlist = [
//    //    '/assets/images/noPic.png',
//    //    '/assets/images/apache1.png',
//    //    '/assets/images/circam2s.png',
//    //    '/assets/images/dces4p.png',
//    //    '/assets/images/foxwarp2.png',
//    //    '/assets/images/tri1b.png',
//    //    '/assets/images/22222.png',
//    //    '/assets/images/zowie1r.png'
//    //];
//
//    vm.startHere = function(){
//        console.log('in startHere function');
//
//    };
//
//    vm.startBeginning = function(){
//        console.log('in startBeginning function');
//    };
//
//}]);
//




