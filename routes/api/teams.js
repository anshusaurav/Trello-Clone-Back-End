var router = require("express").Router();
var mongoose = require("mongoose");
var User = mongoose.model("User");
var Team = mongoose.model("Team");
var auth = require("../auth");
router.param("teams", function (req, res, next, slug) {
    Team.findOne({ slug })
        .then(function (team) {
            if (!team) {
                return res.sendStatus(404);
            }
            req.team = team;
            return next();
        })
        .catch(next);
});

/**
 * Get all team of current user
 */
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
            Team.find({ $or: [{ members: user.id }, { owner: user.id }] })
                .limit(Number(limit))
                .skip(Number(offset))
                .sort({ createdAt: "desc" })
                .populate({
                    path: 'owner members',
                    select: '-salt -__v -hash'
                })
                .populate({
                    path: 'boards',
                    select: '-__v'
                })
                .exec(),
            Team.count({ $or: [{ members: user.id }, { owner: user.id }] }),
        ])
            .then(function (results) {
                console.log(results[0])
                var teams = results[0];
                var teamCount = results[1];
                return res.json({
                    teams: teams.map(function (team) {
                        return team;
                    }),
                    teamCount: teamCount,
                });
            })
            .catch(next);
    });
})

router.get('/owner', auth.required, function (req, res, next) {
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
            Team.find({ owner: user.id })
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


router.get('/member', auth.required, function (req, res, next) {
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
            Team.find({ members: user.id })
                .limit(Number(limit))
                .skip(Number(offset))
                .sort({ createdAt: "desc" })
                .populate("owner")
                .populate("members")
                .populate("boards")
                .exec(),
            Team.count({ members: user.id }),
        ])
            .then(function (results) {
                var teams = results[0];
                var teamCount = results[1];
                // console.log(teams);
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

router.post("/", auth.required, function (req, res, next) {
    User.findById(req.payload.id).then(function (user) {
        if (!user) {
            return res.sendStatus(401);
        }
        var team = new Team({
            name: req.body.team.name,
            description: req.body.team.description

        })
        team.owner = user;
        return team.save().then(function () {
            return res.json({ team: team.toTeamJSON() })
        })

    })
});
router.post("/:slug/add", auth.required, function (req, res, next) {
    const { slug } = req.params;
    const email = req.body.user.email;
    User.findById(req.payload.id).then(function (user) {
        if (!user) {
            return res.sendStatus(401);
        }
        return User.findOne({ email }).then(function (userM) {
            if (!userM) {
                return res.status(401).send(`No user with ${email}`);
            }
            return Team.findOne({ slug: slug }).then(function (team) {
                if (!team) {
                    return res.sendStatus(401);
                }
                if (user.id.toString() != team.owner.toString()) {
                    return res.sendStatus(401);
                }
                return team.addMember(userM.id).then(function (team) {

                    team.populate("owner")
                        .populate("members")
                        .populate("boards")
                        .execPopulate()
                        .then(function (team) {
                            console.log(team._doc)
                            return res.json({ team: team.toTeamJSON() });
                        });
                })
            });
        })
    })

});

router.delete("/:slug/add", auth.required, function (req, res, next) {
    const { slug } = req.params;
    const email = req.body.user.email;
    User.findById(req.payload.id).then(function (user) {
        if (!user) {
            return res.sendStatus(401);
        }
        return User.findOne({ email }).then(function (userM) {
            return Team.findOne({ slug: slug }).then(function (team) {
                if (!team) {
                    return res.sendStatus(401);
                }
                if (user.id.toString() != team.owner.toString()) {
                    return res.sendStatus(401);
                }
                return team.removeMember(userM.id).then(function (team) {
                    team.populate("owner")
                        .populate("members")
                        .populate("boards")
                        .execPopulate()
                        .then(function (team) {
                            console.log(team._doc)
                            return res.json({ team: team.toTeamJSON() });
                        });
                })
            });
        })
    })

});

router.get("/:slug", auth.required, function (req, res, next) {
    const { slug } = req.params;
    User.findById(req.payload.id).then(function (user) {
        if (!user) {
            return res.sendStatus(401);
        }
        return Team.findOne({ slug: slug }).then(function (team) {
            team.populate("owner")
                .populate("members")
                .populate("boards")
                .execPopulate()
                .then(function (team) {
                    return res.json({ team: team.toTeamJSON() });
                });
        });

    })

});

router.put("/:slug", auth.required, function (req, res, next) {
    const { slug } = req.params;
    Promise.resolve(req.payload ? User.findById(req.payload.id) : null)
        .then(function (user) {
            Team.findOne({ slug }).then(function (team) {
                console.log(team)
                if (typeof req.body.team.name !== 'undefined') {
                    team.name = req.body.team.name
                }
                if (typeof req.body.team.image !== 'undefined') {
                    team.image = req.body.team.image
                }
                if (team.isOwner(user.id)) {
                    team.save().then(function (team) {
                        team.populate("owner")
                            .populate("members")
                            .populate("boards")
                            .execPopulate()
                            .then(function (team) {
                                return res.json({ team: team.toTeamJSON() });

                            });
                    });
                } else {
                    return res.sendStatus(403);
                }

            });
        })

        .catch(next);
})

router.delete("/:slug", auth.required, function (req, res, next) {
    const { slug } = req.params;
    Promise.resolve(req.payload ? User.findById(req.payload.id) : null)
        .then(function (user) {
            Team.findOne({ slug }).then(function (team) {
                console.log(team)

                if (team.isOwner(user.id)) {
                    team.remove().then(function (team) {
                        team.populate("owner")
                            .populate("members")
                            .populate("boards")
                            .execPopulate()
                            .then(function (team) {
                                return res.json({ team: team.toTeamJSON() });

                            });
                    });
                } else {
                    return res.sendStatus(403);
                }

            });
        })

        .catch(next);
})
module.exports = router