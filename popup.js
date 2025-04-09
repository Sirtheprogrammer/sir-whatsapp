<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WhatsApp Web Enhancer</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      width: 300px;
      margin: 0;
      padding: 0;
      color: #4a4a4a;
    }
    
    header {
      background-color: #25D366;
      color: white;
      padding: 15px;
      text-align: center;
      border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    }
    
    h1 {
      margin: 0;
      font-size: 18px;
      font-weight: 500;
    }
    
    .container {
      padding: 15px;
    }
    
    .feature-toggle {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 15px;
      padding-bottom: 15px;
      border-bottom: 1px solid #f0f0f0;
    }
    
    .feature-toggle:last-child {
      border-bottom: none;
    }
    
    .feature-name {
      font-weight: 500;
    }
    
    .feature-description {
      font-size: 12px;
      color: #888;
      margin-top: 3px;
    }
    
    /* Toggle switch */
    .switch {
      position: relative;
      display: inline-block;
      width: 44px;
      height: 24px;
    }
    
    .switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }
    
    .slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: #ccc;
      transition: .4s;
      border-radius: 24px;
    }
    
    .slider:before {
      position: absolute;
      content: "";
      height: 18px;
      width: 18px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      transition: .4s;
      border-radius: 50%;
    }
    
    input:checked + .slider {
      background-color: #25D366;
    }
    
    input:checked + .slider:before {
      transform: translateX(20px);
    }
    
    .button-container {
      display: flex;
      justify-content: space-between;
      margin-top: 20px;
    }
    
    button {
      padding: 8px 12px;
      background-color: #f5f5f5;
      border: 1px solid #ddd;
      border-radius: 4px;
      cursor: pointer;
      font-size: 13px;
      transition: background-color 0.3s;
    }
    
    button:hover {
      background-color: #eaeaea;
    }
    
    .status {
      text-align: center;
      font-size: 12px;
      color: #888;
      margin-top: 15px;
    }
    
    .primary-button {
      background-color: #128C7E;
      color: white;
      border: none;
    }
    
    .primary-button:hover {
      background-color: #0e6d62;
    }
  </style>
</head>
<body>
  <header>
    <h1>WhatsApp Web Enhancer</h1>
  </header>
  
  <div class="container">
    <div class="feature-toggle">
      <div>
        <div class="feature-name">Anti-Delete</div>
        <div class="feature-description">See messages even after they're deleted</div>
      </div>
      <label class="switch">
        <input type="checkbox" id="anti-delete-toggle">
        <span class="slider"></span>
      </label>
    </div>
    
    <div class="feature-toggle">
      <div>
        <div class="feature-name">Invisible Mode</div>
        <div class="feature-description">Hide your online and typing status</div>
      </div>
      <label class="switch">
        <input type="checkbox" id="invisible-mode-toggle">
        <span class="slider"></span>
      </label>
    </div>
    
    <div class="feature-toggle">
      <div>
        <div class="feature-name">AI Integration</div>
        <div class="feature-description">Generate messages with Gemini AI</div>
      </div>
      <label class="switch">
        <input type="checkbox" id="ai-integration-toggle">
        <span class="slider"></span>
      </label>
    </div>
    
    <div class="feature-toggle">
      <div>
        <div class="feature-name">Auto Status</div>
        <div class="feature-description">Automatically update your status</div>
      </div>
      <label class="switch">
        <input type="checkbox" id="auto-status-toggle">
        <span class="slider"></span>
      </label>
    </div>
    
    <div class="button-container">
      <button id="view-deleted">View Deleted Messages</button>
      <button id="advanced-settings" class="primary-button">Advanced Settings</button>
    </div>
    
    <div class="status" id="status-text">Ready</div>
  </div>
  
  <script src="popup.js"></script>
</body>
</html>
