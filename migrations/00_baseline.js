'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        /**
         * Users Table
         */
        await queryInterface.createTable('Users', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true
            },
            username: {
                type: Sequelize.STRING,
                allowNull: false,
                unique: true
            },
            passwordHash: {
                type: Sequelize.STRING,
                allowNull: false
            },
            role: {
                type: Sequelize.ENUM('OWNER', 'EDITOR', 'VIEWER'),
                defaultValue: 'VIEWER',
                allowNull: false
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE
            }
        });

        /**
         * Connections Table
         */
        await queryInterface.createTable('Connections', {
            id: {
                allowNull: false,
                autoIncrement: true, // Assuming default ID behavior if not specified in model but sequelize usually adds one
                // Wait, the model didn't specify 'id'. Sequelize adds 'id' integer PK by default.
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            connectionId: {
                type: Sequelize.STRING,
                allowNull: false
                // unique: true // Removed in model
            },
            connectionSecret: {
                type: Sequelize.STRING,
                allowNull: true
            },
            websiteName: {
                type: Sequelize.STRING
            },
            websiteDescription: {
                type: Sequelize.TEXT
            },
            logoUrl: {
                type: Sequelize.STRING,
                allowNull: true
            },
            faviconPath: {
                type: Sequelize.STRING,
                allowNull: true
            },
            logoPath: {
                type: Sequelize.STRING,
                allowNull: true
            },
            brandingStatus: {
                type: Sequelize.ENUM('PENDING', 'READY', 'PARTIAL', 'FAILED'),
                defaultValue: 'PENDING'
            },
            assistantName: {
                type: Sequelize.STRING,
                defaultValue: "AI Assistant"
            },
            tone: {
                type: Sequelize.STRING,
                defaultValue: "professional"
            },
            allowedDomains: {
                type: Sequelize.JSON,
                allowNull: true
            },
            theme: {
                type: Sequelize.JSON,
                defaultValue: {
                    primary: "#4f46e5",
                    background: "#ffffff",
                    text: "#111111"
                }
            },
            systemPrompt: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            knowledgeBase: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            extractedTools: {
                type: Sequelize.JSON,
                allowNull: true,
                defaultValue: []
            },
            welcomeMessage: {
                type: Sequelize.STRING,
                defaultValue: "Hi! How can I help you today?"
            },
            capabilities: {
                type: Sequelize.JSON,
                defaultValue: ["general"]
            },
            actionConfig: {
                type: Sequelize.JSON,
                defaultValue: {
                    type: "SAVE",
                    config: { target: "ideas_table" }
                }
            },
            permissions: {
                type: Sequelize.JSON,
                defaultValue: {
                    modes: ["FREE_CHAT"],
                    actions: ["SAVE"],
                    aiEnabled: true
                }
            },
            behaviorProfile: {
                type: Sequelize.JSON,
                defaultValue: {
                    assistantRole: "support_agent",
                    tone: "neutral",
                    responseLength: "medium",
                    salesIntensity: 0.0,
                    empathyLevel: 0.5,
                    primaryGoal: "support",
                    hardConstraints: {
                        never_claim: [],
                        escalation_path: "human_support"
                    }
                }
            },
            behaviorOverrides: {
                type: Sequelize.JSON,
                defaultValue: []
            },
            passwordHash: {
                type: Sequelize.STRING,
                allowNull: true
            },
            status: {
                type: Sequelize.ENUM('CREATED', 'CONNECTED', 'EXTRACTION_REQUESTED', 'READY', 'FAILED'),
                defaultValue: 'CREATED'
            },
            widgetSeen: {
                type: Sequelize.BOOLEAN,
                defaultValue: false
            },
            extractionEnabled: {
                type: Sequelize.BOOLEAN,
                defaultValue: false
            },
            allowedExtractors: {
                type: Sequelize.JSON,
                defaultValue: []
            },
            extractionToken: {
                type: Sequelize.STRING,
                allowNull: true
            },
            extractionTokenExpires: {
                type: Sequelize.DATE,
                allowNull: true
            },
            policies: {
                type: Sequelize.JSON,
                defaultValue: []
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE
            }
        });

        /**
         * ConnectionKnowledges Table
         */
        await queryInterface.createTable('ConnectionKnowledges', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true
            },
            connectionId: {
                type: Sequelize.STRING,
                allowNull: false
            },
            sourceType: {
                type: Sequelize.ENUM('URL', 'TEXT'),
                allowNull: false
            },
            sourceValue: {
                type: Sequelize.STRING,
                allowNull: false
            },
            rawText: {
                type: Sequelize.TEXT
            },
            cleanedText: {
                type: Sequelize.TEXT
            },
            status: {
                type: Sequelize.ENUM('PENDING', 'READY', 'FAILED'),
                defaultValue: 'PENDING'
            },
            visibility: {
                type: Sequelize.ENUM('SHADOW', 'ACTIVE'),
                defaultValue: 'SHADOW'
            },
            confidenceScore: {
                type: Sequelize.FLOAT,
                defaultValue: 0.5
            },
            contentHash: {
                type: Sequelize.STRING,
                allowNull: true
            },
            lastCheckedAt: {
                type: Sequelize.DATE,
                allowNull: true
            },
            metadata: {
                type: Sequelize.JSON,
                allowNull: true
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE
            }
        });

        // Indexes for ConnectionKnowledges
        await queryInterface.addIndex('ConnectionKnowledges', ['connectionId']);
        await queryInterface.addIndex('ConnectionKnowledges', ['status']);

        /**
         * PendingExtractions Table
         */
        await queryInterface.createTable('PendingExtractions', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true
            },
            connectionId: {
                type: Sequelize.STRING,
                allowNull: false
            },
            source: {
                type: Sequelize.ENUM('WIDGET', 'MANUAL'),
                defaultValue: 'WIDGET'
            },
            extractorType: {
                type: Sequelize.ENUM('BRANDING', 'KNOWLEDGE', 'FORM', 'METADATA', 'NAVIGATION'),
                allowNull: false
            },
            rawData: {
                type: Sequelize.JSONB,
                allowNull: false
            },
            pageUrl: {
                type: Sequelize.STRING,
                allowNull: true
            },
            status: {
                type: Sequelize.ENUM('PENDING', 'APPROVED', 'REJECTED'),
                defaultValue: 'PENDING'
            },
            reviewedBy: {
                type: Sequelize.STRING,
                allowNull: true
            },
            reviewedAt: {
                type: Sequelize.DATE,
                allowNull: true
            },
            reviewNotes: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            triggerQueries: {
                type: Sequelize.JSONB,
                defaultValue: []
            },
            relevanceScore: {
                type: Sequelize.FLOAT,
                defaultValue: 0.0
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE
            }
        });

        // Indexes for PendingExtractions
        await queryInterface.addIndex('PendingExtractions', ['connectionId']);
        await queryInterface.addIndex('PendingExtractions', ['status']);

        /**
         * ChatSessions Table
         */
        await queryInterface.createTable('ChatSessions', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            sessionId: {
                type: Sequelize.STRING,
                allowNull: false
            },
            connectionId: {
                type: Sequelize.STRING,
                allowNull: false
            },
            messages: {
                type: Sequelize.JSON,
                allowNull: false,
                defaultValue: []
            },
            currentStep: {
                type: Sequelize.ENUM('NONE', 'TITLE', 'DESCRIPTION', 'IMPACT', 'CONFIRM', 'SUBMITTED'),
                allowNull: false,
                defaultValue: 'NONE'
            },
            tempData: {
                type: Sequelize.JSON,
                allowNull: true,
                defaultValue: {}
            },
            mode: {
                type: Sequelize.ENUM('FREE_CHAT', 'GUIDED_FLOW'),
                defaultValue: 'FREE_CHAT'
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE
            }
        });

        /**
         * Ideas Table
         */
        await queryInterface.createTable('Ideas', {
            id: {
                type: Sequelize.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            ideaId: {
                type: Sequelize.STRING
            },
            connectionId: {
                type: Sequelize.STRING,
                allowNull: false
            },
            userId: {
                type: Sequelize.STRING,
                allowNull: true
            },
            title: {
                type: Sequelize.STRING,
                allowNull: false
            },
            description: {
                type: Sequelize.TEXT,
                allowNull: false
            },
            impactedUsers: {
                type: Sequelize.INTEGER,
                defaultValue: 0
            },
            status: {
                type: Sequelize.STRING,
                defaultValue: "New"
            },
            idempotencyKey: {
                type: Sequelize.STRING,
                allowNull: true
            },
            source: {
                type: Sequelize.STRING,
                defaultValue: "CHATBOT"
            },
            submittedAt: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.NOW
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE
            }
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('Ideas');
        await queryInterface.dropTable('ChatSessions');
        await queryInterface.dropTable('PendingExtractions');
        await queryInterface.dropTable('ConnectionKnowledges');
        await queryInterface.dropTable('Connections');
        await queryInterface.dropTable('Users');
    }
};
