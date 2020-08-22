var router = require("express").Router();
var mongoose = require("mongoose");
var util = require("util")
var User = mongoose.model("User");
var Team = mongoose.model("Team");
var Board = mongoose.model("Board");
var Issue = mongoose.model("Issue");
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


// router.get('/', auth.required, function (req, res, next) {
//     var limit = 20;
//     var offset = 0;
//     if (typeof req.query.limit !== "undefined") {
//         limit = req.query.limit;
//     }

//     if (typeof req.query.offset !== "undefined") {
//         offset = req.query.offset;
//     }

//     User.findById(req.payload.id).then(function (user) {
//         if (!user) {
//             return res.sendStatus(401);
//         }
//         Promise.all([
//             Team.find({ owner: user._doc._id })
//                 .limit(Number(limit))
//                 .skip(Number(offset))
//                 .sort({ createdAt: "desc" })
//                 .populate("owner")
//                 .populate("members")
//                 .populate("boards")
//                 .exec(),
//             Team.count({ owner: user.id }),
//         ])
//             .then(function (results) {
//                 var teams = results[0];
//                 var teamCount = results[1];
//                 console.log(teams);
//                 return res.json({
//                     teams: teams.map(function (team) {
//                         return team.toTeamJSON();
//                     }),
//                     teamCount: teamCount,
//                 });
//             })
//             .catch(next);
//     });
// })

/**
 * Board can either be added by member or  owner of team for a team
 * All users can create their personal boards.
 */
router.post("/", auth.required, function (req, res, next) {
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
                if (team.isMember(user.id) || team.isOwner(user.id)) {
                    team.populate("members")
                        .execPopulate()
                        .then(function (team) {
                            board.team = req.body.board.team;
                            team.addBoard(board.id);
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
                                        },
                                        select: '-__v'
                                    })
                                    .execPopulate()
                                    .then(function (board) {
                                        return res.json({ board: board._doc })
                                    })
                            })
                        })
                } else
                    return res.status(401).send("You don't belong here");

            });
        }
        else {
            return board.save().then(function () {
                return res.json({ board: board.toBoardJSON() })
            })
        }

    }).catch(next);
});

/**
 * Get all private boards for loggedin user
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
            Board.count({ owner: user, isPrivate: true }),
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
    }).catch(next);

})

/**
 * Get all boards of particular team's slug if user is member or owner of that 
 * team
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
            if (!team)
                return res.status(401).send("No such team found");
            if (!(team.isMember(user.id) || team.isOwner(user.id)))
                return res.status(401).send("You don't belong here");
            Promise.all([
                Board.find({ team })
                    .limit(Number(limit))
                    .skip(Number(offset))
                    .sort({ createdAt: "desc" })
                    .populate({
                        path: 'team',
                        populate: {
                            path: 'members owner',
                            select: '-salt -__v -hash'
                        },
                        select: '-__v'
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
        })

    }).catch(next);
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
        return Board.findOne({ slug }).then(function (board) {
            board.populate({
                path: 'owner',
                select: '-salt -__v -hash'
            })
                .populate({
                    path: 'team',
                    populate: {
                        path: 'members owner',
                        select: '-salt -__v -hash'
                    },
                    select: '-__v'
                })
                .execPopulate()
                .then(function (board) {
                    return res.json({ board });
                });
        });

    }).catch(next);
})

router.put("/:slug", auth.required, function (req, res, next) {
    const { slug } = req.params;
    Promise.resolve(req.payload ? User.findById(req.payload.id) : null)
        .then(function (user) {
            Board.findOne({ slug }).then(function (board) {
                if (!board)
                    return res.status(401).send("No such board found");
                if (typeof req.body.board.name !== 'undefined') {
                    board.name = req.body.board.name
                }
                if (typeof req.body.board.image !== 'undefined') {
                    board.image = req.body.board.image
                }
                if (board.owner._id.toString() === user.id.toString()) {
                    board.save().then(function () {
                        return res.json({ board: board._doc });
                    });
                } else {
                    return res.status(401).send("You don't belong here");
                }
            });
        })
        .catch(next);
})
/**
 * Delete board by slug
 * 
 */

router.delete("/:slug", auth.required, function (req, res, next) {
    const { slug } = req.params;
    Promise.resolve(req.payload ? User.findById(req.payload.id) : null)
        .then(function (user) {
            Board.findOne({ slug }).then(function (board) {
                if (!board)
                    return res.status(401).send("No such board found");
                if (board.owner._id.toString() === user.id.toString()) {
                    board.remove().then(function () {
                        return res.json({ board: board._doc });
                    });
                } else {
                    return res.status(401).send("You don't belong here");
                }
            });
        })
        .catch(next);
})
module.exports = router