
var router = require("express").Router()
var mongoose = require("mongoose")
var List = mongoose.model("List")
var auth = require("../auth");
/**
 * Move cards b/w lists
 */
router.post("/", auth.required, function (req, res, next) {
    var srcListId = null;
    var destListId = null;
    var srcPos = null;
    var destPos = null;
    if (typeof req.query.srcListId !== "undefined") {
        srcListId = req.query.srcListId;
    }

    if (typeof req.query.destListId !== "undefined") {
        destListId = req.query.destListId;
    }

    if (typeof req.query.srcPos !== "undefined") {
        srcPos = req.query.srcPos;
    }

    if (typeof req.query.destPos !== "undefined") {
        destPos = req.query.destPos;
    }
    console.log('HERE');
    console.log(srcListId, destListId, srcPos, destPos);
    if (srcListId && srcListId === destListId) {
        List.findById(srcListId).then(function (srcList) {
            if (!srcList) {
                return res.status(401).send('No such source List found');
            }
            srcList.moveCard(srcPos, destPos);
            return res.json({ srcList: srcList })
        }).catch(next);
    }
    else {
        List.findById(srcListId).then(function (srcList) {
            if (!srcList) {
                return res.status(401).send('No such source List found');
            }
            List.findById(destListId).then(function (destList) {
                const issueId = srcList.getCard(srcPos);
                srcList.removeCard(srcPos);
                destList.addCard(issueId, destPos);
                return res.json({ srcList: srcList })
            })
        }).catch(next);
    }
});

module.exports = router