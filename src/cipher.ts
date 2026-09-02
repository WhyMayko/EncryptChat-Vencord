/*
 * Encrypt Chat - Cipher & Translation Engine
 * Supports: Inspecttor Server, Inspecttor Offline, PGP, Funny Texts, XOR Cipher, Vigenère, Morse Code, Binary, Hexadecimal, Base64, ROT13
 */

import { deflateSync, inflateSync } from "fflate";
import * as openpgp from "openpgp";

export type CipherMethod =
    | "inspecttor_server"
    | "inspecttor_offline"
    | "pgp"
    | "funny"
    | "xor"
    | "vigenere"
    | "morse"
    | "binary"
    | "hex"
    | "base64"
    | "rot13";

export type XorFormat = "binary" | "hex" | "base64";

export type FunnyStyle =
    | "superscript"
    | "subscript"
    | "alternating"
    | "upsidedown"
    | "bubble"
    | "reverse"
    | "smallcaps"
    | "fullwidth"
    | "leet"
    | "zalgo"
    | "strikethrough"
    | "underline";

export interface DecryptResult {
    success: boolean;
    text: string;
    method: CipherMethod | "unknown";
    error?: string;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder("utf-8", { fatal: false });

/* ==========================================================================
   1. PGP Engine (OpenPGP Industry Standard)
   ========================================================================== */

export async function encryptPgp(text: string, secretWord: string, includePrefix = false): Promise<string> {
    const effectivePass = (secretWord || "").trim();
    if (!effectivePass) throw new Error("Secret Word is required for PGP encryption.");

    const message = await openpgp.createMessage({ text });
    const armored = await openpgp.encrypt({
        message,
        passwords: [effectivePass],
        format: "armored"
    });
    const cleanArmored = typeof armored === "string" ? armored.trim() : "";
    return includePrefix ? `[PGP]\n${cleanArmored}` : cleanArmored;
}

export async function decryptPgp(armoredText: string, secretWord: string): Promise<string> {
    const effectivePass = (secretWord || "").trim();
    if (!effectivePass) throw new Error("Secret Word is required for PGP decryption.");

    const cleanArmored = armoredText.replace(/^\[PGP\]\s*/i, "").trim();
    const message = await openpgp.readMessage({ armoredMessage: cleanArmored });
    const { data: decrypted } = await openpgp.decrypt({
        message,
        passwords: [effectivePass]
    });
    return String(decrypted);
}

/* ==========================================================================
   2. Base85 Helper
   ========================================================================== */

const BASE85_CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!#$%()*+,-./:;=?@[]^_{}";
const BASE85_LOOKUP = (() => {
    const table = new Int16Array(128).fill(-1);
    for (let i = 0; i < BASE85_CHARS.length; i++) {
        table[BASE85_CHARS.charCodeAt(i)] = i;
    }
    return table;
})();

export function base85Encode(bytes: Uint8Array): string {
    let result = "";
    for (let i = 0; i < bytes.length; i += 4) {
        const chunkLen = Math.min(4, bytes.length - i);
        let val = 0;
        for (let r = 0; r < 4; r++) {
            val = (val * 256 + (r < chunkLen ? bytes[i + r] : 0)) >>> 0;
        }
        const encodedChars = [0, 0, 0, 0, 0];
        for (let r = 4; r >= 0; r--) {
            encodedChars[r] = val % 85;
            val = Math.floor(val / 85);
        }
        for (let r = 0; r < chunkLen + 1; r++) {
            result += BASE85_CHARS[encodedChars[r]];
        }
    }
    return result;
}

export function base85Decode(str: string): Uint8Array | null {
    const output: number[] = [];
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
        const bytes = [
            (val >>> 24) & 255,
            (val >>> 16) & 255,
            (val >>> 8) & 255,
            val & 255
        ];
        for (let r = 0; r < chunkLen - 1; r++) {
            output.push(bytes[r]);
        }
    }
    return Uint8Array.from(output);
}

const toHex = (bytes: Uint8Array) => Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
const fromHex = (hex: string) => Uint8Array.from(hex.match(/.{2}/g)?.map(b => parseInt(b, 16)) || []);

/* ==========================================================================
   3. Inspecttor Server Engine (Live inspecttor.xyz API + Dynamic Server Seed)
   ========================================================================== */

const INSPECTTOR_SERVER = "https://inspecttor.xyz";
let cachedApiToken: { key: string; token: string; until: number } | null = null;
const serverSeedCache = new Map<string, Uint8Array>();

async function getInspecttorServerSeed(accessKey: string, saltHex: string): Promise<Uint8Array> {
    const cleanKey = (accessKey || "").trim();
    if (!cleanKey) throw new Error("Inspecttor Access Key is required for Server mode.");

    const cacheKey = `${cleanKey}:${saltHex}`;
    const cached = serverSeedCache.get(cacheKey);
    if (cached) return cached;

    const now = Date.now();
    if (!cachedApiToken || cachedApiToken.key !== cleanKey || cachedApiToken.until < now + 30000) {
        const tokenRes = await fetch(`${INSPECTTOR_SERVER}/translator/token`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ key: cleanKey })
        });
        if (tokenRes.status === 401) throw new Error("Invalid Inspecttor Access Key.");
        if (!tokenRes.ok) throw new Error(`Token request failed (${tokenRes.status})`);

        const data = await tokenRes.json();
        cachedApiToken = { key: cleanKey, token: data.token, until: now + (data.ttl || 3600000) };
    }

    const kdfRes = await fetch(`${INSPECTTOR_SERVER}/translator/kdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: cachedApiToken.token, salt: saltHex })
    });
    if (!kdfRes.ok) throw new Error(`Server seed request failed (${kdfRes.status})`);

    const kdfData = await kdfRes.json();
    if (!kdfData.seed) throw new Error("No seed returned by Inspecttor server.");

    const seedBytes = fromHex(kdfData.seed);
    serverSeedCache.set(cacheKey, seedBytes);
    return seedBytes;
}

export async function encryptInspecttorServer(
    text: string,
    secretWord: string,
    accessKey: string,
    includePrefix = false
): Promise<string> {
    const effectivePass = (secretWord || "").trim();
    if (!effectivePass) throw new Error("Secret Word is required for Inspecttor encryption.");

    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const saltHex = toHex(salt);

    const seedBytes = await getInspecttorServerSeed(accessKey, saltHex);

    const rawKey = await crypto.subtle.importKey("raw", encoder.encode(effectivePass), "PBKDF2", false, ["deriveBits"]);
    const derivedBits = new Uint8Array(
        await crypto.subtle.deriveBits(
            { name: "PBKDF2", salt: salt as any, iterations: 310000, hash: "SHA-256" },
            rawKey,
            256
        )
    );

    for (let i = 0; i < 32; i++) derivedBits[i] ^= seedBytes[i];

    const cryptoKey = await crypto.subtle.importKey("raw", derivedBits as any, { name: "AES-GCM" }, false, ["encrypt"]);
    const cipherBuffer = await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv as any }, cryptoKey, encoder.encode(text));
    const cipherBytes = new Uint8Array(cipherBuffer);

    const token = new Uint8Array(29 + cipherBytes.length);
    token[0] = 1;
    token.set(salt, 1);
    token.set(iv, 17);
    token.set(cipherBytes, 29);

    const enc = base85Encode(token);
    return includePrefix ? `[INSPECTTOR] ${enc}` : enc;
}

export async function decryptInspecttorServer(
    tokenStr: string,
    secretWord: string,
    accessKey: string
): Promise<string> {
    const effectivePass = (secretWord || "").trim();
    if (!effectivePass) throw new Error("Secret Word is required for Inspecttor decryption.");

    const cleaned = tokenStr
        .replace(/^\u200B\u200C\u200B\u200D/, "")
        .replace(/^\[INSPECTTOR\]\s*/i, "")
        .replace(/\s+/g, "");
    const rawBytes = base85Decode(cleaned);
    if (!rawBytes || rawBytes.length < 40) throw new Error("Invalid inspecttor server token");
    if (rawBytes[0] !== 1) throw new Error("Not an inspecttor server format token");

    const salt = rawBytes.slice(1, 17);
    const iv = rawBytes.slice(17, 29);
    const cipherData = rawBytes.slice(29);
    const saltHex = toHex(salt);

    const seedBytes = await getInspecttorServerSeed(accessKey, saltHex);

    const rawKey = await crypto.subtle.importKey("raw", encoder.encode(effectivePass), "PBKDF2", false, ["deriveBits"]);
    const derivedBits = new Uint8Array(
        await crypto.subtle.deriveBits(
            { name: "PBKDF2", salt: salt as any, iterations: 310000, hash: "SHA-256" },
            rawKey,
            256
        )
    );

    for (let i = 0; i < 32; i++) derivedBits[i] ^= seedBytes[i];

    const cryptoKey = await crypto.subtle.importKey("raw", derivedBits as any, { name: "AES-GCM" }, false, ["decrypt"]);
    const decryptedBuffer = await crypto.subtle.decrypt({ name: "AES-GCM", iv: iv as any }, cryptoKey, cipherData as any);
    return decoder.decode(new Uint8Array(decryptedBuffer));
}

/* ==========================================================================
   4. Inspecttor Offline Engine (Local Standalone AES-256-GCM + PBKDF2 + Deflate)
   ========================================================================== */

export async function encryptInspecttorOffline(
    text: string,
    secretWord: string,
    includePrefix = false
): Promise<string> {
    const effectivePass = (secretWord || "").trim();
    if (!effectivePass) throw new Error("Secret Word is required for Inspecttor Offline encryption.");

    const salt = crypto.getRandomValues(new Uint8Array(8));
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const rawKey = await crypto.subtle.importKey("raw", encoder.encode(effectivePass), "PBKDF2", false, ["deriveKey"]);
    const cryptoKey = await crypto.subtle.deriveKey(
        { name: "PBKDF2", salt: salt as any, iterations: 310000, hash: "SHA-256" },
        rawKey,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt"]
    );

    const plainBytes = encoder.encode(text);
    const compressedBytes = deflateSync(plainBytes);
    const cipherBuffer = await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv as any }, cryptoKey, compressedBytes as any);
    const cipherBytes = new Uint8Array(cipherBuffer);

    const token = new Uint8Array(21 + cipherBytes.length);
    token[0] = 16 | 1;
    token.set(salt, 1);
    token.set(iv, 9);
    token.set(cipherBytes, 21);

    const enc = base85Encode(token);
    return includePrefix ? `[INSPECTTOR:OFFLINE] ${enc}` : enc;
}

export async function decryptInspecttorOffline(tokenStr: string, secretWord: string): Promise<string> {
    const effectivePass = (secretWord || "").trim();
    if (!effectivePass) throw new Error("Secret Word is required for Inspecttor Offline decryption.");

    const cleaned = tokenStr
        .replace(/^\[INSPECTTOR:OFFLINE\]\s*/i, "")
        .replace(/^\[INSPECTTOR\]\s*/i, "")
        .replace(/\s+/g, "");
    const rawBytes = base85Decode(cleaned);
    if (!rawBytes || rawBytes.length < 37) throw new Error("Invalid inspecttor offline token");
    if (rawBytes[0] >> 4 !== 1) throw new Error("Unknown offline format");

    const isCompressed = (rawBytes[0] & 1) === 1;
    const salt = rawBytes.slice(1, 9);
    const iv = rawBytes.slice(9, 21);
    const cipherData = rawBytes.slice(21);

    const rawKey = await crypto.subtle.importKey("raw", encoder.encode(effectivePass), "PBKDF2", false, ["deriveKey"]);
    const cryptoKey = await crypto.subtle.deriveKey(
        { name: "PBKDF2", salt: salt as any, iterations: 310000, hash: "SHA-256" },
        rawKey,
        { name: "AES-GCM", length: 256 },
        false,
        ["decrypt"]
    );

    const decryptedBuffer = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv as any },
        cryptoKey,
        cipherData as any
    );
    const decryptedBytes = new Uint8Array(decryptedBuffer);
    const finalBytes = isCompressed ? inflateSync(decryptedBytes) : decryptedBytes;
    return decoder.decode(finalBytes);
}

export function isInspecttorToken(str: string): boolean {
    const cleaned = str
        .replace(/^\u200B\u200C\u200B\u200D/, "")
        .replace(/^\[INSPECTTOR(?::OFFLINE)?\]\s*/i, "")
        .replace(/\s+/g, "");
    if (cleaned.length < 35) return false;
    const rawBytes = base85Decode(cleaned);
    if (!rawBytes || rawBytes.length < 37) return false;
    return rawBytes[0] === 1 || rawBytes[0] === 17 || (rawBytes[0] >> 4 === 1);
}

/* ==========================================================================
   5. Funny Texts Engine (12 Styles)
   ========================================================================== */

const SUPERSCRIPT_MAP: Record<string, string> = {
    a: "ᵃ", b: "ᵇ", c: "ᶜ", d: "ᵈ", e: "ᵉ", f: "ᶠ", g: "ᵍ", h: "ʰ", i: "ⁱ", j: "ʲ",
    k: "ᵏ", l: "ˡ", m: "ᵐ", n: "ⁿ", o: "ᵒ", p: "ᵖ", r: "ʳ", s: "ˢ", t: "ᵗ", u: "ᵘ",
    v: "ᵛ", w: "ʷ", x: "ˣ", y: "ʸ", z: "ᶻ",
    A: "ᴬ", B: "ᴮ", C: "ᶜ", D: "ᴰ", E: "ᴱ", F: "ᶠ", G: "ᴳ", H: "ᴴ", I: "ᴵ", J: "ᴶ",
    K: "ᴷ", L: "ᴸ", M: "ᴹ", N: "ᴺ", O: "ᴼ", P: "ᴾ", R: "ᴿ", T: "ᵀ", U: "ᵁ", V: "ⱽ",
    W: "ᵂ", 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹",
    "+": "⁺", "-": "⁻", "=": "⁼", "(": "⁽", ")": "⁾"
};
const REV_SUPERSCRIPT: Record<string, string> = Object.fromEntries(
    Object.entries(SUPERSCRIPT_MAP).map(([k, v]) => [v, k])
);

export function toSuperscript(str: string, includePrefix = false): string {
    const clean = str.replace(/^\[(?:FUNNY:)?SUPERSCRIPT\]\s*/i, "");
    const res = Array.from(clean).map(c => SUPERSCRIPT_MAP[c] || c).join("");
    return includePrefix ? `[SUPERSCRIPT] ${res}` : res;
}

export function fromSuperscript(str: string): string {
    const clean = str.replace(/^\[(?:FUNNY:)?SUPERSCRIPT\]\s*/i, "");
    return Array.from(clean).map(c => REV_SUPERSCRIPT[c] || c).join("");
}

const SUBSCRIPT_MAP: Record<string, string> = {
    a: "ₐ", e: "ₑ", h: "ₕ", i: "ᵢ", j: "ⱼ", k: "ₖ", l: "ₗ", m: "ₘ", n: "ₙ", o: "ₒ",
    p: "ₚ", r: "ᵣ", s: "ₛ", t: "ₜ", u: "ᵤ", v: "ᵥ", x: "ₓ",
    0: "₀", 1: "₁", 2: "₂", 3: "₃", 4: "₄", 5: "₅", 6: "₆", 7: "₇", 8: "₈", 9: "₉",
    "+": "₊", "-": "₋", "=": "₌", "(": "₍", ")": "₎"
};
const REV_SUBSCRIPT: Record<string, string> = Object.fromEntries(
    Object.entries(SUBSCRIPT_MAP).map(([k, v]) => [v, k])
);

export function toSubscript(str: string, includePrefix = false): string {
    const clean = str.replace(/^\[(?:FUNNY:)?SUBSCRIPT\]\s*/i, "");
    const res = Array.from(clean).map(c => SUBSCRIPT_MAP[c.toLowerCase()] || c).join("");
    return includePrefix ? `[SUBSCRIPT] ${res}` : res;
}

export function fromSubscript(str: string): string {
    const clean = str.replace(/^\[(?:FUNNY:)?SUBSCRIPT\]\s*/i, "");
    return Array.from(clean).map(c => REV_SUBSCRIPT[c] || c).join("");
}

export function toAlternating(str: string, includePrefix = false): string {
    const clean = str.replace(/^\[(?:FUNNY:)?ALTERNATING\]\s*/i, "");
    let res = "";
    let upper = false;
    for (const c of clean) {
        if (/[a-zA-Z]/.test(c)) {
            res += upper ? c.toUpperCase() : c.toLowerCase();
            upper = !upper;
        } else {
            res += c;
        }
    }
    return includePrefix ? `[ALTERNATING] ${res}` : res;
}

export function toBubble(str: string, includePrefix = false): string {
    const clean = str.replace(/^\[(?:FUNNY:)?BUBBLE\]\s*/i, "");
    const res = Array.from(clean).map(c => {
        const code = c.charCodeAt(0);
        if (code >= 65 && code <= 90) return String.fromCodePoint(0x24B6 + code - 65);
        if (code >= 97 && code <= 122) return String.fromCodePoint(0x24D0 + code - 97);
        if (code >= 49 && code <= 57) return String.fromCodePoint(0x2460 + code - 49);
        if (code === 48) return "\u24EA";
        return c;
    }).join("");
    return includePrefix ? `[BUBBLE] ${res}` : res;
}

export function fromBubble(str: string): string {
    const clean = str.replace(/^\[(?:FUNNY:)?BUBBLE\]\s*/i, "");
    return Array.from(clean).map(c => {
        const cp = c.codePointAt(0);
        if (cp && cp >= 0x24B6 && cp <= 0x24CF) return String.fromCharCode(65 + cp - 0x24B6);
        if (cp && cp >= 0x24D0 && cp <= 0x24E9) return String.fromCharCode(97 + cp - 0x24D0);
        if (cp && cp >= 0x2460 && cp <= 0x2468) return String.fromCharCode(49 + cp - 0x2460);
        if (cp === 0x24EA) return "0";
        return c;
    }).join("");
}

const UPSIDE_DOWN_MAP: Record<string, string> = {
    a: "\u0250", b: "q", c: "\u0254", d: "p", e: "\u01DD", f: "\u025F", g: "\u0183",
    h: "\u0265", i: "\u1D09", j: "\u027E", k: "\u029E", l: "l", m: "\u026F", n: "u",
    o: "o", p: "d", q: "b", r: "\u0279", s: "s", t: "\u0287", u: "n", v: "\u028C",
    w: "\u028D", x: "x", y: "\u028E", z: "z",
    A: "\u2200", B: "B", C: "\u0186", D: "D", E: "\u018E", F: "\u2132",
    G: "\u2141", H: "H", I: "I", J: "\u017F", K: "K", L: "\u02E5", M: "W",
    N: "N", O: "O", P: "\u0500", Q: "\u038C", R: "\u1D1A", S: "S", T: "\u22A5",
    U: "\u2229", V: "\u039B", W: "M", X: "X", Y: "\u2144", Z: "Z",
    "1": "\u21C2", "2": "\u1105", "3": "\u0190", "4": "\u3123", "5": "\u03DB",
    "6": "9", "7": "\u3125", "8": "8", "9": "6", "0": "0",
    ".": "\u02D9", ",": "'", "?": "\u00BF", "!": "\u00A1"
};
const REVERSE_UPSIDE_DOWN: Record<string, string> = Object.fromEntries(
    Object.entries(UPSIDE_DOWN_MAP).map(([k, v]) => [v, k])
);

export function toUpsideDown(str: string, includePrefix = false): string {
    const clean = str.replace(/^\[(?:FUNNY:)?UPSIDEDOWN\]\s*/i, "");
    const res = Array.from(clean).map(c => UPSIDE_DOWN_MAP[c] || c).reverse().join("");
    return includePrefix ? `[UPSIDEDOWN] ${res}` : res;
}

export function fromUpsideDown(str: string): string {
    const clean = str.replace(/^\[(?:FUNNY:)?UPSIDEDOWN\]\s*/i, "");
    return Array.from(clean).map(c => REVERSE_UPSIDE_DOWN[c] || c).reverse().join("");
}

const SMALL_CAPS_MAP: Record<string, string> = {
    a: "ᴀ", b: "ʙ", c: "ᴄ", d: "ᴅ", e: "ᴇ", f: "ꜰ", g: "ɢ", h: "ʜ", i: "ɪ",
    j: "ᴊ", k: "ᴋ", l: "ʟ", m: "ᴍ", n: "ɴ", o: "ᴏ", p: "ᴘ", q: "ǫ", r: "ʀ",
    s: "ꜱ", t: "ᴛ", u: "ᴜ", v: "ᴠ", w: "ᴡ", x: "x", y: "ʏ", z: "ᴢ"
};
const REVERSE_SMALL_CAPS: Record<string, string> = Object.fromEntries(
    Object.entries(SMALL_CAPS_MAP).map(([k, v]) => [v, k])
);

export function toSmallCaps(str: string, includePrefix = false): string {
    const clean = str.replace(/^\[(?:FUNNY:)?SMALLCAPS\]\s*/i, "");
    const res = Array.from(clean).map(c => SMALL_CAPS_MAP[c.toLowerCase()] || c).join("");
    return includePrefix ? `[SMALLCAPS] ${res}` : res;
}

export function fromSmallCaps(str: string): string {
    const clean = str.replace(/^\[(?:FUNNY:)?SMALLCAPS\]\s*/i, "");
    return Array.from(clean).map(c => REVERSE_SMALL_CAPS[c] || c).join("");
}

export function toFullwidth(str: string, includePrefix = false): string {
    const clean = str.replace(/^\[(?:FUNNY:)?FULLWIDTH\]\s*/i, "");
    const res = Array.from(clean).map(c => {
        const code = c.charCodeAt(0);
        if (code >= 33 && code <= 126) return String.fromCharCode(code + 0xFEE0);
        if (code === 32) return "\u3000";
        return c;
    }).join("");
    return includePrefix ? `[FULLWIDTH] ${res}` : res;
}

export function fromFullwidth(str: string): string {
    const clean = str.replace(/^\[(?:FUNNY:)?FULLWIDTH\]\s*/i, "");
    return Array.from(clean).map(c => {
        const code = c.charCodeAt(0);
        if (code >= 0xFF01 && code <= 0xFF5E) return String.fromCharCode(code - 0xFEE0);
        if (code === 0x3000) return " ";
        return c;
    }).join("");
}

const LEET_MAP: Record<string, string> = { a: "4", e: "3", i: "1", o: "0", s: "5", t: "7", b: "8" };
export function toLeet(str: string, includePrefix = false): string {
    const clean = str.replace(/^\[(?:FUNNY:)?LEET\]\s*/i, "");
    const res = Array.from(clean).map(c => LEET_MAP[c.toLowerCase()] || c).join("");
    return includePrefix ? `[LEET] ${res}` : res;
}

const ZALGO_UP = ["\u030d", "\u030e", "\u0304", "\u0305", "\u033f", "\u0311", "\u0306", "\u0310", "\u0352", "\u0357"];
const ZALGO_DOWN = ["\u0316", "\u0317", "\u0318", "\u0319", "\u031c", "\u031d", "\u031e", "\u031f", "\u0320", "\u0324"];
const ZALGO_MID = ["\u0315", "\u031b", "\u0340", "\u0341", "\u0358", "\u0321", "\u0322", "\u0327", "\u0328", "\u0334"];

export function toZalgo(str: string, includePrefix = false): string {
    const clean = str.replace(/^\[(?:FUNNY:)?ZALGO\]\s*/i, "");
    let res = "";
    for (const ch of clean) {
        res += ch;
        if (ch !== " ") {
            res += ZALGO_UP[Math.floor(Math.random() * ZALGO_UP.length)];
            res += ZALGO_MID[Math.floor(Math.random() * ZALGO_MID.length)];
            res += ZALGO_DOWN[Math.floor(Math.random() * ZALGO_DOWN.length)];
        }
    }
    return includePrefix ? `[ZALGO] ${res}` : res;
}

export function fromZalgo(str: string): string {
    const clean = str.replace(/^\[(?:FUNNY:)?ZALGO\]\s*/i, "");
    return clean.replace(/[\u0300-\u036f\u1dc0-\u1dff\u20d0-\u20ff\ufe20-\ufe2f]/g, "");
}

export function toStrikethrough(str: string, includePrefix = false): string {
    const clean = str.replace(/^\[(?:FUNNY:)?STRIKE\]\s*/i, "");
    const res = Array.from(clean).map(c => c + "\u0336").join("");
    return includePrefix ? `[STRIKE] ${res}` : res;
}
export function fromStrikethrough(str: string): string {
    const clean = str.replace(/^\[(?:FUNNY:)?STRIKE\]\s*/i, "");
    return clean.replace(/\u0336/g, "");
}

export function toUnderline(str: string, includePrefix = false): string {
    const clean = str.replace(/^\[(?:FUNNY:)?UNDERLINE\]\s*/i, "");
    const res = Array.from(clean).map(c => c + "\u0332").join("");
    return includePrefix ? `[UNDERLINE] ${res}` : res;
}
export function fromUnderline(str: string): string {
    const clean = str.replace(/^\[(?:FUNNY:)?UNDERLINE\]\s*/i, "");
    return clean.replace(/\u0332/g, "");
}

export function reverseText(str: string, includePrefix = false): string {
    const clean = str.replace(/^\[(?:FUNNY:)?REV(?:ERSE)?\]\s*/i, "");
    const res = Array.from(clean).reverse().join("");
    return includePrefix ? `[REVERSE] ${res}` : res;
}
export function reverseTextDecrypt(str: string): string {
    const clean = str.replace(/^\[(?:FUNNY:)?REV(?:ERSE)?\]\s*/i, "");
    return Array.from(clean).reverse().join("");
}

export function encryptFunny(text: string, style: FunnyStyle = "superscript", includePrefix = false): string {
    switch (style) {
        case "superscript": return toSuperscript(text, includePrefix);
        case "subscript": return toSubscript(text, includePrefix);
        case "alternating": return toAlternating(text, includePrefix);
        case "upsidedown": return toUpsideDown(text, includePrefix);
        case "bubble": return toBubble(text, includePrefix);
        case "reverse": return reverseText(text, includePrefix);
        case "smallcaps": return toSmallCaps(text, includePrefix);
        case "fullwidth": return toFullwidth(text, includePrefix);
        case "leet": return toLeet(text, includePrefix);
        case "zalgo": return toZalgo(text, includePrefix);
        case "strikethrough": return toStrikethrough(text, includePrefix);
        case "underline": return toUnderline(text, includePrefix);
        default: return toSuperscript(text, includePrefix);
    }
}

/* ==========================================================================
   6. Vigenère Cipher
   ========================================================================== */

export function vigenereEncrypt(text: string, key: string, includePrefix = false): string {
    const cleanKey = (key || "").replace(/[^a-zA-Z]/g, "").toUpperCase();
    if (!cleanKey) throw new Error("Secret Word is required for Vigenère encryption.");

    let res = "";
    let ki = 0;
    for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (/[a-zA-Z]/.test(ch)) {
            const isUpper = ch >= "A" && ch <= "Z";
            const base = isUpper ? 65 : 97;
            const shift = cleanKey.charCodeAt(ki % cleanKey.length) - 65;
            res += String.fromCharCode(((ch.charCodeAt(0) - base + shift) % 26) + base);
            ki++;
        } else {
            res += ch;
        }
    }
    return includePrefix ? `[VIGENERE] ${res}` : res;
}

export function vigenereDecrypt(text: string, key: string): string {
    const cleanText = text.replace(/^\[VIGENERE\]\s*/i, "").replace(/^\[VIG\]\s*/i, "");
    const cleanKey = (key || "").replace(/[^a-zA-Z]/g, "").toUpperCase();
    if (!cleanKey) return "";

    let res = "";
    let ki = 0;
    for (let i = 0; i < cleanText.length; i++) {
        const ch = cleanText[i];
        if (/[a-zA-Z]/.test(ch)) {
            const isUpper = ch >= "A" && ch <= "Z";
            const base = isUpper ? 65 : 97;
            const shift = cleanKey.charCodeAt(ki % cleanKey.length) - 65;
            res += String.fromCharCode(((ch.charCodeAt(0) - base - shift + 26) % 26) + base);
            ki++;
        } else {
            res += ch;
        }
    }
    return res;
}

/* ==========================================================================
   7. Morse Code Engine
   ========================================================================== */

const MORSE_MAP: Record<string, string> = {
    A: ".-", B: "-...", C: "-.-.", D: "-..", E: ".", F: "..-.",
    G: "--.", H: "....", I: "..", J: ".---", K: "-.-", L: ".-..",
    M: "--", N: "-.", O: "---", P: ".--.", Q: "--.-", R: ".-.",
    S: "...", T: "-", U: "..-", V: "...-", W: ".--", X: "-..-",
    Y: "-.--", Z: "--..",
    0: "-----", 1: ".----", 2: "..---", 3: "...--", 4: "....-",
    5: ".....", 6: "-....", 7: "--...", 8: "---..", 9: "----.",
    ".": ".-.-.-", ",": "--..--", "?": "..--..", "!": "-.-.--", "/": "-..-.",
    "(": "-.--.", ")": "-.--.-", "&": ".-...", ":": "---...", ";": "-.-.-.",
    "=": "-...-", "+": ".-.-.", "-": "-....-", "_": "..--.-", "@": ".--.-."
};

const REVERSE_MORSE: Record<string, string> = Object.fromEntries(
    Object.entries(MORSE_MAP).map(([char, code]) => [code, char])
);

export function textToMorse(text: string, includePrefix = false): string {
    const code = text
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toUpperCase()
        .split(" ")
        .map(word => word.split("").map(ch => MORSE_MAP[ch] || ch).join(" "))
        .join(" / ");
    return includePrefix ? `[MORSE] ${code}` : code;
}

export function morseToText(morse: string): string {
    const clean = morse.replace(/^\[MORSE\]\s*/i, "");
    return clean
        .trim()
        .split(" / ")
        .map(word =>
            word
                .trim()
                .split(/\s+/)
                .map(code => REVERSE_MORSE[code] || code)
                .join("")
        )
        .join(" ");
}

/* ==========================================================================
   8. Plain Binary, Hexadecimal, and Base64 Engines
   ========================================================================== */

export function textToPlainBinary(text: string, includePrefix = false): string {
    const bytes = encoder.encode(text);
    const chunks: string[] = [];
    for (let i = 0; i < bytes.length; i++) {
        chunks.push(bytes[i].toString(2).padStart(8, "0"));
    }
    const bin = chunks.join(" ");
    return includePrefix ? `[BINARY] ${bin}` : bin;
}

export function plainBinaryToText(binaryStr: string): string | null {
    const cleaned = binaryStr.replace(/^\[BINARY\]\s*/i, "").replace(/[^01]/g, "");
    if (!cleaned || cleaned.length % 8 !== 0) return null;
    const count = cleaned.length / 8;
    const bytes = new Uint8Array(count);
    for (let i = 0; i < count; i++) {
        bytes[i] = parseInt(cleaned.slice(i * 8, (i + 1) * 8), 2);
    }
    return decoder.decode(bytes);
}

export function textToHex(text: string, includePrefix = false): string {
    const bytes = encoder.encode(text);
    const hex: string[] = [];
    for (let i = 0; i < bytes.length; i++) {
        hex.push(bytes[i].toString(16).padStart(2, "0"));
    }
    const h = hex.join(" ");
    return includePrefix ? `[HEX] ${h}` : h;
}

export function hexToText(hexStr: string): string | null {
    const cleaned = hexStr.replace(/^\[HEX\]\s*/i, "").replace(/[^0-9a-fA-F]/g, "");
    if (!cleaned || cleaned.length % 2 !== 0) return null;
    const bytes = new Uint8Array(cleaned.length / 2);
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(cleaned.slice(i * 2, (i + 1) * 2), 16);
    }
    return decoder.decode(bytes);
}

export function textToBase64(text: string, includePrefix = false): string {
    const bytes = encoder.encode(text);
    let bin = "";
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    const b64 = btoa(bin);
    return includePrefix ? `[BASE64] ${b64}` : b64;
}

export function base64ToText(b64Str: string): string | null {
    try {
        const cleaned = b64Str.replace(/^\[BASE64\]\s*/i, "").replace(/^\[B64\]\s*/i, "").trim();
        const bin = atob(cleaned);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        return decoder.decode(bytes);
    } catch {
        return null;
    }
}

/* ==========================================================================
   9. ROT13
   ========================================================================== */

export function rot13(str: string): string {
    const clean = str.replace(/^\[ROT13\]\s*/i, "");
    return clean.replace(/[a-zA-Z]/g, ch => {
        const code = ch.charCodeAt(0);
        if (code >= 65 && code <= 90) return String.fromCharCode(((code - 65 + 13) % 26) + 65);
        if (code >= 97 && code <= 122) return String.fromCharCode(((code - 97 + 13) % 26) + 97);
        return ch;
    });
}

export function rot13Encrypt(text: string, includePrefix = false): string {
    const res = rot13(text);
    return includePrefix ? `[ROT13] ${res}` : res;
}

export function rot13Decrypt(text: string): string {
    return rot13(text);
}

/* ==========================================================================
   10. XOR Cipher Engine (with Secret Word)
   ========================================================================== */

export function xorBytes(data: Uint8Array, key: Uint8Array): Uint8Array {
    const result = new Uint8Array(data.length);
    for (let i = 0; i < data.length; i++) {
        result[i] = data[i] ^ key[i % key.length];
    }
    return result;
}

export function xorEncrypt(
    plainText: string,
    secretWord: string,
    format: XorFormat = "binary",
    includePrefix = false
): string {
    if (!plainText) return "";
    const cleanKey = (secretWord || "").trim();
    if (!cleanKey) throw new Error("Secret Word is required for XOR encryption.");

    const plainBytes = encoder.encode(plainText);
    const keyBytes = encoder.encode(cleanKey);
    const encryptedBytes = xorBytes(plainBytes, keyBytes);

    if (format === "hex") {
        const hex: string[] = [];
        for (let i = 0; i < encryptedBytes.length; i++) {
            hex.push(encryptedBytes[i].toString(16).padStart(2, "0"));
        }
        const h = hex.join(" ");
        return includePrefix ? `[XOR:HEX] ${h}` : h;
    }

    if (format === "base64") {
        let bin = "";
        for (let i = 0; i < encryptedBytes.length; i++) {
            bin += String.fromCharCode(encryptedBytes[i]);
        }
        const b64 = btoa(bin);
        return includePrefix ? `[XOR:B64] ${b64}` : b64;
    }

    const binaryChunks: string[] = [];
    for (let i = 0; i < encryptedBytes.length; i++) {
        binaryChunks.push(encryptedBytes[i].toString(2).padStart(8, "0"));
    }
    const b = binaryChunks.join(" ");
    return includePrefix ? `[XOR] ${b}` : b;
}

export function xorDecrypt(cipherText: string, secretWord: string): { success: boolean; text: string } {
    const cleanKey = (secretWord || "").trim();
    if (!cleanKey) return { success: false, text: "Secret Word is missing." };

    let cleaned = cipherText.trim();
    let format: XorFormat = "binary";

    if (cleaned.startsWith("[XOR:HEX]")) {
        format = "hex";
        cleaned = cleaned.slice(9).trim();
    } else if (cleaned.startsWith("[XOR:B64]")) {
        format = "base64";
        cleaned = cleaned.slice(9).trim();
    } else if (cleaned.startsWith("[XOR]") || cleaned.startsWith("[XOR:BIN]")) {
        format = "binary";
        cleaned = cleaned.replace(/^\[XOR(?::BIN)?\]\s*/, "").trim();
    }

    let rawBytes: Uint8Array | null = null;
    if (format === "binary" || (/^[01\s]+$/.test(cleaned) && cleaned.includes(" "))) {
        const binClean = cleaned.replace(/[^01]/g, "");
        if (binClean.length % 8 === 0 && binClean.length > 0) {
            rawBytes = new Uint8Array(binClean.length / 8);
            for (let i = 0; i < rawBytes.length; i++) {
                rawBytes[i] = parseInt(binClean.slice(i * 8, (i + 1) * 8), 2);
            }
        }
    } else if (format === "hex" || (/^[0-9a-fA-F\s]+$/.test(cleaned) && cleaned.includes(" "))) {
        const hexClean = cleaned.replace(/[^0-9a-fA-F]/g, "");
        if (hexClean.length % 2 === 0 && hexClean.length > 0) {
            rawBytes = new Uint8Array(hexClean.length / 2);
            for (let i = 0; i < rawBytes.length; i++) {
                rawBytes[i] = parseInt(hexClean.slice(i * 2, (i + 1) * 2), 16);
            }
        }
    }

    if (!rawBytes) {
        return { success: false, text: "Invalid XOR ciphertext." };
    }

    const keyBytes = encoder.encode(cleanKey);
    const decryptedBytes = xorBytes(rawBytes, keyBytes);
    return { success: true, text: decoder.decode(decryptedBytes) };
}

/* ==========================================================================
   11. Unified Encrypt & Auto-Decrypt Functions
   ========================================================================== */

export async function encryptMessage(
    text: string,
    method: CipherMethod,
    secretWord = "",
    xorFormat: XorFormat = "binary",
    includePrefix = false,
    funnyStyle: FunnyStyle = "superscript",
    inspecttorAccessKey = ""
): Promise<string> {
    if (!text) return "";

    try {
        switch (method) {
            case "inspecttor_server":
                return await encryptInspecttorServer(text, secretWord, inspecttorAccessKey, includePrefix);
            case "inspecttor_offline":
                return await encryptInspecttorOffline(text, secretWord, includePrefix);
            case "pgp":
                return await encryptPgp(text, secretWord, includePrefix);
            case "funny":
                return encryptFunny(text, funnyStyle, includePrefix);
            case "vigenere":
                return vigenereEncrypt(text, secretWord, includePrefix);
            case "morse":
                return textToMorse(text, includePrefix);
            case "binary":
                return textToPlainBinary(text, includePrefix);
            case "hex":
                return textToHex(text, includePrefix);
            case "base64":
                return textToBase64(text, includePrefix);
            case "rot13":
                return rot13Encrypt(text, includePrefix);
            case "xor":
            default:
                return xorEncrypt(text, secretWord, xorFormat, includePrefix);
        }
    } catch (err: any) {
        console.error("[EncryptChat] Encryption error:", err);
        throw err;
    }
}

export async function decryptMessage(
    ciphertext: string,
    secretWord = "",
    inspecttorAccessKey = ""
): Promise<DecryptResult> {
    if (!ciphertext || !ciphertext.trim()) {
        return { success: false, text: "", method: "unknown", error: "Empty message" };
    }

    const trimmed = ciphertext.trim();

    // 1. PGP Armored Message Detection
    if (trimmed.includes("-----BEGIN PGP MESSAGE-----") || trimmed.startsWith("[PGP]")) {
        try {
            const dec = await decryptPgp(trimmed, secretWord);
            if (dec && dec.length > 0) return { success: true, text: dec, method: "pgp" };
        } catch {}
    }

    // 2. Inspecttor Token Auto-Detection (Server Seed or Offline Standalone)
    if (isInspecttorToken(trimmed)) {
        // Try Server Mode first if accessKey is provided
        if (inspecttorAccessKey) {
            try {
                const dec = await decryptInspecttorServer(trimmed, secretWord, inspecttorAccessKey);
                if (dec && dec.length > 0) {
                    return { success: true, text: dec, method: "inspecttor_server" };
                }
            } catch {}
        }
        // Try Offline Standalone Mode
        try {
            const dec = await decryptInspecttorOffline(trimmed, secretWord);
            if (dec && dec.length > 0) {
                return { success: true, text: dec, method: "inspecttor_offline" };
            }
        } catch {}
    }

    // 3. Tag-based Fast Matches
    if (trimmed.startsWith("[INSPECTTOR:OFFLINE]")) {
        try {
            const dec = await decryptInspecttorOffline(trimmed, secretWord);
            if (dec && dec.length > 0) return { success: true, text: dec, method: "inspecttor_offline" };
        } catch {}
    }

    if (trimmed.startsWith("[INSPECTTOR]")) {
        if (inspecttorAccessKey) {
            try {
                const dec = await decryptInspecttorServer(trimmed, secretWord, inspecttorAccessKey);
                if (dec && dec.length > 0) return { success: true, text: dec, method: "inspecttor_server" };
            } catch {}
        }
        try {
            const dec = await decryptInspecttorOffline(trimmed, secretWord);
            if (dec && dec.length > 0) return { success: true, text: dec, method: "inspecttor_offline" };
        } catch {}
    }

    if (trimmed.startsWith("[XOR")) {
        const xorRes = xorDecrypt(trimmed, secretWord);
        if (xorRes.success) return { success: true, text: xorRes.text, method: "xor" };
    }

    if (trimmed.startsWith("[VIGENERE]") || trimmed.startsWith("[VIG]")) {
        const dec = vigenereDecrypt(trimmed, secretWord);
        if (dec && dec.length > 0) return { success: true, text: dec, method: "vigenere" };
    }

    if (trimmed.startsWith("[HEX]")) {
        const hexDec = hexToText(trimmed);
        if (hexDec) return { success: true, text: hexDec, method: "hex" };
    }

    if (trimmed.startsWith("[BASE64]") || trimmed.startsWith("[B64]")) {
        const b64Dec = base64ToText(trimmed);
        if (b64Dec) return { success: true, text: b64Dec, method: "base64" };
    }

    if (trimmed.startsWith("[ROT13]")) {
        return { success: true, text: rot13Decrypt(trimmed), method: "rot13" };
    }

    if (trimmed.startsWith("[REVERSE]") || trimmed.startsWith("[REV]")) {
        return { success: true, text: reverseTextDecrypt(trimmed), method: "funny" };
    }

    if (trimmed.startsWith("[SUPERSCRIPT]")) {
        return { success: true, text: fromSuperscript(trimmed), method: "funny" };
    }

    if (trimmed.startsWith("[SUBSCRIPT]")) {
        return { success: true, text: fromSubscript(trimmed), method: "funny" };
    }

    if (trimmed.startsWith("[BUBBLE]")) {
        return { success: true, text: fromBubble(trimmed), method: "funny" };
    }

    if (trimmed.startsWith("[UPSIDEDOWN]")) {
        return { success: true, text: fromUpsideDown(trimmed), method: "funny" };
    }

    if (trimmed.startsWith("[SMALLCAPS]")) {
        return { success: true, text: fromSmallCaps(trimmed), method: "funny" };
    }

    if (trimmed.startsWith("[FULLWIDTH]")) {
        return { success: true, text: fromFullwidth(trimmed), method: "funny" };
    }

    if (trimmed.startsWith("[ZALGO]")) {
        return { success: true, text: fromZalgo(trimmed), method: "funny" };
    }

    if (trimmed.startsWith("[STRIKE]")) {
        return { success: true, text: fromStrikethrough(trimmed), method: "funny" };
    }

    if (trimmed.startsWith("[UNDERLINE]")) {
        return { success: true, text: fromUnderline(trimmed), method: "funny" };
    }

    if (trimmed.startsWith("[MORSE]")) {
        const morseDec = morseToText(trimmed);
        if (morseDec && morseDec.length > 0) return { success: true, text: morseDec, method: "morse" };
    }

    if (trimmed.startsWith("[BINARY]")) {
        const plainBin = plainBinaryToText(trimmed);
        if (plainBin && plainBin.length > 0) return { success: true, text: plainBin, method: "binary" };
    }

    // 4. Tag-less Auto-Detection: Strikethrough / Underline
    if (/\u0336/.test(trimmed)) {
        return { success: true, text: fromStrikethrough(trimmed), method: "funny" };
    }
    if (/\u0332/.test(trimmed)) {
        return { success: true, text: fromUnderline(trimmed), method: "funny" };
    }

    // 5. Tag-less Auto-Detection: Zalgo Glitch Text
    if (/[\u0300-\u036f\u1dc0-\u1dff\u20d0-\u20ff]/.test(trimmed)) {
        const zalgoDec = fromZalgo(trimmed);
        if (zalgoDec && zalgoDec !== trimmed) {
            return { success: true, text: zalgoDec, method: "funny" };
        }
    }

    // 6. Tag-less Auto-Detection: Superscript
    if (/[ᵃᵇᶜᵈᵉᶠᵍʰⁱʲᵏˡᵐⁿᵒᵖʳˢᵗᵘᵛʷˣʸᶻᴬᴮᴰᴱᴳᴴᴵᴶᴷᴸᴹᴺᴼᴾᴿᵀᵁⱽᵂ⁰¹²³⁴⁵⁶⁷⁸⁹]/.test(trimmed)) {
        const superDec = fromSuperscript(trimmed);
        if (superDec && superDec !== trimmed) {
            return { success: true, text: superDec, method: "funny" };
        }
    }

    // 7. Tag-less Auto-Detection: Subscript
    if (/[ₐₑₕᵢⱼₖₗₘₙₒₚᵣₛₜᵤᵥₓ₀₁₂₃₄₅₆₇₈₉]/.test(trimmed)) {
        const subDec = fromSubscript(trimmed);
        if (subDec && subDec !== trimmed) {
            return { success: true, text: subDec, method: "funny" };
        }
    }

    // 8. Tag-less Auto-Detection: Bubble Text
    if (/[\u24B6-\u24E9\u2460-\u24EA]/.test(trimmed)) {
        const bubbleDec = fromBubble(trimmed);
        if (bubbleDec && bubbleDec !== trimmed) {
            return { success: true, text: bubbleDec, method: "funny" };
        }
    }

    // 9. Tag-less Auto-Detection: Fullwidth
    if (/[\uff01-\uff5e\u3000]/.test(trimmed)) {
        const fwDec = fromFullwidth(trimmed);
        if (fwDec && fwDec !== trimmed) {
            return { success: true, text: fwDec, method: "funny" };
        }
    }

    // 10. Tag-less Auto-Detection: Small Caps
    if (/[ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘǫʀꜱᴛᴜᴠᴡʏᴢ]/.test(trimmed)) {
        const scDec = fromSmallCaps(trimmed);
        if (scDec && scDec !== trimmed) {
            return { success: true, text: scDec, method: "funny" };
        }
    }

    // 11. Tag-less Auto-Detection: Upside Down Unicode
    if (/[\u0250-\u02AF\u2144\u2200\u018E\u2132\u2141\u02D9\u00BF\u00A1]/.test(trimmed)) {
        const udDec = fromUpsideDown(trimmed);
        if (udDec && udDec !== trimmed) {
            return { success: true, text: udDec, method: "funny" };
        }
    }

    // 12. Tag-less Auto-Detection: Morse Code (strict check: only dots, dashes, and slashes)
    if (/^[.\-/\s]+$/.test(trimmed) && trimmed.length > 2 && (trimmed.includes(".") || trimmed.includes("-"))) {
        const morseDec = morseToText(trimmed);
        if (morseDec && morseDec.length > 0 && morseDec !== trimmed) {
            return { success: true, text: morseDec, method: "morse" };
        }
    }

    // 13. Tag-less Auto-Detection: Binary (strict check: space-separated 8-bit bytes)
    if (/^[01]{8}(\s+[01]{8})+$/.test(trimmed)) {
        const plainBin = plainBinaryToText(trimmed);
        if (plainBin && plainBin.length > 0) {
            return { success: true, text: plainBin, method: "binary" };
        }
    }

    // 14. Tag-less Auto-Detection: Hex (strict check: space-separated 2-char hex bytes)
    if (/^[0-9a-fA-F]{2}(\s+[0-9a-fA-F]{2})+$/.test(trimmed)) {
        const hexDec = hexToText(trimmed);
        if (hexDec && hexDec.length > 0) {
            return { success: true, text: hexDec, method: "hex" };
        }
    }

    return {
        success: false,
        text: "Could not decrypt message.",
        method: "unknown"
    };
}
