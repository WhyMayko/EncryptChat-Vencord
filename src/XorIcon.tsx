/*
 * Encrypt Chat - Chat Bar Lock Icon Component with Smooth Lock Animation
 */

import { ChatBarButton, ChatBarButtonFactory } from "@api/ChatButtons";
import { classNameFactory } from "@utils/css";

import { settings } from "./settings";
import { openXorModal } from "./XorModal";

const cl = classNameFactory("vc-xor-");

export interface XorIconProps extends React.SVGProps<SVGSVGElement> {
    isLocked?: boolean;
}

export function XorIcon({ isLocked = false, className, width = 20, height = 20, style, ...props }: XorIconProps) {
    return (
        <svg
            width={width}
            height={height}
            viewBox="0 0 24 24"
            className={cl("lock-icon", isLocked ? "locked" : "unlocked", className)}
            style={style}
            {...props}
        >
            {/* Lock Shackle (Animated Top Loop) */}
            <path
                className={cl("shackle")}
                fill="currentColor"
                fillRule="evenodd"
                clipRule="evenodd"
                d="M7 6.5C7 3.73858 9.23858 1.5 12 1.5C14.7614 1.5 17 3.73858 17 6.5V9H15V6.5C15 4.84315 13.6569 3.5 12 3.5C10.3431 3.5 9 4.84315 9 6.5V9H7V6.5Z"
            />
            {/* Lock Body */}
            <rect
                className={cl("body")}
                x="4.5"
                y="8.5"
                width="15"
                height="13"
                rx="3"
                fill="currentColor"
            />
            {/* Keyhole */}
            <circle cx="12" cy="14" r="1.5" fill="var(--background-secondary, #2b2d31)" />
            <path
                d="M11.3 14.5L11 18H13L12.7 14.5H11.3Z"
                fill="var(--background-secondary, #2b2d31)"
            />
        </svg>
    );
}

export const XorChatBarIcon: ChatBarButtonFactory = () => {
    const { autoEncrypt } = settings.use(["autoEncrypt"]);

    return (
        <ChatBarButton
            tooltip={autoEncrypt ? "Encrypt Chat (Active)" : "Encrypt Chat"}
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
                className: cl("chat-btn-wrapper")
            }}
        >
            <XorIcon
                isLocked={autoEncrypt}
                className={autoEncrypt ? cl("auto-encrypt-active") : undefined}
                width={20}
                height={20}
            />
        </ChatBarButton>
    );
};
