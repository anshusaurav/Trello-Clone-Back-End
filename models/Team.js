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
    return {
        slug: this.slug,
        name: this.name,
        members: this.members.map(member => member.toProfileJSON()),
        owner: this.owner.toProfileJSON(),
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,

    };
};
module.exports = mongoose.model("Team", TeamSchema);
