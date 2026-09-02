# 🔐 Vencord Encryption Chat Plugin

A powerful, all-in-one message obfuscation, encryption, and translation plugin for Discord with multi-method support.

---

## ✨ Features & Encryption Methods

1. 🛡️ **Inspecttor AES-256-GCM (inspecttor.xyz)**:
   - Military-grade encryption with PBKDF2 (310,000 iterations), AES-256-GCM, Deflate compression, and Base85 formatting.
   - 100% mathematically and bit-for-bit compatible with `https://inspecttor.xyz/translator`.
   - Default key: `Iyqz0XO0EceG` (or any custom passphrase).

2. 🔑 **XOR Cipher (with Secret Word)**:
   - Classic XOR with custom Secret Word and output formatting:
     - **Binary** (`01001000 01100101...`)
     - **Hexadecimal** (`48 65 6c...`)
     - **Base64** (`SGVsbG8...`)

3. 📻 **Morse Code**:
   - Encodes text into standard Morse dots and dashes (`... --- ... / .--. .-.. ..- --. .. -.`).
   - Automatically decodes back to clear text.

4. 🤖 **Plain Binary**:
   - Direct 8-bit binary representation (`01001000 01100101...`).

---

## 🟢 Clean UI & Controls

- **Chat Bar Lock Button**:
  - Located on the right side of the chat input box.
  - **Click**: Toggles auto-encryption ON / OFF.
  - When active, the icon illuminates in **Discord Green** (`var(--green-360)`) and outgoing messages are automatically encrypted before being sent!
  - **Shift + Click** or **Right-Click**: Opens the **Encryption Chat Settings & Live Testing Playground**.
- **Message Hover & Context Menu**:
  - Hover on any message to see the **"Decrypt Message"** button on the action bar.
  - Right-click any message ➔ **"Decrypt Message"**.
  - Smart auto-detection identifies whether the message is Inspecttor AES-256, XOR, Morse Code, or Binary and decodes it in-place!
- **In-Line Accessory**:
  - Renders the decoded plaintext cleanly underneath the original message with Markdown support and a *Dismiss* button.
