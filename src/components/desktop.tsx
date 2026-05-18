"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Folder, 
  Settings, 
  FileText, 
  X, 
  Minus, 
  Square,
  Lock,
  Wifi,
  Battery,
  ChevronRight,
  Terminal,
  Image as ImageIcon,
  File as FileIcon,
  MousePointer2,
  Monitor,
  Search,
  ChevronLeft,
  RotateCcw,
  Menu
} from "lucide-react";

// Types
type WindowType = "notes" | "files" | "settings" | "terminal";

interface WindowState {
  id: string;
  type: WindowType;
  title: string;
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
}

interface DesktopPost {
  title?: string;
  slug?: string;
  content_html?: string;
  published_at?: string | null;
  excerpt?: string | null;
}

interface DesktopProps {
  posts: DesktopPost[];
  featured?: DesktopPost[];
}

export default function Desktop({ posts }: DesktopProps) {
  const [windows, setWindows] = useState<WindowState[]>([]);
  const [activeWindow, setActiveWindow] = useState<string | null>(null);
  const [highestZ, setHighestZ] = useState(10);
  const [time, setTime] = useState("");
  const [showPopup, setShowPopup] = useState(true);
  
  // Start Menu State
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Settings State
  const [theme, setTheme] = useState("dark");
  const [textSize, setTextSize] = useState("normal");
  
  // Settings Auth
  const [isSettingsUnlocked, setIsSettingsUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [settingsTab, setSettingsTab] = useState("appearance");
  const [lastTouch, setLastTouch] = useState({ x: 0, y: 0 });
  
  // Files/Notes State
  const [currentPath] = useState("/home/mint/Documents");
  const [selectedPostSlug, setSelectedPostSlug] = useState<string | null>(null);

  // Terminal State
  const [terminalHistory, setTerminalHistory] = useState<{type: 'input'|'output'|'error', content: string}[]>([
    { type: 'output', content: 'Linux Mint 21.2 Cinnamon 64-bit' },
    { type: 'output', content: 'Type "help" to see available commands.' }
  ]);
  const [terminalInput, setTerminalInput] = useState("");
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Context Menu State
  const [contextMenu, setContextMenu] = useState({ isOpen: false, x: 0, y: 0, type: 'desktop' });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [terminalHistory]);

  const isLight = theme === 'light';

  // Helper colors
  const c = {
    bg: isLight ? 'bg-[#f0f0f0]' : 'bg-[#2C2C2C]',
    bgSecondary: isLight ? 'bg-[#ffffff]' : 'bg-[#222222]',
    bgPanel: isLight ? 'bg-[#e0e0e0]' : 'bg-[#1a1a1a]',
    bgTitlebar: isLight ? 'bg-[#d6d6d6]' : 'bg-[#2b2b2b]',
    bgActiveTitlebar: isLight ? 'bg-[#c0c0c0]' : 'bg-[#353535]',
    bgHover: isLight ? 'hover:bg-[#e0e0e0]' : 'hover:bg-[#353535]',
    text: isLight ? 'text-[#222222]' : 'text-[#E0E0E0]',
    textMuted: isLight ? 'text-[#666666]' : 'text-[#999999]',
    border: isLight ? 'border-[#cccccc]' : 'border-[#1a1a1a]',
    borderLight: isLight ? 'border-[#dddddd]' : 'border-[#353535]',
    accent: '#87C095'
  };

  const openWindow = (type: WindowType, title: string) => {
    setIsMenuOpen(false);
    const existing = windows.find(w => w.type === type);
    if (existing) {
      bringToFront(existing.id);
      if (existing.isMinimized) {
        setWindows(windows.map(w => w.id === existing.id ? { ...w, isMinimized: false } : w));
      }
      return;
    }

    const newWindow: WindowState = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      title,
      isOpen: true,
      isMinimized: false,
      isMaximized: false,
      zIndex: highestZ + 1,
    };
    
    setHighestZ(prev => prev + 1);
    setWindows([...windows, newWindow]);
    setActiveWindow(newWindow.id);
  };

  const closeWindow = (id: string) => {
    setWindows(windows.filter(w => w.id !== id));
    if (activeWindow === id) setActiveWindow(null);
  };

  const minimizeWindow = (id: string) => {
    setWindows(windows.map(w => w.id === id ? { ...w, isMinimized: true } : w));
    if (activeWindow === id) setActiveWindow(null);
  };

  const toggleMaximize = (id: string) => {
    setWindows(windows.map(w => w.id === id ? { ...w, isMaximized: !w.isMaximized } : w));
  };

  const bringToFront = (id: string) => {
    setHighestZ(prev => prev + 1);
    setWindows(windows.map(w => w.id === id ? { ...w, zIndex: highestZ + 1 } : w));
    setActiveWindow(id);
  };

  const handleSettingsAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === "admin") {
      setIsSettingsUnlocked(true);
    } else {
      alert("Authentication failed.");
    }
    setPasswordInput("");
  };

  const handleContextMenu = (e: React.MouseEvent, type: 'desktop' | 'taskbar' = 'desktop') => {
    e.preventDefault();
    e.stopPropagation();
    setIsMenuOpen(false);
    
    let x = e.clientX;
    let y = e.clientY;
    
    // Fallback for mobile where clientX/Y might be 0 on context menu trigger
    if (x === 0 && y === 0) {
      x = lastTouch.x;
      y = lastTouch.y;
    }

    if (type === 'taskbar') y = y - 100;
    
    // Ensure menu doesn't go off screen
    if (x > window.innerWidth - 200) x = window.innerWidth - 200;
    if (y > window.innerHeight - 200) y = window.innerHeight - 200;

    setContextMenu({ isOpen: true, x, y, type });
  };

  const hideContextMenu = () => {
    if (contextMenu.isOpen) {
      setContextMenu({ ...contextMenu, isOpen: false });
    }
    if (isMenuOpen) {
      setIsMenuOpen(false);
    }
  };

  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminalInput.trim()) return;
    
    const cmd = terminalInput.trim().toLowerCase();
    const newHistory = [...terminalHistory, { type: 'input' as const, content: `mint@pc:~$ ${terminalInput}` }];
    
    if (cmd === 'clear') {
      setTerminalHistory([]);
      setTerminalInput("");
      return;
    } else if (cmd === 'ls') {
      newHistory.push({ type: 'output', content: 'Desktop  Documents  Downloads  Music  Pictures  Public  Templates  Videos' });
    } else if (cmd === 'whoami') {
      newHistory.push({ type: 'output', content: 'mint' });
    } else if (cmd === 'pwd') {
      newHistory.push({ type: 'output', content: '/home/mint' });
    } else if (cmd === 'date') {
      newHistory.push({ type: 'output', content: new Date().toString() });
    } else if (cmd === 'help') {
      newHistory.push({ type: 'output', content: 'Available commands: ls, pwd, whoami, date, clear, sudo, apt, neofetch, echo, cat, top' });
    } else if (cmd.startsWith('sudo')) {
      newHistory.push({ type: 'error', content: '[sudo] password for mint: \nSorry, try again.\nsudo: 3 incorrect password attempts' });
    } else if (cmd.startsWith('echo ')) {
      newHistory.push({ type: 'output', content: cmd.slice(5) });
    } else if (cmd.startsWith('cat ')) {
      newHistory.push({ type: 'error', content: `cat: ${cmd.slice(4)}: Permission denied` });
    } else if (cmd === 'top') {
      newHistory.push({ type: 'output', content: 'PID USER PR NI VIRT RES SHR S %CPU %MEM TIME+ COMMAND\n  1 mint 20  0 166m 12m  8m S  0.0  0.1  0:01.01 systemd' });
    } else if (cmd.startsWith('apt')) {
      newHistory.push({ type: 'error', content: 'E: Could not open lock file /var/lib/dpkg/lock-frontend - open (13: Permission denied)' });
    } else if (cmd === 'neofetch') {
      newHistory.push({ type: 'output', content: 'MMMMMMMMMMMMMMMMMMMMMMMMMmds+.\nMMm----::-://////////////oymNMd+\nMMd      /++                -sNMd:\nMMNso/`  dMM    `.::-. .-::.` .hMN:\nddddMMh  dMM   :hNMNMd: hNMNMd: `NMm\n    NMm  dMM  .mMMo-s- `mMMo-s-  pMM\n    NMm  dMM  -MMy       MMy      pMM\n    NMm  dMM  -MMy       MMy      pMM\n\nOS: Linux Mint 21.2 x86_64\nKernel: 5.15.0-76-generic\nUptime: 2 days, 4 hours\nPackages: 2133 (dpkg)\nShell: bash 5.1.16\nDE: Cinnamon 5.8.4\nWM: Muffin' });
    } else if (cmd.startsWith('rm -rf')) {
      newHistory.push({ type: 'error', content: "rm: it is dangerous to operate recursively on '/'\nrm: use --no-preserve-root to override this failsafe" });
    } else {
      const funnies = [
        `bash: ${cmd}: command not found. Have you tried turning it off and on again? 🔌`,
        `bash: ${cmd}: command not found. I'm just a dummy terminal, not your personal sysadmin! 🐧`,
        `bash: ${cmd}: command not found. Maybe try typing "help"? 🤷‍♂️`,
        `bash: ${cmd}: command not found. Are you sure you know what you are doing? 🤨`,
      ];
      newHistory.push({ type: 'error', content: funnies[Math.floor(Math.random() * funnies.length)] });
    }
    
    setTerminalHistory(newHistory);
    setTerminalInput("");
  };

  const renderWindowContent = (win: WindowState) => {
    switch (win.type) {
      case "terminal":
        return (
          <div className="flex flex-col h-full bg-[#1e1e1e] text-[#cccccc] font-mono text-sm p-2 overflow-hidden" onClick={() => document.getElementById('terminal-input')?.focus()}>
            <div className="flex-1 overflow-y-auto pb-2 whitespace-pre-wrap">
              {terminalHistory.map((line, i) => (
                <div key={i} className={`mb-1 ${line.type === 'error' ? 'text-red-400' : line.type === 'input' ? 'text-white' : ''}`}>
                  {line.content}
                </div>
              ))}
              <form onSubmit={handleTerminalSubmit} className="flex">
                <span className="text-green-400 mr-2">mint@pc:~$</span>
                <input 
                  id="terminal-input"
                  type="text" 
                  value={terminalInput}
                  onChange={e => setTerminalInput(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-white border-none focus:ring-0"
                  autoFocus
                  autoComplete="off"
                />
              </form>
              <div ref={terminalEndRef} />
            </div>
          </div>
        );

      case "notes":
        return (
          <div className={`flex h-full ${c.bg} ${c.text}`}>
            {/* Sidebar */}
            <div className={`w-1/3 border-r ${c.border} ${c.bgSecondary} overflow-y-auto`}>
              <div className="flex flex-col py-2">
                {posts.map(post => (
                  <button 
                    key={post.slug}
                    onClick={() => setSelectedPostSlug(post.slug || null)}
                    className={`px-4 py-3 text-left border-b ${c.border} transition-colors ${selectedPostSlug === post.slug ? `${isLight ? 'bg-[#e0e0e0]' : 'bg-[#353535]'} border-l-4 border-l-[#87C095]` : `${c.bgHover} border-l-4 border-l-transparent`}`}
                  >
                    <h4 className="font-semibold text-sm truncate">{post.title || "Untitled"}</h4>
                    <p className={`text-xs ${c.textMuted} mt-1`}>{post.published_at ? new Date(post.published_at).toLocaleDateString() : 'Draft'}</p>
                  </button>
                ))}
                {posts.length === 0 && (
                  <div className={`p-4 text-sm ${c.textMuted}`}>No documents found.</div>
                )}
              </div>
            </div>
            {/* Content Area */}
            <div className={`flex-1 p-8 overflow-y-auto ${isLight ? 'bg-white' : 'bg-[#fafafa]'} text-[#333333]`}>
              <div className="max-w-2xl mx-auto">
                <h1 className="text-3xl font-bold mb-2">
                  {selectedPostSlug ? posts.find(p => p.slug === selectedPostSlug)?.title : (posts[0]?.title || "Welcome to Notes")}
                </h1>
                <div className="text-sm text-[#777777] mb-8 pb-4 border-b border-[#e0e0e0]">
                  {selectedPostSlug ? `Published on ${new Date(posts.find(p => p.slug === selectedPostSlug)?.published_at || Date.now()).toLocaleDateString()}` : "Select a document from the left."}
                </div>
                <div className="prose prose-slate max-w-none">
                  {selectedPostSlug ? (
                     <div dangerouslySetInnerHTML={{ __html: posts.find(p => p.slug === selectedPostSlug)?.content_html || "<p>No content</p>" }} />
                  ) : (
                    <p>Linux Mint is a community-driven Linux distribution based on Ubuntu, bundled with a variety of free and open-source applications.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case "files":
        return (
          <div className={`flex flex-col h-full ${c.bg} ${c.text}`}>
            <div className={`flex items-center px-2 py-2 border-b ${c.border} ${isLight ? 'bg-[#f5f5f5]' : 'bg-[#353535]'} gap-2 shadow-sm`}>
              <button className={`p-1.5 ${c.bgHover} rounded ${c.text}`}><ChevronLeft className="w-4 h-4" /></button>
              <button className={`p-1.5 ${c.bgHover} rounded ${c.text}`}><ChevronRight className="w-4 h-4" /></button>
              <div className={`flex-1 px-3 py-1.5 ${c.bg} rounded border ${c.border} text-sm ${c.text} flex items-center gap-2`}>
                <Folder size={14} className="text-[#87C095]" />
                {currentPath}
              </div>
            </div>
            <div className={`flex-1 p-4 grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-4 overflow-y-auto content-start ${c.bgSecondary}`}>
              {[1,2,3,4,5,6,7,8].map(i => (
                <div key={i} className={`flex flex-col items-center gap-2 p-3 ${c.bgHover} rounded cursor-pointer transition-colors group`}>
                  <div className="w-12 h-12 flex items-center justify-center text-[#87C095]">
                    {i % 3 === 0 ? <ImageIcon size={36} className="fill-current opacity-80 group-hover:opacity-100" /> : <FileIcon size={36} className="fill-current opacity-80 group-hover:opacity-100" />}
                  </div>
                  <span className={`text-xs text-center break-words w-full ${c.text}`}>archive_{i}.png</span>
                </div>
              ))}
            </div>
          </div>
        );

      case "settings":
        if (!isSettingsUnlocked) {
          return (
            <div className={`flex items-center justify-center h-full ${c.bg}`}>
              <form onSubmit={handleSettingsAuth} className={`${c.bgSecondary} p-8 rounded border ${c.border} shadow-md w-80 text-center`}>
                <div className={`w-16 h-16 ${c.bgPanel} rounded-full flex items-center justify-center mx-auto mb-6 text-[#87C095]`}>
                  <Lock size={32} />
                </div>
                <h3 className={`text-lg font-bold ${c.text} mb-2`}>Authentication</h3>
                <p className={`text-sm ${c.textMuted} mb-6`}>Administrator privileges required.</p>
                <input 
                  type="password" 
                  value={passwordInput}
                  onChange={e => setPasswordInput(e.target.value)}
                  placeholder="Password (admin)"
                  className={`w-full ${c.bg} border ${c.borderLight} rounded px-3 py-2 ${c.text} mb-4 focus:outline-none focus:border-[#87C095] focus:ring-1 focus:ring-[#87C095]`}
                  autoFocus
                />
                <button type="submit" className="w-full bg-[#87C095] hover:bg-[#7AB088] text-white font-bold py-2 rounded transition-colors shadow-sm">
                  Authenticate
                </button>
              </form>
            </div>
          );
        }
        return (
          <div className={`flex h-full ${c.bg} ${c.text}`}>
            {/* Settings Sidebar */}
            <div className={`w-48 border-r ${c.border} ${c.bgSecondary} py-4`}>
              <button 
                onClick={() => setSettingsTab('appearance')}
                className={`w-full text-left px-4 py-2 text-sm ${settingsTab === 'appearance' ? `bg-[#87C095]/20 border-r-2 border-[#87C095] ${c.text}` : `${c.textMuted} ${c.bgHover}`}`}
              >
                Appearance
              </button>
              <button 
                onClick={() => setSettingsTab('system')}
                className={`w-full text-left px-4 py-2 text-sm ${settingsTab === 'system' ? `bg-[#87C095]/20 border-r-2 border-[#87C095] ${c.text}` : `${c.textMuted} ${c.bgHover}`}`}
              >
                System Info
              </button>
            </div>
            {/* Settings Content */}
            <div className="flex-1 p-8 overflow-y-auto">
              <h2 className={`text-2xl font-bold mb-8 ${c.text} border-b ${c.border} pb-4`}>
                {settingsTab === 'appearance' ? 'Appearance Settings' : 'System Information'}
              </h2>
              
              {settingsTab === 'appearance' && (
                <div className="space-y-6 max-w-lg">
                  <div className={`${c.bgSecondary} p-5 rounded border ${c.borderLight}`}>
                    <h3 className={`text-sm font-bold uppercase ${c.textMuted} mb-4`}>Theme</h3>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Desktop Mode</span>
                      <div className={`flex ${c.bgPanel} rounded p-1 border ${c.border}`}>
                        <button 
                          onClick={() => setTheme("light")}
                          className={`px-4 py-1.5 text-sm rounded ${isLight ? 'bg-white text-black shadow-sm' : `text-[#999999] hover:text-[#E0E0E0]`}`}
                        >
                          Light
                        </button>
                        <button 
                          onClick={() => setTheme("dark")}
                          className={`px-4 py-1.5 text-sm rounded ${!isLight ? 'bg-[#353535] text-white shadow-sm' : `text-[#666666] hover:text-black`}`}
                        >
                          Dark
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className={`${c.bgSecondary} p-5 rounded border ${c.borderLight}`}>
                    <h3 className={`text-sm font-bold uppercase ${c.textMuted} mb-4`}>Typography</h3>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Text Size</span>
                      <select 
                        value={textSize}
                        onChange={(e) => setTextSize(e.target.value)}
                        className={`${c.bgPanel} border ${c.border} rounded px-3 py-1.5 text-sm ${c.text} focus:outline-none focus:border-[#87C095]`}
                      >
                        <option value="small">Small</option>
                        <option value="normal">Normal</option>
                        <option value="large">Large</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {settingsTab === 'system' && (
                <div className={`${c.bgSecondary} p-5 rounded border ${c.borderLight} max-w-lg`}>
                  <div className={`text-sm ${c.text} space-y-3`}>
                    <div className={`flex justify-between border-b ${c.border} pb-2`}><span className={c.textMuted}>OS:</span> <span>Linux Mint 21.2 (Dummy)</span></div>
                    <div className={`flex justify-between border-b ${c.border} pb-2`}><span className={c.textMuted}>Kernel:</span> <span>5.15.0-76-generic</span></div>
                    <div className={`flex justify-between border-b ${c.border} pb-2`}><span className={c.textMuted}>DE:</span> <span>Cinnamon</span></div>
                    <div className={`flex justify-between pb-1`}><span className={c.textMuted}>WM:</span> <span>Muffin</span></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div 
      className={`fixed inset-0 overflow-hidden font-sans select-none ${isLight ? 'bg-gray-300' : 'bg-[#2b2b2b]'}`} 
      style={{ fontSize: textSize === 'small' ? '14px' : textSize === 'large' ? '18px' : '16px' }}
      onClick={hideContextMenu}
      onContextMenu={(e) => handleContextMenu(e, 'desktop')}
      onTouchStart={(e) => {
        if (e.touches.length > 0) {
          setLastTouch({ x: e.touches[0].clientX, y: e.touches[0].clientY });
        }
      }}
    >
      {/* Background Wallpaper */}
      <div className="absolute inset-0 z-0 bg-[#2f343f]">
        {/* Simple elegant noise/gradient typical of default mint dark themes */}
        <div className={`absolute inset-0 bg-gradient-to-br ${isLight ? 'from-[#a1c4b5] to-[#c2d6cc]' : 'from-[#3b4252] to-[#2e3440]'} opacity-100`} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-5 pointer-events-none">
           <Monitor size={300} />
        </div>
      </div>

      {/* Context Menu */}
      <AnimatePresence>
        {contextMenu.isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className={`fixed z-[100] ${isLight ? 'bg-white border-gray-300' : 'bg-[#222222] border-[#111111]'} shadow-xl rounded py-1 min-w-[200px]`}
            style={{ top: contextMenu.y, left: contextMenu.x }}
          >
            {contextMenu.type === 'desktop' ? (
              <>
                <div className={`px-4 py-2 text-sm ${c.text} hover:bg-[#87C095] hover:text-white cursor-pointer flex items-center gap-2`} onClick={() => openWindow("terminal", "Terminal")}>
                  <Terminal size={14} /> Open Terminal Here
                </div>
                <div className={`px-4 py-2 text-sm ${c.text} hover:bg-[#87C095] hover:text-white cursor-pointer flex items-center gap-2 border-b ${c.border}`} onClick={() => openWindow("settings", "System Settings")}>
                  <Settings size={14} /> System Settings
                </div>
              </>
            ) : (
              <>
                <div className={`px-4 py-2 text-sm ${c.text} hover:bg-[#87C095] hover:text-white cursor-pointer flex items-center gap-2`} onClick={() => setIsMenuOpen(true)}>
                  <Menu size={14} /> Open Menu
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Icons */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-4 w-24">
        <button 
          onDoubleClick={() => openWindow("files", "Home")}
          onClick={(e) => { e.stopPropagation(); openWindow("files", "Home"); }}
          className="flex flex-col items-center gap-1 p-2 rounded hover:bg-black/10 border border-transparent hover:border-black/5 transition-colors group"
        >
          <Folder className="text-[#87C095] fill-current opacity-90 group-hover:opacity-100 drop-shadow-md" size={42} />
          <span className={`text-sm font-medium ${isLight ? 'text-gray-800' : 'text-white shadow-black drop-shadow-md'} text-center`}>Home</span>
        </button>

        <button 
          onDoubleClick={() => openWindow("notes", "Notes")}
          onClick={(e) => { e.stopPropagation(); openWindow("notes", "Notes"); }}
          className="flex flex-col items-center gap-1 p-2 rounded hover:bg-black/10 border border-transparent hover:border-black/5 transition-colors group"
        >
          <FileText className="text-[#999999] fill-current opacity-90 group-hover:opacity-100 drop-shadow-md" size={42} />
          <span className={`text-sm font-medium ${isLight ? 'text-gray-800' : 'text-white shadow-black drop-shadow-md'} text-center`}>Notes</span>
        </button>
      </div>

      {/* Windows Area */}
      <div className="absolute inset-0 z-20 pointer-events-none pb-10">
        {windows.map(win => {
          if (win.isMinimized) return null;
          return (
            <motion.div
              key={win.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={win.isMaximized 
                ? { opacity: 1, scale: 1, x: 0, y: 0 } 
                : { opacity: 1, scale: 1 }
              }
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              drag={!win.isMaximized}
              dragMomentum={false}
              dragConstraints={{ left: 0, right: window.innerWidth - 300, top: 0, bottom: window.innerHeight - 100 }}
              onPointerDown={(e) => { e.stopPropagation(); bringToFront(win.id); hideContextMenu(); setIsMenuOpen(false); }}
              style={win.isMaximized 
                ? { zIndex: win.zIndex, top: 0, left: 0, width: '100%', height: 'calc(100% - 40px)', position: 'absolute' } 
                : { zIndex: win.zIndex, top: '10vh', left: '10vw', width: '80vw', height: '70vh', maxWidth: 900, maxHeight: 650, minWidth: 320, minHeight: 400, position: 'absolute' }
              }
              className={`pointer-events-auto flex flex-col ${c.bg} rounded-t shadow-2xl border ${c.border} overflow-hidden ${activeWindow === win.id ? (isLight ? 'ring-1 ring-gray-400 shadow-[0_5px_30px_rgba(0,0,0,0.2)]' : 'ring-1 ring-[#111111] shadow-[0_5px_30px_rgba(0,0,0,0.5)]') : 'shadow-[0_5px_20px_rgba(0,0,0,0.3)] opacity-95'}`}
            >
              {/* Window Header */}
              <div 
                className={`h-9 ${activeWindow === win.id ? c.bgActiveTitlebar : c.bgTitlebar} flex items-center justify-between px-3 cursor-grab active:cursor-grabbing border-b ${c.borderLight}`}
              >
                <div className={`flex items-center gap-2 ${c.text} text-sm font-semibold`}>
                  {win.type === 'notes' && <FileText size={14} className={c.textMuted} />}
                  {win.type === 'files' && <Folder size={14} className="text-[#87C095]" />}
                  {win.type === 'settings' && <Settings size={14} className={c.textMuted} />}
                  {win.type === 'terminal' && <Terminal size={14} className={c.textMuted} />}
                  {win.title}
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={(e) => { e.stopPropagation(); minimizeWindow(win.id); }}
                    className={`w-8 h-6 flex items-center justify-center ${isLight ? 'hover:bg-gray-300' : 'hover:bg-[#444444]'} rounded-sm ${c.text}`}
                  >
                    <Minus size={14} />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); toggleMaximize(win.id); }}
                    className={`w-8 h-6 flex items-center justify-center ${isLight ? 'hover:bg-gray-300' : 'hover:bg-[#444444]'} rounded-sm ${c.text}`}
                  >
                    <Square size={12} />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); closeWindow(win.id); }}
                    className={`w-8 h-6 flex items-center justify-center hover:bg-[#c0392b] hover:text-white rounded-sm ${c.text}`}
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
              
              {/* Window Content */}
              <div className="flex-1 overflow-hidden" onClick={hideContextMenu}>
                {renderWindowContent(win)}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Start Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.15 }}
            className={`fixed bottom-10 left-0 z-[70] w-[400px] h-[500px] ${c.bg} border border-[#111111] rounded-tr-lg shadow-[5px_-5px_20px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden pointer-events-auto`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Bar */}
            <div className={`p-4 border-b ${c.border} ${c.bgSecondary}`}>
              <div className={`flex items-center ${c.bgPanel} rounded px-3 py-2 border ${c.borderLight}`}>
                <Search size={16} className={c.textMuted} />
                <input type="text" placeholder="Search..." className={`ml-2 bg-transparent outline-none ${c.text} w-full text-sm`} />
              </div>
            </div>
            
            <div className="flex flex-1 overflow-hidden">
              {/* Categories */}
              <div className={`w-1/3 border-r ${c.border} ${c.bgSecondary} p-2 flex flex-col gap-1`}>
                <button className={`p-2 text-left text-sm ${c.text} bg-[#87C095]/20 rounded font-medium`}>All Applications</button>
                <button className={`p-2 text-left text-sm ${c.textMuted} ${c.bgHover} rounded`}>Accessories</button>
                <button className={`p-2 text-left text-sm ${c.textMuted} ${c.bgHover} rounded`}>System</button>
              </div>
              {/* Apps List */}
              <div className="flex-1 p-2 overflow-y-auto">
                <button onClick={() => openWindow('terminal', 'Terminal')} className={`w-full flex items-center gap-3 p-3 ${c.bgHover} rounded transition-colors`}>
                  <Terminal size={24} className="text-gray-400" />
                  <span className={`text-sm ${c.text}`}>Terminal</span>
                </button>
                <button onClick={() => openWindow('notes', 'Notes')} className={`w-full flex items-center gap-3 p-3 ${c.bgHover} rounded transition-colors`}>
                  <FileText size={24} className="text-[#999999]" />
                  <span className={`text-sm ${c.text}`}>Notes</span>
                </button>
                <button onClick={() => openWindow('files', 'Home')} className={`w-full flex items-center gap-3 p-3 ${c.bgHover} rounded transition-colors`}>
                  <Folder size={24} className="text-[#87C095]" />
                  <span className={`text-sm ${c.text}`}>Files</span>
                </button>
                <button onClick={() => openWindow('settings', 'System Settings')} className={`w-full flex items-center gap-3 p-3 ${c.bgHover} rounded transition-colors`}>
                  <Settings size={24} className="text-gray-400" />
                  <span className={`text-sm ${c.text}`}>System Settings</span>
                </button>
              </div>
            </div>
            
            {/* User/Session Actions */}
            <div className={`p-3 border-t ${c.border} ${c.bgSecondary} flex justify-between items-center`}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#87C095] flex items-center justify-center text-[#1a1a1a] font-bold">M</div>
                <span className={`text-sm font-medium ${c.text}`}>Mint User</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { window.location.href = '/admin'; }} title="Restart (Login as Admin)" className={`p-2 rounded ${c.bgHover} text-red-400`}>
                  <RotateCcw size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Panel (Cinnamon style Taskbar) */}
      <div 
        className="absolute bottom-0 inset-x-0 h-10 bg-[#1a1a1a] z-[80] flex items-center justify-between px-2 text-[#E0E0E0] text-sm shadow-[0_-1px_10px_rgba(0,0,0,0.5)] border-t border-[#111]"
        onClick={(e) => { e.stopPropagation(); hideContextMenu(); }}
        onContextMenu={(e) => handleContextMenu(e, 'taskbar')}
      >
        <div className="flex items-center gap-2 h-full">
          {/* Start Menu Button */}
          <button 
            className={`flex items-center gap-2 px-3 h-full transition-colors group ${isMenuOpen ? 'bg-[#353535]' : 'hover:bg-[#353535]'}`}
            onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); hideContextMenu(); }}
          >
            <div className="w-5 h-5 rounded-full bg-[#87C095] flex items-center justify-center text-[#1a1a1a] group-hover:bg-[#97D0A5]">
              <span className="font-bold text-xs font-serif leading-none">M</span>
            </div>
            <span className="font-medium hidden sm:block">Menu</span>
          </button>
          
          <div className="w-px h-6 bg-[#353535] mx-1"></div>

          {/* Taskbar Windows */}
          <div className="flex gap-1 h-full py-1">
            {windows.map(w => (
              <button 
                key={w.id} 
                onClick={(e) => {
                  e.stopPropagation();
                  if (activeWindow === w.id && !w.isMinimized) {
                    minimizeWindow(w.id);
                  } else {
                    bringToFront(w.id);
                    if (w.isMinimized) {
                      setWindows(windows.map(win => win.id === w.id ? { ...win, isMinimized: false } : win));
                    }
                  }
                }}
                className={`px-3 py-1 flex items-center gap-2 rounded-sm border-b-2 transition-colors ${activeWindow === w.id && !w.isMinimized ? 'bg-[#353535] border-[#87C095] text-white' : 'bg-transparent border-transparent hover:bg-[#2C2C2C] text-[#999999]'}`}
              >
                {w.type === 'terminal' && <Terminal size={14} className={activeWindow === w.id && !w.isMinimized ? 'text-white' : 'text-[#999999]'} />}
                {w.type === 'notes' && <FileText size={14} className={activeWindow === w.id && !w.isMinimized ? 'text-white' : 'text-[#999999]'} />}
                {w.type === 'files' && <Folder size={14} className={activeWindow === w.id && !w.isMinimized ? 'text-[#87C095]' : 'text-[#87C095]'} />}
                {w.type === 'settings' && <Settings size={14} className={activeWindow === w.id && !w.isMinimized ? 'text-white' : 'text-[#999999]'} />}
                <span className="max-w-[100px] truncate hidden sm:block">{w.title}</span>
              </button>
            ))}
          </div>
        </div>
        
        {/* System Tray */}
        <div className="flex items-center gap-4 h-full px-2">
          <div className="flex items-center gap-3 text-[#999999]">
            <MousePointer2 size={14} className="hover:text-white cursor-pointer" />
            <Wifi size={14} className="hover:text-white cursor-pointer" />
            <Battery size={14} className="hover:text-white cursor-pointer" />
          </div>
          <div className="text-sm font-medium hover:text-white cursor-pointer px-2">
            {time || "00:00"}
          </div>
        </div>
      </div>

      {/* Ad/Recent Post Widget Popup (Linux Mint style notification) */}
      <AnimatePresence>
        {showPopup && posts[0] && (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ duration: 0.2 }}
            className={`fixed top-6 right-6 z-50 w-80 ${isLight ? 'bg-white border-gray-300' : 'bg-[#222222] border-[#111111]'} rounded shadow-lg overflow-hidden flex flex-col border`}
          >
            <div className={`px-3 py-2 flex items-center justify-between border-b ${c.border} ${isLight ? 'bg-gray-100' : 'bg-[#1a1a1a]'}`}>
              <div className="flex items-center gap-2">
                <FileText size={14} className="text-[#87C095]" />
                <span className={`text-xs font-semibold ${c.text}`}>New Document</span>
              </div>
              <button onClick={(e) => { e.stopPropagation(); setShowPopup(false); }} className={`${c.textMuted} hover:text-red-500 p-1`}>
                <X size={12} />
              </button>
            </div>
            <div className={`p-4 cursor-pointer ${c.bgHover} transition-colors flex gap-3`} onClick={(e) => { e.stopPropagation(); setSelectedPostSlug(posts[0].slug || null); openWindow("notes", "Notes"); setShowPopup(false); }}>
              <div className="flex-1">
                <h4 className={`font-bold ${c.text} text-sm mb-1 line-clamp-1`}>{posts[0].title}</h4>
                <p className={`text-xs ${c.textMuted} line-clamp-2`}>
                  {posts[0].excerpt || "Click to read the latest document."}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
