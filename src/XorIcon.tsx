/*
 * Encrypt Chat - Lock Icon Component
 * Perfectly proportioned padlock with rooted shackle hinge animation
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
            {/* Shackle: Left leg anchored deep into y=13 inside the body (top at y=10) */}
            <path
                className={cl("shackle")}
                fill="currentColor"
                d="M6 13V6.5a6 6 0 0 1 12 0v4.5h-3.2V6.5a2.8 2.8 0 0 0-5.6 0V13H6z"
            />
            {/* Body: Solid rounded padlock body with keyhole */}
            <path
                className={cl("body")}
                fill="currentColor"
                fillRule="evenodd"
                clipRule="evenodd"
                d="M4 10h16a2.5 2.5 0 0 1 2.5 2.5v7a2.5 2.5 0 0 1-2.5 2.5H4A2.5 2.5 0 0 1 1.5 19.5v-7A2.5 2.5 0 0 1 4 10zm8 3a1.5 1.5 0 0 0-1.5 1.5c0 .54.29.98.7 1.25L10.5 18h3l-.7-2.25c.41-.27.7-.71.7-1.25A1.5 1.5 0 0 0 12 13z"
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
