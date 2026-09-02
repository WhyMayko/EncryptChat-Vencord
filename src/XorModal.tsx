/*
 * Encrypt Chat - Settings & Testing Modal
 */

import { Divider } from "@components/Divider";
import { FormSwitch } from "@components/FormSwitch";
import { Margins } from "@utils/margins";
import { RenderModalProps } from "@vencord/discord-types";
import {
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
    decryptMessage,
    encryptMessage,
    FunnyStyle,
    InspecttorMode,
    XorFormat
} from "./cipher";
import { settings } from "./settings";

const methodOptions = [
    { label: "Inspecttor", value: "inspecttor" as CipherMethod },
    { label: "PGP", value: "pgp" as CipherMethod },
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
        "funnyStyle",
        "xorFormat",
        "includeMethodPrefix",
        "autoEncrypt",
        "autoDecrypt"
    ]);

    const [testInput, setTestInput] = useState("Hello World");
    const [liveEncrypted, setLiveEncrypted] = useState("");
    const [liveDecrypted, setLiveDecrypted] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        let isCurrent = true;
        setIsProcessing(true);

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
                    inspecttorMode as InspecttorMode
                );
                if (!isCurrent) return;
                setLiveEncrypted(enc);

                const dec = await decryptMessage(enc, secretWord, inspecttorAccessKey);
                if (!isCurrent) return;
                setLiveDecrypted(dec.success ? dec.text : `[Error: ${dec.text}]`);
            } catch (err: any) {
                if (isCurrent) {
                    setLiveEncrypted(`[${err?.message || "Encryption failed"}]`);
                    setLiveDecrypted("");
                }
            } finally {
                if (isCurrent) setIsProcessing(false);
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

    return (
        <Modal {...rootProps} title="Encrypt Chat - Vencord Settings">
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

            {/* 2. Inspecttor Mode (Sub-dropdown when Inspecttor is selected) */}
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

            {/* 3. Server Access Key (Only when Inspecttor + Server) */}
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
                        placeholder="Enter your secret passphrase..."
                        onChange={(val: string) => {
                            settings.store.secretWord = val;
                        }}
                    />
                </section>
            )}

            {/* 5. Funny Text Style (When Funny Texts is selected) */}
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

            {/* 6. XOR Output Format (When XOR is selected) */}
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

            {/* Include Method Prefix Tag Toggle */}
            <FormSwitch
                title="Include Method Tag in Messages"
                description="Add method prefix tags to outgoing messages. Leave off for pure raw ciphertext without giving any hints to others."
                value={includeMethodPrefix}
                onChange={(val: boolean) => {
                    settings.store.includeMethodPrefix = val;
                }}
                hideBorder
            />

            <Divider className={Margins.bottom16} />

            {/* Auto Encrypt Toggle */}
            <FormSwitch
                title="Auto-Encrypt Outgoing Messages"
                description="Automatically encrypt all sent messages with your selected method. You can also toggle this instantly with the chat bar lock button."
                value={autoEncrypt}
                onChange={(val: boolean) => {
                    settings.store.autoEncrypt = val;
                }}
                hideBorder
            />

            <Divider className={Margins.bottom16} />

            {/* Auto Decrypt Toggle */}
            <FormSwitch
                title="Auto-Translate / Decrypt Incoming Messages"
                description="Automatically decrypt and display incoming encrypted or funny messages directly under the chat message without needing to click."
                value={autoDecrypt}
                onChange={(val: boolean) => {
                    settings.store.autoDecrypt = val;
                }}
                hideBorder
            />

            <Divider className={Margins.bottom16} />

            {/* Live Testing Box */}
            <section className={Margins.bottom16}>
                <Forms.FormTitle tag="h3">
                    Live Playground {isProcessing && <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "normal" }}>(updating...)</span>}
                </Forms.FormTitle>
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
                        🔒 Output:
                    </div>
                    <div style={{ color: "var(--text-positive)", marginBottom: "10px" }}>
                        {liveEncrypted || "..."}
                    </div>

                    <div style={{ color: "var(--text-muted)", marginBottom: "4px", fontWeight: "bold" }}>
                        🔓 Decrypted Preview:
                    </div>
                    <div style={{ color: "var(--text-normal)" }}>
                        {liveDecrypted || "..."}
                    </div>
                </div>
            </section>
        </Modal>
    );
}

export function openXorModal() {
    openModal(props => <EncryptionSettingsModal rootProps={props} />);
}
