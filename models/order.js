var mongoose = require("mongoose");

var orderSchema = new mongoose.Schema({
    items: [{
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Item"
        },
        quantity: Number,
        pickupLocation: String
    }],
    deliveryPerson: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    },
    customer: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    },
    orderStage: String
});

module.exports = mongoose.model("Order", orderSchema);