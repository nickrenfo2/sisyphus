var mongoose = require('mongoose');

var PathSchema = new mongoose.Schema({
    name:{type:String, required:true,index:{unique:true}}, //filename of path - primary unique key
    desc:String, //title or description of path
    start:Number, //0 or 1 for starting point of this path
    end:Number, //0 or 1 for end point of this path
    steps:Number, //number of steps in path
    path:[String] //the actual contents of the path file

});