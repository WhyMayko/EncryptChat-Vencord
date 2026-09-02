import { copyToClipboard } from "@utils/clipboard";
import { Message } from "@vencord/discord-types";
import { Parser, useEffect, useState } from "@webpack/common";

import { DecryptResult, decryptMessage } from "./cipher";
import { settings } from "./settings";
import { XorIcon } from "./XorIcon";

const DecryptSetters = new Map<string, (result: DecryptResult | undefined) => void>();

export function handleMessageDecrypt(messageId: string, data: DecryptResult) {
    const setter = DecryptSetters.get(messageId);
    if (setter) {
        setter(data);
    }
}

export function getMessageContent(message: Message): string {
    return (
        message.content ||
        message.messageSnapshots?.[0]?.message.content ||
        message.embeds?.find(embed => embed.type === "auto_moderation_message")?.rawDescription ||
        ""
    );
}

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);

    const onCopy = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        copyToClipboard(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
    };

    return (
        <button
            onClick={onCopy}
            className="vc-xor-copy-btn"
            type="button"
            title="Copy plain text to clipboard"
        >
            {copied ? "Copied! ✓" : "Copy"}
        </button>
    );
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
    inspecttor: "Inspecttor",
    pgp: "PGP",
    discord: "Discord",
    funny: "Funny Text",
    xor: "XOR Cipher",
    vigenere: "Vigenère",
    morse: "Morse Code",
    binary: "Binary",
    hex: "Hexadecimal",
    base64: "Base64",
    rot13: "ROT13",
    unknown: "Decrypted"
};

export function XorAccessory({ message }: { message: Message }) {
    const [decrypted, setDecrypted] = useState<DecryptResult | undefined>();
    const { autoDecrypt, secretWord, inspecttorAccessKey } = settings.use([
        "autoDecrypt",
        "secretWord",
        "inspecttorAccessKey"
    ]);

    useEffect(() => {
        if ((message as any).vencordEmbeddedBy) return;

        DecryptSetters.set(message.id, setDecrypted);

        let isCurrent = true;
        if (autoDecrypt) {
            const content = getMessageContent(message);
            if (content && content.trim()) {
                decryptMessage(content, secretWord, inspecttorAccessKey)
                    .then(res => {
                        if (isCurrent && res.success) {
                            setDecrypted(res);
                        }
                    })
                    .catch(() => {});
            }
        }

        return () => {
            isCurrent = false;
            DecryptSetters.delete(message.id);
        };
    }, [message.id, (message as any).content, autoDecrypt, secretWord, inspecttorAccessKey]);

    if (!decrypted) return null;

    if (!decrypted.success) {
        return (
            <div className="vc-xor-accessory vc-xor-accessory-error">
                <div className="vc-xor-accessory-main">
                    <XorIcon
                        width={16}
                        height={16}
                        isLocked={true}
                        className="vc-xor-accessory-icon vc-xor-error-icon"
                    />
                    <span className="vc-xor-error-text">{decrypted.text}</span>
                </div>
                <div className="vc-xor-meta">
                    <span>Decryption Failed</span>
                    <span className="vc-xor-meta-separator">•</span>
                    <Dismiss onDismiss={() => setDecrypted(undefined)} />
                </div>
            </div>
        );
    }

    const methodDisplay = METHOD_LABELS[decrypted.method] || "Decrypted";

    return (
        <div className="vc-xor-accessory">
            <div className="vc-xor-accessory-main">
                <XorIcon
                    width={16}
                    height={16}
                    isLocked={false}
                    className="vc-xor-accessory-icon vc-xor-success-icon"
                />
                <span className="vc-xor-content">
                    {Parser.parse(decrypted.text)}
                </span>
            </div>
            <div className="vc-xor-meta">
                <span>{methodDisplay}</span>
                <span className="vc-xor-meta-separator">•</span>
                <CopyButton text={decrypted.text} />
                <span className="vc-xor-meta-separator">•</span>
                <Dismiss onDismiss={() => setDecrypted(undefined)} />
            </div>
        </div>
    );
}
