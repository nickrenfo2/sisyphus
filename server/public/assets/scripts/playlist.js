/**
 * Created by johnvang on 11/5/15.
 */
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
        nav: true,
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


var app = angular.module('sisApp',[]);


app.controller('PlaylistController',['$http', function ($http) {
    var vm = this;

    //get call to server for all playlists
    //$http.get('/getPlaylists', {withCredentials: true}).then(function(response){
    //    this.allPlaylists = response.data;
    //}, function(err){
    //    console.log(err);
    //});

    vm.allPlaylists = [
        {id: "1234", playlist: "list1", paths: [{name: "path1-1"},{name: "path1-2"}, {name: "path1-3"}]},
        {id: "2345", playlist: "list2", paths: [{name: "path2-1"},{name: "path2-2"}, {name: "path2-3"}]},
        {id: "3456", playlist: "list3", paths: [{name: "path3-1"},{name: "path3-2"}, {name: "path3-3"}]}
    ];

    vm.selected = "Choose Playlist";
    vm.submit = function(){
        console.log(vm.selected);
        };

    vm.pathlist = [
        '/assets/images/fuzzybunny.jpg',
        '/assets/images/kiwibird.jpg',
        '/assets/images/littleowl.jpg',
        '/assets/images/puppies.jpg',
        '/assets/images/silkies.jpg',
        '/assets/images/puppy3.jpg',
        '/assets/images/puppy2.jpg',
        '/assets/images/bunnydots.jpg'
    ];


    vm.startHere = function(){
        console.log('in startHere function');

    };

    vm.startBeginning = function(){
        console.log('in startBeginning function');
    };

}]);




