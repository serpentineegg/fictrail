// Styles Module - All CSS styling for FicTrail

function addStyles() {
    const css = `
          /* Core Layout - Essential only */
          #fictrail-overlay {
              position: fixed;
              inset: 0;
              background: rgba(0, 0, 0, 0.8);
              z-index: 10000;
              display: none;
          }
          
          #fictrail-container {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              width: min(95vw, 1200px);
              height: 90vh;
              background: var(--bg-color, #f8fafc);
              border-radius: 12px;
              overflow: hidden;
              display: flex;
              flex-direction: column;
          }
          
          #fictrail-content {
              flex: 1;
              overflow-y: auto;
              display: flex;
              flex-direction: column;
          }
          
          /* Shared Patterns */
          .fictrail-section {
              padding: 20px;
              text-align: center;
          }
          
          .fictrail-flex-col {
              display: flex;
              flex-direction: column;
              gap: 20px;
          }
          
          .fictrail-flex-row {
              display: flex;
              gap: 20px;
              align-items: flex-start;
              flex-wrap: wrap;
          }
          
          /* Base Button - Theme Adaptable */
          .fictrail-btn-base {
              height: 44px;
              padding: 12px 24px;
              border-radius: 8px;
              font-size: 16px;
              font-weight: 600;
              cursor: pointer;
              border: none;
              box-sizing: border-box;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              transition: all 0.2s ease;
          }
          
          .fictrail-btn {
              background: var(--primary-color, #3b82f6);
              color: var(--primary-text, white);
          }
          
          .fictrail-btn:hover {
              opacity: 0.9;
          }
          
          .fictrail-btn-secondary {
              background: var(--bg-color, white);
              color: var(--text-color, #4a5568);
              border: 2px solid var(--border-color, #e2e8f0);
          }
          
          /* Header */
          .fictrail-header {
              padding: 24px;
              padding-bottom: 16px;
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              gap: 16px;
          }
          
          #fictrail-header-main { 
              flex: 1; 
          }
          
          .fictrail-header h1 {
              margin: 0;
              white-space: nowrap;
              font-size: 2em;
              font-weight: 300;
          }
          
          #fictrail-close {
              width: 32px;
              height: 32px;
              border-radius: 6px;
              cursor: pointer;
              border: none;
              background: rgba(0, 0, 0, 0.1);
              display: flex;
              align-items: center;
              justify-content: center;
              transition: all 0.2s ease;
          }
          
          #fictrail-close:hover {
              background: rgba(239, 68, 68, 0.1);
              color: #dc2626;
          }
          
          /* Subtitle */
          #fictrail-subtitle {
          color: var(--text-muted, #718096);
              display: flex;
              flex-wrap: wrap;
              gap: 4px 8px; /* vertical gap smaller than horizontal */
              align-items: center;
              justify-content: center;
              margin-top: 10px;
          }
          
          #fictrail-subtitle span { 
              white-space: nowrap; 
          }
          
          #fictrail-subtitle span:not(:first-child)::before {
              content: " • ";
              margin-right: 4px;
          }
          
          @media (min-width: 769px) {
              #fictrail-subtitle { justify-content: flex-start; }
          }
          
          /* Favorite Tags Summary */
          .fictrail-favorite-tags-summary {
              margin-top: 8px;
              color: var(--text-muted, #718096);
              line-height: 1.5;
          }
          
          /* Main Content Areas */
          .fictrail-main { 
              flex: 1; 
              overflow-y: auto; 
              display: flex; 
              flex-direction: column; 
          }
          
          .fictrail-loading,
          .fictrail-error,
          .fictrail-no-results { 
              padding: 80px 40px; 
              text-align: center; 
          }
          
          .fictrail-history { 
              padding: 20px; 
              display: flex; 
              flex-direction: column; 
              gap: 20px; 
          }
          
          /* Controls */
          .fictrail-controls-section { 
              display: flex; 
              flex-direction: column; 
              gap: 12px; 
          }
          
          .fictrail-controls { 
              display: flex; 
              gap: 20px; 
              align-items: flex-start; 
              flex-wrap: wrap; 
          }
          
          .fictrail-search { 
              flex: 1; 
              min-width: 250px; 
          }
          
          .fictrail-search input,
          .fictrail-filter select {
              width: 100%;
              padding: 10px 15px;
              border: 2px solid var(--border-color, #e2e8f0);
              border-radius: 8px;
              font-size: 14px;
              outline: none;
              height: 42px;
              box-sizing: border-box;
          }
          
          .fictrail-search input {
              box-shadow: none !important;
              -webkit-box-shadow: none !important;
              -moz-box-shadow: none !important;
          }
          
          .fictrail-filter select {
              width: 200px;
              background: var(--bg-color, white);
              cursor: pointer;
          }
          
          .fictrail-results-count {
              padding-left: 4px;
              font-size: 14px;
              color: var(--text-muted, #718096);
              font-weight: 500;
          }
          
          /* Works Grid */
          .fictrail-works {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
              gap: 20px;
          }
          
          @media (min-width: 1025px) {
              .fictrail-works { grid-template-columns: repeat(2, 1fr); }
          }
          
          .fictrail-work {
              background: var(--bg-color, white);
              border-radius: 12px;
              padding: 20px;
              border: 1px solid var(--border-color, #e2e8f0);
              transition: border-color 0.2s ease;
          }
          
          .fictrail-work:hover {
              border-color: var(--border-hover, #cbd5e0);
          }
          
          /* Work Content */
          .fictrail-work-header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 8px;
          }
          
          .fictrail-work h3 {
              margin: 0 15px 0 0;
              font-size: 1.1em;
              line-height: 1.4;
              flex: 1;
          }
          
          .fictrail-work h3 a {
              color: var(--link-color, #3b82f6);
              text-decoration: none;
              font-weight: 600;
          }
          
          .fictrail-work-number {
              background: var(--primary-color, #3b82f6);
              color: var(--primary-text, white);
              padding: 4px 10px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: 600;
          }
          
          /* Author and Fandoms */
          .fictrail-author {
              color: var(--text-color, #4a5568);
              font-style: italic;
              margin-bottom: 6px;
              font-weight: 500;
          }
          
          .fictrail-author a {
              color: var(--link-color, #3b82f6);
              text-decoration: none;
              font-weight: 600;
          }
          
          .fictrail-fandoms {
              color: var(--fandom-color, #38a169);
              font-weight: 600;
              margin-bottom: 8px;
              font-size: 0.9em;
              line-height: 1.3;
          }
          
          /* Summary */
          .fictrail-summary {
              color: var(--text-muted, #718096);
              font-size: 14px;
              line-height: 1.4;
              margin: 10px 0 0 0;
              max-height: 120px;
              overflow-y: auto;
              border: 1px solid var(--border-color, #e2e8f0);
              border-radius: 6px;
              padding: 8px;
              background: var(--summary-bg, #fafafa);
          }
          
          /* Matching Sections */
          .fictrail-matching-section {
              margin: 12px 0;
              padding: 12px;
              background: var(--highlight-bg, #f0f9ff);
              border-radius: 6px;
              border: 1px solid var(--highlight-border, #bae6fd);
              font-size: 14px;
              line-height: 1.4;
          }
          
          /* Metadata */
          .fictrail-metadata {
              display: flex;
              gap: 12px;
              flex-wrap: wrap;
              margin-top: 12px;
          }
          
          .fictrail-metadata span {
              background: var(--meta-bg, #edf2f7);
              color: var(--meta-text, #4a5568);
              padding: 4px 8px;
              border-radius: 6px;
              font-size: 12px;
          }
          
          /* Tags */
          .fictrail-tag-match {
              display: inline-block;
              padding: 2px 6px;
              margin: 2px;
              border-radius: 4px;
              font-size: 12px;
              cursor: pointer;
              position: relative;
              outline: none;
              tabindex: 0;
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
          
          /* Tag tooltips */
          .fictrail-tag-match::after {
              content: attr(data-tooltip);
              position: absolute;
              bottom: 125%;
              left: 50%;
              transform: translateX(-50%);
              background-color: #1f2937;
              color: white;
              padding: 6px 10px;
              border-radius: 6px;
              font-size: 12px;
              font-weight: 500;
              white-space: nowrap;
              z-index: 1000;
              visibility: hidden;
              opacity: 0;
              transition: opacity 0.2s ease, visibility 0.2s ease;
              pointer-events: none;
          }
          
          .fictrail-tag-match::before {
              content: "";
              position: absolute;
              bottom: 115%;
              left: 50%;
              transform: translateX(-50%);
              border: 5px solid transparent;
              border-top-color: #1f2937;
              z-index: 1000;
              visibility: hidden;
              opacity: 0;
              transition: opacity 0.2s ease, visibility 0.2s ease;
              pointer-events: none;
          }
          
          .fictrail-tag-match:hover::after,
          .fictrail-tag-match:hover::before,
          .fictrail-tag-match:focus::after,
          .fictrail-tag-match:focus::before {
              visibility: visible;
              opacity: 1;
          }
          
          /* Tag focus states */
          .fictrail-tag-relationship:focus {
              background: #fde047;
              color: #b45309;
          }
          
          .fictrail-tag-character:focus {
              background: #bbf7d0;
              color: #15803d;
          }
          
          .fictrail-tag-freeform:focus {
              background: #c7d2fe;
              color: #3730a3;
          }
          
          /* Spinner */
          .fictrail-spinner {
              width: 40px;
              height: 40px;
              border: 3px solid var(--border-color, #e2e8f0);
              border-top-color: var(--primary-color, #3b82f6);
              border-radius: 50%;
              animation: spin 1s linear infinite;
              margin: 0 auto 32px;
          }
          
          @keyframes spin {
              to { transform: rotate(360deg); }
          }
          
          /* Footer and Load More - Centered */
          .fictrail-footer {
              padding: 30px 20px;
              text-align: center;
          }
          
          .fictrail-footer-content {
              display: flex;
              flex-direction: column;
              gap: 20px;
              align-items: center;
          }
          
          .fictrail-footer .fictrail-page-selector {
              display: flex;
              flex-direction: column;
              gap: 15px;
              align-items: center;
          }
          
          .fictrail-footer .fictrail-page-selector-header {
              display: flex;
              align-items: center;
              gap: 8px;
          }
          
          .fictrail-footer .fictrail-page-selector-header label {
              font-size: 16px;
              font-weight: 600;
              color: var(--text-color, #374151);
          }
          
          .fictrail-info-message {
              font-size: 14px;
              color: var(--text-muted, #6b7280);
          }
          
          .fictrail-footer .fictrail-slider-container {
              width: 300px;
          }
          
          /* Load More Results - Centered */
          .fictrail-load-more-message {
              text-align: center;
          }
          
          .fictrail-load-more-message p {
              margin: 0;
              color: var(--text-muted, #718096);
              font-size: 0.9em;
              font-weight: 500;
          }
          
          .fictrail-load-more-btn {
              margin-top: 15px;
              text-align: center;
          }
          
          .fictrail-load-more-btn button {
              background: var(--bg-color, white);
              color: var(--primary-color, #3b82f6);
              border: 2px solid var(--primary-color, #3b82f6);
          }
          
          .fictrail-load-more-btn button:hover {
              background: var(--primary-color, #3b82f6);
              color: var(--primary-text, white);
          }
          
          /* Slider Styles */
          .fictrail-slider-container {
              display: flex;
              flex-direction: column;
              gap: 8px;
          }
          
          .fictrail-slider-track {
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 12px;
          }
          
          .fictrail-slider-min,
          .fictrail-slider-max {
              font-size: 12px;
              color: var(--text-muted, #718096);
              font-weight: 500;
              min-width: 20px;
              text-align: center;
          }
          
          .fictrail-slider {
              width: 200px;
              height: 6px;
              border-radius: 3px;
              background: var(--border-color, #e2e8f0);
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
              background: var(--primary-color, #3b82f6);
              cursor: pointer;
          }
          
          .fictrail-slider::-moz-range-thumb {
              width: 18px;
              height: 18px;
              border-radius: 50%;
              background: var(--primary-color, #3b82f6);
              cursor: pointer;
              border: none;
          }
          
          /* Responsive */
          @media (max-width: 768px) {
              #fictrail-container { 
                  width: 98vw; 
                  height: 95vh; 
                  border-radius: 8px; 
              }
              
              .fictrail-header { 
                  padding: 16px; 
                  padding-bottom: 10px;
                  flex-direction: column; 
                  gap: 12px; 
                  align-items: center;
              }
              
              #fictrail-header-main { text-align: center; }
              
              #fictrail-close-btn { 
                  position: absolute; 
                  top: 16px; 
                  right: 16px; 
              }
              
              .fictrail-controls { 
                  flex-direction: column; 
                  gap: 12px; 
              }
              
              .fictrail-search,
              .fictrail-filter { 
                  width: 100%; 
                  min-width: unset; 
              }
              
              .fictrail-filter select { width: 100%; }
              
              .fictrail-works { 
                  grid-template-columns: 1fr; 
                  gap: 16px; 
              }
              
              .fictrail-work { padding: 16px; }
              
              .fictrail-work-header { 
                  flex-direction: column; 
                  gap: 8px; 
                  align-items: flex-start; 
              }
              
              .fictrail-work h3 { 
                  margin-right: 0; 
                  margin-bottom: 8px; 
              }
              
              .fictrail-history { 
                  padding: 16px; 
                  gap: 16px; 
              }
              
              .fictrail-favorite-tags-summary {
                  display: none;
              }
          }
      `;

    // Use GM_addStyle if available, otherwise fallback to creating style element
    if (typeof GM_addStyle !== 'undefined') {
      GM_addStyle(css);
    } else {
      const style = document.createElement('style');
      style.textContent = css;
      document.head.appendChild(style);
    }
  }
