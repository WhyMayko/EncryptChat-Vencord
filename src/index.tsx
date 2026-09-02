/*
 * Encrypt Chat - Vencord Plugin
 * Encrypt and decrypt messages with Inspecttor (Server & Offline), PGP, XOR, Vigenère, Morse Code, Binary, and Funny Texts.
 * Created by Mayko (@whymayko)
 */

import "./styles.css";

import { findGroupChildrenByChildId, NavContextMenuPatchCallback } from "@api/ContextMenu";
import definePlugin from "@utils/types";
import { Message } from "@vencord/discord-types";
import { ChannelStore, Menu, showToast } from "@webpack/common";

import {
    CipherMethod,
    decryptMessage,
    encryptMessage,
    FunnyStyle,
    InspecttorMode,
    XorFormat
} from "./cipher";
import { settings } from "./settings";
import { handleMessageDecrypt, XorAccessory } from "./XorAccessory";
import { XorChatBarIcon, XorIcon } from "./XorIcon";

function getMessageContent(message: Message): string {
    return (
        message.content ||
        message.messageSnapshots?.[0]?.message.content ||
        message.embeds?.find(embed => embed.type === "auto_moderation_message")?.rawDescription ||
        ""
    );
}

const messageCtxPatch: NavContextMenuPatchCallback = (children, { message }: { message: Message }) => {
    const content = getMessageContent(message);
    if (!content) return;

    const group = findGroupChildrenByChildId("copy-text", children);
    if (!group) return;

    const copyIdx = group.findIndex(c => c?.props?.id === "copy-text");
    const insertIdx = copyIdx !== -1 ? copyIdx + 1 : group.length;

    group.splice(
        insertIdx,
        0,
        <Menu.MenuItem
            id="vc-encrypt-chat-decrypt"
            label="Decrypt Message"
            icon={XorIcon}
            leadingAccessory={{ type: "icon", icon: XorIcon }}
            action={async () => {
                const res = await decryptMessage(
                    content,
                    settings.store.secretWord,
                    settings.store.inspecttorAccessKey
                );
                handleMessageDecrypt(message.id, res);
            }}
        />
    );
};

function handleGlobalKeydown(e: KeyboardEvent) {
    // Ctrl + Alt + E: Quick toggle encryption on/off from anywhere
    if (e.ctrlKey && e.altKey && (e.key === "e" || e.key === "E")) {
        e.preventDefault();
        settings.store.autoEncrypt = !settings.store.autoEncrypt;
        showToast(
            settings.store.autoEncrypt ? "🔒 Encrypt Chat: ON" : "🔓 Encrypt Chat: OFF"
        );
    }
}

export default definePlugin({
    name: "EncryptChat",
    description: "Military-grade encryption & fun typography for Discord. Created by @whymayko.",
    tags: ["Chat", "Utility", "Security"],
    authors: [
        {
            name: "Mayko (@whymayko)",
            id: 0n
        }
    ],
    settings,

    start() {
        window.addEventListener("keydown", handleGlobalKeydown);
    },

    stop() {
        window.removeEventListener("keydown", handleGlobalKeydown);
    },

    contextMenus: {
        message: messageCtxPatch
    },

    renderMessageAccessory: props => <XorAccessory message={props.message} />,

    chatBarButton: {
        icon: XorIcon,
        render: XorChatBarIcon
    },

    messagePopoverButton: {
        icon: XorIcon,
        render(message: Message) {
            const content = getMessageContent(message);
            if (!content) return null;

            return {
                label: "Decrypt Message",
                icon: XorIcon,
                message,
                channel: ChannelStore.getChannel(message.channel_id),
                onClick: async () => {
                    const res = await decryptMessage(
                        content,
                        settings.store.secretWord,
                        settings.store.inspecttorAccessKey
                    );
                    handleMessageDecrypt(message.id, res);
                }
            };
        }
    },

    async onBeforeMessageSend(_, message) {
        if (!settings.store.autoEncrypt) return;
        if (!message.content) return;

        try {
            const encrypted = await encryptMessage(
                message.content,
                settings.store.method as CipherMethod,
                settings.store.secretWord,
                settings.store.xorFormat as XorFormat,
                settings.store.includeMethodPrefix,
                settings.store.funnyStyle as FunnyStyle,
                settings.store.inspecttorAccessKey,
                settings.store.inspecttorMode as InspecttorMode
            );

            if (encrypted) {
                message.content = encrypted;
            }
        } catch (err) {
            console.error("[EncryptChat] onBeforeMessageSend error:", err);
        }
    }
});
