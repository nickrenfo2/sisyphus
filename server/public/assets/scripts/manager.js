/**
 * Created by Nick on 11/13/15.
 */
var app = angular.module('sisApp',['ngMaterial']);
app.controller('PlaylistManagerController', ['$http',function($http) {
    var vm = this;
    vm.imgPath = '/assets/images/';
    vm.playlists = [{
        name:"testing",
        paths:[
            "home",
            "circam2s",
            "zowie1r",
            "e100r"
        ]
    }];

    vm.curPlaylist = {

    };

    vm.savePlaylist = function () {
        $http.post('/savePlaylist', vm.curPlaylist).then(function (resp) {
            console.log(resp.data);
        });
    };
}]);