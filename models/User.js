const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const bcrypt = require("bcryptjs");

const User = sequelize.define("User", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    passwordHash: {
        type: DataTypes.STRING,
        allowNull: false
    },
    role: {
        type: DataTypes.ENUM('OWNER', 'EDITOR', 'VIEWER'),
        defaultValue: 'VIEWER',
        allowNull: false
    }
}, {
    hooks: {
        beforeCreate: async (user) => {
            if (user.passwordHash && !user.passwordHash.startsWith("$2a$")) {
                const salt = await bcrypt.genSalt(10);
                user.passwordHash = await bcrypt.hash(user.passwordHash, salt);
            }
        },
        beforeUpdate: async (user) => {
            if (user.changed('passwordHash') && !user.passwordHash.startsWith("$2a$")) {
                const salt = await bcrypt.genSalt(10);
                user.passwordHash = await bcrypt.hash(user.passwordHash, salt);
            }
        }
    }
});

User.prototype.validPassword = async function (password) {
    return await bcrypt.compare(password, this.passwordHash);
};

module.exports = User;
