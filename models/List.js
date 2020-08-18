var mongoose = require("mongoose");
var slug = require("slug")
var ListSchema = new mongoose.Schema(
    {
        slug: {
            type: String,
            lowercase: true,
            unique: true
        },
        name: {
            type: String,
            required: [true, "can't be blank"],
            index: true,
        },
        board: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Board'
        },
        issues: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Issue'
            }
        ]
    },
    { timestamps: true }
)
ListSchema.pre("validate", function (next) {
    if (!this.slug) {
        this.slugify();
    }
    next();
});

ListSchema.methods.slugify = function () {
    this.slug =
        slug(this.name) +
        "-" +
        ((Math.random() * Math.pow(36, 6)) | 0).toString(36);
};
/**
 * Move a card inside list from moveFrom to moveTo position.
 * Consist of two steps
 * Removing Card at moveFrom position
 * Inserting it at movetoPosition and shift other elements
 * accordingly.
 * @param {*} moveFrom 
 * @param {*} moveTo 
 */
ListSchema.methods.moveCard = function (moveFrom, moveTo) {
    if (start > this.issues.length || end > this.issues.length || start < 0 || end < 0) {
        return;
    }
    let resArr = [...this.issues];
    removedIssue = resArr.splice(moveFrom, 1);
    resArr.splice(moveTo, 0, removedIssue);
    this.issues = resArr;
    this.save();
};


/**
 * add a card with "issueId" at position "position" in given list. If no position 
 * is provided card will be added to the end
 * @param {*} issueId 
 * @param {*} position 
 */
ListSchema.methods.addCard = function (issueId, position = this.issues.length) {
    if (position < 0 || position > issues.length) {
        return;
    }
    let resArr = [...this.issues];
    resArr.splice(position, 0, issueId);
    this.issues = resArr;
    this.save();
};


/**
 * remove a card at position "position" in given list. 
 * @param {*} issueId 
 */
ListSchema.methods.removeCard = function (position) {
    if (position < 0 || position > issues.length) {
        return;
    }
    let resArr = [...this.issues];
    const ids = resArr.splice(position, 1);
    this.issues = resArr;
    this.save();
    return ids[0];
};

/**
 * Append card at the end of List
 * @param {} id 
 */
ListSchema.methods.appendCard = function (id) {
    if (this.issues.indexOf(id) === -1) {
        this.issues = this.issues.concat([id]);
    }
    return this.save();
};

ListSchema.methods.deleteCard = function (id) {
    this.issues.remove(id);
    return this.save();
}
/**
 * Checks whether card with id is present in list or not
 * @param {*} id 
 */
ListSchema.methods.isCardPresent = function (id) {
    return this.issues.some(function (issueId) {
        return issueId.toString() === id.toString();
    })
};

ListSchema.methods.toListJSON = function () {
    return {
        id: this._id,
        slug: this.slug,
        name: this.name,
        board: this.board,
        updatedAt: this.updatedAt,
        createdAt: this.createdAt

    };
};
module.exports = mongoose.model("List", ListSchema);
