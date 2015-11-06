/**
 * Created by Nick on 11/4/15.
 */

var socket = io();
socket.on('connect', function () {
//            socket.emit('myTest');
});

var app = angular.module('sisApp',[]);


app.controller('MainController',['$http', function ($http) {
    var vm = this;

    vm.logout = function(){
        $http.get('/logout').then(function () {
            window.location.href = '/';
        });
    };

    vm.changeState = function(){
        var changes = {
            status:'paused',
            speed:10
        };


        socket.emit('statechange',changes);
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