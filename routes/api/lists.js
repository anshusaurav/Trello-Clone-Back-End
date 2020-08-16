var router = require("express").Router();
var mongoose = require("mongoose");
var util = require("util")
var User = mongoose.model("User");
var Team = mongoose.model("Team");
var Board = mongoose.model("Board");
var List = mongoose.model("List");
var auth = require("../auth");
router.param("lists", function (req, res, next, slug) {
    List.findOne({ slug })
        .then(function (list) {
            if (!list) {
                return res.sendStatus(404);
            }

            req.list = list;
            console.log("list assigned");
            return next();
        })
        .catch(next);
});
/**
 * List can be added for any board, private or public.
 * For adding a list to private board user must be owner of the board
 * For adding a list to public board user must be either owner or member of the 
 */
router.post("/", auth.required, function (req, res, next) {
    console.log(req.payload);
    User.findById(req.payload.id).then(function (user) {
        if (!user) {
            return res.sendStatus(401);
        }
        // util.inspect(req.body.board);
        const { name } = req.body.list;
        var board = new Board({
            name, isPrivate, image
        })
        board.owner = user;
        if (!isPrivate) {
            return Team.findById(req.body.board.team).then(function (team) {
                team.populate("members")
                    .execPopulate()
                    .then(function (team) {
                        if (team.isMember(user) || team.isOwner(user)) {
                            board.team = req.body.board.team;
                            return board.save().then(function (board) {
                                board.populate({
                                    path: 'owner',
                                    select: '-salt -__v -hash'
                                })
                                    .populate({
                                        path: 'team',
                                        populate: {
                                            path: 'members owner',
                                            select: '-salt -__v -hash'
                                        }
                                    })
                                    .execPopulate()
                                    .then(function (board) {
                                        return res.json({ board: board._doc })
                                    })
                            })
                        }
                        return res.status(401).send("You don't belong here");

                    })
            })
        }
        else {
            return board.save().then(function () {
                return res.json({ board: board.toBoardJSON() })
            })
        }

    })
});
module.exports = router