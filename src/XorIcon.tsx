/*
 * Encrypt Chat - Chat Bar Lock Icon Component
 * Follows the exact structure of TranslateIcon for 100% native Discord styling
 */

import { ChatBarButton, ChatBarButtonFactory } from "@api/ChatButtons";
import { classNameFactory } from "@utils/css";

import { settings } from "./settings";
import { openXorModal } from "./XorModal";

const cl = classNameFactory("vc-xor-");

export interface XorIconProps extends React.SVGProps<SVGSVGElement> {
    isLocked?: boolean;
}

const LOCKED_PATH = "M12 2C9.243 2 7 4.243 7 7V10H6C4.897 10 4 10.897 4 12V20C4 21.103 4.897 22 6 22H18C19.103 22 20 21.103 20 20V12C20 10.897 19.103 10 18 10H17V7C17 4.243 14.757 2 12 2ZM9 7C9 5.346 10.346 4 12 4C13.654 4 15 5.346 15 7V10H9V7ZM12 14C11.171 14 10.5 14.671 10.5 15.5C10.5 16.091 10.846 16.598 11.344 16.837L10.75 19H13.25L12.656 16.837C13.154 16.598 13.5 16.091 13.5 15.5C13.5 14.671 12.829 14 12 14Z";
const UNLOCKED_PATH = "M18 10H17V7C17 4.243 14.757 2 12 2C9.243 2 7 4.243 7 7V8H9V7C9 5.346 10.346 4 12 4C13.654 4 15 5.346 15 7V10H6C4.897 10 4 10.897 4 12V20C4 21.103 4.897 22 6 22H18C19.103 22 20 21.103 20 20V12C20 10.897 19.103 10 18 10ZM12 14C11.171 14 10.5 14.671 10.5 15.5C10.5 16.091 10.846 16.598 11.344 16.837L10.75 19H13.25L12.656 16.837C13.154 16.598 13.5 16.091 13.5 15.5C13.5 14.671 12.829 14 12 14Z";

export function XorIcon({ isLocked = true, width = 24, height = 24, className, ...props }: XorIconProps) {
    return (
        <svg
            width={width}
            height={height}
            viewBox="0 0 24 24"
            className={cl("icon", className)}
            {...props}
        >
            <path
                fill="currentColor"
                fillRule="evenodd"
                clipRule="evenodd"
                d={isLocked ? LOCKED_PATH : UNLOCKED_PATH}
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
                "aria-label": "Encrypt Chat"
            }}
        >
            <XorIcon
                isLocked={autoEncrypt}
                className={cl({ "auto-encrypt": autoEncrypt, "chat-button": true })}
            />
        </ChatBarButton>
    );
};
