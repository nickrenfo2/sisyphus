var mongoose = require('mongoose');

var playlistSchema = new mongoose.Schema({
    name:String,
    title:String,
    paths:[String]
});