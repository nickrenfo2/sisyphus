var mongoose = require('mongoose');

var PathSchema = new mongoose.Schema({
    name:{type:String, required:true}, //filename of path - primary unique key
    desc:String, //title or description of path
    startR:Number, //0 or 1 for starting point of this path
    endR:Number, //0 or 1 for end point of this path
    steps:Number, //number of steps in path
    sisbots:[String],
    path:[String] //the actual contents of the path file

});

module.exports = mongoose.model('Path',PathSchema);