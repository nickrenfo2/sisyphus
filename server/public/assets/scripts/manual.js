/**
 * Created by Nick on 11/17/15.
 */
var socket = io();
socket.on('connect', function () {
    console.log('socket connected');
});

var app = angular.module('sisApp');
angular.controller('ManualController', [function() {

}]);