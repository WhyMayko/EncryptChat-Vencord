/*
 * Encrypt Chat - Chat Bar Lock Icon Component
 */

import { ChatBarButton, ChatBarButtonFactory } from "@api/ChatButtons";

import { openXorModal } from "./XorModal";

export function XorIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            width={props.width ?? 24}
            height={props.height ?? 24}
            viewBox="0 0 24 24"
            fill="currentColor"
            {...props}
        >
            <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
        </svg>
    );
}

export const XorChatBarIcon: ChatBarButtonFactory = ({ isMainChat, settings }) => {
    if (!isMainChat) return null;

    const autoEncrypt = settings.use(["autoEncrypt"]).autoEncrypt;

    return (
        <ChatBarButton
            tooltip="Encrypt Chat"
            onClick={() => {
                settings.store.autoEncrypt = !settings.store.autoEncrypt;
            }}
            onContextMenu={e => {
                e.preventDefault();
                e.stopPropagation();
                openXorModal();
            }}
            buttonProps={{
                "aria-label": "Encrypt Chat",
                className: autoEncrypt ? "vc-xor-button-active" : undefined
            }}
        >
            <XorIcon
                style={
                    autoEncrypt
                        ? {
                              color: "var(--green-360, #23a55a)",
                              fill: "var(--green-360, #23a55a)"
                          }
                        : undefined
                }
            />
        </ChatBarButton>
    );
};
