/**
 * Hostmagic Settings & Gateway Hub Dashboard Template
 */

export function getDefaultDashboardTemplate(): string {
  return `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Hostmagic Settings &amp; Gateway</title>
  <link rel="manifest" href="/__hostmagic/manifest.json" />
  <link rel="icon" type="image/webp" href="/magichost.webp" />
  <link rel="icon" type="image/webp" href="/__hostmagic/magichost.webp" />
  <link rel="shortcut icon" href="/favicon.ico" />
  <link rel="apple-touch-icon" href="/magichost.webp" />
  <meta name="theme-color" content="#161616" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="apple-mobile-web-app-title" content="Hostmagic" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;1,400&family=IBM+Plex+Sans:wght@300;400;600&display=swap" rel="stylesheet" />
  <style>
    /* Carbon Design System Token Architecture */
    :root, [data-theme="dark"] {
      --cds-background: #161616;
      --cds-layer-01: #262626;
      --cds-layer-02: #393939;
      --cds-layer-03: #525252;
      --cds-layer-hover: #333333;
      --cds-layer-selected: #002d9c;
      --cds-field: #262626;
      --cds-field-hover: #333333;
      
      --cds-text-primary: #f4f4f4;
      --cds-text-secondary: #c6c6c6;
      --cds-text-helper: #8d8d8d;
      --cds-text-on-color: #ffffff;
      
      --cds-border-subtle: #393939;
      --cds-border-strong: #6f6f6f;
      --cds-border-interactive: #78a9ff;
      
      --cds-interactive: #78a9ff;
      --cds-link-primary: #78a9ff;
      --cds-link-primary-hover: #a6c8ff;
      
      --cds-button-primary: #0f62fe;
      --cds-button-primary-hover: #0353e9;
      --cds-button-primary-active: #002d9c;
      
      --cds-button-secondary: #393939;
      --cds-button-secondary-hover: #4c4c4c;
      --cds-button-secondary-active: #6f6f6f;
      
      --cds-button-tertiary: transparent;
      --cds-button-tertiary-hover: #78a9ff;
      
      --cds-button-danger: #da1e28;
      --cds-button-danger-hover: #b81921;
      --cds-button-danger-active: #750e13;

      --cds-button-success: #24a148;
      --cds-button-success-hover: #198038;
      
      --cds-support-error: #fa4d56;
      --cds-support-success: #42be65;
      --cds-support-warning: #f1c21b;
      --cds-support-info: #4589ff;
      
      --cds-tag-bg-blue: #002d9c;
      --cds-tag-text-blue: #edf5ff;
      --cds-tag-bg-green: #044317;
      --cds-tag-text-green: #defbe6;
      --cds-tag-bg-gray: #393939;
      --cds-tag-text-gray: #f4f4f4;
      --cds-tag-bg-purple: #491d8b;
      --cds-tag-text-purple: #f6f2ff;
      --cds-tag-bg-amber: #483700;
      --cds-tag-text-amber: #fdf4d8;
      --cds-tag-bg-red: #750e13;
      --cds-tag-text-red: #fff1f1;

      --cds-masthead-bg: #121212;
      --cds-masthead-text: #ffffff;
      --cds-masthead-subtle: #8d8d8d;

      --cds-overlay-backdrop: rgba(0, 0, 0, 0.75);
      --cds-shadow-raised: 0 4px 12px rgba(0, 0, 0, 0.4);
    }

    [data-theme="light"] {
      --cds-background: #ffffff;
      --cds-layer-01: #f4f4f4;
      --cds-layer-02: #e0e0e0;
      --cds-layer-03: #ffffff;
      --cds-layer-hover: #e8e8e8;
      --cds-layer-selected: #edf5ff;
      --cds-field: #f4f4f4;
      --cds-field-hover: #e8e8e8;
      
      --cds-text-primary: #161616;
      --cds-text-secondary: #525252;
      --cds-text-helper: #6f6f6f;
      --cds-text-on-color: #ffffff;
      
      --cds-border-subtle: #e0e0e0;
      --cds-border-strong: #8d8d8d;
      --cds-border-interactive: #0f62fe;
      
      --cds-interactive: #0f62fe;
      --cds-link-primary: #0f62fe;
      --cds-link-primary-hover: #0043ce;
      
      --cds-button-primary: #0f62fe;
      --cds-button-primary-hover: #0353e9;
      --cds-button-primary-active: #002d9c;
      
      --cds-button-secondary: #393939;
      --cds-button-secondary-hover: #4c4c4c;
      --cds-button-secondary-active: #6f6f6f;
      
      --cds-button-tertiary: transparent;
      --cds-button-tertiary-hover: #0353e9;
      
      --cds-button-danger: #da1e28;
      --cds-button-danger-hover: #b81921;
      --cds-button-danger-active: #750e13;

      --cds-button-success: #24a148;
      --cds-button-success-hover: #198038;
      
      --cds-support-error: #da1e28;
      --cds-support-success: #24a148;
      --cds-support-warning: #f1c21b;
      --cds-support-info: #0f62fe;
      
      --cds-tag-bg-blue: #edf5ff;
      --cds-tag-text-blue: #0043ce;
      --cds-tag-bg-green: #defbe6;
      --cds-tag-text-green: #198038;
      --cds-tag-bg-gray: #e0e0e0;
      --cds-tag-text-gray: #393939;
      --cds-tag-bg-purple: #f6f2ff;
      --cds-tag-text-purple: #6929c4;
      --cds-tag-bg-amber: #fdf4d8;
      --cds-tag-text-amber: #8a6d00;
      --cds-tag-bg-red: #fff1f1;
      --cds-tag-text-red: #da1e28;

      --cds-masthead-bg: #161616;
      --cds-masthead-text: #ffffff;
      --cds-masthead-subtle: #c6c6c6;

      --cds-overlay-backdrop: rgba(22, 22, 22, 0.6);
      --cds-shadow-raised: 0 2px 6px rgba(0, 0, 0, 0.2);
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'IBM Plex Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: var(--cds-background);
      color: var(--cds-text-primary);
      min-height: 100vh;
      line-height: 1.43;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    /* SVG icon utility styling (react-icons style) */
    .icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      vertical-align: -0.15em;
      flex-shrink: 0;
    }

    .icon svg {
      width: 1em;
      height: 1em;
    }

    /* IBM Masthead Navigation Bar (Fused Header) */
    .carbon-masthead {
      min-height: 56px;
      background-color: var(--cds-masthead-bg);
      color: var(--cds-masthead-text);
      position: sticky;
      top: 0;
      z-index: 1000;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      padding: 10px 24px;
      display: flex;
      align-items: center;
    }

    .masthead-container {
      max-width: 1600px;
      width: 100%;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
    }

    .masthead-left {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .brand-mark {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      background: transparent;
      color: #ffffff;
      border-radius: 50%;
      flex-shrink: 0;
      line-height: 1;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }

    .brand-mark img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .pwa-install-btn {
      background: var(--cds-interactive) !important;
      color: #ffffff !important;
      border-color: var(--cds-interactive) !important;
      font-weight: 500;
    }

    .pwa-install-btn:hover {
      background: var(--cds-button-primary-hover) !important;
      color: #ffffff !important;
    }

    .masthead-title-group {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .brand-name {
      font-size: 15px;
      font-weight: 600;
      letter-spacing: 0.16px;
      color: #ffffff;
      display: flex;
      align-items: center;
      gap: 8px;
      line-height: 1.2;
    }

    .brand-subtitle {
      font-size: 12px;
      font-weight: 300;
      color: var(--cds-masthead-subtle);
      letter-spacing: 0.16px;
      line-height: 1.2;
    }

    .domain-badge {
      font-family: 'IBM Plex Mono', monospace;
      font-size: 11px;
      letter-spacing: 0.16px;
      padding: 2px 7px;
      background: #262626;
      color: #78a9ff;
      border: 1px solid #393939;
      border-radius: 0;
    }

    .masthead-right {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    /* Masthead Action Items */
    .masthead-btn {
      height: 32px;
      padding: 0 12px;
      background: transparent;
      border: 1px solid transparent;
      color: var(--cds-masthead-subtle);
      font-family: 'IBM Plex Sans', sans-serif;
      font-size: 13px;
      letter-spacing: 0.16px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      border-radius: 0;
      transition: background-color 0.15s, color 0.15s;
    }

    .masthead-btn:hover {
      background: #262626;
      color: #ffffff;
    }

    .masthead-btn:focus-visible {
      outline: 2px solid #0f62fe;
      outline-offset: -2px;
    }

    /* Carbon Toggle Switch for Start on Boot */
    .carbon-toggle-wrapper {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 0 10px;
      height: 32px;
      border: 1px solid var(--cds-border-subtle);
      background: transparent;
      user-select: none;
      cursor: pointer;
      transition: background-color 0.15s, border-color 0.15s;
    }

    .carbon-toggle-wrapper:hover {
      background-color: var(--cds-layer-hover);
      border-color: var(--cds-border-strong);
    }

    .toggle-label-text {
      font-size: 12px;
      font-family: 'IBM Plex Sans', sans-serif;
      color: var(--cds-masthead-subtle);
      letter-spacing: 0.16px;
    }

    .carbon-toggle-switch {
      background: transparent;
      border: none;
      padding: 0;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      pointer-events: none;
    }

    .carbon-toggle-track {
      width: 28px;
      height: 16px;
      background-color: var(--cds-border-strong);
      border-radius: 16px;
      position: relative;
      transition: background-color 0.15s cubic-bezier(0.2, 0, 0.38, 0.9);
      display: inline-block;
    }

    .carbon-toggle-dot {
      width: 12px;
      height: 12px;
      background-color: #ffffff;
      border-radius: 50%;
      position: absolute;
      top: 2px;
      left: 2px;
      transition: transform 0.15s cubic-bezier(0.2, 0, 0.38, 0.9);
    }

    .carbon-toggle-switch[aria-checked="true"] .carbon-toggle-track {
      background-color: var(--cds-button-primary);
    }

    .carbon-toggle-switch[aria-checked="true"] .carbon-toggle-dot {
      transform: translateX(12px);
    }

    .carbon-toggle-status {
      font-family: 'IBM Plex Mono', monospace;
      font-size: 11px;
      font-weight: 600;
      color: var(--cds-text-helper);
      min-width: 20px;
      text-transform: uppercase;
    }

    .carbon-toggle-switch[aria-checked="true"] .carbon-toggle-status {
      color: var(--cds-interactive);
    }

    /* Project Card Autostart Toggle Switch */
    .project-autostart-toggle {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 0 8px;
      height: 28px;
      border: 1px solid var(--cds-border-subtle);
      background: var(--cds-layer);
      user-select: none;
      cursor: pointer;
      font-size: 11px;
      font-weight: 500;
      color: var(--cds-text-secondary);
      transition: background-color 0.15s, border-color 0.15s, color 0.15s;
    }

    .project-autostart-toggle:hover {
      background-color: var(--cds-layer-hover);
      border-color: var(--cds-border-strong);
      color: var(--cds-text-primary);
    }

    .project-autostart-toggle.active {
      border-color: var(--cds-interactive);
      background-color: rgba(15, 98, 254, 0.12);
      color: var(--cds-interactive);
    }

    .project-autostart-toggle .toggle-track {
      width: 24px;
      height: 14px;
      background-color: var(--cds-border-strong);
      border-radius: 14px;
      position: relative;
      transition: background-color 0.15s cubic-bezier(0.2, 0, 0.38, 0.9);
      display: inline-block;
    }

    .project-autostart-toggle .toggle-dot {
      width: 10px;
      height: 10px;
      background-color: #ffffff;
      border-radius: 50%;
      position: absolute;
      top: 2px;
      left: 2px;
      transition: transform 0.15s cubic-bezier(0.2, 0, 0.38, 0.9);
    }

    .project-autostart-toggle.active .toggle-track {
      background-color: var(--cds-button-primary);
    }

    .project-autostart-toggle.active .toggle-dot {
      transform: translateX(10px);
    }

    /* Main Content Layout */
    .main-container {
      max-width: 1600px;
      margin: 0 auto;
      padding: 32px 0 64px 0;
    }

    /* Carbon Buttons (0px border-radius, strict rectangular) */
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      height: 40px;
      padding: 0 16px;
      font-family: 'IBM Plex Sans', sans-serif;
      font-size: 14px;
      font-weight: 400;
      letter-spacing: 0.16px;
      cursor: pointer;
      border: 1px solid transparent;
      border-radius: 0;
      text-decoration: none;
      transition: background-color 0.15s, border-color 0.15s, color 0.15s;
      white-space: nowrap;
    }

    .btn:focus-visible {
      outline: 2px solid var(--cds-border-interactive);
      outline-offset: 1px;
    }

    .btn-primary {
      background-color: var(--cds-button-primary);
      color: var(--cds-text-on-color);
    }
    .btn-primary:hover {
      background-color: var(--cds-button-primary-hover);
    }
    .btn-primary:active {
      background-color: var(--cds-button-primary-active);
    }

    .btn-secondary {
      background-color: var(--cds-button-secondary);
      color: var(--cds-text-on-color);
    }
    .btn-secondary:hover {
      background-color: var(--cds-button-secondary-hover);
    }
    .btn-secondary:active {
      background-color: var(--cds-button-secondary-active);
    }

    .btn-tertiary {
      background-color: transparent;
      border-color: var(--cds-border-strong);
      color: var(--cds-text-primary);
    }
    .btn-tertiary:hover {
      background-color: var(--cds-layer-hover);
      border-color: var(--cds-interactive);
      color: var(--cds-interactive);
    }

    .btn-ghost {
      background-color: transparent;
      color: var(--cds-link-primary);
    }
    .btn-ghost:hover {
      background-color: var(--cds-layer-hover);
    }

    .btn-danger {
      background-color: var(--cds-button-danger);
      color: var(--cds-text-on-color);
    }
    .btn-danger:hover {
      background-color: var(--cds-button-danger-hover);
    }

    .btn-danger-outline {
      background-color: transparent;
      border: 1px solid var(--cds-button-danger);
      color: var(--cds-support-error);
    }
    .btn-danger-outline:hover {
      background-color: var(--cds-button-danger);
      color: var(--cds-text-on-color);
      border-color: var(--cds-button-danger);
    }
    .btn-danger-outline:disabled {
      opacity: 0.4;
      cursor: not-allowed;
      border-color: var(--cds-border-subtle);
      color: var(--cds-text-helper);
      background-color: transparent;
    }

    .btn-success {
      background-color: var(--cds-button-success);
      color: var(--cds-text-on-color);
    }
    .btn-success:hover {
      background-color: var(--cds-button-success-hover);
    }

    .btn-sm {
      height: 32px;
      padding: 0 12px;
      font-size: 13px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .spin {
      display: inline-block;
      animation: spin 0.8s linear infinite;
    }

    /* Carbon Metric Tiles Grid (8px grid alignment) */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 16px;
      margin-bottom: 32px;
    }

    .metric-tile {
      background-color: var(--cds-layer-01);
      border: 1px solid var(--cds-border-subtle);
      border-radius: 0;
      padding: 16px 20px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 104px;
      transition: background-color 0.15s, border-color 0.15s;
    }

    .metric-tile:hover {
      background-color: var(--cds-layer-hover);
      border-color: var(--cds-border-strong);
    }

    .metric-tile-label {
      font-size: 12px;
      font-weight: 400;
      letter-spacing: 0.32px;
      color: var(--cds-text-secondary);
      text-transform: uppercase;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .metric-tile-value {
      font-size: 32px;
      font-weight: 300;
      line-height: 1;
      color: var(--cds-text-primary);
      display: flex;
      align-items: baseline;
      gap: 6px;
      font-family: 'IBM Plex Sans', sans-serif;
    }

    .metric-tile-sub {
      font-size: 13px;
      font-weight: 400;
      color: var(--cds-text-helper);
      letter-spacing: 0.16px;
    }

    .status-indicator {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 400;
    }

    .status-dot-live {
      width: 8px;
      height: 8px;
      background-color: var(--cds-support-success);
      border-radius: 50%;
      display: inline-block;
    }

    .status-dot-stopped {
      width: 8px;
      height: 8px;
      background-color: var(--cds-border-strong);
      border-radius: 50%;
      display: inline-block;
    }

    /* Section Header and Search Toolbar */
    .toolbar-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
      margin-bottom: 16px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--cds-border-subtle);
    }

    .toolbar-title {
      font-size: 20px;
      font-weight: 400;
      color: var(--cds-text-primary);
      display: flex;
      align-items: center;
      gap: 10px;
      letter-spacing: 0;
    }

    .toolbar-actions {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    /* Carbon Bottom-Border Input Pattern */
    .carbon-search-box {
      position: relative;
      width: 320px;
      max-width: 100%;
    }

    .carbon-input {
      width: 100%;
      height: 40px;
      background-color: var(--cds-field);
      color: var(--cds-text-primary);
      border: none;
      border-bottom: 2px solid var(--cds-border-subtle);
      border-radius: 0;
      padding: 0 16px 0 36px;
      font-family: 'IBM Plex Sans', sans-serif;
      font-size: 14px;
      letter-spacing: 0.16px;
      transition: background-color 0.15s, border-color 0.15s;
    }

    .carbon-search-icon {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--cds-text-helper);
      pointer-events: none;
    }

    .carbon-input::placeholder {
      color: var(--cds-text-helper);
    }

    .carbon-input:hover {
      background-color: var(--cds-field-hover);
    }

    .carbon-input:focus {
      outline: none;
      border-bottom-color: var(--cds-border-interactive);
    }

    /* Projects Container */
    .projects-list {
      display: flex;
      flex-direction: column;
      gap: 20px;
      margin-bottom: 32px;
    }

    /* Carbon Accordion Project Card */
    .project-card {
      background-color: var(--cds-layer-01);
      border: 1px solid var(--cds-border-subtle);
      border-left: 4px solid var(--project-border, var(--cds-border-strong));
      border-radius: 0;
      overflow: hidden;
      transition: border-color 0.15s;
    }

    .project-card.running {
      border-left: 4px solid var(--project-border, var(--cds-support-success));
    }

    .project-card.stopped {
      border-left: 4px solid var(--project-border, var(--cds-border-strong));
    }

    .project-card-header {
      padding: 14px 20px;
      background-color: var(--cds-layer-01);
      border-bottom: 1px solid var(--cds-border-subtle);
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
      cursor: pointer;
      user-select: none;
      transition: background-color 0.15s;
    }

    .project-card-header:hover {
      background-color: var(--cds-layer-hover);
    }

    .project-card.collapsed .project-card-header {
      border-bottom: none;
    }

    .accordion-chevron {
      color: var(--cds-text-secondary);
      transition: transform 0.2s cubic-bezier(0.2, 0, 0.38, 0.9);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-right: 2px;
    }

    .project-card.collapsed .accordion-chevron {
      transform: rotate(-90deg);
    }

    .project-card-body {
      display: block;
    }

    .project-card.collapsed .project-card-body {
      display: none;
    }

    .services-count-badge {
      font-size: 12px;
      color: var(--cds-text-helper);
      letter-spacing: 0.16px;
      font-weight: 400;
    }

    .project-meta {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }

    .project-name {
      font-size: 16px;
      font-weight: 600;
      color: var(--cds-text-primary);
      letter-spacing: 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .project-path {
      font-family: 'IBM Plex Mono', monospace;
      font-size: 12px;
      letter-spacing: 0.16px;
      color: var(--cds-text-secondary);
      background-color: var(--cds-layer-02);
      padding: 2px 8px;
      border-radius: 0;
      max-width: 800px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .btn-link-folder {
      background: transparent;
      border: 1px dashed var(--cds-border-strong);
      color: var(--cds-link-primary);
      padding: 3px 8px;
      border-radius: 0;
      font-size: 12px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-family: 'IBM Plex Sans', sans-serif;
      transition: background-color 0.15s;
    }

    .btn-link-folder:hover {
      background-color: var(--cds-layer-hover);
    }

    .project-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    /* Carbon Data Table Styles */
    .table-responsive {
      overflow-x: auto;
      background-color: var(--cds-background);
    }

    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 14px;
      letter-spacing: 0.16px;
    }

    thead th {
      background-color: var(--cds-layer-01);
      color: var(--cds-text-secondary);
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.32px;
      padding: 12px 20px;
      border-bottom: 1px solid var(--cds-border-subtle);
      white-space: nowrap;
    }

    tbody td {
      padding: 14px 20px;
      border-bottom: 1px solid var(--cds-border-subtle);
      vertical-align: middle;
      color: var(--cds-text-primary);
    }

    tbody tr:last-child td {
      border-bottom: none;
    }

    tbody tr:hover td {
      background-color: var(--cds-layer-hover);
    }

    /* Carbon Tags (Pill Shape: 24px border radius as documented exception) */
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 2px 10px;
      border-radius: 24px;
      font-size: 12px;
      font-weight: 400;
      letter-spacing: 0.32px;
      line-height: 1.33;
    }

    .badge-status-live {
      background-color: var(--cds-tag-bg-green);
      color: var(--cds-tag-text-green);
    }

    .badge-status-stopped {
      background-color: var(--cds-tag-bg-gray);
      color: var(--cds-tag-text-gray);
    }

    .badge-frontend {
      background-color: var(--cds-tag-bg-blue);
      color: var(--cds-tag-text-blue);
    }

    .badge-backend {
      background-color: var(--cds-tag-bg-purple);
      color: var(--cds-tag-text-purple);
    }

    .badge-custom {
      background-color: var(--cds-tag-bg-amber);
      color: var(--cds-tag-text-amber);
    }

    .domain-link {
      color: var(--cds-link-primary);
      text-decoration: none;
      font-weight: 400;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-family: 'IBM Plex Mono', monospace;
      font-size: 13px;
      letter-spacing: 0.16px;
    }

    .domain-link:hover {
      color: var(--cds-link-primary-hover);
      text-decoration: underline;
    }

    .domain-link.stopped {
      color: var(--cds-text-helper);
      cursor: default;
      text-decoration: none !important;
    }

    .port-tag {
      font-family: 'IBM Plex Mono', monospace;
      font-size: 12px;
      color: var(--cds-text-secondary);
      background-color: var(--cds-layer-01);
      border: 1px solid var(--cds-border-subtle);
      padding: 1px 6px;
      border-radius: 0;
    }

    .action-group {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .btn-action {
      height: 32px;
      padding: 0 10px;
      font-size: 12px;
      font-weight: 400;
      letter-spacing: 0.16px;
      cursor: pointer;
      border-radius: 0;
      border: 1px solid transparent;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: background-color 0.15s, border-color 0.15s;
    }

    .btn-action-logs {
      background-color: transparent;
      color: var(--cds-link-primary);
      border-color: var(--cds-border-subtle);
    }
    .btn-action-logs:hover {
      background-color: var(--cds-tag-bg-blue);
      border-color: var(--cds-interactive);
    }

    .btn-action-edit {
      background-color: transparent;
      color: var(--cds-text-secondary);
      border-color: var(--cds-border-subtle);
    }
    .btn-action-edit:hover {
      background-color: var(--cds-layer-hover);
      color: var(--cds-text-primary);
      border-color: var(--cds-border-strong);
    }

    /* Project Customization Modal Styles */
    .customize-preview-box {
      background-color: var(--cds-layer-02);
      border: 1px solid var(--cds-border-subtle);
      border-left: 4px solid var(--cds-border-strong);
      padding: 14px 18px;
      display: flex;
      align-items: center;
      gap: 12px;
      border-radius: 0;
      transition: border-left-color 0.2s;
    }

    .color-swatches {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-top: 8px;
    }

    .color-swatch {
      width: 28px;
      height: 28px;
      border: 2px solid transparent;
      cursor: pointer;
      border-radius: 0;
      transition: transform 0.1s, border-color 0.1s;
    }

    .color-swatch:hover {
      transform: scale(1.15);
      border-color: #ffffff;
    }

    .color-swatch.active {
      border-color: #ffffff;
      outline: 2px solid var(--cds-interactive);
      outline-offset: 1px;
    }

    .icon-quick-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(36px, 1fr));
      gap: 6px;
      margin-top: 10px;
      max-height: 140px;
      overflow-y: auto;
      padding: 6px;
      background: var(--cds-layer-02);
      border: 1px solid var(--cds-border-subtle);
    }

    .icon-quick-btn {
      height: 36px;
      background: var(--cds-layer-01);
      border: 1px solid var(--cds-border-subtle);
      color: var(--cds-text-primary);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 0;
      transition: background-color 0.1s, border-color 0.1s;
    }

    .icon-quick-btn:hover {
      background: var(--cds-layer-hover);
      border-color: var(--cds-border-strong);
    }

    .icon-quick-btn.active {
      background: var(--cds-interactive);
      color: #ffffff;
      border-color: var(--cds-interactive);
    }

    /* Carbon Native Dialog / Modal */
    dialog {
      background-color: var(--cds-background);
      color: var(--cds-text-primary);
      border: 1px solid var(--cds-border-subtle);
      border-radius: 0;
      box-shadow: var(--cds-shadow-raised);
      max-width: 860px;
      width: 92vw;
      margin: auto;
      padding: 0;
      position: fixed;
      inset: 0;
      overflow: hidden;
    }

    dialog#logModal {
      max-width: 1600px;
      width: 95vw;
    }

    dialog#projectIdeModal {
      max-width: 820px;
    }

    .dashboard-ide-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 10px;
      margin-top: 12px;
      max-height: 420px;
      overflow-y: auto;
      padding-right: 4px;
    }

    .btn-dashboard-ide {
      display: flex;
      align-items: center;
      gap: 10px;
      height: 42px;
      padding: 0 14px;
      background: var(--cds-layer-01);
      border: 1px solid var(--cds-border-subtle);
      color: var(--cds-text-primary);
      font-family: 'IBM Plex Sans', sans-serif;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      border-radius: 0;
      transition: background 0.15s, border-color 0.15s, transform 0.1s;
      text-align: left;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .btn-dashboard-ide:hover {
      background: var(--cds-layer-hover);
      border-color: var(--cds-interactive);
      color: #ffffff;
      transform: translateY(-1px);
    }

    .btn-dashboard-ide svg {
      flex-shrink: 0;
      color: var(--cds-interactive);
    }

    .btn-dashboard-ide.primary {
      background: rgba(15, 98, 254, 0.08);
      border-color: rgba(15, 98, 254, 0.3);
    }

    .btn-dashboard-ide.primary:hover {
      background: rgba(15, 98, 254, 0.18);
      border-color: var(--cds-interactive);
    }

    dialog::backdrop {
      background-color: var(--cds-overlay-backdrop);
    }

    .dialog-header {
      padding: 16px 24px;
      background-color: var(--cds-layer-01);
      border-bottom: 1px solid var(--cds-border-subtle);
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
    }

    .dialog-header h3 {
      font-size: 16px;
      font-weight: 600;
      letter-spacing: 0.16px;
      color: var(--cds-text-primary);
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .dialog-controls {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .dialog-close-btn {
      background: none;
      border: none;
      color: var(--cds-text-secondary);
      font-size: 18px;
      cursor: pointer;
      width: 32px;
      height: 32px;
      border-radius: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background-color 0.15s, color 0.15s;
    }

    .dialog-close-btn:hover {
      background-color: var(--cds-layer-hover);
      color: var(--cds-text-primary);
    }

    .dialog-body {
      padding: 24px;
      background-color: var(--cds-background);
    }

    .dialog-footer {
      padding: 16px 24px;
      background-color: var(--cds-layer-01);
      border-top: 1px solid var(--cds-border-subtle);
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }

    /* Terminal Output in IBM Plex Mono */
    .terminal-container {
      background-color: #121212;
      border: 1px solid #333333;
      border-radius: 0;
      height: 480px;
      overflow-y: auto;
      padding: 16px;
      font-family: 'IBM Plex Mono', monospace;
      font-size: 13px;
      line-height: 1.5;
      color: #f4f4f4;
      white-space: pre-wrap;
      word-break: break-all;
    }

    .terminal-empty {
      color: #8d8d8d;
      text-align: center;
      margin-top: 180px;
      font-style: italic;
    }

    /* Form Layouts */
    .form-group {
      margin-bottom: 20px;
    }

    .form-group label {
      display: block;
      margin-bottom: 8px;
      font-size: 12px;
      font-weight: 400;
      letter-spacing: 0.32px;
      color: var(--cds-text-secondary);
    }

    .form-control {
      width: 100%;
      height: 40px;
      background-color: var(--cds-field);
      border: none;
      border-bottom: 2px solid var(--cds-border-subtle);
      border-radius: 0;
      padding: 0 16px;
      color: var(--cds-text-primary);
      font-family: 'IBM Plex Sans', sans-serif;
      font-size: 14px;
      letter-spacing: 0.16px;
      transition: background-color 0.15s, border-color 0.15s;
    }

    .form-control:focus {
      outline: none;
      border-bottom-color: var(--cds-border-interactive);
    }

    .input-group-row {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    /* Sileo Toast Notification Engine */
    #sileo-toaster {
      position: fixed;
      top: 24px;
      right: 24px;
      z-index: 99999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
      max-width: 420px;
      width: calc(100vw - 48px);
    }

    .sileo-toast {
      pointer-events: auto;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 16px 10px 12px;
      background: rgba(26, 26, 30, 0.94);
      backdrop-filter: blur(16px) saturate(180%);
      -webkit-backdrop-filter: blur(16px) saturate(180%);
      color: #f4f4f4;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 9999px;
      box-shadow: 0 16px 36px -8px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.06);
      font-family: 'IBM Plex Sans', sans-serif;
      font-size: 13.5px;
      letter-spacing: 0.12px;
      cursor: pointer;
      user-select: none;
      position: relative;
      overflow: hidden;
      transform-origin: top right;
      animation: sileoSpringIn 0.44s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
      transition: transform 0.15s cubic-bezier(0.2, 0, 0.38, 0.9), box-shadow 0.15s, opacity 0.25s;
    }

    [data-theme="light"] .sileo-toast {
      background: rgba(255, 255, 255, 0.94);
      color: #161616;
      border: 1px solid rgba(0, 0, 0, 0.1);
      box-shadow: 0 14px 32px -6px rgba(0, 0, 0, 0.15), 0 2px 6px rgba(0, 0, 0, 0.08);
    }

    .sileo-toast:hover {
      transform: scale(1.02);
      box-shadow: 0 20px 42px -6px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.18);
    }

    .sileo-toast.sileo-dismissing {
      animation: sileoSpringOut 0.26s cubic-bezier(0.4, 0, 1, 1) forwards;
    }

    .sileo-icon-capsule {
      width: 28px;
      height: 28px;
      min-width: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
    }

    .sileo-icon-capsule.success {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      box-shadow: 0 0 12px rgba(16, 185, 129, 0.4);
    }

    .sileo-icon-capsule.error {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      box-shadow: 0 0 12px rgba(239, 68, 68, 0.4);
    }

    .sileo-icon-capsule.warning {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      box-shadow: 0 0 12px rgba(245, 158, 11, 0.4);
    }

    .sileo-icon-capsule.info {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      box-shadow: 0 0 12px rgba(59, 130, 246, 0.4);
    }

    .sileo-content {
      flex: 1;
      font-weight: 450;
      line-height: 1.35;
      padding-right: 4px;
    }

    .sileo-close-btn {
      background: transparent;
      border: none;
      color: var(--cds-text-helper);
      cursor: pointer;
      padding: 2px 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      opacity: 0.6;
      transition: opacity 0.15s, color 0.15s;
    }

    .sileo-close-btn:hover {
      opacity: 1;
      color: var(--cds-text-primary);
    }

    .sileo-progress {
      position: absolute;
      bottom: 0;
      left: 18px;
      right: 18px;
      height: 2px;
      background: rgba(255, 255, 255, 0.12);
      border-radius: 2px;
      overflow: hidden;
    }

    .sileo-progress-bar {
      height: 100%;
      width: 100%;
      transform-origin: left;
      animation: sileoProgress linear forwards;
    }

    .sileo-toast.success .sileo-progress-bar { background: #10b981; }
    .sileo-toast.error .sileo-progress-bar { background: #ef4444; }
    .sileo-toast.warning .sileo-progress-bar { background: #f59e0b; }
    .sileo-toast.info .sileo-progress-bar { background: #3b82f6; }

    @keyframes sileoSpringIn {
      0% {
        opacity: 0;
        transform: translateY(-18px) scale(0.85);
        filter: blur(4px);
      }
      60% {
        opacity: 1;
        transform: translateY(3px) scale(1.02);
        filter: blur(0);
      }
      100% {
        opacity: 1;
        transform: translateY(0) scale(1);
        filter: blur(0);
      }
    }

    @keyframes sileoSpringOut {
      0% {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
      100% {
        opacity: 0;
        transform: translateY(-12px) scale(0.9);
        filter: blur(3px);
      }
    }

    @keyframes sileoProgress {
      from { transform: scaleX(1); }
      to { transform: scaleX(0); }
    }

    /* Empty state */
    .empty-state {
      background-color: var(--cds-layer-01);
      border: 1px dashed var(--cds-border-subtle);
      border-radius: 0;
      padding: 48px 24px;
      text-align: center;
      color: var(--cds-text-secondary);
    }

    .empty-state h3 {
      color: var(--cds-text-primary);
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 8px;
    }

    .empty-state code {
      font-family: 'IBM Plex Mono', monospace;
      background-color: var(--cds-layer-02);
      padding: 2px 6px;
      border-radius: 0;
    }

    /* Responsive adjustments */
    @media (max-width: 672px) {
      .carbon-masthead {
        padding: 10px 16px;
      }
      .brand-subtitle {
        display: none;
      }
      .main-container {
        padding: 20px 0 48px 0;
      }
      .carbon-search-box {
        width: 100%;
      }
    }
  </style>
</head>
<body>
  <!-- Unified Fused Carbon Masthead Header -->
  <header class="carbon-masthead">
    <div class="masthead-container">
      <div class="masthead-left">
        <div class="brand-mark" title="Hostmagic Gateway">
          <img src="/__hostmagic/magichost.webp" alt="Hostmagic" onerror="this.onerror=null; this.parentElement.innerHTML='<svg width=\'18\' height=\'18\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'><polygon points=\'13 2 3 14 12 14 11 22 21 10 12 10 13 2\'></polygon></svg>';" />
        </div>
        <div class="masthead-title-group">
          <div class="brand-name">
            <span>Hostmagic Gateway</span>
            <span class="domain-badge">hostmagic.settings</span>
          </div>
          <div class="brand-subtitle">
            Enterprise Multi-Project Reverse Proxy &bull; Universal OAuth 2.0 Bridge &bull; Live Routing Hub
          </div>
        </div>
      </div>
      <div class="masthead-right">
        <button class="masthead-btn pwa-install-btn" id="pwaInstallBtn" onclick="installPwaApp()" title="Install Hostmagic PWA" style="display: none;">
          <span class="icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
          </span>
          <span>Install App</span>
        </button>
        <button class="masthead-btn" id="themeToggleBtn" onclick="toggleTheme()" title="Switch Carbon theme">
          <span class="icon" id="themeToggleIcon"></span>
          <span id="themeToggleText">Light</span>
        </button>
        <div class="carbon-toggle-wrapper" id="autostartToggleWrapper" title="Automatically start Hostmagic Gateway when operating system boots" onclick="toggleAutostartSetting()">
          <span class="toggle-label-text">Start on Boot</span>
          <button type="button" class="carbon-toggle-switch" id="autostartToggleBtn" role="switch" aria-checked="false">
            <span class="carbon-toggle-track">
              <span class="carbon-toggle-dot"></span>
            </span>
            <span class="carbon-toggle-status" id="autostartStatusText">Off</span>
          </button>
        </div>
        <button class="masthead-btn" onclick="loadDashboard(true)" title="Refresh data">
          <span class="icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="23 4 23 10 17 10"></polyline>
              <polyline points="1 20 1 14 7 14"></polyline>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
          </span>
          <span>Refresh</span>
        </button>
        <button class="masthead-btn" id="btnRestartMasthead" onclick="restartFromMasthead()" title="Restart running projects">
          <span class="icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5A10 10 0 0 1 18.8 4.2M22 12.5a10 10 0 0 1-18.8 4.2"></path>
            </svg>
          </span>
          <span>Restart</span>
        </button>
        <button class="btn btn-secondary btn-sm" onclick="openAddRouteModal()" title="Add Custom Route">
          <span class="icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </span>
          <span>Custom Route</span>
        </button>
        <button class="btn btn-primary btn-sm" onclick="openAddProjectModal()" title="Import Project">
          <span class="icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
              <line x1="12" y1="11" x2="12" y2="17"></line>
              <line x1="9" y1="14" x2="15" y2="14"></line>
            </svg>
          </span>
          <span>Add Project</span>
        </button>
      </div>
    </div>
  </header>

  <!-- Main Container -->
  <main class="main-container">
    <!-- Carbon Metric Tiles -->
    <div class="metrics-grid">
      <div class="metric-tile">
        <div class="metric-tile-label">
          <span>Active Domains</span>
          <span class="icon" style="color: var(--cds-text-helper);">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="2" y1="12" x2="22" y2="12"></line>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
            </svg>
          </span>
        </div>
        <div class="metric-tile-value">
          <span id="metricDomains">{{DOMAIN_COUNT}}</span>
          <span class="metric-tile-sub">routing</span>
        </div>
      </div>
      <div class="metric-tile">
        <div class="metric-tile-label">
          <span>Running Projects</span>
          <span class="icon" style="color: var(--cds-text-helper);">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
            </svg>
          </span>
        </div>
        <div class="metric-tile-value">
          <span id="metricRunningProjects">{{PROJECT_COUNT}}</span>
          <span class="metric-tile-sub" id="metricTotalProjects"></span>
        </div>
      </div>
      <div class="metric-tile">
        <div class="metric-tile-label">
          <span>Proxy Engine</span>
          <span class="icon" style="color: var(--cds-text-helper);">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
              <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
              <line x1="6" y1="6" x2="6.01" y2="6"></line>
              <line x1="6" y1="18" x2="6.01" y2="18"></line>
            </svg>
          </span>
        </div>
        <div class="metric-tile-value" style="font-size: 20px; font-weight: 400;">
          <span class="status-indicator">
            <span class="status-dot-live"></span> Port 80 Active
          </span>
        </div>
      </div>
      <div class="metric-tile">
        <div class="metric-tile-label">
          <span>OAuth 2.0 Bridge</span>
          <span class="icon" style="color: var(--cds-text-helper);">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </span>
        </div>
        <div class="metric-tile-value" style="font-size: 18px; font-family: 'IBM Plex Mono', monospace;">
          localhost:3000
        </div>
      </div>
    </div>

    <!-- Section Toolbar -->
    <div class="toolbar-bar">
      <div class="toolbar-title">
        <span class="icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
            <line x1="12" y1="22.08" x2="12" y2="12"></line>
          </svg>
        </span>
        <span>Configured Projects &amp; Services</span>
      </div>
      <div class="toolbar-actions">
        <button type="button" class="btn btn-tertiary btn-sm" onclick="toggleAllAccordions()" title="Expand or collapse all project cards">
          <span id="toggleAllIcon">▸</span> <span id="toggleAllText">Expand All</span>
        </button>
        <div class="carbon-search-box">
          <span class="icon carbon-search-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </span>
          <input 
            type="text" 
            id="searchInput" 
            class="carbon-input" 
            placeholder="Search projects, domains, or ports..." 
            oninput="filterDashboard()"
          />
        </div>
      </div>
    </div>

    <!-- Projects List Cards Container -->
    <div id="projectsContainer" class="projects-list">
      <!-- Dynamically rendered project cards -->
    </div>

    <!-- Standalone Routes Container (if any) -->
    <div id="standaloneContainer" style="display: none; margin-top: 24px;">
      <div class="toolbar-bar">
        <div class="toolbar-title" style="font-size: 16px;">
          <span class="icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
            </svg>
          </span>
          <span>Standalone Custom Routes</span>
        </div>
      </div>
      <div class="project-card">
        <div class="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Domain</th>
                <th>Target Port</th>
                <th>Service Name</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="standaloneTableBody">
              <!-- Dynamically populated -->
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </main>

  <!-- HTML5 Native Dialog for Logs -->
  <dialog id="logModal">
    <div class="dialog-header">
      <h3>
        <span class="icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="4 17 10 11 4 5"></polyline>
            <line x1="12" y1="19" x2="20" y2="19"></line>
          </svg>
        </span>
        <span>Service Logs: <span id="logModalTarget" style="font-family: 'IBM Plex Mono', monospace; font-weight: 400; color: var(--cds-interactive);">service</span></span>
        <span class="badge badge-status-live" style="margin-left: 8px;">
          <span class="status-dot-live"></span> LIVE
        </span>
      </h3>
      <div class="dialog-controls">
        <label style="font-size: 12px; color: var(--cds-text-secondary); display: flex; align-items: center; gap: 6px; cursor: pointer;">
          <input type="checkbox" id="autoScrollToggle" checked /> Auto-scroll
        </label>
        <button id="copyLogsBtn" class="btn btn-tertiary btn-sm" onclick="copyLogsToClipboard()">
          <span class="icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          </span>
          <span>Copy</span>
        </button>
        <button class="btn btn-tertiary btn-sm" onclick="clearTerminalView()">
          <span class="icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M2.5 2v6h6M21.5 22v-6h-6"></path>
              <path d="M22 11.5A10 10 0 0 0 3.2 7.2M2 12.5a10 10 0 0 0 18.8 4.2"></path>
            </svg>
          </span>
          <span>Clear</span>
        </button>
        <button class="dialog-close-btn" onclick="closeLogModal()" title="Close dialog">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    </div>
    <div class="dialog-body">
      <div id="terminalOutput" class="terminal-container"></div>
    </div>
  </dialog>

  <!-- HTML5 Native Dialog for Adding Project -->
  <dialog id="addProjectModal">
    <div class="dialog-header">
      <h3>
        <span class="icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
            <line x1="12" y1="11" x2="12" y2="17"></line>
            <line x1="9" y1="14" x2="15" y2="14"></line>
          </svg>
        </span>
        <span>Import Project into Dashboard</span>
      </h3>
      <button class="dialog-close-btn" onclick="closeAddProjectModal()" title="Close dialog">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
    <div class="dialog-body">
      <div class="form-group">
        <label for="projectFolderPath">Project Directory Path</label>
        <div class="input-group-row">
          <input type="text" id="projectFolderPath" class="form-control" placeholder="e.g. C:\Users\obedu\proyectos\my-app" />
          <button type="button" class="btn btn-secondary" id="btnBrowseFolder" onclick="browseFolderForImport()">
            <span class="icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
              </svg>
            </span>
            <span>Browse Folder...</span>
          </button>
        </div>
        <p id="browseStatusMsg" style="font-size: 12px; color: var(--cds-text-secondary); margin-top: 8px; letter-spacing: 0.16px;">
          Select or enter the folder path containing a <code>.hostmagic.json</code> configuration file.
        </p>
      </div>
    </div>
    <div class="dialog-footer">
      <button class="btn btn-secondary" onclick="closeAddProjectModal()">Cancel</button>
      <button class="btn btn-primary" id="btnSubmitImport" onclick="submitNewProject()">Import Project</button>
    </div>
  </dialog>

  <!-- HTML5 Native Dialog for Adding Custom Route -->
  <dialog id="addModal">
    <div class="dialog-header">
      <h3>
        <span class="icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="16"></line>
            <line x1="8" y1="12" x2="16" y2="12"></line>
          </svg>
        </span>
        <span>Register Custom Domain / Route</span>
      </h3>
      <button class="dialog-close-btn" onclick="closeAddModal()" title="Close dialog">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
    <div class="dialog-body">
      <div class="form-group">
        <label for="addProject">Project Identifier</label>
        <input type="text" id="addProject" class="form-control" placeholder="e.g. custom" />
      </div>
      <div class="form-group">
        <label for="addService">Service Name</label>
        <input type="text" id="addService" class="form-control" placeholder="e.g. web, api, docs" />
      </div>
      <div class="form-group">
        <label for="addDomain">Domain Name (resolves to port 80)</label>
        <input type="text" id="addDomain" class="form-control" placeholder="e.g. custom-app.test" />
      </div>
      <div class="form-group">
        <label for="addPort">Internal Target Port</label>
        <input type="number" id="addPort" class="form-control" placeholder="e.g. 5173, 4000" />
      </div>
      <div class="form-group">
        <label for="addType">Service Role</label>
        <select id="addType" class="form-control">
          <option value="frontend">Frontend Application</option>
          <option value="backend">Backend API</option>
          <option value="custom" selected>Custom Service</option>
        </select>
      </div>
    </div>
    <div class="dialog-footer">
      <button class="btn btn-secondary" onclick="closeAddModal()">Cancel</button>
      <button class="btn btn-primary" onclick="submitNewRoute()">Register Route</button>
    </div>
  </dialog>

  <!-- HTML5 Native Dialog for Customizing Project Appearance -->
  <dialog id="customizeModal">
    <div class="dialog-header">
      <h3>
        <span class="icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line>
            <line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line>
            <line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line>
            <line x1="17" y1="16" x2="23" y2="16"></line>
          </svg>
        </span>
        <span>Project Config: <span id="customizeProjectTitle" style="color: var(--cds-interactive);">project</span></span>
      </h3>
      <button class="dialog-close-btn" onclick="closeCustomizeModal()" title="Close dialog">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
    <div class="dialog-body">
      <!-- Live Preview -->
      <div class="form-group">
        <label>Live Card Border &amp; Icon Preview</label>
        <div id="customizePreviewCard" class="customize-preview-box">
          <span style="color: var(--cds-text-secondary); font-size: 11px;">▸</span>
          <span id="customizePreviewIcon" style="font-size: 16px;"></span>
          <span id="customizePreviewName" style="font-weight: 600; font-size: 15px; letter-spacing: 0.16px;">project</span>
          <span class="badge badge-status-live" style="margin-left: 8px;">LIVE</span>
          <span style="font-size: 12px; color: var(--cds-text-helper); margin-left: auto;">(Live Preview)</span>
        </div>
      </div>

      <!-- Icon Select Dropdown -->
      <div class="form-group">
        <label for="customizeIconSelect">Project Icon (React-Icon)</label>
        <select id="customizeIconSelect" class="form-control" onchange="onIconSelectChange(this.value)">
        </select>
        <div id="customizeIconQuickGrid" class="icon-quick-grid">
        </div>
      </div>

      <!-- Left Border Color -->
      <div class="form-group">
        <label>Project Left Border Color</label>
        <div class="color-swatches" id="colorSwatchesContainer">
        </div>
        <div style="display: flex; align-items: center; gap: 10px; margin-top: 10px;">
          <input type="color" id="customizeColorPicker" oninput="onColorPickerInput(this.value)" style="width: 44px; height: 38px; padding: 2px; border: 1px solid var(--cds-border-strong); background: var(--cds-field); cursor: pointer; border-radius: 0;" />
          <input type="text" id="customizeColorInput" class="form-control" placeholder="Hex color e.g. #0f62fe or empty for default status color" oninput="onColorTextInput(this.value)" style="font-family: 'IBM Plex Mono', monospace; font-size: 13px;" />
          <button type="button" class="btn btn-secondary btn-sm" onclick="resetCustomizeColor()">Reset to Default</button>
        </div>
        <p style="font-size: 12px; color: var(--cds-text-secondary); margin-top: 6px;">
          Select a Carbon swatch, enter a custom hex code, or click <em>Reset</em> to follow live/stopped status.
        </p>
      </div>

      <!-- Autostart on Gateway Launch -->
      <div class="form-group" style="margin-top: 16px; padding-top: 14px; border-top: 1px solid var(--cds-border-subtle);">
        <label style="display: flex; align-items: center; justify-content: space-between; cursor: pointer;">
          <div>
            <div style="font-weight: 600; color: var(--cds-text-primary);">Auto-start on Gateway Launch</div>
            <div style="font-size: 12px; color: var(--cds-text-secondary); font-weight: normal; margin-top: 2px;">
              Automatically start this project whenever <code>hm start</code> is run.
            </div>
          </div>
          <input type="checkbox" id="customizeAutostartCheckbox" style="width: 18px; height: 18px; accent-color: var(--cds-interactive); cursor: pointer;" />
        </label>
      </div>
    </div>
    <div class="dialog-footer">
      <button type="button" class="btn btn-danger-outline" id="customizeForgetBtn" onclick="forgetCurrentProject()" style="margin-right: auto;" title="Remove project from dashboard">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -2px; margin-right: 4px;"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        Forget Project
      </button>
      <button class="btn btn-secondary" onclick="closeCustomizeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveProjectCustomization()">Save Config</button>
    </div>
  </dialog>

  <!-- HTML5 Native Dialog for Opening Project in IDE / Terminal -->
  <dialog id="projectIdeModal">
    <div class="dialog-header">
      <h3>
        <span class="icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline>
          </svg>
        </span>
        <span>Open <span id="projectIdeModalTarget" style="font-family: 'IBM Plex Mono', monospace; font-weight: 600; color: var(--cds-interactive);">project</span> in IDE / Terminal</span>
      </h3>
      <button class="dialog-close-btn" onclick="closeProjectIdeModal()" title="Close dialog">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
    <div class="dialog-body">
      <div class="form-group" style="margin-bottom: 8px;">
        <input 
          type="text" 
          id="projectIdeSearchInput" 
          class="carbon-input" 
          placeholder="Filter IDEs (e.g. antigravity, claude, codex, vscode, pycharm, zed)..." 
          oninput="filterProjectIdes()" 
          style="width: 100%; box-sizing: border-box;" 
        />
      </div>
      <div class="dashboard-ide-grid" id="projectIdeButtonsContainer">
      </div>
    </div>
    <div class="dialog-footer">
      <button class="btn btn-secondary" onclick="closeProjectIdeModal()">Close</button>
    </div>
  </dialog>

  <!-- Sileo Physics-Based Toast Notifications Container -->
  <div id="sileo-toaster"></div>

  <script>
    // --- Available React-Icons (Feather/Carbon Icons) ---
    const AVAILABLE_ICONS = [
      { id: 'box', name: 'Box / Package (Default)', svg: '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line>' },
      { id: 'globe', name: 'Globe / Web Application', svg: '<circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>' },
      { id: 'server', name: 'Server / Backend API', svg: '<rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect><line x1="6" y1="6" x2="6.01" y2="6"></line><line x1="6" y1="18" x2="6.01" y2="18"></line>' },
      { id: 'database', name: 'Database / Data Store', svg: '<ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>' },
      { id: 'cpu', name: 'CPU / Microservice', svg: '<rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="14" x2="23" y2="14"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="14" x2="4" y2="14"></line>' },
      { id: 'layout', name: 'Layout / Frontend UI', svg: '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line>' },
      { id: 'layers', name: 'Layers / Fullstack', svg: '<polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline>' },
      { id: 'terminal', name: 'Terminal / CLI Tool', svg: '<polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line>' },
      { id: 'code', name: 'Code / Script', svg: '<polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline>' },
      { id: 'zap', name: 'Zap / Fast Service', svg: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>' },
      { id: 'cloud', name: 'Cloud / Gateway', svg: '<path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path>' },
      { id: 'shield', name: 'Shield / Auth & Security', svg: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>' },
      { id: 'smartphone', name: 'Smartphone / Mobile App', svg: '<rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line>' },
      { id: 'shopping-bag', name: 'Shopping Bag / E-Commerce', svg: '<path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path>' },
      { id: 'activity', name: 'Activity / Monitoring', svg: '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>' },
      { id: 'compass', name: 'Compass / Discovery', svg: '<circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>' },
      { id: 'folder', name: 'Folder / Workspace', svg: '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>' },
      { id: 'star', name: 'Star / Featured', svg: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>' },
      { id: 'rocket', name: 'Rocket / Deployment', svg: '<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"></path><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"></path>' },
      { id: 'coffee', name: 'Coffee / Utility', svg: '<path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line>' },
      { id: 'tool', name: 'Tool / Maintenance', svg: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>' },
      { id: 'feather', name: 'Feather / Lightweight', svg: '<path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"></path><line x1="16" y1="8" x2="2" y2="22"></line><line x1="17.5" y1="15" x2="9" y2="15"></line>' },
      { id: 'monitor', name: 'Monitor / Client', svg: '<rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line>' },
      { id: 'lock', name: 'Lock / Private', svg: '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path>' }
    ];

    const PRESET_COLORS = [
      { name: 'IBM Blue 60', hex: '#0f62fe' },
      { name: 'IBM Cyan 40', hex: '#1192e8' },
      { name: 'IBM Teal 40', hex: '#009d9a' },
      { name: 'IBM Green 50', hex: '#24a148' },
      { name: 'IBM Purple 60', hex: '#8a3ffc' },
      { name: 'IBM Magenta 50', hex: '#ee538b' },
      { name: 'IBM Yellow 30', hex: '#f1c21b' },
      { name: 'IBM Orange 40', hex: '#ff832b' },
      { name: 'IBM Red 60', hex: '#da1e28' },
      { name: 'IBM Cool Gray 50', hex: '#697077' },
      { name: 'Dark Slate', hex: '#3949ab' },
      { name: 'Emerald', hex: '#00bfa5' }
    ];

    // --- React-Icons SVG Library ---
    const Icons = {
      chevron: '<span class="icon accordion-chevron"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg></span>',
      sliders: '<span class="icon"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></svg></span>',
      play: '<span class="icon"><svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg></span>',
      restart: '<span class="icon"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5A10 10 0 0 1 18.8 4.2M22 12.5a10 10 0 0 1-18.8 4.2"></path></svg></span>',
      stop: '<span class="icon"><svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16"></rect></svg></span>',
      terminal: '<span class="icon"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg></span>',
      trash: '<span class="icon"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></span>',
      folder: '<span class="icon"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg></span>',
      box: '<span class="icon"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg></span>',
      globe: '<span class="icon"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg></span>',
      external: '<span class="icon"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg></span>',
      moon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>',
      sun: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>',
      check: '<span class="icon" style="color: var(--cds-support-success);"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></span>',
      alert: '<span class="icon" style="color: var(--cds-support-warning);"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg></span>',
      error: '<span class="icon" style="color: var(--cds-support-error);"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg></span>'
    };

    // Register all available icons into Icons dictionary
    AVAILABLE_ICONS.forEach(item => {
      Icons[item.id] = '<span class="icon"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + item.svg + '</svg></span>';
    });

    let allProjects = [];
    let allRoutes = {{INITIAL_JSON}};
    let activeLogTarget = null;
    let logInterval = null;
    let actionInProgress = false;

    // --- Accordion State Management (Default: Collapsed) ---
    const expandedProjects = new Set();

    function toggleProjectAccordion(name) {
      if (expandedProjects.has(name)) {
        expandedProjects.delete(name);
      } else {
        expandedProjects.add(name);
      }
      const card = document.getElementById('project-card-' + name);
      if (card) {
        card.classList.toggle('collapsed', !expandedProjects.has(name));
      }
      updateToggleAllBtn();
    }

    function toggleAllAccordions() {
      const anyExpanded = allProjects.length > 0 && allProjects.some(p => expandedProjects.has(p.name));
      if (anyExpanded) {
        expandedProjects.clear();
      } else {
        allProjects.forEach(p => expandedProjects.add(p.name));
      }
      filterDashboard();
      updateToggleAllBtn();
    }

    function updateToggleAllBtn() {
      const text = document.getElementById('toggleAllText');
      const icon = document.getElementById('toggleAllIcon');
      const anyExpanded = allProjects.length > 0 && allProjects.some(p => expandedProjects.has(p.name));
      if (text) text.textContent = anyExpanded ? 'Collapse All' : 'Expand All';
      if (icon) icon.textContent = anyExpanded ? '▾' : '▸';
    }

    // --- Carbon Theme Management (Dark Mode as Default) ---
    function initTheme() {
      const savedTheme = localStorage.getItem('hostmagic_theme');
      // Dark theme is the default unless explicitly set to light
      if (savedTheme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
        updateThemeUI('light');
      } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        updateThemeUI('dark');
      }
    }

    function toggleTheme() {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('hostmagic_theme', next);
      updateThemeUI(next);
    }

    function updateThemeUI(theme) {
      const icon = document.getElementById('themeToggleIcon');
      const text = document.getElementById('themeToggleText');
      if (theme === 'dark') {
        if (icon) icon.innerHTML = Icons.sun;
        if (text) text.textContent = 'Light';
      } else {
        if (icon) icon.innerHTML = Icons.moon;
        if (text) text.textContent = 'Dark';
      }
    }

    initTheme();

    // --- Operating System Autostart Management ---
    let autostartEnabled = false;

    async function fetchAutostartStatus() {
      try {
        const res = await fetch('/__hostmagic/api/autostart');
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            updateAutostartUI(Boolean(data.enabled));
          }
        }
      } catch {}
    }

    function updateAutostartUI(enabled) {
      autostartEnabled = Boolean(enabled);
      const btn = document.getElementById('autostartToggleBtn');
      const statusText = document.getElementById('autostartStatusText');
      if (btn) btn.setAttribute('aria-checked', autostartEnabled ? 'true' : 'false');
      if (statusText) statusText.textContent = autostartEnabled ? 'ON' : 'OFF';
    }

    async function toggleAutostartSetting() {
      const nextState = !autostartEnabled;
      updateAutostartUI(nextState);
      try {
        const res = await fetch('/__hostmagic/api/autostart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ enabled: nextState })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          updateAutostartUI(Boolean(data.enabled));
          if (data.enabled) {
            sileo.success('Hostmagic configured to start on OS boot');
          } else {
            sileo.info('Start on OS boot disabled');
          }
        } else {
          updateAutostartUI(!nextState);
          sileo.error('Failed to change startup setting: ' + (data.error || 'Unknown error'));
        }
      } catch (err) {
        updateAutostartUI(!nextState);
        sileo.error('Error connecting to gateway: ' + err.message);
      }
    }

    fetchAutostartStatus();

    // --- Project Appearance & Customization (React-Icons & Border Colors) ---
    let currentCustomizingProject = null;
    let currentSelectedIcon = 'box';
    let currentSelectedColor = '';

    function getProjectCustomizations() {
      try {
        const raw = localStorage.getItem('hostmagic_project_styles');
        return raw ? JSON.parse(raw) : {};
      } catch {
        return {};
      }
    }

    function saveProjectCustomizations(data) {
      try {
        localStorage.setItem('hostmagic_project_styles', JSON.stringify(data));
      } catch {}
    }

    function getProjectCustomization(name, backendIcon, backendColor) {
      const all = getProjectCustomizations();
      const client = all[name.toLowerCase()] || {};
      return {
        icon: client.icon || backendIcon || 'box',
        color: client.color !== undefined ? client.color : (backendColor || '')
      };
    }

    let currentIdeProject = null;

    const DASHBOARD_IDES = [
      { id: 'antigravity', name: 'Antigravity', label: 'Open in Antigravity', primary: true, icon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>' },
      { id: 'claude', name: 'Claude Code', label: 'Open in Claude Code', primary: true, icon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 1 0 10 10H12V2z"></path><path d="M12 12 2.1 12a10.1 10.1 0 0 0 1.9 4"></path></svg>' },
      { id: 'codex', name: 'Codex', label: 'Open in Codex', primary: true, icon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>' },
      { id: 'vscode', name: 'VS Code', label: 'Open in VS Code', primary: true, icon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>' },
      { id: 'cursor', name: 'Cursor', label: 'Open in Cursor', primary: true, icon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 3 10.07 19.97 12.58 12.58 19.97 10.07 3 3"></polygon></svg>' },
      { id: 'terminal', name: 'Terminal', label: 'Open in Terminal', primary: true, icon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>' },
      { id: 'zed', name: 'Zed', label: 'Open in Zed', icon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16l-16 16h16"></path></svg>' },
      { id: 'sublime', name: 'Sublime Text', label: 'Open in Sublime Text', icon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m4 8 16-4-16 8 16-4-16 8 16-4"></path></svg>' },
      { id: 'notepadplusplus', name: 'Notepad++', label: 'Open in Notepad++', icon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>' },
      { id: 'visualstudio', name: 'Visual Studio', label: 'Open in Visual Studio', icon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 6-8 6 8 6V6z"></path><path d="M6 18V6l4 3-4 3 8 6"></path></svg>' },
      { id: 'webstorm', name: 'WebStorm', label: 'Open in WebStorm', icon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"></rect><path d="m7 15 3-6 2 4 2-4 3 6"></path></svg>' },
      { id: 'datagrip', name: 'DataGrip', label: 'Open in DataGrip', icon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>' },
      { id: 'pycharm', name: 'PyCharm', label: 'Open in PyCharm', icon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"></rect><path d="M7 9h4a2 2 0 1 1 0 4H7z"></path></svg>' },
      { id: 'intellij', name: 'IntelliJ IDEA', label: 'Open in IntelliJ IDEA', icon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"></rect><line x1="7" y1="8" x2="7" y2="16"></line><path d="M11 16h4a2 2 0 0 2 2-2V8"></path></svg>' },
      { id: 'androidstudio', name: 'Android Studio', label: 'Open in Android Studio', icon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a4 4 0 0 0-4 4v1H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2V6a4 4 0 0 0-4-4z"></path></svg>' },
      { id: 'phpstorm', name: 'PhpStorm', label: 'Open in PhpStorm', icon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"></rect><path d="M7 15V9h3a2 2 0 1 1 0 4H7"></path></svg>' },
      { id: 'goland', name: 'GoLand', label: 'Open in GoLand', icon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"></rect><circle cx="10" cy="12" r="3"></circle></svg>' },
      { id: 'clion', name: 'CLion', label: 'Open in CLion', icon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"></rect><path d="M10 9a3 3 0 0 0-3 3v0a3 3 0 0 0 3 3"></path></svg>' },
      { id: 'rider', name: 'Rider', label: 'Open in Rider', icon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"></rect><path d="M8 9h4a2 2 0 1 1 0 4H8v3"></path></svg>' },
      { id: 'rubymine', name: 'RubyMine', label: 'Open in RubyMine', icon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="6 3 18 3 22 9 12 22 2 9 6 3"></polygon></svg>' },
      { id: 'fleet', name: 'Fleet', label: 'Open in Fleet', icon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path></svg>' },
      { id: 'windsurf', name: 'Windsurf', label: 'Open in Windsurf', icon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12h20M2 12l5-5m-5 5 5 5M22 12l-5-5m5 5-5 5"></path></svg>' },
      { id: 'void', name: 'Void', label: 'Open in Void', icon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="4"></circle></svg>' },
      { id: 'positron', name: 'Positron', label: 'Open in Positron', icon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M3 12h3m12 0h3M12 3v3m0 12v3"></path></svg>' },
      { id: 'trae', name: 'Trae', label: 'Open in Trae', icon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"></path></svg>' },
      { id: 'neovim', name: 'Neovim', label: 'Open in Neovim', icon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 20 4 4 10 4 20 20 20 4"></polyline></svg>' },
      { id: 'helix', name: 'Helix', label: 'Open in Helix', icon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h4v16H4zM16 4h4v16h-4z"></path></svg>' },
      { id: 'emacs', name: 'Emacs', label: 'Open in Emacs', icon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7c0-2.2 3.6-4 8-4s8 1.8 8 4-3.6 4-8 4-8-1.8-8-4z"></path></svg>' },
      { id: 'eclipse', name: 'Eclipse', label: 'Open in Eclipse', icon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle></svg>' },
      { id: 'xcode', name: 'Xcode', label: 'Open in Xcode', icon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77"></path></svg>' },
      { id: 'explorer', name: 'File Explorer', label: 'Open in File Explorer', icon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>' },
    ];

    function openProjectIdeModal(projectName) {
      currentIdeProject = projectName;
      const targetEl = document.getElementById('projectIdeModalTarget');
      if (targetEl) targetEl.textContent = projectName;
      const searchInput = document.getElementById('projectIdeSearchInput');
      if (searchInput) searchInput.value = '';

      renderProjectIdeButtons();
      const modal = document.getElementById('projectIdeModal');
      if (modal && typeof modal.showModal === 'function') {
        modal.showModal();
        if (searchInput) searchInput.focus();
      }
    }

    function closeProjectIdeModal() {
      const modal = document.getElementById('projectIdeModal');
      if (modal && typeof modal.close === 'function') {
        modal.close();
      }
      currentIdeProject = null;
    }

    function renderProjectIdeButtons(filter = '') {
      const container = document.getElementById('projectIdeButtonsContainer');
      if (!container) return;
      const cleanFilter = filter.toLowerCase().trim();

      const filtered = DASHBOARD_IDES.filter(ide =>
        !cleanFilter ||
        ide.name.toLowerCase().includes(cleanFilter) ||
        ide.label.toLowerCase().includes(cleanFilter) ||
        ide.id.toLowerCase().includes(cleanFilter)
      );

      if (filtered.length === 0) {
        container.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: var(--cds-text-helper); padding: 24px;">No IDEs matching filter.</div>';
        return;
      }

      container.innerHTML = filtered.map(ide =>
        '<button type="button" class="btn-dashboard-ide' + (ide.primary ? ' primary' : '') + '" data-ide="' + escapeHtml(ide.id) + '" onclick="launchProjectIde(this.dataset.ide)" title="' + escapeHtml(ide.name) + '">' +
          '<span>' + escapeHtml(ide.name) + '</span>' +
        '</button>'
      ).join('');
    }

    function filterProjectIdes() {
      const query = (document.getElementById('projectIdeSearchInput')?.value || '');
      renderProjectIdeButtons(query);
    }

    async function launchProjectIde(ideId) {
      if (!currentIdeProject) return;
      const pName = currentIdeProject;
      sileo.info('Launching ' + ideId + ' for [' + pName + ']...');
      try {
        const res = await fetch('/__hostmagic/api/projects/open-ide', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ide: ideId, name: pName })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          sileo.success(data.message || 'Opened project in ' + ideId + '!');
          closeProjectIdeModal();
        } else if (data.needPath) {
          closeProjectIdeModal();
          sileo.info('Project folder not linked yet. Select project directory...');
          browseAndLinkProject(pName);
        } else {
          sileo.error('Could not open ' + ideId + ': ' + (data.error || data.message || 'Unknown error'));
        }
      } catch (err) {
        sileo.error('Error launching IDE: ' + err.message);
      }
    }

    function openCustomizeModal(projectName) {
      currentCustomizingProject = projectName;
      const titleEl = document.getElementById('customizeProjectTitle');
      const nameEl = document.getElementById('customizePreviewName');
      if (titleEl) titleEl.textContent = projectName;
      if (nameEl) nameEl.textContent = projectName;

      const p = allProjects.find(item => item.name.toLowerCase() === projectName.toLowerCase()) || {};
      const isRunning = p.status === 'running';
      const forgetBtn = document.getElementById('customizeForgetBtn');
      if (forgetBtn) {
        if (isRunning) {
          forgetBtn.disabled = true;
          forgetBtn.title = 'Stop project before removing from dashboard';
        } else {
          forgetBtn.disabled = false;
          forgetBtn.title = 'Remove project from dashboard registry';
        }
      }

      const current = getProjectCustomization(projectName, p.icon, p.color);
      currentSelectedIcon = current.icon || 'box';
      currentSelectedColor = current.color || '';

      // Populate Select if empty
      const select = document.getElementById('customizeIconSelect');
      if (select && select.children.length === 0) {
        select.innerHTML = AVAILABLE_ICONS.map(i => '<option value="' + i.id + '">' + i.name + '</option>').join('');
      }
      if (select) select.value = currentSelectedIcon;

      // Populate Quick Grid if empty
      const grid = document.getElementById('customizeIconQuickGrid');
      if (grid && grid.children.length === 0) {
        grid.innerHTML = AVAILABLE_ICONS.map(i =>
          '<button type="button" class="icon-quick-btn' + (i.id === currentSelectedIcon ? ' active' : '') + '" id="quick-icon-' + i.id + '" title="' + i.name + '" data-icon="' + i.id + '" onclick="onIconSelectChange(this.dataset.icon)">' +
            (Icons[i.id] || Icons.box) +
          '</button>'
        ).join('');
      }

      // Populate Swatches if empty
      const swatches = document.getElementById('colorSwatchesContainer');
      if (swatches && swatches.children.length === 0) {
        swatches.innerHTML = PRESET_COLORS.map(c =>
          '<div class="color-swatch" id="swatch-' + c.hex.replace('#', '') + '" style="background-color: ' + c.hex + ';" title="' + c.name + ' (' + c.hex + ')" data-color="' + c.hex + '" onclick="onSelectColor(this.dataset.color)"></div>'
        ).join('');
      }

      const colorInput = document.getElementById('customizeColorInput');
      const colorPicker = document.getElementById('customizeColorPicker');
      if (colorInput) colorInput.value = currentSelectedColor;
      if (colorPicker) colorPicker.value = currentSelectedColor || '#0f62fe';

      const autostartCheck = document.getElementById('customizeAutostartCheckbox');
      if (autostartCheck) autostartCheck.checked = Boolean(p.autostart);

      updateCustomizePreview();
      const modal = document.getElementById('customizeModal');
      if (modal) modal.showModal();
    }

    function closeCustomizeModal() {
      const modal = document.getElementById('customizeModal');
      if (modal) modal.close();
      currentCustomizingProject = null;
    }

    function onIconSelectChange(iconId) {
      currentSelectedIcon = iconId;
      const select = document.getElementById('customizeIconSelect');
      if (select) select.value = iconId;
      updateCustomizePreview();
    }

    function onSelectColor(hex) {
      currentSelectedColor = hex;
      const colorInput = document.getElementById('customizeColorInput');
      const colorPicker = document.getElementById('customizeColorPicker');
      if (colorInput) colorInput.value = hex;
      if (colorPicker) colorPicker.value = hex;
      updateCustomizePreview();
    }

    function onColorPickerInput(hex) {
      currentSelectedColor = hex;
      const colorInput = document.getElementById('customizeColorInput');
      if (colorInput) colorInput.value = hex;
      updateCustomizePreview();
    }

    function onColorTextInput(val) {
      currentSelectedColor = (val || '').trim();
      if (/^#[0-9a-f]{3,8}$/i.test(currentSelectedColor)) {
        const colorPicker = document.getElementById('customizeColorPicker');
        if (colorPicker) colorPicker.value = currentSelectedColor;
      }
      updateCustomizePreview();
    }

    function resetCustomizeColor() {
      currentSelectedColor = '';
      const colorInput = document.getElementById('customizeColorInput');
      if (colorInput) colorInput.value = '';
      updateCustomizePreview();
    }

    function updateCustomizePreview() {
      const previewCard = document.getElementById('customizePreviewCard');
      const previewIcon = document.getElementById('customizePreviewIcon');
      if (previewIcon) {
        previewIcon.innerHTML = Icons[currentSelectedIcon] || Icons.box;
      }
      if (previewCard) {
        previewCard.style.borderLeftColor = currentSelectedColor || 'var(--cds-support-success)';
      }

      // Highlight active icon button
      document.querySelectorAll('.icon-quick-btn').forEach(b => b.classList.remove('active'));
      const activeBtn = document.getElementById('quick-icon-' + currentSelectedIcon);
      if (activeBtn) activeBtn.classList.add('active');

      // Highlight active color swatch
      document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
      if (currentSelectedColor) {
        const hexKey = currentSelectedColor.replace('#', '').toLowerCase();
        const sw = document.getElementById('swatch-' + hexKey);
        if (sw) sw.classList.add('active');
      }
    }

    async function saveProjectCustomization() {
      if (!currentCustomizingProject) return;
      const name = currentCustomizingProject;
      const styles = getProjectCustomizations();
      styles[name.toLowerCase()] = {
        icon: currentSelectedIcon,
        color: currentSelectedColor
      };
      saveProjectCustomizations(styles);

      const autostartCheck = document.getElementById('customizeAutostartCheckbox');
      const isAutostart = autostartCheck ? autostartCheck.checked : false;

      const proj = allProjects.find(item => item.name.toLowerCase() === name.toLowerCase());
      if (proj) proj.autostart = isAutostart;

      // Async persist to gateway backend
      fetch('/__hostmagic/api/projects/customize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name,
          icon: currentSelectedIcon,
          color: currentSelectedColor,
          autostart: isAutostart
        })
      }).catch(() => {});

      closeCustomizeModal();
      filterDashboard();
      showToast('Settings updated for [' + name + ']');
    }

    async function toggleProjectAutostart(name) {
      const proj = allProjects.find(p => p.name.toLowerCase() === name.toLowerCase());
      const newStatus = !Boolean(proj?.autostart);

      if (proj) proj.autostart = newStatus;
      const toggleEl = document.getElementById('autostart-toggle-' + name);
      if (toggleEl) {
        toggleEl.classList.toggle('active', newStatus);
      }

      try {
        const res = await fetch('/__hostmagic/api/projects/autostart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, autostart: newStatus })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          if (newStatus) {
            sileo.success('Auto-start enabled for [' + name + ']');
          } else {
            sileo.info('Auto-start disabled for [' + name + ']');
          }
        } else {
          if (proj) proj.autostart = !newStatus;
          if (toggleEl) toggleEl.classList.toggle('active', !newStatus);
          sileo.error('Failed to update autostart: ' + (data.error || 'Unknown error'));
        }
      } catch (err) {
        if (proj) proj.autostart = !newStatus;
        if (toggleEl) toggleEl.classList.toggle('active', !newStatus);
        sileo.error('Error updating autostart: ' + err.message);
      }
    }

    function cleanAnsi(str) {
      if (!str) return '';
      return str.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
    }

    // --- Sileo Notification Library ---
    const sileo = (function() {
      const ICONS = {
        success: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>',
        error: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>',
        warning: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>',
        info: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>'
      };

      function getToaster() {
        let toaster = document.getElementById('sileo-toaster');
        if (!toaster) {
          toaster = document.createElement('div');
          toaster.id = 'sileo-toaster';
          document.body.appendChild(toaster);
        }
        return toaster;
      }

      function dismiss(toastEl) {
        if (!toastEl || toastEl.classList.contains('sileo-dismissing')) return;
        toastEl.classList.add('sileo-dismissing');
        setTimeout(() => {
          if (toastEl.parentNode) toastEl.parentNode.removeChild(toastEl);
        }, 260);
      }

      function show(message, type = 'info', duration = 3400) {
        const text = typeof message === 'object' && message ? (message.title || message.message || JSON.stringify(message)) : String(message || '');
        const validTypes = ['success', 'error', 'warning', 'info'];
        const toastType = validTypes.includes(type) ? type : 'info';
        const toaster = getToaster();

        const toast = document.createElement('div');
        toast.className = 'sileo-toast ' + toastType;
        
        const iconCapsule = document.createElement('div');
        iconCapsule.className = 'sileo-icon-capsule ' + toastType;
        iconCapsule.innerHTML = ICONS[toastType];

        const content = document.createElement('div');
        content.className = 'sileo-content';
        content.textContent = text;

        const closeBtn = document.createElement('button');
        closeBtn.className = 'sileo-close-btn';
        closeBtn.title = 'Dismiss';
        closeBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
        closeBtn.onclick = (e) => {
          e.stopPropagation();
          dismiss(toast);
        };

        const progress = document.createElement('div');
        progress.className = 'sileo-progress';
        const progressBar = document.createElement('div');
        progressBar.className = 'sileo-progress-bar';
        progressBar.style.animationDuration = duration + 'ms';
        progress.appendChild(progressBar);

        toast.appendChild(iconCapsule);
        toast.appendChild(content);
        toast.appendChild(closeBtn);
        toast.appendChild(progress);

        toast.onclick = () => dismiss(toast);

        toaster.appendChild(toast);

        let timer = setTimeout(() => {
          dismiss(toast);
        }, duration);

        toast.addEventListener('mouseenter', () => {
          clearTimeout(timer);
          progressBar.style.animationPlayState = 'paused';
        });

        toast.addEventListener('mouseleave', () => {
          timer = setTimeout(() => dismiss(toast), 1500);
          progressBar.style.animationPlayState = 'running';
        });

        return toast;
      }

      return {
        show,
        success: (msg, dur) => show(msg, 'success', dur || 3400),
        error: (msg, dur) => show(msg, 'error', dur || 4500),
        warning: (msg, dur) => show(msg, 'warning', dur || 3800),
        info: (msg, dur) => show(msg, 'info', dur || 3400),
        dismiss,
        clear: () => {
          const toaster = document.getElementById('sileo-toaster');
          if (toaster) toaster.innerHTML = '';
        }
      };
    })();

    window.sileo = sileo;

    function showToast(msg, type = 'info') {
      if (typeof msg === 'string') {
        const lower = msg.toLowerCase();
        if (type === 'info') {
          if (lower.includes('error') || lower.includes('failed') || lower.includes('fail')) {
            type = 'error';
          } else if (lower.includes('success') || lower.includes('started') || lower.includes('updated') || lower.includes('linked') || lower.includes('imported') || lower.includes('registered') || lower.includes('copied')) {
            type = 'success';
          } else if (lower.includes('warning') || lower.includes('no logs')) {
            type = 'warning';
          }
        }
      }
      return sileo.show(msg, type);
    }

    function escapeHtml(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

    function renderDashboard(projectsToRender, routesToRender) {
      const container = document.getElementById('projectsContainer');
      if (!container) return;
      const search = (document.getElementById('searchInput')?.value || '').toLowerCase().trim();

      if (!projectsToRender || projectsToRender.length === 0) {
        container.innerHTML = \`
          <div class="empty-state">
            <h3>No projects registered yet</h3>
            <p>Run <code>hm init</code> in your project repository or click <strong>Add Project</strong> above to import an existing directory.</p>
          </div>
        \`;
      } else {
        container.innerHTML = projectsToRender.map(p => {
          const isRunning = p.status === 'running';
          const cardClass = isRunning ? 'running' : 'stopped';
          const isCollapsed = !expandedProjects.has(p.name);
          const collapsedClass = isCollapsed ? ' collapsed' : '';
          const statusBadge = isRunning
            ? '<span class="badge badge-status-live"><span class="status-dot-live"></span> LIVE</span>'
            : '<span class="badge badge-status-stopped"><span class="status-dot-stopped"></span> STOPPED</span>';

          const mainActionBtn = isRunning
            ? \`<button class="btn btn-secondary btn-sm" id="btn-restart-\${escapeHtml(p.name)}" onclick="event.stopPropagation(); restartProject('\${escapeHtml(p.name)}', '\${escapeHtml(p.path)}')" title="Restart project services">
                \${Icons.restart} Restart
              </button>
              <button class="btn btn-danger btn-sm" onclick="event.stopPropagation(); stopProject('\${escapeHtml(p.name)}')">
                \${Icons.stop} Stop
              </button>\`
            : \`<button class="btn btn-primary btn-sm" id="btn-play-\${escapeHtml(p.name)}" onclick="event.stopPropagation(); startProject('\${escapeHtml(p.name)}', '\${escapeHtml(p.path)}')">
                \${Icons.play} Start
              </button>\`;


          const projectLogBtn = isRunning
            ? \`<button class="btn-action btn-action-logs" onclick="event.stopPropagation(); openLogModal('\${escapeHtml(p.name)}', 'all')">
                \${Icons.terminal} Logs
              </button>\`
            : '';

          const services = p.services || [];
          const rowsHtml = services.map(s => {
            const role = (s.type || 'custom').toLowerCase();
            const typeBadgeClass = role === 'frontend' ? 'badge-frontend' : (role === 'backend' ? 'badge-backend' : 'badge-custom');
            const domain = s.domain || (p.name + '.' + (p.tld || 'test'));
            const livePort = s.livePort || s.port || '-';
            const sIsLive = isRunning;

            const domainHtml = sIsLive
              ? \`<a href="http://\${encodeURIComponent(domain)}" target="_blank" class="domain-link">
                  \${Icons.globe} \${escapeHtml(domain)} \${Icons.external}
                </a>\`
              : \`<span class="domain-link stopped">
                  \${Icons.globe} \${escapeHtml(domain)}
                </span>\`;

            const sStatusHtml = sIsLive
              ? '<span class="badge badge-status-live"><span class="status-dot-live"></span> LIVE</span>'
              : '<span class="badge badge-status-stopped"><span class="status-dot-stopped"></span> OFFLINE</span>';

            const sActionHtml = sIsLive
              ? \`<button class="btn-action btn-action-logs" onclick="openLogModal('\${escapeHtml(domain)}', '\${escapeHtml(s.name)}')">
                  \${Icons.terminal} Logs
                </button>\`
              : '<span style="color: var(--cds-text-helper); font-size: 12px;">—</span>';

            return \`
              <tr>
                <td style="font-weight: 600; color: var(--cds-text-primary);">\${escapeHtml(s.name)}</td>
                <td>\${domainHtml}</td>
                <td><span class="port-tag">\${livePort !== '-' ? ':' + livePort : '(auto)'}</span></td>
                <td><span class="badge \${typeBadgeClass}">\${escapeHtml((s.type || 'custom').toUpperCase())}</span></td>
                <td>\${sStatusHtml}</td>
                <td>\${sActionHtml}</td>
              </tr>
            \`;
          }).join('');

          const customStyle = getProjectCustomization(p.name, p.icon, p.color);
          const chosenIconKey = customStyle.icon || 'box';
          const projectIcon = Icons[chosenIconKey] || Icons.box;
          const customBorderColor = customStyle.color || '';
          const borderStyleAttr = customBorderColor
            ? \`style="--project-border: \${escapeHtml(customBorderColor)}; border-left-color: \${escapeHtml(customBorderColor)} !important;"\`
            : '';

          return \`
            <div class="project-card \${cardClass}\${collapsedClass}" id="project-card-\${escapeHtml(p.name)}" \${borderStyleAttr}>
              <div class="project-card-header" onclick="toggleProjectAccordion('\${escapeHtml(p.name)}')">
                <div class="project-meta">
                  \${Icons.chevron}
                  <span class="project-name" title="Click to customize appearance" onclick="event.stopPropagation(); openCustomizeModal('\${escapeHtml(p.name)}')">
                    \${projectIcon} \${escapeHtml(p.name)}
                  </span>
                  \${statusBadge}
                  <span class="services-count-badge">(\${services.length} \${services.length === 1 ? 'service' : 'services'})</span>
                  \${p.path
                    ? \`<span class="project-path" title="\${escapeHtml(p.path)}" onclick="event.stopPropagation()">\${escapeHtml(p.path)}</span>\`
                    : \`<button type="button" class="btn-link-folder" onclick="event.stopPropagation(); browseAndLinkProject('\${escapeHtml(p.name)}')" title="Browse and link project folder">\${Icons.folder} Link Folder</button>\`
                  }
                </div>
                <div class="project-actions" onclick="event.stopPropagation()">
                  <div class="project-autostart-toggle\${p.autostart ? ' active' : ''}" 
                       id="autostart-toggle-\${escapeHtml(p.name)}" 
                       data-name="\${escapeHtml(p.name)}" 
                       onclick="event.stopPropagation(); toggleProjectAutostart(this.dataset.name)" 
                       title="Auto-start project whenever 'hm start' is run">
                    <span style="font-family: 'IBM Plex Mono', monospace; font-size: 11px;">⚡ Auto-start</span>
                    <span class="toggle-track">
                      <span class="toggle-dot"></span>
                    </span>
                  </div>
                  <button type="button" class="btn-action" title="Open project in IDE or Terminal" onclick="openProjectIdeModal('\${escapeHtml(p.name)}')">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -2px; margin-right: 4px;"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
                    Open in...
                  </button>
                  <button type="button" class="btn-action btn-action-edit" title="Configure project appearance & settings" onclick="openCustomizeModal('\${escapeHtml(p.name)}')">
                    \${Icons.sliders} Config
                  </button>
                  \${projectLogBtn}
                  \${mainActionBtn}
                </div>
              </div>
              <div class="project-card-body">
                <div class="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>Service</th>
                        <th>Domain</th>
                        <th>Port</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      \${rowsHtml || '<tr><td colspan="6" style="text-align: center; color: var(--cds-text-helper); padding: 16px;">No services configured.</td></tr>'}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          \`;
        }).join('');
      }

      // Render Standalone Routes
      const standaloneContainer = document.getElementById('standaloneContainer');
      const standaloneBody = document.getElementById('standaloneTableBody');
      const standaloneRoutes = (routesToRender || []).filter(r => r.projectName === 'standalone' || r.projectName === 'custom');

      if (standaloneRoutes.length > 0) {
        standaloneContainer.style.display = 'block';
        standaloneBody.innerHTML = standaloneRoutes.map(r => \`
          <tr>
            <td>
              <a href="http://\${encodeURIComponent(r.domain)}" target="_blank" class="domain-link">
                \${Icons.globe} \${escapeHtml(r.domain)} \${Icons.external}
              </a>
            </td>
            <td><span class="port-tag">:\${r.targetPort}</span></td>
            <td>\${escapeHtml(r.serviceName || r.domain.split('.')[0])}</td>
            <td><span class="badge badge-custom">\${escapeHtml((r.type || 'custom').toUpperCase())}</span></td>
            <td>
              <button class="btn-action btn-action-delete" onclick="deleteRoute('\${escapeHtml(r.domain)}')">
                \${Icons.trash} Remove
              </button>
            </td>
          </tr>
        \`).join('');
      } else {
        standaloneContainer.style.display = 'none';
      }

      updateToggleAllBtn();
    }

    function filterDashboard() {
      const q = document.getElementById('searchInput').value.toLowerCase().trim();
      if (!q) {
        renderDashboard(allProjects, allRoutes);
        return;
      }
      const filtered = allProjects.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.path && p.path.toLowerCase().includes(q)) ||
        (p.services && p.services.some(s =>
          s.name.toLowerCase().includes(q) ||
          (s.domain && s.domain.toLowerCase().includes(q)) ||
          String(s.port || '').includes(q)
        ))
      );
      renderDashboard(filtered, allRoutes);
    }

    async function loadDashboard(showNotice) {
      if (actionInProgress) return;
      try {
        const [projRes, statusRes] = await Promise.all([
          fetch('/__hostmagic/api/projects'),
          fetch('/__hostmagic/api/status')
        ]);

        if (projRes.ok) {
          const projData = await projRes.json();
          const rawProjects = projData.projects || [];
          const dedupMap = new Map();
          for (const p of rawProjects) {
            if (p && p.name) {
              const k = p.name.toLowerCase();
              if (!dedupMap.has(k) || (p.path && !dedupMap.get(k).path)) {
                dedupMap.set(k, p);
              }
            }
          }
          allProjects = Array.from(dedupMap.values());
          const runningCount = allProjects.filter(p => p.status === 'running').length;
          const runningEl = document.getElementById('metricRunningProjects');
          if (runningEl) runningEl.textContent = runningCount;
          const totalEl = document.getElementById('metricTotalProjects');
          if (totalEl) totalEl.textContent = ' / ' + allProjects.length + ' total';
        }

        if (statusRes.ok) {
          const statusData = await statusRes.json();
          allRoutes = statusData.routes || [];
          const domainsEl = document.getElementById('metricDomains');
          if (domainsEl) domainsEl.textContent = allRoutes.length;
        }

        filterDashboard();
        if (showNotice) showToast('Dashboard refreshed');
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      }
    }

    // --- Project Start / Stop Controls ---
    async function startProject(name, path) {
      if (!path) {
        await browseAndLinkProject(name);
        return;
      }
      const btn = document.getElementById('btn-play-' + name);
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="icon"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg></span> Starting...';
      }
      actionInProgress = true;
      try {
        const res = await fetch('/__hostmagic/api/projects/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, path })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          sileo.success('Project [' + name + '] started successfully');
        } else {
          sileo.error('Failed to start project: ' + (data.error || 'Unknown error'));
        }
      } catch (err) {
        sileo.error('Error connecting to Hostmagic gateway: ' + err.message);
      } finally {
        actionInProgress = false;
        await loadDashboard();
      }
    }

    async function stopProject(name) {
      if (!confirm('Stop all running services for project [' + name + ']?')) {
        return;
      }
      actionInProgress = true;
      try {
        const res = await fetch('/__hostmagic/api/projects/stop', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          sileo.info('Project [' + name + '] stopped cleanly');
        } else {
          sileo.error('Failed to stop project: ' + (data.error || 'Unknown error'));
        }
      } catch (err) {
        sileo.error('Error communicating with Hostmagic gateway: ' + err.message);
      } finally {
        actionInProgress = false;
        await loadDashboard();
      }
    }

    async function restartProject(name, path) {
      if (!path) {
        await browseAndLinkProject(name);
        return;
      }
      const btn = document.getElementById('btn-restart-' + name);
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="icon spin"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5A10 10 0 0 1 18.8 4.2M22 12.5a10 10 0 0 1-18.8 4.2"></path></svg></span> Restarting...';
      }
      actionInProgress = true;
      try {
        const res = await fetch('/__hostmagic/api/projects/restart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, path })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          sileo.success('Project [' + name + '] restarted successfully');
        } else {
          sileo.error('Failed to restart project: ' + (data.error || 'Unknown error'));
        }
      } catch (err) {
        sileo.error('Error restarting project: ' + err.message);
      } finally {
        actionInProgress = false;
        await loadDashboard();
      }
    }

    async function restartFromMasthead() {
      const running = allProjects.filter(p => p.status === 'running');
      if (running.length === 0) {
        sileo.info('No projects are currently running to restart.');
        await loadDashboard(true);
        return;
      }
      const btn = document.getElementById('btnRestartMasthead');
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="icon spin"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5A10 10 0 0 1 18.8 4.2M22 12.5a10 10 0 0 1-18.8 4.2"></path></svg></span> <span>Restarting...</span>';
      }
      actionInProgress = true;
      try {
        const res = await fetch('/__hostmagic/api/projects/restart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        });
        const data = await res.json();
        if (res.ok && data.success) {
          sileo.success('Restarted ' + (data.restarted?.length || running.length) + ' running project(s)');
        } else {
          sileo.error('Failed to restart projects: ' + (data.error || 'Unknown error'));
        }
      } catch (err) {
        sileo.error('Error restarting projects: ' + err.message);
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = '<span class="icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5A10 10 0 0 1 18.8 4.2M22 12.5a10 10 0 0 1-18.8 4.2"></path></svg></span> <span>Restart</span>';
        }
        actionInProgress = false;
        await loadDashboard();
      }
    }

    async function forgetProject(name) {
      if (!confirm('Remove project [' + name + '] from Hostmagic dashboard registry? (Files on disk will remain untouched)')) {
        return;
      }
      closeCustomizeModal();
      try {
        const res = await fetch('/__hostmagic/api/projects', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name })
        });
        if (res.ok) {
          sileo.info('Project [' + name + '] removed');
          await loadDashboard();
        } else {
          sileo.error('Failed to remove project.');
        }
      } catch (err) {
        sileo.error('Error removing project: ' + err.message);
      }
    }

    async function forgetCurrentProject() {
      if (!currentCustomizingProject) return;
      await forgetProject(currentCustomizingProject);
    }

    // --- Modal Logs ---
    const logModal = document.getElementById('logModal');
    if (logModal) {
      logModal.addEventListener('close', () => {
        if (logInterval) {
          clearInterval(logInterval);
          logInterval = null;
        }
        activeLogTarget = null;
      });
    }

    function openLogModal(target, serviceName) {
      activeLogTarget = target;
      document.getElementById('logModalTarget').textContent = target + (serviceName && serviceName !== 'all' ? ' (' + serviceName + ')' : '');
      document.getElementById('terminalOutput').innerHTML = '<div class="terminal-empty">Connecting to live log stream...</div>';
      logModal.showModal();
      fetchLogs();
      logInterval = setInterval(fetchLogs, 1200);
    }

    function closeLogModal() {
      logModal.close();
    }

    function clearTerminalView() {
      document.getElementById('terminalOutput').innerHTML = '<div class="terminal-empty">Log view cleared. Waiting for new output...</div>';
    }

    async function copyLogsToClipboard() {
      const terminal = document.getElementById('terminalOutput');
      const text = terminal ? terminal.textContent : '';
      if (!text || text.includes('Connecting to live log stream...') || text.includes('No logs recorded yet') || text.includes('Log view cleared.')) {
        showToast('No logs to copy');
        return;
      }

      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(text);
        } else {
          const ta = document.createElement('textarea');
          ta.value = text;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
        }

        const btn = document.getElementById('copyLogsBtn');
        const origHtml = btn.innerHTML;
        btn.innerHTML = Icons.check + ' Copied';
        showToast('Logs copied to clipboard');
        setTimeout(() => {
          btn.innerHTML = origHtml;
        }, 2000);
      } catch (err) {
        showToast('Failed to copy logs');
      }
    }

    async function fetchLogs() {
      if (!activeLogTarget) return;
      try {
        const res = await fetch('/__hostmagic/api/logs?target=' + encodeURIComponent(activeLogTarget));
        if (res.ok) {
          const data = await res.json();
          const terminal = document.getElementById('terminalOutput');
          if (data.logs && data.logs.length > 0) {
            const shouldScroll = document.getElementById('autoScrollToggle').checked;
            terminal.textContent = data.logs.map(cleanAnsi).join('\\n');
            if (shouldScroll) {
              terminal.scrollTop = terminal.scrollHeight;
            }
          } else {
            terminal.innerHTML = '<div class="terminal-empty">No logs recorded yet for ' + escapeHtml(activeLogTarget) + '</div>';
          }
        }
      } catch (err) {}
    }

    // --- Add Project Modal ---
    const addProjectModal = document.getElementById('addProjectModal');
    function openAddProjectModal() {
      const status = document.getElementById('browseStatusMsg');
      if (status) {
        status.innerHTML = 'Select or enter the folder path containing a <code>.hostmagic.json</code> configuration file.';
      }
      addProjectModal.showModal();
    }
    function closeAddProjectModal() {
      addProjectModal.close();
    }

    async function browseFolderForImport() {
      const btn = document.getElementById('btnBrowseFolder');
      const status = document.getElementById('browseStatusMsg');
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg></span> Browsing...';
      }
      if (status) {
        status.innerHTML = '<span style="color: var(--cds-interactive);">' + Icons.folder + ' Selecting folder in OS dialog...</span>';
      }
      try {
        const res = await fetch('/__hostmagic/api/projects/pick-folder', { method: 'POST' });
        const data = await res.json();
        if (data.success && data.path) {
          document.getElementById('projectFolderPath').value = data.path;
          if (data.hasConfig && data.config) {
            status.innerHTML = '<span style="color: var(--cds-support-success);">' + Icons.check + ' Found .hostmagic.json for [<strong>' + escapeHtml(data.config.name || 'project') + '</strong>]</span>';
          } else {
            status.innerHTML = '<span style="color: var(--cds-support-warning);">' + Icons.alert + ' Note: .hostmagic.json was not found in this folder yet.</span>';
          }
        } else if (data.cancelled) {
          if (status) status.innerHTML = 'Folder selection was cancelled.';
        }
      } catch (err) {
        if (status) status.innerHTML = '<span style="color: var(--cds-support-error);">' + Icons.error + ' Error opening folder picker: ' + escapeHtml(err.message) + '</span>';
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = '<span class="icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg></span> Browse Folder...';
        }
      }
    }

    async function browseAndLinkProject(name) {
      showToast('Opening folder picker for [' + name + ']...');
      try {
        const res = await fetch('/__hostmagic/api/projects/pick-folder', { method: 'POST' });
        const data = await res.json();
        if (data.success && data.path) {
          const importRes = await fetch('/__hostmagic/api/projects/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: data.path })
          });
          const importData = await importRes.json();
          if (importRes.ok && importData.success) {
            sileo.success('Project [' + name + '] linked to ' + data.path);
            await loadDashboard();
          } else {
            openAddProjectModal();
            document.getElementById('projectFolderPath').value = data.path;
            const status = document.getElementById('browseStatusMsg');
            if (status) {
              status.innerHTML = '<span style="color: var(--cds-support-warning);">' + Icons.alert + ' ' + escapeHtml(importData.error || 'Please confirm configuration for this directory.') + '</span>';
            }
          }
        }
      } catch (err) {
        sileo.error('Error picking folder: ' + err.message);
      }
    }

    async function submitNewProject() {
      const pPath = document.getElementById('projectFolderPath').value.trim();
      if (!pPath) {
        sileo.warning('Please enter a project directory path.');
        return;
      }
      try {
        const res = await fetch('/__hostmagic/api/projects/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: pPath })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          closeAddProjectModal();
          sileo.success('Project [' + (data.project?.name || 'project') + '] imported');
          document.getElementById('projectFolderPath').value = '';
          await loadDashboard();
        } else {
          sileo.error(data.error || 'Failed to import project. Make sure .hostmagic.json exists in that directory.');
        }
      } catch (err) {
        sileo.error('Error connecting to Hostmagic gateway: ' + err.message);
      }
    }

    // --- Custom Route Modal ---
    const addModal = document.getElementById('addModal');
    function openAddModal() {
      if (addModal) addModal.showModal();
    }
    function openAddRouteModal() {
      if (addModal) addModal.showModal();
    }
    function closeAddModal() {
      if (addModal) addModal.close();
    }
    function closeAddRouteModal() {
      if (addModal) addModal.close();
    }

    async function submitNewRoute() {
      const project = document.getElementById('addProject').value.trim() || 'custom';
      const service = document.getElementById('addService').value.trim() || 'service';
      const domain = document.getElementById('addDomain').value.trim();
      const port = parseInt(document.getElementById('addPort').value.trim(), 10);
      const type = document.getElementById('addType').value;

      if (!domain || isNaN(port) || port <= 0) {
        sileo.warning('Please enter a valid domain and internal port.');
        return;
      }

      try {
        const res = await fetch('/__hostmagic/api/routes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectName: project,
            serviceName: service,
            domain: domain,
            targetPort: port,
            type: type
          })
        });

        if (res.ok) {
          closeAddModal();
          sileo.success('Domain ' + domain + ' registered');
          document.getElementById('addDomain').value = '';
          document.getElementById('addPort').value = '';
          await loadDashboard();
        } else {
          sileo.error('Failed to register domain.');
        }
      } catch (err) {
        sileo.error('Error connecting to Hostmagic gateway.');
      }
    }

    async function deleteRoute(domain) {
      if (!confirm('Remove custom domain ' + domain + ' from reverse proxy?')) {
        return;
      }
      try {
        const res = await fetch('/__hostmagic/api/routes', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ domain })
        });
        if (res.ok) {
          sileo.info('Domain ' + domain + ' removed');
          await loadDashboard();
        }
      } catch (err) {
        sileo.error('Error deleting route.');
      }
    }

    // Initial load
    loadDashboard();

    // Auto sync every 2.5 seconds if modals are closed
    setInterval(() => {
      if (!activeLogTarget && !document.querySelector('dialog[open]')) {
        loadDashboard(false);
      }
    }, 2500);

    // Progressive Web App (PWA) Support
    let deferredPwaPrompt = null;

    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/__hostmagic/sw.js', { scope: '/' })
          .then((reg) => {
            console.log('[Hostmagic PWA] Service Worker registered with scope:', reg.scope);
          })
          .catch((err) => {
            console.warn('[Hostmagic PWA] Service Worker registration failed:', err);
          });
      });
    }

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPwaPrompt = e;
      const installBtn = document.getElementById('pwaInstallBtn');
      if (installBtn) {
        installBtn.style.display = 'inline-flex';
      }
    });

    window.addEventListener('appinstalled', () => {
      deferredPwaPrompt = null;
      const installBtn = document.getElementById('pwaInstallBtn');
      if (installBtn) {
        installBtn.style.display = 'none';
      }
      if (typeof sileo !== 'undefined' && sileo.success) {
        sileo.success('Hostmagic PWA installed successfully!');
      }
    });

    async function installPwaApp() {
      if (!deferredPwaPrompt) return;
      deferredPwaPrompt.prompt();
      try {
        const choice = await deferredPwaPrompt.userChoice;
        if (choice && choice.outcome === 'accepted') {
          const installBtn = document.getElementById('pwaInstallBtn');
          if (installBtn) installBtn.style.display = 'none';
        }
      } catch (err) {
        console.warn('[Hostmagic PWA] Prompt outcome error:', err);
      }
      deferredPwaPrompt = null;
    }
  </script>
</body>
</html>`;
}
