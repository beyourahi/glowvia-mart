import {cn} from "~/lib/utils";

export interface HeaderActionState {
    isScrolled: boolean;
    useLightText: boolean;
}

const HEADER_ACTION_BASE_CLASSNAME = "min-h-11 font-medium cursor-pointer hover:bg-transparent hover:text-inherit";
const HEADER_TEXT_ACTION_SIZE_CLASSNAME = "px-1.5 sm:px-4 text-sm sm:text-base";
const HEADER_MENU_ACTION_SIZE_CLASSNAME = "min-w-11 text-base";

export const HEADER_ACTION_LINK_RESET_CLASSNAME = "text-inherit no-underline hover:no-underline";

export function getHeaderActionToneClassName({isScrolled, useLightText}: HeaderActionState) {
    return isScrolled || useLightText ? "text-light" : "text-primary";
}

export function getHeaderTextActionClassName(state: HeaderActionState, ...classNames: Array<string | false | null | undefined>) {
    return cn(
        HEADER_ACTION_BASE_CLASSNAME,
        HEADER_TEXT_ACTION_SIZE_CLASSNAME,
        getHeaderActionToneClassName(state),
        ...classNames
    );
}

export function getHeaderMenuActionClassName(
    state: HeaderActionState,
    ...classNames: Array<string | false | null | undefined>
) {
    return cn(
        HEADER_ACTION_BASE_CLASSNAME,
        HEADER_MENU_ACTION_SIZE_CLASSNAME,
        getHeaderActionToneClassName(state),
        ...classNames
    );
}
