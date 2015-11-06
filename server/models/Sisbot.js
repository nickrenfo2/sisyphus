var mongoose = require('mongoose');

var SisbotSchema = new mongoose.Schema({
    serial:{type:String,required:true,index:{unique:true}},
    sid:{type:String,required:true},
    state:{
        status:String, //pause, play, sleep
        curPlaylistTitle:String,
        curPlaylist:String,
        curPathInd:Number,
        curPathTitle:String,
        playlists:[String],
        repeat:Boolean,
        paths:[String],
        speed:Number,
        lights:Number,
        timestamp:String
    },
    socketid:String
});

SisbotSchema.pre('save', function (next) {
    var date = new Date();
    this.state.timestamp = date.getTime();
    next();
});

module.exports = mongoose.model('Sisbot',SisbotSchema);