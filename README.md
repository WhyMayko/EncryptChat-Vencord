# 🔒 Encrypt Chat — Vencord Plugin

> **Military-grade message encryption & fun typography for Discord.**  
> Made with 💜 by **[@whymayko](https://github.com/WhyMayko)**.

[![Vencord](https://img.shields.io/badge/Vencord-Plugin-blueviolet?style=for-the-badge)](https://vencord.dev)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)
[![Discord](https://img.shields.io/badge/Discord-@whymayko-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.com)

---

## ⚡ Quick 1-Click Install (PowerShell)

Open **PowerShell** on Windows and run:

```powershell
iwr -useb https://raw.githubusercontent.com/WhyMayko/Encrypt-Chat-Vencord/main/install.ps1 | iex
```

That's it! Restart Discord (`Ctrl + R`) and enjoy.

---

## ✨ Features

- 🔐 **Inspecttor Compatibility (100% Interoperable)**:
  - Supports both **Server Mode** (live seed negotiation + native Electron IPC bypass) and **Offline Mode** (zero-network PBKDF2 + AES-256-GCM + Deflate).
  - Seamless two-way decryption with official Inspecttor users.
- 🛡️ **OpenPGP Industry Standard**: Full public/private armored PGP encryption.
- ⚡ **Ultra-Fast Performance**: Built-in in-memory LRU cache guarantees **0.001ms instantaneous decrypts** with silky 60+ FPS scrolling.
- 📋 **1-Click Copy**: Convenient `Copy` button directly in the decrypted accessory box.
- 🎨 **Adaptive Visual Badges**:
  - **✅ Decrypted Messages**: Vibrant translucent green pill (`#23a55a`) with an open lock icon and crisp white text.
  - **❌ Failed Messages**: Translucent red pill (`#fa777c`) with a closed lock icon.
- 🎭 **12 Funny Text Typography Styles**:
  - Superscript, Subscript, Alternating Caps, Upside Down, Bubble Text, Reverse, Small Caps, Fullwidth, Leet Speak, Zalgo Glitch, Strikethrough, Underline.
- 🔢 **Classic Ciphers**: XOR Cipher (Binary/Hex/Base64), Vigenère, Morse Code, Plain Binary, Hex, Base64, and ROT13.

---

## 🎮 Controls & Shortcuts

| Action | Shortcut / Trigger |
|---|---|
| **Toggle Encryption** | Left-Click Lock Icon in Chat Bar |
| **Open Settings & Playground** | Right-Click Lock Icon in Chat Bar |
| **Manual Decrypt** | Right-Click any message → `Decrypt Message` or click the lock on message popover |
| **Copy Decrypted Text** | Click `Copy` next to `Dismiss` on the decrypted card |

---

## 👨‍💻 Author

Created and maintained with love by **Mayko** ([@whymayko](https://github.com/WhyMayko)).  
Discord: `@whymayko`
