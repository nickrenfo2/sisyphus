/**
 * Created by johnvang on 11/5/15.
 */
var app = angular.module('sisApp',[]);


app.controller('PlaylistController',['$http', function ($http) {
    var vm = this;
    vm.allPlaylists = [];
    vm.pathsInPlaylist = [];
    vm.selectedPlaylist = [];
    vm.pathlist = [];


    //get call to server for all playlists
    $http.get('/getPlaylists', {withCredentials: true}).then(function(response){
        vm.allPlaylists = response.data;
        console.log(vm.allPlaylists);
    }, function(err){
        console.log('you got an error' + err);
    });

    vm.selected = "Choose Playlist";
    vm.submit = function(){
        var selected = vm.selected;
        console.log("selected: " + selected);
        //this loop extracts the selected playlist (array of individual paths) from allPlaylists
        //for(var i=0; i<vm.allPlaylists.length; i++){
        //    if(vm.allPlaylists[i].name === selected){
        //        console.log(vm.allPlaylists[i].paths);
        //        vm.selectedPlaylist = vm.allPlaylists[i];
        //    }
        //}
        ////vm.pathlist = vm.getPathList();
        //console.log('pathlist:',vm.pathlist);
        vm.pathlist = [
            '/assets/images/noPic.png',
            '/assets/images/apache1.png',
            '/assets/images/circam2s.png',
            '/assets/images/dces4p.png',
            '/assets/images/foxwarp2.png',
            '/assets/images/tri1b.png',
            '/assets/images/22222.png',
            '/assets/images/zowie1r.png'
        ];
    };

    //takes in selectedPlaylists, extracts paths, converts paths into src url
    vm.getPathList = function(){
        console.log('in getPathList function');
        console.log(vm.selectedPlaylist);
        var newPathlist = [];
        for(var i=0; i<vm.selectedPlaylist.paths.length; i++){
            var path = '/assets/images/' + vm.selectedPlaylist.paths[i].name + '.png';
            console.log(path);
            newPathlist.push(path);
        }
        return newPathlist;
    };




    vm.startHere = function(){
        console.log('in startHere function');

    };

    vm.startBeginning = function(){
        console.log('in startBeginning function');
    };

}]);


$(function(){

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
        onItemSwitch: function onChangeFunction(newItem,oldItem){
            getnewItem(newItem);
        }
    });

    var currentItem = "";
    function getnewItem(newItem){
        //console.log('in getnewItem function');
        //console.log(newItem);
        currentItem = $(newItem).attr("data-ind");
        console.log(currentItem);
    }




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






