// Styles Module - All CSS styling for FicTrail

function addStyles() {
  GM_addStyle(`
        /* FicTrail Styles */
        #fictrail-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            z-index: 10000;
            display: none;
        }
        
        #fictrail-container {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 95%;
            max-width: 1200px;
            min-width: 800px;
            height: 90%;
            background: #f8fafc;
            border-radius: 12px;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }
        
        #fictrail-close {
            background: rgba(0, 0, 0, 0.1);
            color: #4a5568;
            border: none;
            width: 32px;
            height: 32px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
            font-weight: 600;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
        }
        
        #fictrail-close:hover {
            background: rgba(239, 68, 68, 0.1);
            color: #dc2626;
        }
        
        #fictrail-header-main {
            flex: 1;
        }
        
        #fictrail-content {
            padding: 0;
            overflow-y: auto;
            height: 100%;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            flex-direction: column;
        }
        
        .fictrail-header {
            padding: 24px 40px 20px 40px;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 32px;
        }
        
        
        .fictrail-header h1 {
            font-size: 2em;
            font-weight: 300;
            color: #2d3748;
            margin: 0 0 3px 0;
        }
        
        .fictrail-header p {
            font-size: 1em;
            color: #718096;
            margin: 0;
        }
        
        .fictrail-main {
            flex: 1;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
        }
        
        .fictrail-btn {
            background: #3b82f6;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: background-color 0.2s ease;
        }
        
        .fictrail-btn:hover {
            background: #2563eb;
        }
        
        .fictrail-btn:disabled {
            background: #9ca3af;
            cursor: not-allowed;
            opacity: 0.6;
        }
        
        .fictrail-btn:disabled:hover {
            background: #9ca3af;
        }
        
        .fictrail-btn-secondary {
            background: white;
            color: #4a5568;
            border: 2px solid #e2e8f0;
            padding: 10px 20px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
        }
        
        .fictrail-loading {
            padding: 80px 40px;
            text-align: center;
        }
        
        .fictrail-spinner {
            width: 40px;
            height: 40px;
            border: 3px solid #e2e8f0;
            border-top: 3px solid #3b82f6;
            border-radius: 50%;
            animation: fictrail-spin 1s linear infinite;
            margin: 0 auto 32px;
        }
        
        @keyframes fictrail-spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .fictrail-error {
            padding: 80px 40px;
            text-align: center;
        }
        
        .fictrail-error h2 {
            font-size: 2.2em;
            font-weight: 300;
            color: #e53e3e;
            margin-bottom: 24px;
        }
        
        .fictrail-history {
            padding: 48px 40px;
        }
        
        .fictrail-controls {
            display: flex;
            gap: 20px;
            align-items: flex-end;
            flex-wrap: wrap;
            margin-bottom: 32px;
        }
        
        .fictrail-search {
            flex: 1;
            min-width: 300px;
        }
        
        .fictrail-search input {
            width: 100%;
            padding: 10px 15px;
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            font-size: 14px;
            outline: none;
            box-shadow: none !important;
            -webkit-box-shadow: none !important;
            -moz-box-shadow: none !important;
            height: 42px;
            line-height: 1.2;
            box-sizing: border-box;
        }
        
        .fictrail-filter select {
            padding: 10px 15px;
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            background: white;
            font-size: 14px;
            cursor: pointer;
            outline: none;
            width: 200px;
            height: 42px;
            line-height: 1.2;
        }
        
        .fictrail-works {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 20px;
        }
        
        .fictrail-work {
            background: white;
            border-radius: 12px;
            padding: 20px;
            border: 1px solid #e2e8f0;
            transition: all 0.2s ease;
        }
        
        .fictrail-work:hover {
            border-color: #cbd5e0;
        }
        
        .fictrail-work-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 8px;
        }
        
        .fictrail-work h3 {
            margin: 0;
            font-size: 1.1em;
            line-height: 1.4;
            flex: 1;
            margin-right: 15px;
        }
        
        .fictrail-work h3 a {
            color: #3b82f6;
            text-decoration: none;
            font-weight: 600;
            border-bottom: 1px solid transparent;
            transition: all 0.2s ease;
        }
        
        .fictrail-work h3 a:hover {
            color: #2563eb;
            border-bottom-color: #3b82f6;
            text-decoration: none !important;
        }
        
        .fictrail-work-number {
            background: #3b82f6;
            color: white;
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
        }
        
        .fictrail-author {
            color: #4a5568;
            font-style: italic;
            margin-bottom: 6px;
            font-weight: 500;
        }
        
        .fictrail-author a {
            color: #3b82f6;
            text-decoration: none;
            font-weight: 600;
        }
        
        .fictrail-fandoms {
            color: #38a169;
            font-weight: 600;
            margin-bottom: 8px;
            font-size: 0.9em;
        }
        
        .fictrail-metadata {
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
            margin-top: 12px;
        }
        
        .fictrail-metadata span {
            background: #edf2f7;
            color: #4a5568;
            padding: 4px 8px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 500;
        }
        
        .fictrail-last-visited {
            color: #718096;
            font-size: 12px;
            margin: 12px 0;
            font-weight: 500;
        }
        
        .fictrail-summary {
            color: #718096;
            font-size: 14px;
            line-height: 1.4;
            margin: 8px 0 0 0;
        }
        
        .fictrail-matching-section {
            margin: 12px 0;
            padding: 12px;
            background: #f0f9ff;
            border-radius: 6px;
            border: 1px solid #bae6fd;
            font-size: 14px;
            line-height: 1.4;
        }
        
        .fictrail-tag-match {
            display: inline-block;
            padding: 2px 6px;
            margin: 2px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 500;
            cursor: pointer;
        }
        
        .fictrail-tag-relationship {
            background: #fef3c7;
            color: #d97706;
            border: 1px solid #fed7aa;
        }
        
        .fictrail-tag-character {
            background: #dcfce7;
            color: #16a34a;
            border: 1px solid #bbf7d0;
        }
        
        .fictrail-tag-freeform {
            background: #e0e7ff;
            color: #4338ca;
            border: 1px solid #c7d2fe;
        }
        
        .fictrail-no-results {
            padding: 80px 40px;
            text-align: center;
        }
        
        .fictrail-no-results h3 {
            font-size: 1.8em;
            font-weight: 300;
            margin-bottom: 16px;
            color: #4a5568;
        }
        
        .fictrail-narrow-search-message {
            margin-top: 20px;
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 8px;
            padding: 15px;
            text-align: center;
        }
        
        .fictrail-narrow-search-message p {
            margin: 0;
            color: #92400e;
            font-size: 0.9em;
        }
        
        .fictrail-favorite-tags-summary {
            margin: 10px 0 5px 0;
        }
        
        .fictrail-summary-text {
            color: #718096;
            font-size: 10px;
            font-style: italic;
            margin: 0;
            line-height: 1.5;
        }
        
        .fictrail-page-selector {
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-bottom: 12px;
        }
        
        .fictrail-page-selector-header {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .fictrail-page-selector label {
            font-size: 14px;
            font-weight: 600;
            color: #4a5568;
        }
        
        .fictrail-info-tooltip {
            cursor: help;
            font-size: 14px;
            color: #718096;
            transition: color 0.2s ease;
        }
        
        .fictrail-info-tooltip:hover {
            color: #4a5568;
        }
        
        .fictrail-slider-container {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        
        .fictrail-slider-track {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        .fictrail-slider-min,
        .fictrail-slider-max {
            font-size: 12px;
            color: #718096;
            font-weight: 500;
            min-width: 20px;
            text-align: center;
        }
        
        .fictrail-slider {
            width: 200px;
            height: 6px;
            border-radius: 3px;
            background: #e2e8f0;
            outline: none;
            -webkit-appearance: none;
            appearance: none;
        }
        
        .fictrail-slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background: #3b82f6;
            cursor: pointer;
        }
        
        .fictrail-slider::-moz-range-thumb {
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background: #3b82f6;
            cursor: pointer;
            border: none;
        }
    `);
}
