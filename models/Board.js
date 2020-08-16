var mongoose = require("mongoose");
var slug = require("slug")
var BoardSchema = new mongoose.Schema(
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
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        isPrivate: {
            type: Boolean,
            default: true
        },
        team: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Team"
        },
        lists: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "List"
            }
        ],
        image: {
            type: String
        },

    },
    { timestamps: true }
)
BoardSchema.pre("validate", function (next) {
    if (!this.slug) {
        this.slugify();
    }

    next();
});

BoardSchema.methods.slugify = function () {
    this.slug =
        slug(this.name) +
        "-" +
        ((Math.random() * Math.pow(36, 6)) | 0).toString(36);
};

BoardSchema.methods.addList = function (id) {
    if (this.lists.indexOf(id) === -1) {
        this.lists = this.lists.concat([id]);
    }
    return this.save();
};
BoardSchema.methods.removeList = function (id) {
    this.lists.remove(id);
    return this.save();
};
BoardSchema.methods.contains = function (id) {
    return this.lists.some(function (listId) {

        return listId.toString() === id._id.toString();
    })
};

BoardSchema.methods.toBoardJSON = function () {
    // let mem = this.members.map(member => member.toProfileJSON());
    return {
        id: this._id,
        slug: this.slug,
        name: this.name,
        owner: this.owner.toProfileJSON(),
        isPrivate: this.isPrivate,
        team: this.isPrivate ? undefined : this.team.toTeamJSON(),
        updatedAt: this.updatedAt,
        createdAt: this.createdAt

    };
};
module.exports = mongoose.model("Board", BoardSchema);
