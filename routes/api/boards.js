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

/**
 * Get all private boards
 */
router.get('/private', auth.required, function (req, res, next) {
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
            Board.find({ owner: user, isPrivate: true })
                .limit(Number(limit))
                .skip(Number(offset))
                .sort({ createdAt: "desc" })
                .exec(),
            Board.count({ owner: user._doc._id, isPrivate: true }),
        ])
            .then(function (results) {
                var boards = results[0];
                var boardCount = results[1];
                return res.json({
                    boards: boards.map(function (board) {
                        return board._doc;
                    }),
                    boardCount
                });
            })
            .catch(next);
    });

})

/**
 * Get all boards of particular team's slug
 */
router.get('/team/:slug', auth.required, function (req, res, next) {
    var limit = 20;
    var offset = 0;
    const { slug } = req.params;
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
        Team.findOne({ slug }).then(function (team) {
            console.log(user._doc.username);
            if (!team)
                return res.status(401).send("No such team found");
            if (!(team.isMember(user) || team.isOwner(user)))
                return res.status(401).send("You don't belong here");
            Promise.all([
                Board.find({ team: team._id })
                    .limit(Number(limit))
                    .skip(Number(offset))
                    .sort({ createdAt: "desc" })
                    .populate({
                        path: 'team',
                        populate: {
                            path: 'members owner',
                            select: '-salt -__v -hash'
                        }
                    })
                    .exec(),
                Board.count({ team }),
            ])
                .then(function (results) {
                    var boards = results[0];
                    var boardCount = results[1];
                    return res.json({
                        boards: boards.map(function (board) {
                            return board._doc;
                        }),
                        boardCount
                    });
                })
                .catch(next);
        })

    });
})

/**
 * Get single board by slug
 */
router.get('/:slug', auth.required, function (req, res, next) {
    const { slug } = req.params;
    User.findById(req.payload.id).then(function (user) {
        if (!user) {
            return res.sendStatus(401);
        }
        return Board.findOne({ slug: slug }).then(function (board) {
            board.populate({
                path: 'owner',
                selct: '-salt -__v -hash'
            })
                .populate({
                    path: 'team',
                    populate: {
                        path: 'members owner',
                        select: '-salt -__v -hash'
                    }
                })
                .execPopulate()
                .then(function (team) {
                    return res.json({ board: board._doc });
                });
        });

    })
})


/**
 * Delete board by slug
 * 
 */

router.delete("/:slug", auth.required, function (req, res, next) {
    const { slug } = req.params;
    Promise.resolve(req.payload ? User.findById(req.payload.id) : null)
        .then(function (user) {
            Team.findOne({ slug }).then(function (team) {
                console.log(team)
                team.populate("owner")
                    .populate("members")
                    .populate("boards")
                    .execPopulate()
                    .then(function (team) {
                        if (team.owner._id.toString() === user.id.toString()) {
                            team.remove().then(function () {
                                return res.json({ team: team.toTeamJSON() });

                            });
                        } else {
                            return res.sendStatus(403);
                        }
                    });
            });
        })

        .catch(next);
})
module.exports = router