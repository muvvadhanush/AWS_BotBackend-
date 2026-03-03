import React, { useEffect, useRef } from 'react';

export default function AdminDashboard({ onLogout }) {
    const isScriptLoaded = useRef(false);

    useEffect(() => {
        if (!isScriptLoaded.current) {
            const script = document.createElement("script");
            script.src = "/admin.js";
            script.async = true;
            document.body.appendChild(script);
            isScriptLoaded.current = true;
        }

        // Wire logout handler so admin.js can call it
        const handleLogoutEvent = () => {
            if (onLogout) onLogout();
        };
        window.addEventListener('admin-logout', handleLogoutEvent);

        return () => {
            window.removeEventListener('admin-logout', handleLogoutEvent);
        };
    }, [onLogout]);

    // The HTML content is extracted straight from the views/admin.html file.
    // It's wrapped in dangerouslySetInnerHTML to guarantee 100% exact DOM replication
    // so `admin.js` can attach to its expected `getElementById` targets flawlessly.
    const rawHtml = `
      <!-- SIDEBAR -->
    <nav class="sidebar">
        <div class="brand">
            <span class="material-symbols-outlined" style="color: var(--primary);">neurology</span>
            Neural Bot
        </div>

        <div class="nav-menu">
            <a href="#" id="navDashboard" class="nav-item active">
                <span class="material-symbols-outlined">dashboard</span>
                Dashboard
            </a>
            <a href="#" id="navConnections" class="nav-item">
                <span class="material-symbols-outlined">hub</span>
                Connections
                <span class="status-badge success" style="margin-left: auto; font-size: 0.7rem;">12</span>
            </a>
            <a href="#" id="navAnalytics" class="nav-item">
                <span class="material-symbols-outlined">analytics</span>
                Analytics
            </a>
            <a href="#" id="navSettings" class="nav-item">
                <span class="material-symbols-outlined">settings</span>
                Settings
            </a>
            <a href="#" id="btnLogout" class="nav-item" style="margin-top: auto; color: var(--error);">
                <span class="material-symbols-outlined">logout</span>
                Logout
            </a>
        </div>
    </nav>

    <!-- MAIN CONTENT -->
    <main class="main-content">

        <!-- DASHBOARD VIEW -->
        <div id="dashboardView">
            <!-- HEADER -->
            <header class="header">
                <div style="display: flex; align-items: center; gap: 15px;">
                    <button id="btnMobileMenu" class="btn-icon mobile-only">
                        <span class="material-symbols-outlined">menu</span>
                    </button>
                    <div class="page-title">
                        <h1>Dashboard Overview</h1>
                        <p>Manage your AI connections and performance.</p>
                    </div>
                </div>

                <div class="user-profile">
                    <button id="btnThemeToggle" class="btn-icon">
                        <span class="material-symbols-outlined" id="themeIcon">light_mode</span>
                    </button>
                    <button class="btn-icon">
                        <span class="material-symbols-outlined">notifications</span>
                    </button>
                    <div class="avatar">T</div>
                </div>
            </header>

            <!-- METRICS -->
            <div class="metrics-grid">
                <div class="neu-card">
                    <div class="metric-label">Total Connections</div>
                    <div id="metricConnections" class="metric-value">-</div>
                    <div class="text-success" style="font-size: 0.9rem;">Live</div>
                </div>
                <div class="neu-card">
                    <div class="metric-label">Active Conversations</div>
                    <div id="metricConversations" class="metric-value">-</div>
                    <div class="text-success" style="font-size: 0.9rem;">Live</div>
                </div>
                <div class="neu-card">
                    <div class="metric-label">Knowledge Sources</div>
                    <div id="metricKnowledge" class="metric-value">-</div>
                    <div class="text-secondary" style="font-size: 0.9rem;">Across all bots</div>
                </div>
                <div class="neu-card">
                    <div class="metric-label">Platform Health</div>
                    <div id="metricHealth" class="metric-value">-</div>
                    <div id="metricHealthLabel" class="text-success" style="font-size: 0.9rem;">Stable</div>
                </div>
                <div class="neu-card">
                    <div class="metric-label">Estimated API Cost</div>
                    <div id="metricCost" class="metric-value">-</div>
                    <div class="text-secondary" style="font-size: 0.9rem;">Current Month (est)</div>
                </div>
                <div class="neu-card">
                    <div class="metric-label">Knowledge Gaps</div>
                    <div id="metricGaps" class="metric-value">-</div>
                    <div id="metricGapsLabel" class="text-success" style="font-size: 0.9rem;">0 Pending</div>
                </div>
            </div>

            <!-- CONNECTIONS -->
            <section>
                <div class="header" style="margin-bottom: 24px;">
                    <h2 style="font-size: 1.4rem;">All Connections</h2>
                    <button id="btnNewConnection" class="btn-neu">
                        <span class="material-symbols-outlined">add</span>
                        New Connection
                    </button>
                </div>

                <div id="connectionsList" class="connections-grid">
                    <div class="loading">Loading connections...</div>
                </div>
            </section>
        </div>

        <!-- DETAILS VIEW (Tabbed Interface) -->
        <div id="detailsView" class="hidden">
            <header class="header">
                <div class="page-title">
                    <button id="btnBackToDash" class="btn-icon" style="margin-right: 10px;">
                        <span class="material-symbols-outlined">arrow_back</span>
                    </button>
                    <div id="detailAvatar" class="avatar-circle"
                        style="width:40px; height:40px; font-size:1.2rem; margin-right: 15px;">A</div>
                    <div>
                        <h1 id="detailTitle">Connection Details</h1>
                        <p id="detailSubtitle">Manage knowledge and settings.</p>
                    </div>
                </div>
            </header>

            <!-- TABS -->
            <div class="tabs-container">
                <div class="tab-header">
                    <div class="tab-item active" data-tab="tabTune">
                        <span class="material-symbols-outlined">tune</span> Tune
                    </div>
                    <div class="tab-item" data-tab="tabTest">
                        <span class="material-symbols-outlined">chat</span> Test
                    </div>
                    <div class="tab-item" data-tab="tabWidget">
                        <span class="material-symbols-outlined">widgets</span> Widget
                    </div>
                    <div class="tab-item" data-tab="tabCustomize">
                        <span class="material-symbols-outlined">palette</span> Customize
                    </div>
                    <div class="tab-item" data-tab="tabIntegrations">
                        <span class="material-symbols-outlined">hub</span> Integrations
                    </div>
                    <div class="tab-item" data-tab="tabButtons">
                        <span class="material-symbols-outlined">smart_button</span> Buttons
                    </div>
                </div>

                <!-- TAB CONTENT: TUNE -->
                <div id="tabTune" class="tab-content active">
                    <div class="two-col-grid">
                        <section>
                            <h2 class="section-title">Business Details</h2>
                            <div class="neu-card">
                                <div class="input-group">
                                    <label>Assistant Name</label>
                                    <input type="text" id="tuneName" class="input-neu">
                                </div>
                                <div class="input-group">
                                    <label>System Prompt (Instructions)</label>
                                    <textarea id="tunePrompt" class="input-neu" rows="6"
                                        placeholder="You are a helpful assistant..."></textarea>
                                </div>
                                <button id="btnSaveTune" class="btn-neu" style="width: 100%; color: var(--success);">
                                    <span class="material-symbols-outlined">save</span> Save Tunings
                                </button>
                            </div>

                            <h2 class="section-title" style="margin-top: 20px;">AI Behavior</h2>
                            <div class="neu-card">
                                <div class="input-group">
                                    <label>Assistant Tone</label>
                                    <select id="tuneTone" class="input-neu">
                                        <option value="Professional">Professional</option>
                                        <option value="Friendly">Friendly</option>
                                        <option value="Sales-Oriented">Sales-Oriented</option>
                                        <option value="Technical">Technical</option>
                                    </select>
                                </div>
                                <div class="input-group">
                                    <label>Response Length (Max Tokens)</label>
                                    <div style="display: flex; align-items: center; gap: 10px;">
                                        <input type="range" id="tuneLength" min="50" max="800" step="50" value="400"
                                            class="range-neu">
                                        <span id="valTuneLength" style="font-weight: 600; min-width: 40px;">400</span>
                                    </div>
                                </div>
                                <div class="input-group">
                                    <label>Confidence Threshold</label>
                                    <div style="display: flex; align-items: center; gap: 10px;">
                                        <input type="range" id="tuneThreshold" min="0" max="1" step="0.1" value="0.7"
                                            class="range-neu">
                                        <span id="valTuneThreshold"
                                            style="font-weight: 600; min-width: 40px;">0.7</span>
                                    </div>
                                </div>
                                <p style="font-size: 0.8rem; color: var(--text-tertiary); margin-top: 10px;">
                                    Adjust how much knowledge similarity is required for the AI to attempt an answer.
                                </p>
                            </div>

                            <h2 class="section-title" style="margin-top: 20px;">Knowledge Base</h2>
                            <div class="neu-card">
                                <p style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 10px;">
                                    Manage your indexed content.
                                </p>
                                <button id="btnRefreshExtract" class="btn-neu" style="width: 100%;">
                                    <span class="material-symbols-outlined">refresh</span> re-Scan Website
                                </button>
                                <div id="knowledgeList" class="review-list" style="margin-top: 15px;">
                                    <!-- Dynamic Content -->
                                </div>
                            </div>
                        </section>

                        <section>
                            <h2 class="section-title">Missed Questions</h2>
                            <div id="missedList" class="review-list">
                                <div class="empty-state">No missed questions yet.</div>
                            </div>
                        </section>
                    </div>
                </div>

                <!-- TAB CONTENT: TEST -->
                <div id="tabTest" class="tab-content">
                    <div class="chat-preview" style="height: 600px;">
                        <div class="chat-messages" id="testTabMessages">
                            <div class="msg-bot">Hello! I'm ready to help.</div>
                        </div>
                        <div class="chat-input-area">
                            <input type="text" id="inpTestTabChat" placeholder="Type a message..." class="input-neu">
                            <button id="btnSendTestTabChat" class="btn-icon">
                                <span class="material-symbols-outlined">send</span>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- TAB CONTENT: WIDGET -->
                <div id="tabWidget" class="tab-content">
                    <div class="two-col-grid">
                        <section>
                            <h2 class="section-title">Installation</h2>
                            <div class="neu-card">
                                <p style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 10px;">
                                    Add this code to your website's <code>&lt;head&gt;</code> tag.
                                </p>
                                <div class="code-block" id="snippetView"></div>
                                <button id="btnCopySnippetView" class="btn-neu" style="width: 100%; margin-top: 10px;">
                                    <span class="material-symbols-outlined">content_copy</span> Copy Code
                                </button>
                            </div>
                        </section>
                        <section>
                            <h2 class="section-title">Preview</h2>
                            <div class="neu-card"
                                style="height: 300px; display: flex; align-items: center; justify-content: center; background: var(--bg-body);">
                                <p style="color: var(--text-tertiary);">Widget Preview Placeholder</p>
                            </div>
                        </section>
                    </div>
                </div>

                <!-- TAB CONTENT: CUSTOMIZE -->
                <div id="tabCustomize" class="tab-content">
                    <section style="max-width: 600px;">
                        <h2 class="section-title">Appearance</h2>
                        <div class="neu-card">
                            <div class="input-group">
                                <label>Widget Title</label>
                                <input type="text" id="cfgTitle" class="input-neu" placeholder="AI Assistant">
                            </div>
                            <div class="input-group">
                                <label>Welcome Message</label>
                                <input type="text" id="cfgWelcome" class="input-neu" placeholder="Hi! How can I help?">
                            </div>

                            <div class="two-col-grid" style="grid-template-columns: 1fr 1fr; gap: 10px;">
                                <div class="input-group">
                                    <label>Brand Color</label>
                                    <div style="display: flex; gap: 10px; align-items: center;">
                                        <input type="color" id="cfgColor" value="#4f46e5"
                                            style="height: 40px; width: 60px; border: none; background: none; cursor: pointer;">
                                        <span id="cfgColorVal">#4f46e5</span>
                                    </div>
                                </div>
                                <div class="input-group">
                                    <label>Auto-Open (sec)</label>
                                    <input type="number" id="cfgTimer" class="input-neu" min="0"
                                        placeholder="0 (Disabled)">
                                </div>
                                <div class="input-group">
                                    <label>Bot Avatar URL (Optional)</label>
                                    <input type="text" id="cfgAvatar" class="input-neu" placeholder="https://...">
                                </div>
                            </div>

                            <button id="btnSaveConfig" class="btn-neu"
                                style="width: 100%; margin-top: 15px; color: var(--success);">
                                <span class="material-symbols-outlined">save</span> Save Appearance
                            </button>
                        </div>
                    </section>
                </div>

                <!-- TAB CONTENT: INTEGRATIONS -->
                <div id="tabIntegrations" class="tab-content">
                    <div class="two-col-grid">
                        <section>
                            <h2 class="section-title">Enterprise Connectors</h2>
                            <div class="neu-card">
                                <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 20px;">
                                    <img src="https://cdn-icons-png.flaticon.com/512/2111/2111615.png" width="32"
                                        alt="Slack">
                                    <div>
                                        <h3 style="margin-bottom: 2px;">Slack Notifications</h3>
                                        <p style="font-size: 0.8rem; color: var(--text-tertiary);">Send knowledge gaps
                                            and escalations to a Slack channel.</p>
                                    </div>
                                </div>
                                <div class="input-group">
                                    <label>Incoming Webhook URL</label>
                                    <input type="password" id="slackWebhook" class="input-neu"
                                        placeholder="https://hooks.slack.com/services/...">
                                </div>
                                <button id="btnSaveSlack" class="btn-neu" style="width: 100%; color: var(--success);">
                                    <span class="material-symbols-outlined">save</span> Save Slack Config
                                </button>
                            </div>

                            <div class="neu-card" style="margin-top: 20px; opacity: 0.6; filter: grayscale(1);">
                                <div style="display: flex; align-items: center; gap: 15px;">
                                    <img src="https://cdn-icons-png.flaticon.com/512/5968/5968852.png" width="32"
                                        alt="Salesforce">
                                    <div>
                                        <h3 style="margin-bottom: 2px;">Salesforce CRM (Coming Soon)</h3>
                                        <p style="font-size: 0.8rem;">Sync leads and feedback directly to your CRM.</p>
                                    </div>
                                </div>
                            </div>
                        </section>
                        <section>
                            <h2 class="section-title">Workflow Actions</h2>
                            <div class="neu-card">
                                <div class="input-group">
                                    <label>Action Type</label>
                                    <select id="actionType" class="input-neu">
                                        <option value="NONE">No Action</option>
                                        <option value="WEBHOOK">Generic Webhook</option>
                                        <option value="EMAIL">Email Alert</option>
                                        <option value="SLACK">Slack Message</option>
                                    </select>
                                </div>
                                <p style="font-size: 0.8rem; color: var(--text-tertiary);">This action triggers when a
                                    user completes a guided flow.</p>
                                <button id="btnSaveAction" class="btn-neu"
                                    style="width: 100%; margin-top: 20px; color: var(--success);">
                                    <span class="material-symbols-outlined">save</span> Save Action Policy
                                </button>
                            </div>
                        </section>
                    </div>
                </div>

                <!-- TAB CONTENT: BUTTONS -->
                <div id="tabButtons" class="tab-content">
                    <div class="two-col-grid">
                        <section>
                            <div style="display:flex;justify-content:space-between;align-items:center;">
                                <h2 class="section-title">Button Sets</h2>
                                <button class="btn-neu" onclick="showButtonEditor()" style="color:var(--accent);">
                                    <span class="material-symbols-outlined">add</span> New
                                </button>
                            </div>
                            <div id="buttonSetsList" class="btn-sets-list">
                                <div class="empty-state"
                                    style="text-align:center;padding:40px;color:var(--text-tertiary);">
                                    <span class="material-symbols-outlined"
                                        style="font-size:48px;opacity:0.3;">smart_button</span>
                                    <p style="margin-top:12px;">No button sets yet. Create one to add interactive
                                        buttons to your chatbot.</p>
                                </div>
                            </div>
                        </section>
                        <section>
                            <h2 class="section-title">Live Preview</h2>
                            <div class="neu-card" id="buttonPreviewPanel">
                                <div
                                    style="background:linear-gradient(135deg,#f0f0ff,#fff);border-radius:16px;padding:16px;min-height:120px;position:relative;">
                                    <div
                                        style="background:#fff;padding:10px 14px;border-radius:14px;font-size:13px;color:#374151;box-shadow:0 2px 8px rgba(0,0,0,0.06);display:inline-block;max-width:80%;">
                                        How can I help you today?
                                    </div>
                                    <div id="previewBtnsContainer"
                                        style="display:flex;flex-wrap:wrap;gap:8px;margin-top:12px;"></div>
                                </div>
                                <p
                                    style="font-size:0.75rem;color:var(--text-tertiary);margin-top:10px;text-align:center;">
                                    This preview shows how buttons appear in the widget.
                                </p>
                            </div>
                        </section>
                    </div>

                    <!-- BUTTON EDITOR DIALOG -->
                    <div id="buttonEditorDialog" class="btn-editor-dialog hidden">
                        <div class="btn-editor-overlay"></div>
                        <div class="btn-editor-content">
                            <div class="btn-editor-header">
                                <h3 id="btnEditorTitle">Create Button Set</h3>
                                <button class="btn-icon" onclick="hideButtonEditor()">
                                    <span class="material-symbols-outlined">close</span>
                                </button>
                            </div>
                            <div class="btn-editor-body">
                                <div class="input-group">
                                    <label>Set Name</label>
                                    <input type="text" id="btnSetName" class="input-neu"
                                        placeholder="e.g. Welcome Buttons" maxlength="100">
                                </div>
                                <div style="display:flex;gap:16px;">
                                    <div class="input-group" style="flex:1;">
                                        <label>Trigger Type</label>
                                        <select id="btnTriggerType" class="input-neu" onchange="toggleTriggerValue()">
                                            <option value="MANUAL">Manual</option>
                                            <option value="WELCOME">Welcome (1st message)</option>
                                            <option value="KEYWORD">Keyword Match</option>
                                            <option value="FALLBACK">Low Confidence Fallback</option>
                                        </select>
                                    </div>
                                    <div class="input-group" style="flex:1;">
                                        <label>Quick Reply</label>
                                        <label class="toggle-label">
                                            <input type="checkbox" id="btnQuickReply">
                                            <span style="font-size:0.8rem;color:var(--text-secondary);">Disappear after
                                                click</span>
                                        </label>
                                    </div>
                                </div>
                                <div id="triggerValueGroup" class="input-group hidden">
                                    <label>Keywords (comma-separated)</label>
                                    <input type="text" id="btnTriggerValue" class="input-neu"
                                        placeholder="pricing, plans, cost">
                                </div>

                                <h4 style="margin-top:16px;margin-bottom:8px;">Buttons <span id="btnCountBadge"
                                        style="font-size:0.75rem;color:var(--text-tertiary);">(0/5)</span></h4>
                                <div id="buttonRowsContainer"></div>
                                <button class="btn-neu" id="btnAddRow" onclick="addButtonRow()"
                                    style="width:100%;margin-top:8px;color:var(--accent);">
                                    <span class="material-symbols-outlined">add</span> Add Button
                                </button>
                            </div>
                            <div class="btn-editor-footer">
                                <button class="btn-neu" onclick="hideButtonEditor()">Cancel</button>
                                <button class="btn-neu" id="btnSaveSet" onclick="saveButtonSet()"
                                    style="color:var(--success);">
                                    <span class="material-symbols-outlined">save</span> Save
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>

        <!-- ANALYTICS VIEW -->
        <div id="analyticsView" class="hidden">
            <header class="header">
                <div class="page-title">
                    <h1>Performance Analytics</h1>
                    <p>Insights into your chatbot's conversations and engagement.</p>
                </div>
                <div class="user-profile">
                    <button class="btn-neu" onclick="loadAnalyticsData()">
                        <span class="material-symbols-outlined">refresh</span>
                    </button>
                </div>
            </header>

            <div class="metrics-grid">
                <div class="neu-card">
                    <div class="metric-label">Total Conversations</div>
                    <div id="anaTotalConvs" class="metric-value">-</div>
                </div>
                <div class="neu-card">
                    <div class="metric-label">Avg. Messages/Chat</div>
                    <div id="anaAvgMsg" class="metric-value">-</div>
                </div>
                <div class="neu-card">
                    <div class="metric-label">Avg. Confidence</div>
                    <div id="anaAvgConf" class="metric-value">-</div>
                </div>
            </div>

            <div class="two-col-grid" style="margin-top: 24px;">
                <div class="neu-card">
                    <h3>Conversation Volume</h3>
                    <div
                        style="height: 300px; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.02); border-radius: 8px;">
                        <p style="color: var(--text-tertiary);">Chart Placeholder (Volume)</p>
                    </div>
                </div>
                <div class="neu-card">
                    <h3>Topic Distribution</h3>
                    <div
                        style="height: 300px; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.02); border-radius: 8px;">
                        <p style="color: var(--text-tertiary);">Chart Placeholder (Topics)</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- SETTINGS VIEW -->
        <div id="settingsView" class="hidden">
            <header class="header">
                <div class="page-title">
                    <h1>Global Settings</h1>
                    <p>Manage account and platform configurations.</p>
                </div>
            </header>

            <div class="neu-card" style="max-width: 800px;">
                <h2 class="section-title">Account</h2>
                <div class="input-group">
                    <label>Email Address</label>
                    <input type="email" value="admin@example.com" class="input-neu" disabled>
                </div>
                <div class="input-group">
                    <label>API Key (Master)</label>
                    <div style="display: flex; gap: 10px;">
                        <input type="password" value="sk_live_master_key_hidden" class="input-neu" disabled>
                        <button class="btn-neu">Reveal</button>
                    </div>
                </div>

                <h2 class="section-title" style="margin-top: 30px;">Platform Defaults</h2>
                <div class="input-group">
                    <label>Default Model</label>
                    <select class="input-neu">
                        <option>GPT-4o (Recommended)</option>
                        <option>GPT-3.5 Turbo</option>
                        <option>Claude 3.5 Sonnet</option>
                    </select>
                </div>

                <h2 class="section-title" style="margin-top: 30px;">Team</h2>
                <p style="color: var(--text-secondary); margin-bottom: 10px;">User management is disabled in this
                    version.</p>

                <div style="text-align: right; margin-top: 20px;">
                    <button class="btn-neu primary">Save Changes</button>
                </div>
            </div>
        </div>

    </main>

    <!-- NEW CONNECTION MODAL (RESTORED SIMPLE VERSION) -->
    <div id="workflowContainer" class="workflow-container">
        <div class="workflow-modal modal-content" style="width: 500px; max-width: 95%;">
            <div style="padding: 24px; background: var(--bg-body); border-radius: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <div>
                        <h2 style="font-size: 1.5rem;">New Connection</h2>
                        <p style="color:var(--text-secondary); font-size:0.9rem;">Enter your website details to get started.</p>
                    </div>
                </div>

                <div class="input-group">
                    <label style="font-weight: 600;">Website Name <span style="color: var(--error);">*</span></label>
                    <input type="text" id="inpSiteName" class="input-neu" placeholder="e.g. My Website" maxlength="64">
                </div>

                <div class="input-group" style="margin-top: 15px;">
                    <label style="font-weight: 600;">Website URL <span style="color: var(--error);">*</span></label>
                    <input type="url" id="inpSiteUrl" class="input-neu" placeholder="https://example.com">
                </div>

                <div class="input-group" style="margin-top: 15px;">
                    <label style="font-weight: 600;">API Key (Optional)</label>
                    <input type="password" id="inpApiKey" class="input-neu" placeholder="Custom secret key">
                </div>

                <div style="display: flex; gap: 10px; margin-top: 25px;">
                    <button id="btnCloseWorkflow" class="btn-neu" style="flex: 1;">Cancel</button>
                    <button id="btnCreateIdentity" class="btn-neu primary" style="flex: 2; color: var(--accent);">
                        <span class="material-symbols-outlined">add_circle</span>
                        Create Connection
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- TOAST -->
    <div id="toast" class="toast">Action Successful</div>
    `;

    return (
        <div id="admin-wrapper" dangerouslySetInnerHTML={{ __html: rawHtml }} />
    );
}
