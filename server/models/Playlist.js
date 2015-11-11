var mongoose = require('mongoose');

var playlistSchema = new mongoose.Schema({
    name:String, //filename of playlist
    title:String, //user-given title/description of playlist
    paths:[{
        id:String,
        name:String,//path filename
        pathid:String, //mongo ID of path
        vel:String, //velocity
        accel:String, //acceleration
        thvmax:String //theta velocity max
    }],
    sisbots:[String],
    user:String, //user that owns the playlist
    public:Boolean //whether or not the playlist is public
});

module.exports = mongoose.model('Playlist',playlistSchema);