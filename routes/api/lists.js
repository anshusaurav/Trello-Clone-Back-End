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
router.post("/:slug", auth.required, function (req, res, next) {
    const { slug } = req.params;
    User.findById(req.payload.id).then(function (user) {
        if (!user) {
            return res.sendStatus(401);
        }
        // util.inspect(req.body.board);
        const { name } = req.body.list;
        var list = new List({
            name
        })
        return Board.findOne({ slug }).then(function (board) {
            if (!board) {
                return res.status(401).send('No such board found');
            }
            list.board = board.id;
            if (board.isPrivate) {
                if (board.isOwner(user.id)) {
                    return list.save().then(function (list) {
                        board.addList(list.id)
                        return res.json({ list: list._doc })

                    })
                }
                else {
                    return res.status(401).send('You dont belong here');
                }
            }
            else {
                console.log(user);
                return Team.findById(board.team).then(function (team) {
                    if (team.isOwner(user._id) || team.isMember(user._id)) {
                        return list.save().then(function (list) {
                            board.addList(list.id)
                            return res.json({ list: list._doc })

                        })
                    }
                    else {
                        return res.status(401).send('You dont belong here');
                    }
                })
            }


        })

    })
});
module.exports = router