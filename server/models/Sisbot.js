var mongoose = require('mongoose');

var SisbotSchema = new mongoose.Schema({
    serial:{type:String,required:true,index:{unique:true}},
    sid:{type:String,required:true},
    state:{
        status:String, //pause, play, sleep
        curPlaylistName:String,
        curPlaylist:String,
        curPathInd:Number,
        curPathName:String,
        playlists:[String],
        paths:[String],
        timestamp:String
    }
});