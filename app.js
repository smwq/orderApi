var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var passport = require("passport");
var LocalStrategy = require("passport-local");
var Item = require("./models/item");
var Order = require("./models/order");
var User = require("./models/user");

mongoose.connect("mongodb://localhost/order_api");
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.static(__dirname + "/public"));
app.set("view engine", "ejs");

// PASSPORT CONFIGURATION
app.use(require("express-session")({
    secret: "Order again",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function (req, res, next) {
    res.locals.currentUser = req.user;
    next();
});

//================================================================================================================

app.get("/items", isLoggedIn, function (req, res) {
    Item.find({}, function (err, allItems) {
        if (err) {
            console.log(err);
        } else {
            res.json(allItems);
        }
    });
});

app.post("/items", isLoggedIn, function (req, res) {
    if (req.user.userType == "admin") {
        var newItem = {
            name: req.body.name,
            category: req.body.category,
            address: [req.body.loc1, req.body.loc2]
        };
        Item.create(newItem, function (err, addedItem) {
            if (err) {
                res.json(err);
            } else {
                res.json(addedItem);
            }
        });
    } else {
        res.json("Only admin can add items.")
    }
});

// =====================================================================================================

app.post("/items/:id/order", isLoggedIn, function (req, res) {
    if (req.user.userType == "customer") {
        Item.findById(req.params.id, function (err, item) {
            if (err) {
                res.json(err);
            } else {
                if (req.user.orders.length == 0) {
                    Order.create({
                        customer: {
                            id: req.user._id,
                            username: req.user.username
                        },
                        orderStage: "order in cart"
                    }, function (err, order) {
                        if (err) {
                            res.json(err);
                        } else {
                            var itemToAdd = {
                                id: item._id,
                                quantity: req.body.quantity,
                                pickupLocation: item.address[0]
                            };
                            order.items.push(itemToAdd);
                            order.save(function (err, orderInfo) {
                                if (err) {
                                    res.json(err);
                                } else {
                                    req.user.orders.push(orderInfo);
                                    req.user.save();
                                    res.json(orderInfo);
                                }
                            });
                        }
                    });
                } else {
                    Order.findOne({
                        orderStage: "order in cart"
                    }, function (err, order) {
                        if (err) {
                            res.json(err);
                        } else {
                            var itemToAdd = {
                                id: item._id,
                                quantity: req.body.quantity,
                                pickupLocation: item.address[0]
                            };
                            order.items.push(itemToAdd);
                            order.save(function (err, orderInfo) {
                                if (err) {
                                    res.json(err);
                                } else {
                                    req.user.orders.push(orderInfo);
                                    req.user.save();
                                    res.json(orderInfo);
                                }
                            });
                        }
                    });
                }
            }
        });
    } else {
        res.json("Only customers are allowed to order!");
    }
});

// =====================================================================================================

app.get("/orders", isLoggedIn, function (req, res) {
    if (req.user.userType == "admin") {
        Order.find({}, function (err, order) {
            if (err) {
                res.json(err);
            } else {
                res.json(order);
            }
        });
    } else {
        User.findById(req.user._id).populate("orders").exec(function (err, user) {
            if (err) {
                res.json(err);
            } else {
                res.json(user.orders);
            }
        });
    }
});

app.post("/orders", isLoggedIn, function (req, res) {
    if (req.user.userType == "admin") {
        Order.find({
            orderStage: req.body.status
        }, function (err, order) {
            if (err) {
                res.json(err);
            } else {
                res.json(order);
            }
        });
    } else {
        res.json("Only admin can filter orders.");
    }
});

// ==========================================================================================================

app.post("/orders/:id/status", isLoggedIn, function (req, res) {
    if (req.user.userType == "admin" || req.user.userType == "delivery") {
        Order.findById(req.params.id).populate("items").exec(function (err, order) {
            if (err) {
                res.json(err);
            } else {
                order.orderStage = req.body.status;
                order.save(function (err, orderInfo) {
                    if (err) {
                        res.json(err);
                    } else {
                        res.json(orderInfo);
                    }
                });
            }
        });
    } else {
        res.json("Only admin and delivery can update status.")
    }
});


// =====================================================================================================
// AUTH ROUTES
// =====================================================================================================

app.post("/register", function (req, res) {
    var newUser = new User({
        username: req.body.username,
        userType: req.body.userType.toLowerCase()
    });
    User.register(newUser, req.body.password, function (err, user) {
        if (err) {
            console.log(err);
            res.json(err);
        }
        passport.authenticate("local")(req, res, function () {
            res.json(user);
        });
    });
});

app.post("/login", passport.authenticate("local", {
    successRedirect: "/successjson",
    failureRedirect: "/failurejson"
}), function (req, res) {});

app.get("/logout", function (req, res) {
    req.logout();
    res.json("Logged Out.");
});

app.get("/successjson", function (req, res) {
    res.json(req.user);
});

app.get("/failurejson", function (req, res) {
    res.json("Login failed.");
});

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.json("Please Log In first.");
}

app.listen(8080, function () {
    console.log("The Server has started!");
});