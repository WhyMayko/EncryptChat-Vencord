import { deflateSync, inflateSync } from "fflate";

const f = new TextEncoder(), m = new TextDecoder("utf-8", { fatal: false });
const BASE85_CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!#$%()*+,-./:;=?@[]^_{}";
const BASE85_LOOKUP = new Int16Array(128).fill(-1);
for (let i = 0; i < BASE85_CHARS.length; i++) BASE85_LOOKUP[BASE85_CHARS.charCodeAt(i)] = i;

function base85Encode(bytes) {
    let result = "";
    for (let i = 0; i < bytes.length; i += 4) {
        const chunkLen = Math.min(4, bytes.length - i);
        let val = 0;
        for (let r = 0; r < 4; r++) val = (val * 256 + (r < chunkLen ? bytes[i + r] : 0)) >>> 0;
        const encodedChars = [0, 0, 0, 0, 0];
        for (let r = 4; r >= 0; r--) { encodedChars[r] = val % 85; val = Math.floor(val / 85); }
        for (let r = 0; r < chunkLen + 1; r++) result += BASE85_CHARS[encodedChars[r]];
    }
    return result;
}

function base85Decode(str) {
    const output = [];
    for (let i = 0; i < str.length; i += 5) {
        const chunkLen = Math.min(5, str.length - i);
        if (chunkLen < 2) return null;
        let val = 0;
        for (let r = 0; r < 5; r++) {
            let charIdx = 84;
            if (r < chunkLen) {
                const charCode = str.charCodeAt(i + r);
                if (charCode >= 128) return null;
                charIdx = BASE85_LOOKUP[charCode];
                if (charIdx < 0) return null;
            }
            val = (val * 85 + charIdx) >>> 0;
        }
        const bytes = [(val >>> 24) & 255, (val >>> 16) & 255, (val >>> 8) & 255, val & 255];
        for (let r = 0; r < chunkLen - 1; r++) output.push(bytes[r]);
    }
    return Uint8Array.from(output);
}

// 1. Inspecttor
async function deriveInspecttorKey(passphrase, salt) {
    const rawKey = await crypto.subtle.importKey("raw", f.encode(passphrase || "galax"), "PBKDF2", false, ["deriveKey"]);
    return crypto.subtle.deriveKey(
        { name: "PBKDF2", salt, iterations: 310000, hash: "SHA-256" },
        rawKey,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
    );
}

async function encryptInspecttor(text, secretWord) {
    const salt = crypto.getRandomValues(new Uint8Array(8));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const cryptoKey = await deriveInspecttorKey(secretWord, salt);
    const plainBytes = f.encode(text);
    const preparedBytes = deflateSync(plainBytes);
    const cipherBuffer = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, cryptoKey, preparedBytes);
    const cipherBytes = new Uint8Array(cipherBuffer);
    const token = new Uint8Array(21 + cipherBytes.length);
    token[0] = 16 | 1;
    token.set(salt, 1);
    token.set(iv, 9);
    token.set(cipherBytes, 21);
    return "[INSPECTTOR] " + base85Encode(token);
}

async function decryptInspecttor(tokenStr, secretWord) {
    const cleaned = tokenStr.replace(/^\[INSPECTTOR\]\s*/i, "").replace(/\s+/g, "");
    const rawBytes = base85Decode(cleaned);
    if (!rawBytes || rawBytes.length < 37) throw new Error("Invalid token");
    const isCompressed = (rawBytes[0] & 1) === 1;
    const salt = rawBytes.slice(1, 9);
    const iv = rawBytes.slice(9, 21);
    const cipherData = rawBytes.slice(21);
    const cryptoKey = await deriveInspecttorKey(secretWord, salt);
    const decryptedBuffer = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, cryptoKey, cipherData);
    const decryptedBytes = new Uint8Array(decryptedBuffer);
    const finalBytes = isCompressed ? inflateSync(decryptedBytes) : decryptedBytes;
    return m.decode(finalBytes);
}

// 2. XOR
function xorEncrypt(text, secretWord, format = "binary") {
    const plainBytes = f.encode(text);
    const keyBytes = f.encode(secretWord || "galax");
    const res = new Uint8Array(plainBytes.length);
    for (let i = 0; i < plainBytes.length; i++) res[i] = plainBytes[i] ^ keyBytes[i % keyBytes.length];
    if (format === "hex") {
        return "[XOR:HEX] " + Array.from(res).map(b => b.toString(16).padStart(2, "0")).join(" ");
    }
    if (format === "base64") {
        let bin = "";
        for (let i = 0; i < res.length; i++) bin += String.fromCharCode(res[i]);
        return "[XOR:B64] " + btoa(bin);
    }
    return "[XOR] " + Array.from(res).map(b => b.toString(2).padStart(8, "0")).join(" ");
}

function xorDecrypt(cipherText, secretWord) {
    let cleaned = cipherText.trim();
    let format = "binary";
    if (cleaned.startsWith("[XOR:HEX]")) { format = "hex"; cleaned = cleaned.slice(9).trim(); }
    else if (cleaned.startsWith("[XOR:B64]")) { format = "base64"; cleaned = cleaned.slice(9).trim(); }
    else if (cleaned.startsWith("[XOR]")) { format = "binary"; cleaned = cleaned.slice(5).trim(); }
    
    let rawBytes = null;
    if (format === "hex" || (/^[0-9a-fA-F\s]+$/.test(cleaned) && cleaned.includes(" "))) {
        const hexClean = cleaned.replace(/[^0-9a-fA-F]/g, "");
        rawBytes = new Uint8Array(hexClean.length / 2);
        for (let i = 0; i < rawBytes.length; i++) rawBytes[i] = parseInt(hexClean.slice(i * 2, (i + 1) * 2), 16);
    } else if (format === "base64") {
        const bin = atob(cleaned);
        rawBytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) rawBytes[i] = bin.charCodeAt(i);
    } else {
        const binClean = cleaned.replace(/[^01]/g, "");
        rawBytes = new Uint8Array(binClean.length / 8);
        for (let i = 0; i < rawBytes.length; i++) rawBytes[i] = parseInt(binClean.slice(i * 8, (i + 1) * 8), 2);
    }
    const keyBytes = f.encode(secretWord || "galax");
    const dec = new Uint8Array(rawBytes.length);
    for (let i = 0; i < rawBytes.length; i++) dec[i] = rawBytes[i] ^ keyBytes[i % keyBytes.length];
    return m.decode(dec);
}

// 3. Vigenere
function vigenereEncrypt(text, key) {
    const cleanKey = (key || "galax").replace(/[^a-zA-Z]/g, "").toUpperCase() || "GALAX";
    let res = "", ki = 0;
    for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (/[a-zA-Z]/.test(ch)) {
            const isUpper = ch >= "A" && ch <= "Z";
            const base = isUpper ? 65 : 97;
            const shift = cleanKey.charCodeAt(ki % cleanKey.length) - 65;
            res += String.fromCharCode(((ch.charCodeAt(0) - base + shift) % 26) + base);
            ki++;
        } else res += ch;
    }
    return "[VIGENERE] " + res;
}

function vigenereDecrypt(text, key) {
    const cleanText = text.replace(/^\[VIGENERE\]\s*/i, "").replace(/^\[VIG\]\s*/i, "");
    const cleanKey = (key || "galax").replace(/[^a-zA-Z]/g, "").toUpperCase() || "GALAX";
    let res = "", ki = 0;
    for (let i = 0; i < cleanText.length; i++) {
        const ch = cleanText[i];
        if (/[a-zA-Z]/.test(ch)) {
            const isUpper = ch >= "A" && ch <= "Z";
            const base = isUpper ? 65 : 97;
            const shift = cleanKey.charCodeAt(ki % cleanKey.length) - 65;
            res += String.fromCharCode(((ch.charCodeAt(0) - base - shift + 26) % 26) + base);
            ki++;
        } else res += ch;
    }
    return res;
}

// 4. Morse
const MORSE_MAP = {
    A: ".-", B: "-...", C: "-.-.", D: "-..", E: ".", F: "..-.", G: "--.", H: "....",
    I: "..", J: ".---", K: "-.-", L: ".-..", M: "--", N: "-.", O: "---", P: ".--.",
    Q: "--.-", R: ".-.", S: "...", T: "-", U: "..-", V: "...-", W: ".--", X: "-..-",
    Y: "-.--", Z: "--..", 0: "-----", 1: ".----", 2: "..---", 3: "...--", 4: "....-",
    5: ".....", 6: "-....", 7: "--...", 8: "---..", 9: "----.", ".": ".-.-.-",
    ",": "--..--", "?": "..--..", "!": "-.-.--", "/": "-..-."
};
const REVERSE_MORSE = Object.fromEntries(Object.entries(MORSE_MAP).map(([k, v]) => [v, k]));

function morseEncrypt(text) {
    const code = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().split(" ").map(w => w.split("").map(c => MORSE_MAP[c] || c).join(" ")).join(" / ");
    return "[MORSE] " + code;
}

function morseDecrypt(text) {
    const clean = text.replace(/^\[MORSE\]\s*/i, "");
    return clean.trim().split(" / ").map(w => w.trim().split(/\s+/).map(c => REVERSE_MORSE[c] || c).join("")).join(" ");
}

// 5. Binary
function binaryEncrypt(text) {
    const bytes = f.encode(text);
    return "[BINARY] " + Array.from(bytes).map(b => b.toString(2).padStart(8, "0")).join(" ");
}

function binaryDecrypt(text) {
    const clean = text.replace(/^\[BINARY\]\s*/i, "").replace(/[^01]/g, "");
    const bytes = new Uint8Array(clean.length / 8);
    for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(clean.slice(i * 8, (i + 1) * 8), 2);
    return m.decode(bytes);
}

// 6. Hex
function hexEncrypt(text) {
    const bytes = f.encode(text);
    return "[HEX] " + Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join(" ");
}

function hexDecrypt(text) {
    const clean = text.replace(/^\[HEX\]\s*/i, "").replace(/[^0-9a-fA-F]/g, "");
    const bytes = new Uint8Array(clean.length / 2);
    for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(clean.slice(i * 2, (i + 1) * 2), 16);
    return m.decode(bytes);
}

// 7. Base64
function base64Encrypt(text) {
    const bytes = f.encode(text);
    let bin = "";
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return "[BASE64] " + btoa(bin);
}

function base64Decrypt(text) {
    const clean = text.replace(/^\[BASE64\]\s*/i, "").replace(/^\[B64\]\s*/i, "").trim();
    const bin = atob(clean);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return m.decode(bytes);
}

// 8. ROT13
function rot13(str) {
    const clean = str.replace(/^\[ROT13\]\s*/i, "");
    return clean.replace(/[a-zA-Z]/g, ch => {
        const code = ch.charCodeAt(0);
        if (code >= 65 && code <= 90) return String.fromCharCode(((code - 65 + 13) % 26) + 65);
        if (code >= 97 && code <= 122) return String.fromCharCode(((code - 97 + 13) % 26) + 97);
        return ch;
    });
}
function rot13Encrypt(text) { return "[ROT13] " + rot13(text); }
function rot13Decrypt(text) { return rot13(text); }

// 9. Reverse
function reverseEncrypt(text) { return "[REVERSE] " + Array.from(text).reverse().join(""); }
function reverseDecrypt(text) {
    const clean = text.replace(/^\[REVERSE\]\s*/i, "").replace(/^\[REV\]\s*/i, "");
    return Array.from(clean).reverse().join("");
}

(async () => {
    const testMsg = "Hello World! Teste com acentos: coração 🚀";
    const key = "HI";

    console.log("--- TESTANDO TODOS OS 9 MÉTODOS ---");

    const e1 = await encryptInspecttor(testMsg, key);
    const d1 = await decryptInspecttor(e1, key);
    console.log("1. Inspecttor ->", e1.slice(0, 30) + "... | Match:", testMsg === d1);

    const e2 = xorEncrypt("Hello", "HI", "binary");
    const d2 = xorDecrypt(e2, "HI");
    console.log("2. XOR (Hello with key HI) ->", e2, "-> Decrypted:", d2, "| Match:", "Hello" === d2);

    const e3 = vigenereEncrypt(testMsg, key);
    const d3 = vigenereDecrypt(e3, key);
    console.log("3. Vigenere ->", e3.slice(0, 30) + "... | Match:", testMsg === d3);

    const e4 = morseEncrypt("SOS HELP");
    const d4 = morseDecrypt(e4);
    console.log("4. Morse ->", e4, "-> Decrypted:", d4, "| Match:", "SOS HELP" === d4);

    const e5 = binaryEncrypt(testMsg);
    const d5 = binaryDecrypt(e5);
    console.log("5. Binary ->", e5.slice(0, 30) + "... | Match:", testMsg === d5);

    const e6 = hexEncrypt(testMsg);
    const d6 = hexDecrypt(e6);
    console.log("6. Hex ->", e6.slice(0, 30) + "... | Match:", testMsg === d6);

    const e7 = base64Encrypt(testMsg);
    const d7 = base64Decrypt(e7);
    console.log("7. Base64 ->", e7.slice(0, 30) + "... | Match:", testMsg === d7);

    const e8 = rot13Encrypt(testMsg);
    const d8 = rot13Decrypt(e8);
    console.log("8. ROT13 ->", e8.slice(0, 30) + "... | Match:", testMsg === d8);

    const e9 = reverseEncrypt(testMsg);
    const d9 = reverseDecrypt(e9);
    console.log("9. Reverse ->", e9.slice(0, 30) + "... | Match:", testMsg === d9);
})();
