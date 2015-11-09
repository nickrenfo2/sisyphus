var mongoose = require('mongoose');

var playlistSchema = new mongoose.Schema({
    name:String, //filename of playlist
    title:String, //user-given title/description of playlist
    paths:[String] //list of path filenames
});