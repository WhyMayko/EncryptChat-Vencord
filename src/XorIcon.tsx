/*
 * Encrypt Chat - Chat Bar Lock Icon Component with Smooth Shackle Animation
 */

import { ChatBarButton, ChatBarButtonFactory } from "@api/ChatButtons";
import { classNameFactory } from "@utils/css";

import { settings } from "./settings";
import { openXorModal } from "./XorModal";

const cl = classNameFactory("vc-xor-");

export interface XorIconProps extends React.SVGProps<SVGSVGElement> {
    isLocked?: boolean;
}

export function XorIcon({ isLocked = false, width = 20, height = 20, className, style, ...props }: XorIconProps) {
    return (
        <svg
            width={width}
            height={height}
            viewBox="0 0 24 24"
            className={cl("icon", isLocked ? "locked" : "unlocked", { "auto-encrypt": isLocked }, className)}
            style={{
                overflow: "visible",
                color: isLocked ? "var(--green-360, #23a55a)" : undefined,
                fill: isLocked ? "var(--green-360, #23a55a)" : "currentColor",
                ...style
            }}
            {...props}
        >
            {/* Animated Shackle (Pivots from left at 8px, 10px) */}
            <path
                className={cl("shackle")}
                fill="currentColor"
                d="M8 10V6.5a4 4 0 0 1 8 0V10h-2V6.5a2 2 0 0 0-4 0V10H8z"
            />
            {/* Lock Body with Keyhole cutout */}
            <path
                className={cl("body")}
                fill="currentColor"
                fillRule="evenodd"
                clipRule="evenodd"
                d="M5 10h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2zm7 3a1.5 1.5 0 0 0-1.5 1.5c0 .54.29.98.7 1.25L10.5 18h3l-.7-2.25c.41-.27.7-.71.7-1.25A1.5 1.5 0 0 0 12 13z"
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
                width={20}
                height={20}
            />
        </ChatBarButton>
    );
};
