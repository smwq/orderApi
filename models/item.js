var mongoose = require("mongoose");

//SCHEMA SETUP
var itemSchema = new mongoose.Schema({
    name: String,
    category: String,
    address: [String]
});

module.exports = mongoose.model("Item", itemSchema);