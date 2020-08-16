var mongoose = require("mongoose");
var slug = require("slug")
var uniqueValidator = require("mongoose-unique-validator");

var TeamSchema = new mongoose.Schema(
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
        description: {
            type: String,
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        members: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            }
        ],
        boards: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Board'
            }
        ]
    },
    { timestamps: true }
)

TeamSchema.pre("validate", function (next) {
    if (!this.slug) {
        this.slugify();
    }

    next();
});

TeamSchema.methods.slugify = function () {
    this.slug =
        slug(this.name) +
        "-" +
        ((Math.random() * Math.pow(36, 6)) | 0).toString(36);
};

TeamSchema.methods.toTeamJSON = function () {
    let mem = this.members.map(member => member.toProfileJSON());
    return {
        id: this.id,
        slug: this.slug,
        name: this.name,
        description: this.description,
        members: mem,
        owner: this.owner.toProfileJSON(),
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,

    };
};
TeamSchema.methods.addMember = function (id) {
    if (this.members.indexOf(id) === -1) {
        this.members = this.members.concat([id]);
    }
    return this.save();
};
TeamSchema.methods.removeMember = function (id) {
    this.members.remove(id);
    return this.save();
};
TeamSchema.methods.isMember = function (id) {
    return this.members.some(function (memberId) {

        return memberId.toString() === id.toString();
    })
};
TeamSchema.methods.isOwner = function (id) {
    return this.owner.toString() === id.toString();
}
TeamSchema.methods.addBoard = function (id) {
    if (this.boards.indexOf(id) === -1) {
        this.boards = this.boards.concat([id]);
    }
    return this.save();
}
TeamSchema.methods.removeBoard = function (id) {
    this.boards.remove(id);
    return this.save();
}

TeamSchema.methods.containsBoard = function (id) {
    return this.boards.some(function (boardId) {
        return boardId.toString() === id.toString();
    })
}
module.exports = mongoose.model("Team", TeamSchema);
