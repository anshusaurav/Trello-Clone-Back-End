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
        teamId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Team"
        },
        image: {
            type: String
        },
        members: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            }
        ],
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
module.exports = mongoose.model("Board", BoardSchema);
