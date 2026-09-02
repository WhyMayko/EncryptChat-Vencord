/*
 * Encrypt Chat - Settings & Testing Modal
 * Made with 💜 by Mayko (@whymayko)
 */

import { Divider } from "@components/Divider";
import { FormSwitch } from "@components/FormSwitch";
import { copyToClipboard } from "@utils/clipboard";
import { Margins } from "@utils/margins";
import { RenderModalProps } from "@vencord/discord-types";
import {
    Button,
    Forms,
    Modal,
    openModal,
    SearchableSelect,
    TextInput,
    useEffect,
    useState
} from "@webpack/common";

import {
    CipherMethod,
    DiscordStyle,
    encryptMessage,
    FunnyStyle,
    InspecttorMode,
    XorFormat
} from "./cipher";
import { settings } from "./settings";

const methodOptions = [
    { label: "Inspecttor", value: "inspecttor" as CipherMethod },
    { label: "PGP", value: "pgp" as CipherMethod },
    { label: "Discord", value: "discord" as CipherMethod },
    { label: "Funny Texts", value: "funny" as CipherMethod },
    { label: "XOR Cipher", value: "xor" as CipherMethod },
    { label: "Vigenère", value: "vigenere" as CipherMethod },
    { label: "Morse Code", value: "morse" as CipherMethod },
    { label: "Binary", value: "binary" as CipherMethod },
    { label: "Hexadecimal", value: "hex" as CipherMethod },
    { label: "Base64", value: "base64" as CipherMethod },
    { label: "ROT13", value: "rot13" as CipherMethod }
];

const inspecttorModeOptions = [
    { label: "Server", value: "server" as InspecttorMode },
    { label: "Offline", value: "offline" as InspecttorMode }
];

const discordStyleOptions = [
    { label: "Lua Codeblock (Color)", value: "lua" as DiscordStyle },
    { label: "Diff Green (+ green lines)", value: "diff-green" as DiscordStyle },
    { label: "Diff Red (- red lines)", value: "diff-red" as DiscordStyle },
    { label: "ANSI Green", value: "ansi-green" as DiscordStyle },
    { label: "ANSI Red", value: "ansi-red" as DiscordStyle },
    { label: "ANSI Cyan", value: "ansi-cyan" as DiscordStyle },
    { label: "ANSI Blue", value: "ansi-blue" as DiscordStyle },
    { label: "ANSI Yellow", value: "ansi-yellow" as DiscordStyle },
    { label: "ANSI Pink", value: "ansi-pink" as DiscordStyle },
    { label: "ANSI White Bold", value: "ansi-white" as DiscordStyle },
    { label: "ANSI Gray", value: "ansi-gray" as DiscordStyle },
    { label: "Python Codeblock", value: "python" as DiscordStyle },
    { label: "JavaScript Codeblock", value: "javascript" as DiscordStyle },
    { label: "TypeScript Codeblock", value: "typescript" as DiscordStyle },
    { label: "JSON Codeblock", value: "json" as DiscordStyle },
    { label: "CSS Codeblock", value: "css" as DiscordStyle },
    { label: "HTML / XML Codeblock", value: "xml" as DiscordStyle },
    { label: "C++ Codeblock", value: "cpp" as DiscordStyle },
    { label: "SQL Codeblock", value: "sql" as DiscordStyle },
    { label: "YAML Codeblock", value: "yaml" as DiscordStyle },
    { label: "Bash Codeblock", value: "bash" as DiscordStyle },
    { label: "Markdown Codeblock", value: "markdown" as DiscordStyle },
    { label: "Plain Box (Copyable)", value: "box" as DiscordStyle },
    { label: "Spoiler Box (Hidden Codeblock)", value: "spoiler-box" as DiscordStyle },
    { label: "Spoiler (||hidden||)", value: "spoiler" as DiscordStyle },
    { label: "Inline Code (`text`)", value: "inline-code" as DiscordStyle },
    { label: "Quote (> blockquote)", value: "quote" as DiscordStyle },
    { label: "Multiline Quote (>>> text)", value: "multiquote" as DiscordStyle },
    { label: "Header 1 (# title)", value: "h1" as DiscordStyle },
    { label: "Header 2 (## title)", value: "h2" as DiscordStyle },
    { label: "Header 3 (### title)", value: "h3" as DiscordStyle },
    { label: "Subtext (-# small text)", value: "subtext" as DiscordStyle },
    { label: "Bullet List (- item)", value: "list" as DiscordStyle },
    { label: "Bold (**text**)", value: "bold" as DiscordStyle },
    { label: "Italic (*text*)", value: "italic" as DiscordStyle },
    { label: "Bold Italic (***text***)", value: "bold-italic" as DiscordStyle },
    { label: "Underline (__text__)", value: "underline" as DiscordStyle },
    { label: "Strikethrough (~~text~~)", value: "strikethrough" as DiscordStyle }
];

const funnyStyleOptions = [
    { label: "Superscript Top", value: "superscript" as FunnyStyle },
    { label: "Subscript Bottom", value: "subscript" as FunnyStyle },
    { label: "Alternating Caps", value: "alternating" as FunnyStyle },
    { label: "Upside Down", value: "upsidedown" as FunnyStyle },
    { label: "Bubble Text", value: "bubble" as FunnyStyle },
    { label: "Reverse", value: "reverse" as FunnyStyle },
    { label: "Small Caps", value: "smallcaps" as FunnyStyle },
    { label: "Fullwidth", value: "fullwidth" as FunnyStyle },
    { label: "Leet Speak", value: "leet" as FunnyStyle },
    { label: "Zalgo Glitch", value: "zalgo" as FunnyStyle },
    { label: "Strikethrough", value: "strikethrough" as FunnyStyle },
    { label: "Underline", value: "underline" as FunnyStyle }
];

const xorFormatOptions = [
    { label: "Binary", value: "binary" as XorFormat },
    { label: "Hexadecimal", value: "hex" as XorFormat },
    { label: "Base64", value: "base64" as XorFormat }
];

function EncryptionSettingsModal({ rootProps }: { rootProps: RenderModalProps }) {
    const {
        method,
        inspecttorMode,
        inspecttorAccessKey,
        secretWord,
        discordStyle,
        funnyStyle,
        xorFormat,
        includeMethodPrefix,
        autoEncrypt,
        autoDecrypt
    } = settings.use([
        "method",
        "inspecttorMode",
        "inspecttorAccessKey",
        "secretWord",
        "discordStyle",
        "funnyStyle",
        "xorFormat",
        "includeMethodPrefix",
        "autoEncrypt",
        "autoDecrypt"
    ]);

    const [testInput, setTestInput] = useState("Hello World");
    const [liveEncrypted, setLiveEncrypted] = useState("");
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        let isCurrent = true;

        const timer = setTimeout(async () => {
            try {
                const enc = await encryptMessage(
                    testInput,
                    method as CipherMethod,
                    secretWord,
                    xorFormat as XorFormat,
                    includeMethodPrefix,
                    funnyStyle as FunnyStyle,
                    inspecttorAccessKey,
                    inspecttorMode as InspecttorMode,
                    discordStyle as DiscordStyle
                );
                if (isCurrent) setLiveEncrypted(enc);
            } catch (err: any) {
                if (isCurrent) {
                    setLiveEncrypted(`[${err?.message || "Encryption failed"}]`);
                }
            }
        }, 150);

        return () => {
            isCurrent = false;
            clearTimeout(timer);
        };
    }, [
        testInput,
        method,
        inspecttorMode,
        inspecttorAccessKey,
        secretWord,
        discordStyle,
        funnyStyle,
        xorFormat,
        includeMethodPrefix
    ]);

    const needsSecretKey =
        method === "inspecttor" ||
        method === "pgp" ||
        method === "xor" ||
        method === "vigenere";

    const isServerInspecttor = method === "inspecttor" && inspecttorMode === "server";

    const copyEncrypted = () => {
        if (!liveEncrypted) return;
        copyToClipboard(liveEncrypted);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
    };

    return (
        <Modal {...rootProps} title="Encrypt Chat - Settings">
            {/* 1. Main Encryption Method */}
            <section className={Margins.bottom16}>
                <Forms.FormTitle tag="h3">Encryption Method</Forms.FormTitle>
                <SearchableSelect
                    options={methodOptions}
                    value={method}
                    placeholder="Select method"
                    maxVisibleItems={6}
                    closeOnSelect={true}
                    onChange={(val: CipherMethod) => {
                        settings.store.method = val;
                    }}
                />
            </section>

            {/* 2. Inspecttor Mode */}
            {method === "inspecttor" && (
                <section className={Margins.bottom16}>
                    <Forms.FormTitle tag="h3">Inspecttor Mode</Forms.FormTitle>
                    <SearchableSelect
                        options={inspecttorModeOptions}
                        value={inspecttorMode}
                        placeholder="Select mode"
                        maxVisibleItems={2}
                        closeOnSelect={true}
                        onChange={(val: InspecttorMode) => {
                            settings.store.inspecttorMode = val;
                        }}
                    />
                </section>
            )}

            {/* 3. Server Access Key */}
            {isServerInspecttor && (
                <section className={Margins.bottom16}>
                    <Forms.FormTitle tag="h3">Server Access Key</Forms.FormTitle>
                    <TextInput
                        value={inspecttorAccessKey || ""}
                        placeholder="Enter server access key..."
                        onChange={(val: string) => {
                            settings.store.inspecttorAccessKey = val;
                        }}
                    />
                </section>
            )}

            {/* 4. Secret Word / Passphrase */}
            {needsSecretKey && (
                <section className={Margins.bottom16}>
                    <Forms.FormTitle tag="h3">Secret Word / Passphrase</Forms.FormTitle>
                    <TextInput
                        value={secretWord || ""}
                        placeholder="Enter passphrase..."
                        onChange={(val: string) => {
                            settings.store.secretWord = val;
                        }}
                    />
                </section>
            )}

            {/* 5. Discord Style Selector */}
            {method === "discord" && (
                <section className={Margins.bottom16}>
                    <Forms.FormTitle tag="h3">Discord Style</Forms.FormTitle>
                    <SearchableSelect
                        options={discordStyleOptions}
                        value={discordStyle}
                        placeholder="Select style"
                        maxVisibleItems={6}
                        closeOnSelect={true}
                        onChange={(val: DiscordStyle) => {
                            settings.store.discordStyle = val;
                        }}
                    />
                </section>
            )}

            {/* 6. Funny Text Style */}
            {method === "funny" && (
                <section className={Margins.bottom16}>
                    <Forms.FormTitle tag="h3">Funny Text Style</Forms.FormTitle>
                    <SearchableSelect
                        options={funnyStyleOptions}
                        value={funnyStyle}
                        placeholder="Select style"
                        maxVisibleItems={6}
                        closeOnSelect={true}
                        onChange={(val: FunnyStyle) => {
                            settings.store.funnyStyle = val;
                        }}
                    />
                </section>
            )}

            {/* 7. XOR Output Format */}
            {method === "xor" && (
                <section className={Margins.bottom16}>
                    <Forms.FormTitle tag="h3">XOR Output Format</Forms.FormTitle>
                    <SearchableSelect
                        options={xorFormatOptions}
                        value={xorFormat}
                        placeholder="Select output format"
                        maxVisibleItems={4}
                        closeOnSelect={true}
                        onChange={(val: XorFormat) => {
                            settings.store.xorFormat = val;
                        }}
                    />
                </section>
            )}

            <Divider className={Margins.bottom16} />

            {/* Include Method Prefix */}
            <FormSwitch
                title="Include Method Prefix"
                description="Adds tags like [PGP] or [DISCORD] to messages."
                value={includeMethodPrefix}
                onChange={(val: boolean) => {
                    settings.store.includeMethodPrefix = val;
                }}
                hideBorder
            />

            <Divider className={Margins.bottom16} />

            {/* Auto Encrypt */}
            <FormSwitch
                title="Auto-Encrypt"
                description="Encrypts outgoing messages before sending."
                value={autoEncrypt}
                onChange={(val: boolean) => {
                    settings.store.autoEncrypt = val;
                }}
                hideBorder
            />

            <Divider className={Margins.bottom16} />

            {/* Auto Decrypt */}
            <FormSwitch
                title="Auto-Decrypt"
                description="Automatically decrypts and displays incoming messages."
                value={autoDecrypt}
                onChange={(val: boolean) => {
                    settings.store.autoDecrypt = val;
                }}
                hideBorder
            />

            <Divider className={Margins.bottom16} />

            {/* Playground */}
            <section className={Margins.bottom16}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <Forms.FormTitle tag="h3" style={{ margin: 0 }}>
                        Playground
                    </Forms.FormTitle>
                    <Button
                        size={Button.Sizes.TINY}
                        look={Button.Looks.LINK}
                        onClick={copyEncrypted}
                    >
                        {copied ? "Copied! ✓" : "Copy Encrypted"}
                    </Button>
                </div>
                <TextInput
                    value={testInput}
                    placeholder="Type text to test..."
                    onChange={(val: string) => setTestInput(val)}
                />

                <div
                    style={{
                        marginTop: "12px",
                        padding: "12px",
                        backgroundColor: "var(--background-secondary-alt)",
                        borderRadius: "8px",
                        fontSize: "12px",
                        fontFamily: "var(--font-code, monospace)",
                        wordBreak: "break-all",
                        whiteSpace: "pre-wrap"
                    }}
                >
                    <div style={{ color: "var(--text-muted)", marginBottom: "4px", fontWeight: "bold" }}>
                        Output:
                    </div>
                    <div style={{ color: "var(--text-positive)" }}>
                        {liveEncrypted || "..."}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer
                style={{
                    marginTop: "18px",
                    paddingTop: "12px",
                    borderTop: "1px solid var(--background-modifier-accent)",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    fontSize: "12px",
                    color: "var(--text-muted)"
                }}
            >
                <span>Made with 💜 by <strong style={{ color: "var(--brand-experiment, #5865F2)" }}>@whymayko</strong></span>
            </footer>
        </Modal>
    );
}

export function openXorModal() {
    openModal(props => <EncryptionSettingsModal rootProps={props} />);
}
