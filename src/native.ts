/*
 * Encrypt Chat - Electron Main Process Native Helper
 * Bypasses Discord renderer CORS & CSP for Inspecttor Server validation API
 */

import { IpcMainInvokeEvent } from "electron";

let cachedToken: { key: string; token: string; until: number } | null = null;
const seedCache = new Map<string, string>();

export async function fetchInspecttorSeed(
    _: IpcMainInvokeEvent,
    server: string,
    accessKey: string,
    saltHex: string
): Promise<string> {
    const cleanKey = (accessKey || "").trim();
    if (!cleanKey) throw new Error("Server Access Key is required.");

    const effectiveServer = (server || "https://inspecttor.xyz").replace(/\/+$/, "");
    const cacheKey = `${effectiveServer}:${cleanKey}:${saltHex}`;
    const cached = seedCache.get(cacheKey);
    if (cached) return cached;

    const now = Date.now();
    if (!cachedToken || cachedToken.key !== cleanKey || cachedToken.until < now + 30000) {
        const tokenRes = await fetch(`${effectiveServer}/translator/token`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ key: cleanKey })
        });
        if (tokenRes.status === 401) throw new Error("Invalid Server Access Key.");
        if (!tokenRes.ok) throw new Error(`Token request failed (${tokenRes.status})`);

        const data = await tokenRes.json();
        cachedToken = { key: cleanKey, token: data.token, until: now + (data.ttl || 3600000) };
    }

    const kdfRes = await fetch(`${effectiveServer}/translator/kdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: cachedToken.token, salt: saltHex })
    });
    if (!kdfRes.ok) throw new Error(`Server seed request failed (${kdfRes.status})`);

    const kdfData = await kdfRes.json();
    if (!kdfData.seed) throw new Error("No seed returned by server.");

    seedCache.set(cacheKey, kdfData.seed);
    return kdfData.seed;
}
