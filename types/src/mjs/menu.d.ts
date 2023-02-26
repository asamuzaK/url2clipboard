export namespace menuItems {
    namespace openOptions {
        export { OPTIONS_OPEN as id };
        export const contexts: string[];
        export const key: string;
    }
    namespace copyPageURL {
        export { COPY_PAGE as id };
        const contexts_1: string[];
        export { contexts_1 as contexts };
        const key_1: string;
        export { key_1 as key };
    }
    namespace copyLinkURL {
        export { COPY_LINK as id };
        const contexts_2: string[];
        export { contexts_2 as contexts };
        const key_2: string;
        export { key_2 as key };
    }
    namespace copyTabURL {
        export { COPY_TAB as id };
        const contexts_3: string[];
        export { contexts_3 as contexts };
        const key_3: string;
        export { key_3 as key };
    }
    namespace copyTabsURL {
        export { COPY_TABS_SELECTED as id };
        const contexts_4: string[];
        export { contexts_4 as contexts };
        const key_4: string;
        export { key_4 as key };
    }
    namespace copyOtherTabsURL {
        export { COPY_TABS_OTHER as id };
        const contexts_5: string[];
        export { contexts_5 as contexts };
        const key_5: string;
        export { key_5 as key };
    }
    namespace copyAllTabsURL {
        export { COPY_TABS_ALL as id };
        const contexts_6: string[];
        export { contexts_6 as contexts };
        const key_6: string;
        export { key_6 as key };
    }
}
export function removeContextMenu(): Promise<any>;
export function createMenuItem(id: string, title: string, data?: object): Promise<void>;
export function createSingleMenuItem(key: string, itemId: string, itemKey: string, itemData: object): Promise<any>;
export function createContextMenu(): Promise<any[]>;
export function updateContextMenu(tabId: number, enabled?: boolean): Promise<any[]>;
export function handleMenusOnShown(info: object, tab: object): Promise<any> | null;
export { enabledFormats };
import { OPTIONS_OPEN } from "./constant.js";
import { COPY_PAGE } from "./constant.js";
import { COPY_LINK } from "./constant.js";
import { COPY_TAB } from "./constant.js";
import { COPY_TABS_SELECTED } from "./constant.js";
import { COPY_TABS_OTHER } from "./constant.js";
import { COPY_TABS_ALL } from "./constant.js";
import { enabledFormats } from "./format.js";
