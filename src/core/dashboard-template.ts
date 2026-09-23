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
      background: #0f62fe;
      color: #ffffff;
      border-radius: 0;
      flex-shrink: 0;
      line-height: 1;
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

    /* Carbon Toast */
    .toast {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background-color: #161616;
      color: #ffffff;
      border-left: 4px solid #0f62fe;
      border-radius: 0;
      padding: 14px 20px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      font-size: 14px;
      letter-spacing: 0.16px;
      z-index: 9999;
      opacity: 0;
      transform: translateY(8px);
      transition: opacity 0.2s, transform 0.2s;
      pointer-events: none;
    }

    .toast.show {
      opacity: 1;
      transform: translateY(0);
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
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
          </svg>
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
        <button class="masthead-btn" id="themeToggleBtn" onclick="toggleTheme()" title="Switch Carbon theme">
          <span class="icon" id="themeToggleIcon"></span>
          <span id="themeToggleText">Light</span>
        </button>
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
        <span>Customize Appearance: <span id="customizeProjectTitle" style="color: var(--cds-interactive);">project</span></span>
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
    </div>
    <div class="dialog-footer">
      <button class="btn btn-secondary" onclick="closeCustomizeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="saveProjectCustomization()">Save Appearance</button>
    </div>
  </dialog>

  <!-- Toast Notification -->
  <div id="toast" class="toast"></div>

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

    function openCustomizeModal(projectName) {
      currentCustomizingProject = projectName;
      const titleEl = document.getElementById('customizeProjectTitle');
      const nameEl = document.getElementById('customizePreviewName');
      if (titleEl) titleEl.textContent = projectName;
      if (nameEl) nameEl.textContent = projectName;

      const p = allProjects.find(item => item.name.toLowerCase() === projectName.toLowerCase()) || {};
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

      // Async persist to gateway backend
      fetch('/__hostmagic/api/projects/customize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name,
          icon: currentSelectedIcon,
          color: currentSelectedColor
        })
      }).catch(() => {});

      closeCustomizeModal();
      filterDashboard();
      showToast('Appearance updated for [' + name + ']');
    }

    function cleanAnsi(str) {
      if (!str) return '';
      return str.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
    }

    function showToast(msg) {
      const toast = document.getElementById('toast');
      toast.textContent = msg;
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 3200);
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
            ? \`<button class="btn btn-danger btn-sm" onclick="event.stopPropagation(); stopProject('\${escapeHtml(p.name)}')">
                \${Icons.stop} Stop
              </button>\`
            : \`<button class="btn btn-primary btn-sm" id="btn-play-\${escapeHtml(p.name)}" onclick="event.stopPropagation(); startProject('\${escapeHtml(p.name)}', '\${escapeHtml(p.path)}')">
                \${Icons.play} Start
              </button>\`;

          const forgetBtn = !isRunning
            ? \`<button class="btn-action btn-action-delete" title="Remove from list" onclick="event.stopPropagation(); forgetProject('\${escapeHtml(p.name)}')">
                \${Icons.trash} Forget
              </button>\`
            : '';

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
                  <button type="button" class="btn-action btn-action-edit" title="Customize icon & left border color" onclick="openCustomizeModal('\${escapeHtml(p.name)}')">
                    \${Icons.sliders} Style
                  </button>
                  \${projectLogBtn}
                  \${forgetBtn}
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
          document.getElementById('metricRunningProjects').textContent = runningCount;
          document.getElementById('metricTotalProjects').textContent = ' / ' + allProjects.length + ' total';
        }

        if (statusRes.ok) {
          const statusData = await statusRes.json();
          allRoutes = statusData.routes || [];
          document.getElementById('metricDomains').textContent = allRoutes.length;
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
          showToast('Project [' + name + '] started successfully');
        } else {
          alert('Failed to start project: ' + (data.error || 'Unknown error'));
        }
      } catch (err) {
        alert('Error connecting to Hostmagic gateway: ' + err.message);
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
          showToast('Project [' + name + '] stopped cleanly');
        } else {
          alert('Failed to stop project: ' + (data.error || 'Unknown error'));
        }
      } catch (err) {
        alert('Error communicating with Hostmagic gateway: ' + err.message);
      } finally {
        actionInProgress = false;
        await loadDashboard();
      }
    }

    async function forgetProject(name) {
      if (!confirm('Remove project [' + name + '] from Hostmagic dashboard registry? (Files on disk will remain untouched)')) {
        return;
      }
      try {
        const res = await fetch('/__hostmagic/api/projects', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name })
        });
        if (res.ok) {
          showToast('Project [' + name + '] removed');
          await loadDashboard();
        } else {
          alert('Failed to remove project.');
        }
      } catch (err) {
        alert('Error removing project: ' + err.message);
      }
    }

    // --- Modal Logs ---
    const logModal = document.getElementById('logModal');
    logModal.addEventListener('close', () => {
      if (logInterval) {
        clearInterval(logInterval);
        logInterval = null;
      }
      activeLogTarget = null;
    });

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
            showToast('Project [' + name + '] linked to ' + data.path);
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
        alert('Error picking folder: ' + err.message);
      }
    }

    async function submitNewProject() {
      const pPath = document.getElementById('projectFolderPath').value.trim();
      if (!pPath) {
        alert('Please enter a project directory path.');
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
          showToast('Project [' + (data.project?.name || 'project') + '] imported');
          document.getElementById('projectFolderPath').value = '';
          await loadDashboard();
        } else {
          alert(data.error || 'Failed to import project. Make sure .hostmagic.json exists in that directory.');
        }
      } catch (err) {
        alert('Error connecting to Hostmagic gateway: ' + err.message);
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
        alert('Please enter a valid domain and internal port.');
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
          showToast('Domain ' + domain + ' registered');
          document.getElementById('addDomain').value = '';
          document.getElementById('addPort').value = '';
          await loadDashboard();
        } else {
          alert('Failed to register domain.');
        }
      } catch (err) {
        alert('Error connecting to Hostmagic gateway.');
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
          showToast('Domain ' + domain + ' removed');
          await loadDashboard();
        }
      } catch (err) {
        alert('Error deleting route.');
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
  </script>
</body>
</html>`;
}
