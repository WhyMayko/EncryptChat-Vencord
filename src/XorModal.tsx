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
    DiscordCategory,
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

const categoryOptions = [
    { label: "All Styles", value: "all" as DiscordCategory },
    { label: "Color", value: "color" as DiscordCategory },
    { label: "Language Code", value: "code" as DiscordCategory },
    { label: "Text Formatting", value: "text" as DiscordCategory },
    { label: "Size & Headers", value: "size" as DiscordCategory }
];

const discordStyleOptionsByCategory: Record<DiscordCategory, { label: string; value: DiscordStyle }[]> = {
    all: [
        { label: "[Color] Diff Green (+ green lines)", value: "diff-green" },
        { label: "[Color] Diff Red (- red lines)", value: "diff-red" },
        { label: "[Color] ANSI Green", value: "ansi-green" },
        { label: "[Color] ANSI Red", value: "ansi-red" },
        { label: "[Color] ANSI Cyan", value: "ansi-cyan" },
        { label: "[Color] ANSI Blue", value: "ansi-blue" },
        { label: "[Color] ANSI Yellow", value: "ansi-yellow" },
        { label: "[Color] ANSI Pink", value: "ansi-pink" },
        { label: "[Color] ANSI White Bold", value: "ansi-white" },
        { label: "[Color] ANSI Gray", value: "ansi-gray" },
        { label: "[Code] Lua Codeblock (Color)", value: "lua" },
        { label: "[Code] Python Codeblock", value: "python" },
        { label: "[Code] JavaScript Codeblock", value: "javascript" },
        { label: "[Code] TypeScript Codeblock", value: "typescript" },
        { label: "[Code] JSON Codeblock", value: "json" },
        { label: "[Code] CSS Codeblock", value: "css" },
        { label: "[Code] HTML / XML Codeblock", value: "xml" },
        { label: "[Code] C++ Codeblock", value: "cpp" },
        { label: "[Code] SQL Codeblock", value: "sql" },
        { label: "[Code] YAML Codeblock", value: "yaml" },
        { label: "[Code] Bash Codeblock", value: "bash" },
        { label: "[Code] Markdown Codeblock", value: "markdown" },
        { label: "[Code] Plain Box (Copyable)", value: "box" },
        { label: "[Code] Spoiler Box (Hidden Codeblock)", value: "spoiler-box" },
        { label: "[Text] Spoiler (||hidden||)", value: "spoiler" },
        { label: "[Text] Inline Code (`text`)", value: "inline-code" },
        { label: "[Text] Quote (> blockquote)", value: "quote" },
        { label: "[Text] Multiline Quote (>>> text)", value: "multiquote" },
        { label: "[Text] Bullet List (- item)", value: "list" },
        { label: "[Text] Bold (**text**)", value: "bold" },
        { label: "[Text] Italic (*text*)", value: "italic" },
        { label: "[Text] Bold Italic (***text***)", value: "bold-italic" },
        { label: "[Text] Underline (__text__)", value: "underline" },
        { label: "[Text] Strikethrough (~~text~~)", value: "strikethrough" },
        { label: "[Size] Header 1 (# Large)", value: "h1" },
        { label: "[Size] Header 2 (## Medium)", value: "h2" },
        { label: "[Size] Header 3 (### Small)", value: "h3" },
        { label: "[Size] Subtext (-# Tiny Gray)", value: "subtext" }
    ],
    color: [
        { label: "Diff Green (+ green lines)", value: "diff-green" },
        { label: "Diff Red (- red lines)", value: "diff-red" },
        { label: "ANSI Green", value: "ansi-green" },
        { label: "ANSI Red", value: "ansi-red" },
        { label: "ANSI Cyan", value: "ansi-cyan" },
        { label: "ANSI Blue", value: "ansi-blue" },
        { label: "ANSI Yellow", value: "ansi-yellow" },
        { label: "ANSI Pink", value: "ansi-pink" },
        { label: "ANSI White Bold", value: "ansi-white" },
        { label: "ANSI Gray", value: "ansi-gray" }
    ],
    code: [
        { label: "Lua Codeblock (Color)", value: "lua" },
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
        { label: "Spoiler Box (Hidden Codeblock)", value: "spoiler-box" }
    ],
    text: [
        { label: "Spoiler (||hidden||)", value: "spoiler" },
        { label: "Inline Code (`text`)", value: "inline-code" },
        { label: "Quote (> blockquote)", value: "quote" },
        { label: "Multiline Quote (>>> text)", value: "multiquote" },
        { label: "Bullet List (- item)", value: "list" },
        { label: "Bold (**text**)", value: "bold" },
        { label: "Italic (*text*)", value: "italic" },
        { label: "Bold Italic (***text***)", value: "bold-italic" },
        { label: "Underline (__text__)", value: "underline" },
        { label: "Strikethrough (~~text~~)", value: "strikethrough" }
    ],
    size: [
        { label: "Header 1 (# Large)", value: "h1" },
        { label: "Header 2 (## Medium)", value: "h2" },
        { label: "Header 3 (### Small)", value: "h3" },
        { label: "Subtext (-# Tiny Gray)", value: "subtext" }
    ]
};

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

export function UniversalSettingsView({ closePluginSettings }: { closePluginSettings?: () => void }) {
    useEffect(() => {
        if (closePluginSettings) {
            closePluginSettings();
            openXorModal();
        }
    }, [closePluginSettings]);

    const {
        method,
        inspecttorMode,
        inspecttorAccessKey,
        secretWord,
        discordCategory,
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
        "discordCategory",
        "discordStyle",
        "funnyStyle",
        "xorFormat",
        "includeMethodPrefix",
        "autoEncrypt",
        "autoDecrypt"
    ]);

    const [testInput, setTestInput] = useState("Hello World!");
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
        discordCategory,
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

    const currentCategory = (discordCategory as DiscordCategory) || "all";
    const currentStyleOptions = discordStyleOptionsByCategory[currentCategory] || discordStyleOptionsByCategory.all;

    return (
        <div className="vc-encrypt-chat-settings-view">
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

            {method === "discord" && (
                <>
                    <section className={Margins.bottom16}>
                        <Forms.FormTitle tag="h3">Discord Category</Forms.FormTitle>
                        <SearchableSelect
                            options={categoryOptions}
                            value={currentCategory}
                            placeholder="Select category"
                            maxVisibleItems={5}
                            closeOnSelect={true}
                            onChange={(val: DiscordCategory) => {
                                settings.store.discordCategory = val;
                                if (val !== "all") {
                                    const available = discordStyleOptionsByCategory[val];
                                    if (!available.some(opt => opt.value === settings.store.discordStyle)) {
                                        settings.store.discordStyle = available[0].value;
                                    }
                                }
                            }}
                        />
                    </section>

                    <section className={Margins.bottom16}>
                        <Forms.FormTitle tag="h3">Discord Style</Forms.FormTitle>
                        <SearchableSelect
                            options={currentStyleOptions}
                            value={discordStyle}
                            placeholder="Select style"
                            maxVisibleItems={6}
                            closeOnSelect={true}
                            onChange={(val: DiscordStyle) => {
                                settings.store.discordStyle = val;
                            }}
                        />
                    </section>
                </>
            )}

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
        </div>
    );
}

function EncryptionSettingsModal({ rootProps }: { rootProps: RenderModalProps }) {
    return (
        <Modal {...rootProps} title="Encrypt Chat - Settings">
            <UniversalSettingsView />
        </Modal>
    );
}

export function openXorModal() {
    openModal(props => <EncryptionSettingsModal rootProps={props} />);
}
