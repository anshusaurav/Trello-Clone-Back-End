var mongoose = require("mongoose");
var uniqueValidator = require("mongoose-unique-validator");

var TeamSchema = new mongoose.Schema(
    {
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

module.exports = mongoose.model("Team", TeamSchema);
