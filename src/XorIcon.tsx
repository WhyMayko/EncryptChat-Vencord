/*
 * Encrypt Chat - Chat Bar Lock Icon Component
 */

import { ChatBarButton, ChatBarButtonFactory } from "@api/ChatButtons";

import { settings } from "./settings";
import { openXorModal } from "./XorModal";

export function XorIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            width={props.width ?? 22}
            height={props.height ?? 22}
            viewBox="0 0 24 24"
            fill="currentColor"
            {...props}
        >
            <path
                fill="currentColor"
                d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"
            />
        </svg>
    );
}

export const XorChatBarIcon: ChatBarButtonFactory = () => {
    const { autoEncrypt } = settings.use(["autoEncrypt"]);

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
                "aria-label": "Encrypt Chat"
            }}
        >
            <XorIcon
                className={autoEncrypt ? "vc-xor-button-active" : undefined}
                style={{
                    color: autoEncrypt ? "var(--green-360, #23a55a)" : "var(--interactive-normal)",
                    fill: autoEncrypt ? "var(--green-360, #23a55a)" : "var(--interactive-normal)",
                    opacity: autoEncrypt ? 1 : 0.85
                }}
            />
        </ChatBarButton>
    );
};
