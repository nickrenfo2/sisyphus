/**
 * Created by johnvang on 11/5/15.
 */
$(function(){

    var allPlaylists = [];
    var selectedPlaylist = [];
    var pathlist = [];
    var currentItem = "";
    var updatedState = {};

    $.get("/sis/getState", {withCredentials:true}, function(data){
        updateObj = data;
        //console.log(updateObj);
        //console.log(updateObj.state.curPlaylist);
        curPlaylist = updateObj.state.curPlaylist;
    });

    //get call to server for all playlists
    $.get("/getPlaylists", {withCredentials:true}, function(data){
        allPlaylists = data;
        //console.log(allPlaylists);
        for (var i=0; i<allPlaylists.length; i++){
            var playlist = allPlaylists[i].name;
            var menuItem = "<option value=\"" + playlist + "\">" + playlist + "</option>";
            $(".playlist-select").append(menuItem);
        }
        $("select").val(curPlaylist);
    }).done(function(){
        console.log('in getPlaylists dot done');
        $(".flipster").remove();
        getPaths();
    });

    //this function calls the flipster function and it's config
    function genCoverflow() {
        $('.flipster').flipster({
            itemContainer: 'ul',
            itemSelector: 'li',
            start: 0,
            fadeIn: 50,
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
        updateObj.state.curPathInd = currentItem;
        console.log(currentItem);
    }


    //gets the list of paths from the selected playlist in dropdown menu
    $('.playlist-select').change(function() {
        $(".flipster").remove();
        getPaths();
    });

    function getPaths(){
        console.log('in getPaths');
        var selected = $(".playlist-select option:selected").text();
        //console.log(selected);
        for (var i=0; i<allPlaylists.length; i++){
            if(selected === allPlaylists[i].name){
                //console.log(allPlaylists[i].paths);
                selectedPlaylist = allPlaylists[i];
                updateObj.state.curPlaylist = allPlaylists[i].name;
                //console.log(selectedPlaylist);
            }
        }
        pathlist = getPathSource();
        //console.log(pathlist);
        displayPaths();
    }


    //returns array of local img source urls for paths
    function getPathSource(){
        //console.log(selectedPlaylist);
        var newPathlist = [];
        //var pathNames = [];
        for(var i=0; i<selectedPlaylist.paths.length; i++){
            var path = '/assets/images/' + selectedPlaylist.paths[i].name + '.png';
            newPathlist.push(path);
            //pathNames.push(selectedPlaylist.paths[i].name);
        }
        //updateObj.state.paths = pathNames;
        //console.log(updateObj.state.paths);
        return newPathlist;
    }

    //appends path img src urls to DOM
    function displayPaths(){
        console.log('in display paths');
        $(".appendFlipster").append("<div class='flipster'></div>");
        var tempUl = $('<ul/>').addClass('items').appendTo('.flipster');
        for(var i=0; i<pathlist.length; i++){
            var $path =  "<li><img id=\"" + i + "\" src=\"" + pathlist[i] + "\" onerror=\"src='/assets/images/noPic.png'\"/></li>";
            console.log($path);
            tempUl.append($path);
        }
        genCoverflow();
    }

    $(".startHere-button").click(function(){
        console.log(updateObj);
        console.log(updateObj.state);
        console.log(updateObj.state.paths);
        $.post("/sis/putState", updateObj.state, function(data, status){
            console.log(data);
            console.log(status);
            window.location.assign('/');
        })
    });

    $(".startBeginning-button").click(function(){
        updateObj.state.curPathInd = "0";
        console.log(updateObj);
        console.log(updateObj.state.paths);
        $.post("/sis/putState", updateObj.state, function(data, status){
            console.log(data);
            console.log(status);
            window.location.assign('/');
        })
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

