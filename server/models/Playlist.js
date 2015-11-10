var mongoose = require('mongoose');

var playlistSchema = new mongoose.Schema({
    name:String, //filename of playlist
    title:String, //user-given title/description of playlist
    paths:[{
        name:String,
        vel:String,
        accel:String,
        thvmax:String
    }] //list of path filenames
});

module.exports = mongoose.model('Playlist',playlistSchema);