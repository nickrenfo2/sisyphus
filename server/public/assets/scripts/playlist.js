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
        spacing: -0.5,
        click: true,
        keyboard: true,
        scrollwheel: true,
        touch: true,
        nav: false,
        buttons: false,
        buttonPrev: 'Previous',
        buttonNext: 'Next',
        onItemSwitch: false
   });

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
    vm.playlist = ['/assets/images/fuzzybunny.jpg','/assets/images/kiwibird.jpg','/assets/images/littleowl.jpg','/assets/images/puppies.jpg','/assets/images/silkies.jpg'];

}]);




