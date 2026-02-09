const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const ConnectionKnowledge = sequelize.define("ConnectionKnowledge", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    connectionId: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: "Foreign Key to Connection.connectionId"
    },
    sourceType: {
        type: DataTypes.ENUM('URL', 'TEXT'),
        allowNull: false
    },
    sourceValue: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: "The URL string or a Label/Title for raw text"
    },
    rawText: {
        type: DataTypes.TEXT('long'), // Support large content
        allowNull: true
    },
    cleanedText: {
        type: DataTypes.TEXT('long'),
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('PENDING', 'READY', 'FAILED'),
        defaultValue: 'PENDING'
    },
    // Phase 2: Shadow Knowledge
    visibility: {
        type: DataTypes.ENUM('SHADOW', 'ACTIVE'),
        defaultValue: 'SHADOW'
    },
    confidenceScore: {
        type: DataTypes.FLOAT,
        defaultValue: 0.5
    },
    // Phase 3.2: Drift Detection
    contentHash: {
        type: DataTypes.STRING,
        allowNull: true
    },
    lastCheckedAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    metadata: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "Scraping stats, lastUpdated, error details etc"
    }
}, {
    indexes: [
        {
            fields: ['connectionId']
        },
        {
            fields: ['status']
        }
    ]
});

module.exports = ConnectionKnowledge;
