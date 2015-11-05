/**
 * Created by Nick on 11/4/15.
 */
//$(function () {
//    $('#coverflow').coverflow();
//});

var app = angular.module('sisApp',[]);

app.controller('LoginController',['$http',function ($http) {
    var vm = this;

    vm.itworks = "Hello World";

    vm.login = function(){
        console.log(vm.acct);
        $http.post('/acct/login',vm.acct);
    };

    vm.register = function(){
        console.log('register...');
        console.log(vm.acct);
        $http.post('/acct/register',vm.acct).then(function (resp) {
            if(resp.data.accountStatus)
                console.log('account created');
            if(resp.data.serialStatus)
                console.log('sisbot added');
        });
    }



}]);