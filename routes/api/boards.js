var router = require("express").Router();
var mongoose = require("mongoose");
var util = require("util")
var User = mongoose.model("User");
var Team = mongoose.model("Team");
var Board = mongoose.model("Board");
var auth = require("../auth");
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


router.get('/', auth.required, function (req, res, next) {
    var limit = 20;
    var offset = 0;
    if (typeof req.query.limit !== "undefined") {
        limit = req.query.limit;
    }

    if (typeof req.query.offset !== "undefined") {
        offset = req.query.offset;
    }

    User.findById(req.payload.id).then(function (user) {
        if (!user) {
            return res.sendStatus(401);
        }
        Promise.all([
            Team.find({ owner: user._doc._id })
                .limit(Number(limit))
                .skip(Number(offset))
                .sort({ createdAt: "desc" })
                .populate("owner")
                .populate("members")
                .populate("boards")
                .exec(),
            Team.count({ owner: user.id }),
        ])
            .then(function (results) {
                var teams = results[0];
                var teamCount = results[1];
                console.log(teams);
                return res.json({
                    teams: teams.map(function (team) {
                        return team.toTeamJSON();
                    }),
                    teamCount: teamCount,
                });
            })
            .catch(next);
    });
})
/**
 * Board can either be added by member of owner of team for a team
 * All users can create personal boards.
 */
router.post("/", auth.required, function (req, res, next) {
    console.log(req.payload);
    User.findById(req.payload.id).then(function (user) {
        if (!user) {
            return res.sendStatus(401);
        }
        util.inspect(req.body.board);
        const { name, isPrivate, image } = req.body.board;
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
                        return res.sendStatus(401);

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

router.get('/private', auth.required, function (req, res, next) {

})
router.get('/:slug', auth.required, function (req, res, next) {

})
module.exports = router