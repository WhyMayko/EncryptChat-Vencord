import { definePluginSettings } from "@api/Settings";
import { OptionType } from "@utils/types";

import { UniversalSettingsView } from "./XorModal";

export const settings = definePluginSettings({
    universalSettings: {
        type: OptionType.COMPONENT,
        description: "Encrypt Chat Settings",
        component: UniversalSettingsView
    },
    method: {
        type: OptionType.SELECT,
        description: "Encryption and Obfuscation Method",
        hidden: () => true,
        options: [
            { label: "Inspecttor", value: "inspecttor", default: true },
            { label: "PGP", value: "pgp" },
            { label: "Discord", value: "discord" },
            { label: "Funny Texts", value: "funny" },
            { label: "XOR Cipher", value: "xor" },
            { label: "Vigenère", value: "vigenere" },
            { label: "Morse Code", value: "morse" },
            { label: "Binary", value: "binary" },
            { label: "Hexadecimal", value: "hex" },
            { label: "Base64", value: "base64" },
            { label: "ROT13", value: "rot13" }
        ] as const
    },
    inspecttorMode: {
        type: OptionType.SELECT,
        description: "Inspecttor Mode",
        hidden: () => true,
        options: [
            { label: "Server", value: "server", default: true },
            { label: "Offline", value: "offline" }
        ] as const
    },
    inspecttorAccessKey: {
        type: OptionType.STRING,
        description: "Server Access Key",
        hidden: () => true,
        default: ""
    },
    secretWord: {
        type: OptionType.STRING,
        description: "Secret Word / Passphrase",
        hidden: () => true,
        default: ""
    },
    discordCategory: {
        type: OptionType.SELECT,
        description: "Discord Style Category",
        hidden: () => true,
        options: [
            { label: "All Styles", value: "all", default: true },
            { label: "Color", value: "color" },
            { label: "Language Code", value: "code" },
            { label: "Text Formatting", value: "text" },
            { label: "Size & Headers", value: "size" }
        ] as const
    },
    discordStyle: {
        type: OptionType.SELECT,
        description: "Discord Style",
        hidden: () => true,
        options: [
            { label: "Lua Codeblock (Color)", value: "lua", default: true },
            { label: "Diff Green (+ green lines)", value: "diff-green" },
            { label: "Diff Red (- red lines)", value: "diff-red" },
            { label: "ANSI Green", value: "ansi-green" },
            { label: "ANSI Red", value: "ansi-red" },
            { label: "ANSI Cyan", value: "ansi-cyan" },
            { label: "ANSI Blue", value: "ansi-blue" },
            { label: "ANSI Yellow", value: "ansi-yellow" },
            { label: "ANSI Pink", value: "ansi-pink" },
            { label: "ANSI White Bold", value: "ansi-white" },
            { label: "ANSI Gray", value: "ansi-gray" },
            { label: "Python Codeblock", value: "python" },
            { label: "JavaScript Codeblock", value: "javascript" },
            { label: "TypeScript Codeblock", value: "typescript" },
            { label: "JSON Codeblock", value: "json" },
            { label: "CSS Codeblock", value: "css" },
            { label: "HTML / XML Codeblock", value: "xml" },
            { label: "C++ Codeblock", value: "cpp" },
            { label: "SQL Codeblock", value: "sql" },
            { label: "YAML Codeblock", value: "yaml" },
            { label: "Bash Codeblock", value: "bash" },
            { label: "Markdown Codeblock", value: "markdown" },
            { label: "Plain Box (Copyable)", value: "box" },
            { label: "Spoiler Box (Hidden Codeblock)", value: "spoiler-box" },
            { label: "Spoiler (||hidden||)", value: "spoiler" },
            { label: "Inline Code (`text`)", value: "inline-code" },
            { label: "Quote (> blockquote)", value: "quote" },
            { label: "Multiline Quote (>>> text)", value: "multiquote" },
            { label: "Header 1 (# title)", value: "h1" },
            { label: "Header 2 (## title)", value: "h2" },
            { label: "Header 3 (### title)", value: "h3" },
            { label: "Subtext (-# small text)", value: "subtext" },
            { label: "Bullet List (- item)", value: "list" },
            { label: "Bold (**text**)", value: "bold" },
            { label: "Italic (*text*)", value: "italic" },
            { label: "Bold Italic (***text***)", value: "bold-italic" },
            { label: "Underline (__text__)", value: "underline" },
            { label: "Strikethrough (~~text~~)", value: "strikethrough" }
        ] as const
    },
    funnyStyle: {
        type: OptionType.SELECT,
        description: "Funny Text Style",
        hidden: () => true,
        options: [
            { label: "Superscript Top", value: "superscript", default: true },
            { label: "Subscript Bottom", value: "subscript" },
            { label: "Alternating Caps", value: "alternating" },
            { label: "Upside Down", value: "upsidedown" },
            { label: "Bubble Text", value: "bubble" },
            { label: "Reverse", value: "reverse" },
            { label: "Small Caps", value: "smallcaps" },
            { label: "Fullwidth", value: "fullwidth" },
            { label: "Leet Speak", value: "leet" },
            { label: "Zalgo Glitch", value: "zalgo" },
            { label: "Strikethrough", value: "strikethrough" },
            { label: "Underline", value: "underline" }
        ] as const
    },
    xorFormat: {
        type: OptionType.SELECT,
        description: "XOR Format",
        hidden: () => true,
        options: [
            { label: "Binary", value: "binary", default: true },
            { label: "Hexadecimal", value: "hex" },
            { label: "Base64", value: "base64" }
        ] as const
    },
    includeMethodPrefix: {
        type: OptionType.BOOLEAN,
        description: "Include Method Tag in Messages",
        hidden: () => true,
        default: false
    },
    autoEncrypt: {
        type: OptionType.BOOLEAN,
        description: "Auto-Encrypt Outgoing Messages",
        hidden: () => true,
        default: false
    },
    autoDecrypt: {
        type: OptionType.BOOLEAN,
        description: "Auto-Decrypt Incoming Messages",
        hidden: () => true,
        default: true
    }
});
