const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const KnowledgeGap = sequelize.define("KnowledgeGap", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    connectionId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    query: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    context: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "Optional metadata about the state (e.g. current URL)"
    },
    confidenceScore: {
        type: DataTypes.FLOAT,
        allowNull: true
    },
    resolutionStatus: {
        type: DataTypes.ENUM('OPEN', 'RESOLVED', 'IGNORED'),
        defaultValue: 'OPEN'
    }
}, {
    timestamps: true
});

module.exports = KnowledgeGap;
