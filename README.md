# 🔒 Encrypt Chat - Vencord

> Seamless, real-time message encryption, obfuscation, and funny text translation for Discord via Vencord.

---

## ⚡ Quick Install (One-Line Command)

Open **PowerShell** (Windows) and paste this command:

```powershell
iwr -useb https://raw.githubusercontent.com/WhyMayko/Encrypt-Chat-Vencord/main/install.ps1 | iex
```

*That's it! Discord will automatically restart with Encrypt Chat installed and ready.*

---

## ✨ Features

- 🔒 **10 Complete Encryption & Obfuscation Methods**:
  1. **`Inspecttor`**: AES-GCM 256-bit + Raw Deflate + Base85 *(compatible with inspecttor.xyz)*
  2. **`PGP`**: Industry-standard OpenPGP armored encryption protected by passphrase
  3. **`Funny Texts`**:
     - **Superscript Top** (`ᴴᵉˡˡᵒ ᵂᵒʳˡᵈ ¹²³`)
     - **Subscript Bottom** (`ₕₑₗₗₒ ᵥᵥₒᵣₗᏧ`)
     - **Alternating Caps** (`hElLo WoRlD`)
     - **Upside Down** (`¡plɹoʍ ollǝH`)
     - **Bubble Text** (`Ⓗⓔⓛⓛⓞ Ⓦⓞⓡⓛⓓ ①②③`)
     - **Reverse** (`!dlrow olleH`)
     - **Small Caps** (`ʜᴇʟʟᴏ ᴡᴏʀʟᴅ!`)
     - **Fullwidth** (`Ｈｅｌｌｏ　Ｗｏｒｌｄ`)
     - **Leet Speak** (`H3ll0 W0rld`)
     - **Zalgo Glitch** (`H̟̑́ē̘͘l̞̐̕l̟̆́o̎`)
     - **Strikethrough** (`H̶e̶l̶l̶o̶ ̶W̶o̶r̶l̶d̶`)
     - **Underline** (`H̲e̲l̲l̲o̲ ̲W̲o̲r̲l̲d̲`)
  4. **`XOR Cipher`**: Bitwise XOR encryption with custom Secret Word
  5. **`Vigenère`**: Polyalphabetic substitution cipher
  6. **`Morse Code`**: Telegraphic dots and dashes
  7. **`Binary`**: 8-bit ASCII / UTF-8 binary
  8. **`Hexadecimal`**: Byte hex format
  9. **`Base64`**: Standard Base64
  10. **`ROT13`**: 13-shift substitution

- 🧠 **Instant Auto-Detection**: Click **`Decrypt Message`** on any message and the plugin detects the format and restores the plaintext in 0.001ms.
- ⚡ **Auto-Translate Incoming**: Encrypted or funny text messages automatically decrypt in real-time below the message!
- 🥷 **Invisible Tag-less Mode**: Messages can be sent completely raw without any `[...]` tags.
- 🟢 **Integrated Chat Bar Lock**:
  - **Left Click**: Toggle auto-encrypt on/off (turns green when active).
  - **Right Click**: Open Settings Modal and Live Playground.
- ⚡ **100% Local & Fast**: Zero external network dependencies, no lag, works completely offline.

---

## 🎮 Controls

| Action | Control |
|---|---|
| **Toggle Auto-Encrypt** | Left-Click lock icon in chat bar (turns Green) |
| **Open Settings & Live Playground** | Right-Click lock icon |
| **Decrypt / Read Message** | Automatic with Auto-Translate, or click "Decrypt Message" popover button |
| **Dismiss Decrypted View** | Click "Dismiss" on the decrypted card |

---

## 🛠️ Manual Installation (For Developers)

1. Clone the official [Vendicated/Vencord](https://github.com/Vendicated/Vencord) repository.
2. Copy `src/` into `src/userplugins/encryptChat`.
3. Run `pnpm build`.
4. Copy `dist/` to `%APPDATA%\Vencord\dist`.
5. Restart Discord!
