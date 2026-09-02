/*
 * Encrypt Chat - Lock Icon Component
 */

import { ChatBarButton, ChatBarButtonFactory } from "@api/ChatButtons";
import { classNameFactory } from "@utils/css";

import { settings } from "./settings";
import { openXorModal } from "./XorModal";

const cl = classNameFactory("vc-xor-");

export interface XorIconProps extends React.SVGProps<SVGSVGElement> {
    isLocked?: boolean;
}

export function XorIcon({ isLocked = true, width = 20, height = 20, className, style, ...props }: XorIconProps) {
    return (
        <svg
            width={width}
            height={height}
            viewBox="0 0 24 24"
            className={cl("icon", isLocked ? "locked" : "unlocked", className)}
            style={{
                overflow: "visible",
                ...style
            }}
            {...props}
        >
            {/* Shackle: Connected directly into the body at y=10.5 */}
            <path
                className={cl("shackle")}
                fill="currentColor"
                d="M7 10.5V6.5a5 5 0 0 1 10 0v4h-2.2V6.5a2.8 2.8 0 0 0-5.6 0v4H7z"
            />
            {/* Lock Body with Keyhole */}
            <path
                className={cl("body")}
                fill="currentColor"
                fillRule="evenodd"
                clipRule="evenodd"
                d="M5 10a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2H5zm7 3a1.5 1.5 0 0 1 1.5 1.5c0 .5-.26.96-.65 1.22l.65 2.28h-3l.65-2.28a1.5 1.5 0 0 1-.65-1.22A1.5 1.5 0 0 1 12 13z"
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
                isLocked={autoEncrypt}
                className={cl({ "auto-encrypt": autoEncrypt, "chat-button": true })}
                style={{
                    color: autoEncrypt ? "var(--green-360, #23a55a)" : undefined
                }}
                width={20}
                height={20}
            />
        </ChatBarButton>
    );
};
