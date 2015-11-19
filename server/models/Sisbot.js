var mongoose = require('mongoose');

var SisbotSchema = new mongoose.Schema({
    serial:{type:String,required:true,index:{unique:true}},
    sid:{type:String,required:true},
    state:{
        status:String,      //pause, play, sleep
        curPlaylist:String, //filename of current playlist
        curPathInd:Number,  //index of current path in playlist
        progress:Number,    //percent completed in current path
        repeat:Boolean,     //whether or not to repeat the playlist upon completion
        paths:[String],     //Array of paths in current playlist
        speed:Number,       //1-10 value for speed of path
        lights:Number,      //0-10 value for intensity of lights
        timestamp:String    //Last updated time of this state object
    },
    socketid:String // id of websockets connection
});

SisbotSchema.pre('save', function (next) {
    var date = new Date();
    this.state.timestamp = date.getTime();
    next();
});

module.exports = mongoose.model('Sisbot',SisbotSchema);