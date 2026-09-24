import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execa } from 'execa';

export interface IdeDefinition {
  id: string;
  name: string;
  buttonLabel: string;
  category: 'primary' | 'ai' | 'jetbrains' | 'editor' | 'terminal';
  commands: string[];
  windowsPaths?: string[];
  macAppNames?: string[];
  linuxCommands?: string[];
  urlScheme?: (folderPath: string) => string;
  isTerminalCli?: boolean;
  cliCommand?: string;
  iconSvg?: string;
}

export const SUPPORTED_IDES: IdeDefinition[] = [
  // --- Primary / AI Assistants & Modern Editors ---
  {
    id: 'antigravity',
    name: 'Antigravity',
    buttonLabel: 'Open in Antigravity',
    category: 'primary',
    commands: ['antigravity', 'agy', 'antigravity-ide'],
    windowsPaths: [
      path.join(process.env.LOCALAPPDATA || '', 'Programs', 'antigravity', 'Antigravity.exe'),
      path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Antigravity IDE', 'Antigravity IDE.exe'),
      path.join(process.env.LOCALAPPDATA || '', 'agy', 'bin', 'agy.exe'),
    ],
    macAppNames: ['Antigravity.app', 'Antigravity IDE.app'],
    urlScheme: (p) => `antigravity://file/${encodeURI(p.replace(/\\/g, '/'))}`,
    iconSvg: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`,
  },
  {
    id: 'claude',
    name: 'Claude Code',
    buttonLabel: 'Open in Claude Code',
    category: 'ai',
    commands: ['claude'],
    isTerminalCli: true,
    cliCommand: 'claude',
    iconSvg: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 1 0 10 10H12V2z"></path><path d="M12 12 2.1 12a10.1 10.1 0 0 0 1.9 4"></path></svg>`,
  },
  {
    id: 'codex',
    name: 'Codex',
    buttonLabel: 'Open in Codex',
    category: 'ai',
    commands: ['codex'],
    isTerminalCli: true,
    cliCommand: 'codex',
    iconSvg: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>`,
  },
  {
    id: 'vscode',
    name: 'VS Code',
    buttonLabel: 'Open in VS Code',
    category: 'primary',
    commands: ['code', 'code-insiders'],
    windowsPaths: [
      path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Microsoft VS Code', 'Code.exe'),
      path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Microsoft VS Code Insiders', 'Code - Insiders.exe'),
      path.join(process.env.PROGRAMFILES || '', 'Microsoft VS Code', 'Code.exe'),
    ],
    macAppNames: ['Visual Studio Code.app', 'Visual Studio Code - Insiders.app'],
    urlScheme: (p) => `vscode://file/${encodeURI(p.replace(/\\/g, '/'))}`,
    iconSvg: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>`,
  },
  {
    id: 'cursor',
    name: 'Cursor',
    buttonLabel: 'Open in Cursor',
    category: 'ai',
    commands: ['cursor'],
    windowsPaths: [
      path.join(process.env.LOCALAPPDATA || '', 'Programs', 'cursor', 'Cursor.exe'),
    ],
    macAppNames: ['Cursor.app'],
    urlScheme: (p) => `cursor://file/${encodeURI(p.replace(/\\/g, '/'))}`,
    iconSvg: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 3 10.07 19.97 12.58 12.58 19.97 10.07 3 3"></polygon></svg>`,
  },
  {
    id: 'windsurf',
    name: 'Windsurf',
    buttonLabel: 'Open in Windsurf',
    category: 'ai',
    commands: ['windsurf'],
    windowsPaths: [
      path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Windsurf', 'Windsurf.exe'),
    ],
    macAppNames: ['Windsurf.app'],
    urlScheme: (p) => `windsurf://file/${encodeURI(p.replace(/\\/g, '/'))}`,
    iconSvg: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12h20M2 12l5-5m-5 5 5 5M22 12l-5-5m5 5-5 5"></path></svg>`,
  },
  {
    id: 'zed',
    name: 'Zed',
    buttonLabel: 'Open in Zed',
    category: 'editor',
    commands: ['zed', 'zedit'],
    windowsPaths: [
      path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Zed', 'Zed.exe'),
      path.join(process.env.LOCALAPPDATA || '', 'Zed', 'Zed.exe'),
    ],
    macAppNames: ['Zed.app'],
    urlScheme: (p) => `zed://file/${encodeURI(p.replace(/\\/g, '/'))}`,
    iconSvg: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16l-16 16h16"></path></svg>`,
  },
  {
    id: 'sublime',
    name: 'Sublime Text',
    buttonLabel: 'Open in Sublime Text',
    category: 'editor',
    commands: ['subl', 'sublime_text'],
    windowsPaths: [
      path.join(process.env.PROGRAMFILES || '', 'Sublime Text', 'sublime_text.exe'),
      path.join(process.env.PROGRAMFILES || '', 'Sublime Text 3', 'sublime_text.exe'),
      path.join(process.env['PROGRAMFILES(X86)'] || '', 'Sublime Text', 'sublime_text.exe'),
    ],
    macAppNames: ['Sublime Text.app'],
    iconSvg: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m4 8 16-4-16 8 16-4-16 8 16-4"></path></svg>`,
  },
  {
    id: 'notepadplusplus',
    name: 'Notepad++',
    buttonLabel: 'Open in Notepad++',
    category: 'editor',
    commands: ['notepad++', 'notepad-plus-plus'],
    windowsPaths: [
      path.join(process.env.PROGRAMFILES || '', 'Notepad++', 'notepad++.exe'),
      path.join(process.env['PROGRAMFILES(X86)'] || '', 'Notepad++', 'notepad++.exe'),
    ],
    iconSvg: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`,
  },
  {
    id: 'visualstudio',
    name: 'Visual Studio',
    buttonLabel: 'Open in Visual Studio',
    category: 'editor',
    commands: ['devenv'],
    windowsPaths: [
      path.join(process.env.PROGRAMFILES || '', 'Microsoft Visual Studio', '2022', 'Community', 'Common7', 'IDE', 'devenv.exe'),
      path.join(process.env.PROGRAMFILES || '', 'Microsoft Visual Studio', '2022', 'Professional', 'Common7', 'IDE', 'devenv.exe'),
      path.join(process.env.PROGRAMFILES || '', 'Microsoft Visual Studio', '2022', 'Enterprise', 'Common7', 'IDE', 'devenv.exe'),
      path.join(process.env['PROGRAMFILES(X86)'] || '', 'Microsoft Visual Studio', '2019', 'Community', 'Common7', 'IDE', 'devenv.exe'),
      path.join(process.env['PROGRAMFILES(X86)'] || '', 'Microsoft Visual Studio', '2019', 'Professional', 'Common7', 'IDE', 'devenv.exe'),
    ],
    iconSvg: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 6-8 6 8 6V6z"></path><path d="M6 18V6l4 3-4 3 8 6"></path></svg>`,
  },

  // --- JetBrains Suite ---
  {
    id: 'webstorm',
    name: 'WebStorm',
    buttonLabel: 'Open in WebStorm',
    category: 'jetbrains',
    commands: ['webstorm', 'webstorm64.exe'],
    windowsPaths: [
      path.join(process.env.LOCALAPPDATA || '', 'Programs', 'WebStorm', 'bin', 'webstorm64.exe'),
    ],
    macAppNames: ['WebStorm.app'],
    urlScheme: (p) => `webstorm://open?url=file://${encodeURI(p.replace(/\\/g, '/'))}`,
    iconSvg: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"></rect><path d="m7 15 3-6 2 4 2-4 3 6"></path></svg>`,
  },
  {
    id: 'datagrip',
    name: 'DataGrip',
    buttonLabel: 'Open in DataGrip',
    category: 'jetbrains',
    commands: ['datagrip', 'datagrip64.exe'],
    windowsPaths: [
      path.join(process.env.LOCALAPPDATA || '', 'Programs', 'DataGrip', 'bin', 'datagrip64.exe'),
    ],
    macAppNames: ['DataGrip.app'],
    urlScheme: (p) => `datagrip://open?url=file://${encodeURI(p.replace(/\\/g, '/'))}`,
    iconSvg: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>`,
  },
  {
    id: 'pycharm',
    name: 'PyCharm',
    buttonLabel: 'Open in PyCharm',
    category: 'jetbrains',
    commands: ['pycharm', 'pycharm64.exe'],
    windowsPaths: [
      path.join(process.env.LOCALAPPDATA || '', 'Programs', 'PyCharm', 'bin', 'pycharm64.exe'),
      path.join(process.env.LOCALAPPDATA || '', 'Programs', 'PyCharm Community', 'bin', 'pycharm64.exe'),
    ],
    macAppNames: ['PyCharm.app', 'PyCharm CE.app'],
    urlScheme: (p) => `pycharm://open?url=file://${encodeURI(p.replace(/\\/g, '/'))}`,
    iconSvg: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"></rect><path d="M7 9h4a2 2 0 1 1 0 4H7z"></path><path d="M7 13v4"></path><path d="M14 17h3"></path></svg>`,
  },
  {
    id: 'intellij',
    name: 'IntelliJ IDEA',
    buttonLabel: 'Open in IntelliJ IDEA',
    category: 'jetbrains',
    commands: ['idea', 'idea64.exe'],
    windowsPaths: [
      path.join(process.env.LOCALAPPDATA || '', 'Programs', 'IntelliJ IDEA Ultimate', 'bin', 'idea64.exe'),
      path.join(process.env.LOCALAPPDATA || '', 'Programs', 'IntelliJ IDEA Community', 'bin', 'idea64.exe'),
    ],
    macAppNames: ['IntelliJ IDEA.app', 'IntelliJ IDEA CE.app'],
    urlScheme: (p) => `idea://open?url=file://${encodeURI(p.replace(/\\/g, '/'))}`,
    iconSvg: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"></rect><line x1="7" y1="8" x2="7" y2="16"></line><path d="M11 16h4a2 2 0 0 0 2-2V8"></path></svg>`,
  },
  {
    id: 'androidstudio',
    name: 'Android Studio',
    buttonLabel: 'Open in Android Studio',
    category: 'jetbrains',
    commands: ['studio', 'studio64.exe', 'android-studio'],
    windowsPaths: [
      path.join(process.env.PROGRAMFILES || '', 'Android', 'Android Studio', 'bin', 'studio64.exe'),
      path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Android Studio', 'bin', 'studio64.exe'),
    ],
    macAppNames: ['Android Studio.app'],
    iconSvg: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a4 4 0 0 0-4 4v1H6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2V6a4 4 0 0 0-4-4z"></path><circle cx="9" cy="11" r="1"></circle><circle cx="15" cy="11" r="1"></circle></svg>`,
  },
  {
    id: 'phpstorm',
    name: 'PhpStorm',
    buttonLabel: 'Open in PhpStorm',
    category: 'jetbrains',
    commands: ['phpstorm', 'phpstorm64.exe'],
    windowsPaths: [
      path.join(process.env.LOCALAPPDATA || '', 'Programs', 'PhpStorm', 'bin', 'phpstorm64.exe'),
    ],
    macAppNames: ['PhpStorm.app'],
    urlScheme: (p) => `phpstorm://open?url=file://${encodeURI(p.replace(/\\/g, '/'))}`,
    iconSvg: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"></rect><path d="M7 15V9h3a2 2 0 1 1 0 4H7"></path><path d="M14 15c1-1 2-2 3-2s2 1 2 2"></path></svg>`,
  },
  {
    id: 'goland',
    name: 'GoLand',
    buttonLabel: 'Open in GoLand',
    category: 'jetbrains',
    commands: ['goland', 'goland64.exe'],
    windowsPaths: [
      path.join(process.env.LOCALAPPDATA || '', 'Programs', 'GoLand', 'bin', 'goland64.exe'),
    ],
    macAppNames: ['GoLand.app'],
    urlScheme: (p) => `goland://open?url=file://${encodeURI(p.replace(/\\/g, '/'))}`,
    iconSvg: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"></rect><circle cx="10" cy="12" r="3"></circle><line x1="16" y1="9" x2="16" y2="15"></line></svg>`,
  },
  {
    id: 'clion',
    name: 'CLion',
    buttonLabel: 'Open in CLion',
    category: 'jetbrains',
    commands: ['clion', 'clion64.exe'],
    windowsPaths: [
      path.join(process.env.LOCALAPPDATA || '', 'Programs', 'CLion', 'bin', 'clion64.exe'),
    ],
    macAppNames: ['CLion.app'],
    urlScheme: (p) => `clion://open?url=file://${encodeURI(p.replace(/\\/g, '/'))}`,
    iconSvg: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"></rect><path d="M10 9a3 3 0 0 0-3 3v0a3 3 0 0 0 3 3"></path><line x1="15" y1="9" x2="15" y2="15"></line></svg>`,
  },
  {
    id: 'rider',
    name: 'Rider',
    buttonLabel: 'Open in Rider',
    category: 'jetbrains',
    commands: ['rider', 'rider64.exe'],
    windowsPaths: [
      path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Rider', 'bin', 'rider64.exe'),
    ],
    macAppNames: ['Rider.app'],
    urlScheme: (p) => `rider://open?url=file://${encodeURI(p.replace(/\\/g, '/'))}`,
    iconSvg: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"></rect><path d="M8 9h4a2 2 0 1 1 0 4H8v3"></path><line x1="12" y1="13" x2="16" y2="16"></line></svg>`,
  },
  {
    id: 'rubymine',
    name: 'RubyMine',
    buttonLabel: 'Open in RubyMine',
    category: 'jetbrains',
    commands: ['rubymine', 'rubymine64.exe'],
    windowsPaths: [
      path.join(process.env.LOCALAPPDATA || '', 'Programs', 'RubyMine', 'bin', 'rubymine64.exe'),
    ],
    macAppNames: ['RubyMine.app'],
    urlScheme: (p) => `rubymine://open?url=file://${encodeURI(p.replace(/\\/g, '/'))}`,
    iconSvg: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="6 3 18 3 22 9 12 22 2 9 6 3"></polygon></svg>`,
  },
  {
    id: 'fleet',
    name: 'Fleet',
    buttonLabel: 'Open in Fleet',
    category: 'jetbrains',
    commands: ['fleet'],
    windowsPaths: [
      path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Fleet', 'Fleet.exe'),
    ],
    macAppNames: ['Fleet.app'],
    iconSvg: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path><path d="M12 12v9"></path><path d="m8 17 4 4 4-4"></path></svg>`,
  },

  // --- Other Emerging & Terminal IDEs ---
  {
    id: 'void',
    name: 'Void',
    buttonLabel: 'Open in Void',
    category: 'ai',
    commands: ['void'],
    windowsPaths: [
      path.join(process.env.PROGRAMFILES || '', 'Void', 'Void.exe'),
      path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Void', 'Void.exe'),
    ],
    macAppNames: ['Void.app'],
    iconSvg: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="4"></circle></svg>`,
  },
  {
    id: 'positron',
    name: 'Positron',
    buttonLabel: 'Open in Positron',
    category: 'editor',
    commands: ['positron'],
    windowsPaths: [
      path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Positron', 'Positron.exe'),
    ],
    macAppNames: ['Positron.app'],
    iconSvg: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M3 12h3m12 0h3M12 3v3m0 12v3"></path></svg>`,
  },
  {
    id: 'trae',
    name: 'Trae',
    buttonLabel: 'Open in Trae',
    category: 'ai',
    commands: ['trae'],
    windowsPaths: [
      path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Trae', 'Trae.exe'),
    ],
    macAppNames: ['Trae.app'],
    iconSvg: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>`,
  },
  {
    id: 'neovim',
    name: 'Neovim',
    buttonLabel: 'Open in Neovim',
    category: 'editor',
    commands: ['nvim'],
    isTerminalCli: true,
    cliCommand: 'nvim .',
    iconSvg: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 20 4 4 10 4 20 20 20 4"></polyline></svg>`,
  },
  {
    id: 'helix',
    name: 'Helix',
    buttonLabel: 'Open in Helix',
    category: 'editor',
    commands: ['hx'],
    isTerminalCli: true,
    cliCommand: 'hx .',
    iconSvg: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h4v16H4zM16 4h4v16h-4zM8 10h8v4H8z"></path></svg>`,
  },
  {
    id: 'emacs',
    name: 'Emacs',
    buttonLabel: 'Open in Emacs',
    category: 'editor',
    commands: ['emacs', 'runemacs'],
    iconSvg: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7c0-2.2 3.6-4 8-4s8 1.8 8 4-3.6 4-8 4-8-1.8-8-4z"></path><path d="M4 7v10c0 2.2 3.6 4 8 4s8-1.8 8-4V7"></path></svg>`,
  },
  {
    id: 'eclipse',
    name: 'Eclipse',
    buttonLabel: 'Open in Eclipse',
    category: 'editor',
    commands: ['eclipse'],
    iconSvg: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a7 7 0 0 0 0 14 7 7 0 0 1 0 6"></path></svg>`,
  },
  {
    id: 'xcode',
    name: 'Xcode',
    buttonLabel: 'Open in Xcode',
    category: 'editor',
    commands: ['xed'],
    macAppNames: ['Xcode.app'],
    iconSvg: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>`,
  },

  // --- Terminal & File Explorer ---
  {
    id: 'terminal',
    name: 'Terminal',
    buttonLabel: 'Open in Terminal',
    category: 'terminal',
    commands: ['wt', 'powershell', 'cmd'],
    isTerminalCli: true,
    cliCommand: '',
    iconSvg: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>`,
  },
  {
    id: 'explorer',
    name: 'File Explorer',
    buttonLabel: 'Open in File Explorer',
    category: 'terminal',
    commands: ['explorer'],
    iconSvg: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>`,
  },
];

export interface LaunchResult {
  success: boolean;
  message: string;
  ide: string;
  commandUsed?: string;
  urlSchemeUsed?: boolean;
}

/**
 * Checks if a binary command exists in PATH or at specified paths
 */
function findExecutableInPath(command: string): string | null {
  const pathEnv = process.env.PATH || '';
  const pathEntries = pathEnv.split(path.delimiter);
  const extensions = process.platform === 'win32'
    ? (process.env.PATHEXT ? process.env.PATHEXT.split(';') : ['.exe', '.cmd', '.bat', '.ps1', ''])
    : [''];

  for (const dir of pathEntries) {
    for (const ext of extensions) {
      const fullPath = path.join(dir, command.endsWith(ext) ? command : `${command}${ext}`);
      try {
        if (fs.existsSync(fullPath)) {
          return fullPath;
        }
      } catch {}
    }
  }
  return null;
}

/**
 * Searches for JetBrains Toolbox installations on Windows
 */
function findJetBrainsToolboxBinary(nameFragment: string): string | null {
  if (process.platform !== 'win32') return null;
  const localAppData = process.env.LOCALAPPDATA;
  if (!localAppData) return null;

  const toolboxApps = path.join(localAppData, 'JetBrains', 'Toolbox', 'apps');
  if (!fs.existsSync(toolboxApps)) return null;

  try {
    const entries = fs.readdirSync(toolboxApps);
    for (const entry of entries) {
      if (entry.toLowerCase().includes(nameFragment.toLowerCase())) {
        const productDir = path.join(toolboxApps, entry);
        const channels = fs.readdirSync(productDir);
        for (const channel of channels) {
          const channelDir = path.join(productDir, channel);
          const versions = fs.readdirSync(channelDir);
          for (const ver of versions) {
            const binDir = path.join(channelDir, ver, 'bin');
            if (fs.existsSync(binDir)) {
              const files = fs.readdirSync(binDir);
              const exe = files.find(f => f.endsWith('64.exe') || f.endsWith('.exe'));
              if (exe) return path.join(binDir, exe);
            }
          }
        }
      }
    }
  } catch {}
  return null;
}

/**
 * Launches an interactive terminal in the project directory, optionally executing a command
 */
async function launchTerminalSession(folderPath: string, cliCommand?: string): Promise<LaunchResult> {
  const isWin = process.platform === 'win32';
  const isMac = process.platform === 'darwin';
  const isLinux = process.platform === 'linux';

  const cleanCmd = cliCommand ? cliCommand.trim() : '';

  if (isWin) {
    // 1. Try Windows Terminal (wt.exe)
    const wtPath = findExecutableInPath('wt');
    if (wtPath) {
      const args: string[] = ['-d', folderPath];
      if (cleanCmd) {
        args.push('powershell.exe', '-NoExit', '-Command', cleanCmd);
      }
      try {
        execa(wtPath, args, { detached: true, stdio: 'ignore' }).unref();
        return {
          success: true,
          ide: 'terminal',
          message: `Opened ${cleanCmd || 'Terminal'} in Windows Terminal.`,
          commandUsed: 'wt',
        };
      } catch {}
    }

    // 2. Fall back to PowerShell
    try {
      const psArgs = ['-NoExit', '-Command', `Set-Location '${folderPath}'; ${cleanCmd}`];
      execa('cmd.exe', ['/c', 'start', 'powershell.exe', ...psArgs], {
        detached: true,
        stdio: 'ignore',
      }).unref();
      return {
        success: true,
        ide: 'terminal',
        message: `Opened ${cleanCmd || 'Terminal'} in PowerShell.`,
        commandUsed: 'powershell',
      };
    } catch {}

    // 3. Fall back to CMD
    try {
      const cmdArgs = ['/c', 'start', 'cmd.exe', '/k', `cd /d "${folderPath}" ${cleanCmd ? `&& ${cleanCmd}` : ''}`];
      execa('cmd.exe', cmdArgs, { detached: true, stdio: 'ignore' }).unref();
      return {
        success: true,
        ide: 'terminal',
        message: `Opened ${cleanCmd || 'Terminal'} in Command Prompt.`,
        commandUsed: 'cmd',
      };
    } catch (err: any) {
      return {
        success: false,
        ide: 'terminal',
        message: `Failed to open Windows terminal: ${err.message}`,
      };
    }
  }

  if (isMac) {
    if (cleanCmd) {
      const script = `tell application "Terminal" to do script "cd \\"${folderPath}\\" && ${cleanCmd}"\ntell application "Terminal" to activate`;
      try {
        execa('osascript', ['-e', script], { detached: true, stdio: 'ignore' }).unref();
        return {
          success: true,
          ide: 'terminal',
          message: `Opened ${cleanCmd} in macOS Terminal.`,
          commandUsed: 'Terminal.app',
        };
      } catch (err: any) {
        return { success: false, ide: 'terminal', message: err.message };
      }
    } else {
      try {
        execa('open', ['-a', 'Terminal', folderPath], { detached: true, stdio: 'ignore' }).unref();
        return {
          success: true,
          ide: 'terminal',
          message: 'Opened macOS Terminal.',
          commandUsed: 'Terminal.app',
        };
      } catch (err: any) {
        return { success: false, ide: 'terminal', message: err.message };
      }
    }
  }

  if (isLinux) {
    const linuxTerms = [
      { bin: 'x-terminal-emulator', args: cleanCmd ? ['-e', `bash -c "cd '${folderPath}' && ${cleanCmd}; exec bash"`] : [] },
      { bin: 'gnome-terminal', args: cleanCmd ? ['--', 'bash', '-c', `cd '${folderPath}' && ${cleanCmd}; exec bash`] : [`--working-directory=${folderPath}`] },
      { bin: 'kitty', args: cleanCmd ? ['--directory', folderPath, 'bash', '-c', `${cleanCmd}; exec bash`] : ['--directory', folderPath] },
      { bin: 'alacritty', args: cleanCmd ? ['--working-directory', folderPath, '-e', 'bash', '-c', `${cleanCmd}; exec bash`] : ['--working-directory', folderPath] },
      { bin: 'konsole', args: cleanCmd ? ['--workdir', folderPath, '-e', 'bash', '-c', `${cleanCmd}; exec bash`] : ['--workdir', folderPath] },
      { bin: 'xfce4-terminal', args: cleanCmd ? ['--working-directory', folderPath, '-e', `bash -c "${cleanCmd}; exec bash"`] : [`--working-directory=${folderPath}`] },
      { bin: 'xterm', args: cleanCmd ? ['-e', `bash -c "cd '${folderPath}' && ${cleanCmd}; exec bash"`] : [] },
    ];

    for (const term of linuxTerms) {
      if (findExecutableInPath(term.bin)) {
        try {
          execa(term.bin, term.args, { cwd: folderPath, detached: true, stdio: 'ignore' }).unref();
          return {
            success: true,
            ide: 'terminal',
            message: `Opened ${cleanCmd || 'Terminal'} in ${term.bin}.`,
            commandUsed: term.bin,
          };
        } catch {}
      }
    }
  }

  return {
    success: false,
    ide: 'terminal',
    message: 'Could not detect an available terminal emulator on your system.',
  };
}

/**
 * Open file explorer / finder / file manager
 */
async function launchFileExplorer(folderPath: string): Promise<LaunchResult> {
  if (process.platform === 'win32') {
    try {
      execa('explorer.exe', [folderPath], { detached: true, stdio: 'ignore' }).unref();
      return { success: true, ide: 'explorer', message: `Opened ${folderPath} in Windows Explorer.` };
    } catch (err: any) {
      return { success: false, ide: 'explorer', message: err.message };
    }
  } else if (process.platform === 'darwin') {
    try {
      execa('open', [folderPath], { detached: true, stdio: 'ignore' }).unref();
      return { success: true, ide: 'explorer', message: `Opened ${folderPath} in Finder.` };
    } catch (err: any) {
      return { success: false, ide: 'explorer', message: err.message };
    }
  } else {
    try {
      execa('xdg-open', [folderPath], { detached: true, stdio: 'ignore' }).unref();
      return { success: true, ide: 'explorer', message: `Opened ${folderPath} in File Manager.` };
    } catch (err: any) {
      return { success: false, ide: 'explorer', message: err.message };
    }
  }
}

/**
 * Opens a project folder in the chosen IDE or terminal
 */
export async function launchIde(ideId: string, folderPath: string): Promise<LaunchResult> {
  const resolvedPath = path.resolve(folderPath);
  if (!fs.existsSync(resolvedPath)) {
    return {
      success: false,
      ide: ideId,
      message: `Folder does not exist: "${resolvedPath}"`,
    };
  }

  const cleanId = ideId.toLowerCase().replace(/[^a-z0-9]/g, '');

  if (cleanId === 'terminal') {
    return launchTerminalSession(resolvedPath);
  }

  if (cleanId === 'explorer' || cleanId === 'finder') {
    return launchFileExplorer(resolvedPath);
  }

  const ide = SUPPORTED_IDES.find(
    i => i.id.toLowerCase() === cleanId || i.name.toLowerCase().replace(/\s+/g, '') === cleanId
  );

  if (!ide) {
    return {
      success: false,
      ide: ideId,
      message: `Unknown IDE: "${ideId}". Supported options include: ${SUPPORTED_IDES.map(i => i.name).join(', ')}`,
    };
  }

  // Handle terminal CLI tools (like Claude Code, Codex, Neovim, Helix)
  if (ide.isTerminalCli) {
    return launchTerminalSession(resolvedPath, ide.cliCommand || ide.id);
  }

  const isWin = process.platform === 'win32';
  const isMac = process.platform === 'darwin';

  // 1. Try commands in PATH
  for (const cmd of ide.commands) {
    const foundPath = findExecutableInPath(cmd);
    if (foundPath) {
      try {
        if (isWin) {
          execa('cmd.exe', ['/c', 'start', '""', foundPath, resolvedPath], {
            detached: true,
            stdio: 'ignore',
          }).unref();
        } else {
          execa(foundPath, [resolvedPath], {
            detached: true,
            stdio: 'ignore',
          }).unref();
        }
        return {
          success: true,
          ide: ide.id,
          message: `Opened project in ${ide.name}.`,
          commandUsed: foundPath,
        };
      } catch {}
    }
  }

  // 2. Check Windows known paths
  if (isWin && ide.windowsPaths) {
    for (const winPath of ide.windowsPaths) {
      if (fs.existsSync(winPath)) {
        try {
          execa('cmd.exe', ['/c', 'start', '""', winPath, resolvedPath], {
            detached: true,
            stdio: 'ignore',
          }).unref();
          return {
            success: true,
            ide: ide.id,
            message: `Opened project in ${ide.name}.`,
            commandUsed: winPath,
          };
        } catch {}
      }
    }
  }

  // 2b. Check JetBrains Toolbox on Windows
  if (isWin && ide.category === 'jetbrains') {
    const tbPath = findJetBrainsToolboxBinary(ide.id);
    if (tbPath && fs.existsSync(tbPath)) {
      try {
        execa('cmd.exe', ['/c', 'start', '""', tbPath, resolvedPath], {
          detached: true,
          stdio: 'ignore',
        }).unref();
        return {
          success: true,
          ide: ide.id,
          message: `Opened project in ${ide.name} (Toolbox).`,
          commandUsed: tbPath,
        };
      } catch {}
    }
  }

  // 3. Check macOS Application Bundles
  if (isMac && ide.macAppNames) {
    for (const appName of ide.macAppNames) {
      const appPath = path.join('/Applications', appName);
      const userAppPath = path.join(os.homedir(), 'Applications', appName);
      if (fs.existsSync(appPath) || fs.existsSync(userAppPath)) {
        try {
          execa('open', ['-a', appName, resolvedPath], {
            detached: true,
            stdio: 'ignore',
          }).unref();
          return {
            success: true,
            ide: ide.id,
            message: `Opened project in ${ide.name}.`,
            commandUsed: appName,
          };
        } catch {}
      }
    }
  }

  // 4. Try URL scheme (e.g. vscode://, cursor://, zed://, idea://)
  if (ide.urlScheme) {
    const url = ide.urlScheme(resolvedPath);
    try {
      if (isWin) {
        execa('cmd.exe', ['/c', 'start', '""', url], { detached: true, stdio: 'ignore' }).unref();
      } else if (isMac) {
        execa('open', [url], { detached: true, stdio: 'ignore' }).unref();
      } else {
        execa('xdg-open', [url], { detached: true, stdio: 'ignore' }).unref();
      }
      return {
        success: true,
        ide: ide.id,
        message: `Dispatched open request to ${ide.name} via protocol handler.`,
        urlSchemeUsed: true,
      };
    } catch {}
  }

  // 5. If not found, return helpful message
  return {
    success: false,
    ide: ide.id,
    message: `${ide.name} executable could not be found in PATH or standard installation locations. Please ensure it is installed or its CLI is added to PATH.`,
  };
}
