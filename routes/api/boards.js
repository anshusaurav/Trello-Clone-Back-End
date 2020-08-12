var router = require("express").Router();
var mongoose = require("mongoose");
var User = mongoose.model("User");
var Team = mongoose.model("Team");
var Board = mongoose.model("Board");
router.param("boards", function (req, res, next, slug) {
    Board.findOne({ slug })
        .then(function (board) {
            if (!board) {
                return res.sendStatus(404);
            }

            req.board = board;
            console.log("team assigned");
            return next();
        })
        .catch(next);
});

module.exports = router