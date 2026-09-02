/*
 * Encryption Chat Plugin - Message Accessory Component
 */

import { Message } from "@vencord/discord-types";
import { Parser, useEffect, useState } from "@webpack/common";

import { DecryptResult } from "./cipher";
import { XorIcon } from "./XorIcon";

const DecryptSetters = new Map<string, (result: DecryptResult | undefined) => void>();

export function handleMessageDecrypt(messageId: string, data: DecryptResult) {
    const setter = DecryptSetters.get(messageId);
    if (setter) {
        setter(data);
    }
}

function Dismiss({ onDismiss }: { onDismiss: () => void }) {
    return (
        <button
            onClick={onDismiss}
            className="vc-xor-dismiss"
            type="button"
        >
            Dismiss
        </button>
    );
}

const METHOD_LABELS: Record<string, string> = {
    pgp: "PGP",
    inspecttor: "Inspecttor",
    funny: "Funny Text",
    xor: "XOR Cipher",
    vigenere: "Vigenère",
    morse: "Morse Code",
    binary: "Binary",
    hex: "Hexadecimal",
    base64: "Base64",
    rot13: "ROT13",
    reverse: "Reverse Text",
    unknown: "Decrypted"
};

export function XorAccessory({ message }: { message: Message }) {
    const [decrypted, setDecrypted] = useState<DecryptResult | undefined>();

    useEffect(() => {
        if ((message as any).vencordEmbeddedBy) return;

        DecryptSetters.set(message.id, setDecrypted);
        return () => {
            DecryptSetters.delete(message.id);
        };
    }, [message.id]);

    if (!decrypted) return null;

    if (!decrypted.success) {
        return (
            <div className="vc-xor-accessory vc-xor-accessory-error">
                <XorIcon width={16} height={16} className="vc-xor-accessory-icon" />
                <span className="vc-xor-error-text">{decrypted.text}</span>
                <br />
                <span className="vc-xor-meta">
                    Decryption Failed • <Dismiss onDismiss={() => setDecrypted(undefined)} />
                </span>
            </div>
        );
    }

    const methodDisplay = METHOD_LABELS[decrypted.method] || "Decrypted";

    return (
        <div className="vc-xor-accessory">
            <XorIcon width={16} height={16} className="vc-xor-accessory-icon" />
            <span className="vc-xor-content">
                {Parser.parse(decrypted.text)}
            </span>
            <br />
            <span className="vc-xor-meta">
                {methodDisplay} • <Dismiss onDismiss={() => setDecrypted(undefined)} />
            </span>
        </div>
    );
}
