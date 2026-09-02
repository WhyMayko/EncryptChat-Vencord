/*
 * Encrypt Chat - Settings Definition
 */

import { definePluginSettings } from "@api/Settings";
import { Button } from "@components/Button";
import { OptionType } from "@utils/types";

import { openXorModal } from "./XorModal";

export const settings = definePluginSettings({
    method: {
        type: OptionType.SELECT,
        description: "Encryption and Obfuscation Method",
        options: [
            { label: "Inspecttor Server", value: "inspecttor_server", default: true },
            { label: "Inspecttor Offline", value: "inspecttor_offline" },
            { label: "PGP", value: "pgp" },
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
    funnyStyle: {
        type: OptionType.SELECT,
        description: "Funny Text Style",
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
    secretWord: {
        type: OptionType.STRING,
        description: "Secret Word / Passphrase",
        default: ""
    },
    inspecttorAccessKey: {
        type: OptionType.STRING,
        description: "Inspecttor Server Access Key",
        default: ""
    },
    xorFormat: {
        type: OptionType.SELECT,
        description: "XOR Output Format",
        options: [
            { label: "Binary", value: "binary", default: true },
            { label: "Hexadecimal", value: "hex" },
            { label: "Base64", value: "base64" }
        ] as const
    },
    includeMethodPrefix: {
        type: OptionType.BOOLEAN,
        description: "Include method prefix tags in sent messages",
        default: false
    },
    autoEncrypt: {
        type: OptionType.BOOLEAN,
        description: "Automatically encrypt chat messages before sending",
        default: false
    },
    autoDecrypt: {
        type: OptionType.BOOLEAN,
        description: "Automatically decrypt and translate incoming messages",
        default: true
    },
    openSettingsModal: {
        type: OptionType.COMPONENT,
        component: () => (
            <Button onClick={openXorModal}>
                Open Encryption Settings & Live Playground
            </Button>
        )
    }
});
