var router = require("express").Router();
var mongoose = require("mongoose");
var util = require("util")
var User = mongoose.model("User");
var Team = mongoose.model("Team");
var Board = mongoose.model("Board");
var List = mongoose.model("List");
var auth = require("../auth");
const { model } = require("../../models/List");
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

/**
 * Get all List by board slug
 */
router.get("/:slug", auth.required, function (req, res, next) {
    const { slug } = req.params;

    User.findById(req.payload.id).then(function (user) {
        if (!user) {
            return res.sendStatus(401);
        }
        return Board.findOne({ slug }).then(function (board) {
            Promise.all([
                List.find({ board: board.id })
                    .populate({
                        path: 'issues',
                        populate: {
                            path: 'comments',
                            model: 'Comment'
                        },
                        select: '-__v'
                    })
                    .populate({
                        path: 'issues',
                        populate: {
                            path: 'comments',
                            populate: {
                                path: 'author',
                                model: 'User',
                                select: '-salt -__v -hash'
                            },
                        },
                        select: '-__v'
                    })
                    .sort({ createdAt: "desc" })
                    .exec(),
                List.count({ board: board.id }),
            ])
                .then(function (results) {
                    var lists = results[0];
                    var listCount = results[1];
                    return res.json({
                        lists: lists.map(function (list) {
                            return list._doc;
                        }),
                        listCount: listCount,
                    });
                })
        });
    }).catch(next);
});


/**
 * Delete all list of board with param slug 
 */
router.delete('/:slug', auth.required, function (req, res, next) {
    const { slug } = req.params;
    User.findById(req.payload.id).then(function (user) {
        if (!user) {
            return res.sendStatus(401);
        }
        return Board.findOne({ slug }).then(function (board) {
            if (!board)
                return res.status(401).send('No such board found');
            List.deleteMany({ board: board.id }).then(function (lists) {
                console.log(lists)
                return res.json({ lists });
            })
        })
    }).catch(next);
})



/**
 * Get Single List by slug
 */
router.get('/single/:slug', auth.required, function (req, res, next) {
    const { slug } = req.params;
    User.findById(req.payload.id).then(function (user) {
        if (!user) {
            return res.sendStatus(401);
        }
        return List.findOne({ slug }).then(function (list) {
            if (!list)
                return res.status(401).send('No such list found');
            list.populate({
                path: 'board',
                select: '-__v'
            })
                .populate({
                    path: 'issues',
                    select: '-__v'
                })
                .execPopulate()
                .then(function (list) {
                    return res.json({ list });
                });
        });
    }).catch(next);
})



router.put('/single/:slug', auth.required, function (req, res, next) {
    const { slug } = req.params;
    User.findById(req.payload.id).then(function (user) {
        if (!user) {
            return res.sendStatus(401);
        }
        return List.findOne({ slug }).then(function (list) {
            if (!list)
                return res.status(401).send('No such list found');
            if (typeof req.body.list.name !== 'undefined') {
                list.name = req.body.list.name
            }
            list.populate({
                path: 'board',
                select: '-__v',
            }).populate({
                path: 'issues',
                select: '-__v'
            })
                .execPopulate()
                .then(function (list) {
                    if (list.board.isPrivate) {

                        return Board.findOne({ slug: list.board.slug }).then(function (board) {
                            if (board.isOwner(user.id)) {
                                return list.save().then(function (list) {
                                    // board.removeList(list.id)
                                    return res.json({ list: list._doc })

                                })
                            }
                            else {
                                return res.status(401).send('You dont belong here');
                            }
                        })

                    }
                    else {
                        return Board.findOne({ slug: list.board.slug }).then(function (board) {
                            if (!board)
                                return res.status(401).send('No such board found');
                            return Team.findById(board.team).then(function (team) {
                                if (team.isOwner(user._id) || team.isMember(user._id)) {
                                    return list.save().then(function (list) {
                                        board.removeList(list.id)
                                        return res.json({ list: list._doc })

                                    })
                                }
                                else {
                                    return res.status(401).send('You dont belong here');
                                }
                            })
                        })
                    }

                });
        })
    }).catch(next);
})
/**
 * Delete single list by slug
 */
router.delete('/single/:slug', auth.required, function (req, res, next) {
    const { slug } = req.params;
    User.findById(req.payload.id).then(function (user) {
        if (!user) {
            return res.sendStatus(401);
        }
        return List.findOne({ slug }).then(function (list) {
            if (!list)
                return res.status(401).send('No such list found');
            list.populate({
                path: 'board',
                select: '-__v',
            }).populate({
                path: 'issues',
                select: '-__v'
            })
                .execPopulate()
                .then(function (list) {
                    if (list.board.isPrivate) {

                        return Board.findOne({ slug: list.board.slug }).then(function (board) {
                            if (board.isOwner(user.id)) {
                                return list.remove().then(function (list) {
                                    board.removeList(list.id)
                                    return res.json({ list: list._doc })

                                })
                            }
                            else {
                                return res.status(401).send('You dont belong here');
                            }
                        })

                    }
                    else {
                        return Board.findOne({ slug: list.board.slug }).then(function (board) {
                            if (!board)
                                return res.status(401).send('No such board found');
                            return Team.findById(board.team).then(function (team) {
                                if (team.isOwner(user._id) || team.isMember(user._id)) {
                                    return list.remove().then(function (list) {
                                        board.removeList(list.id)
                                        return res.json({ list: list._doc })

                                    })
                                }
                                else {
                                    return res.status(401).send('You dont belong here');
                                }
                            })
                        })
                    }

                });
        })
    }).catch(next);
})
/**
 * Delete single list by slug
 */
router.delete('/deleteCards/:slug', auth.required, function (req, res, next) {
    const { slug } = req.params;
    User.findById(req.payload.id).then(function (user) {
        if (!user) {
            return res.sendStatus(401);
        }
        return List.findOne({ slug }).then(function (list) {
            if (!list)
                return res.status(401).send('No such list found');
            list.populate({
                path: 'board',
                select: '-__v',
            }).populate({
                path: 'issues',
                select: '-__v'
            })
                .execPopulate()
                .then(function (list) {
                    if (list.board.isPrivate) {

                        return Board.findOne({ slug: list.board.slug }).then(function (board) {
                            if (board.isOwner(user.id)) {
                                // return list.remove().then(function (list) {
                                //     board.removeList(list.id)
                                //     return res.json({ list: list._doc })

                                // })
                                list.issues = [];
                                return list.save().then(function (list) {
                                    return res.json({ list })
                                })
                            }
                            else {
                                return res.status(401).send('You dont belong here');
                            }
                        })

                    }
                    else {
                        return Board.findOne({ slug: list.board.slug }).then(function (board) {
                            if (!board)
                                return res.status(401).send('No such board found');
                            return Team.findById(board.team).then(function (team) {
                                if (team.isOwner(user._id) || team.isMember(user._id)) {
                                    list.issues = [];
                                    return list.save().then(function (list) {
                                        return res.json({ list })
                                    })
                                }
                                else {
                                    return res.status(401).send('You dont belong here');
                                }
                            })
                        })
                    }

                });
        })
    }).catch(next);
})
module.exports = router