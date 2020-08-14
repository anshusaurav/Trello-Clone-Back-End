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

//author= owner
//favorited = member
//http://localhost:4000/api/p?owner=${loggedInUser.username}&offset=${offset}&limit=${limit}`,
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
        console.log('HERE');
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
            Team.find({ members: user._doc._id })
                .limit(Number(limit))
                .skip(Number(offset))
                .sort({ createdAt: "desc" })
                .populate("owner")
                .populate("members")
                .populate("boards")
                .exec(),
            Team.count({ members: user._doc._id }),
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