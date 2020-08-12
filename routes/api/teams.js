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
            console.log("team assigned");
            return next();
        })
        .catch(next);
});

router.post("/", auth.required, function (req, res, next) {
    User.findById(req.payload.id).then(function (user) {
        if (!user) {
            return res.sendStatus(401);
        }
        console.log(user);
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
    User.findById(req.payload.id).then(function (user) {
        if (!user) {
            return res.sendStatus(401);
        }
        console.log(user);
        var team = new Team({
            name: req.body.team.name,
        })
        team.owner = user;
        return team.save().then(function () {
            return res.json({ team: team.toTeamJSON() })
        })

    })

});

router.get("/:slug", auth.required, function (req, res, next) {
    const { slug } = req.params;
    User.findById(req.payload.id).then(function (user) {
        if (!user) {
            return res.sendStatus(401);
        }
        console.log(user);
        return Team.findOne({ slug: slug }).then(function (team) {
            team
                .populate("owner")
                .populate("members")
                .populate("boards")
                .execPopulate()
                .then(function (team) {
                    return res.json({ team: team.toTeamJSON() });
                });
        });

    })

});
module.exports = router