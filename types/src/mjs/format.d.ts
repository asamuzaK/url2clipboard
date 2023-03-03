export namespace formatData {
    namespace HTMLPlain {
        export { HTML_PLAIN as id };
        export const enabled: boolean;
        export const menu: string;
        export const template: string;
        export const templateAlt: string;
        export const title: string;
    }
    namespace HTMLHyper {
        export { HTML_HYPER as id };
        const enabled_1: boolean;
        export { enabled_1 as enabled };
        const menu_1: string;
        export { menu_1 as menu };
        const template_1: string;
        export { template_1 as template };
        const templateAlt_1: string;
        export { templateAlt_1 as templateAlt };
        const title_1: string;
        export { title_1 as title };
    }
    namespace Markdown {
        export { MARKDOWN as id };
        const enabled_2: boolean;
        export { enabled_2 as enabled };
        const menu_2: string;
        export { menu_2 as menu };
        const template_2: string;
        export { template_2 as template };
        const templateAlt_2: string;
        export { templateAlt_2 as templateAlt };
    }
    namespace BBCodeText {
        export { BBCODE_TEXT as id };
        const enabled_3: boolean;
        export { enabled_3 as enabled };
        const menu_3: string;
        export { menu_3 as menu };
        const template_3: string;
        export { template_3 as template };
        const title_2: string;
        export { title_2 as title };
    }
    namespace BBCodeURL {
        export { BBCODE_URL as id };
        const enabled_4: boolean;
        export { enabled_4 as enabled };
        const menu_4: string;
        export { menu_4 as menu };
        const template_4: string;
        export { template_4 as template };
        const title_3: string;
        export { title_3 as title };
    }
    namespace Textile {
        export { TEXTILE as id };
        const enabled_5: boolean;
        export { enabled_5 as enabled };
        const menu_5: string;
        export { menu_5 as menu };
        const template_5: string;
        export { template_5 as template };
    }
    namespace AsciiDoc {
        export { ASCIIDOC as id };
        const enabled_6: boolean;
        export { enabled_6 as enabled };
        const menu_6: string;
        export { menu_6 as menu };
        const template_6: string;
        export { template_6 as template };
    }
    namespace MediaWiki {
        export { MEDIAWIKI as id };
        const enabled_7: boolean;
        export { enabled_7 as enabled };
        const menu_7: string;
        export { menu_7 as menu };
        const template_7: string;
        export { template_7 as template };
    }
    namespace Jira {
        export { JIRA as id };
        const enabled_8: boolean;
        export { enabled_8 as enabled };
        const menu_8: string;
        export { menu_8 as menu };
        const template_8: string;
        export { template_8 as template };
    }
    namespace reStructuredText {
        export { REST as id };
        const enabled_9: boolean;
        export { enabled_9 as enabled };
        const menu_9: string;
        export { menu_9 as menu };
        const template_9: string;
        export { template_9 as template };
    }
    namespace LaTeX {
        export { LATEX as id };
        const enabled_10: boolean;
        export { enabled_10 as enabled };
        const menu_10: string;
        export { menu_10 as menu };
        const template_10: string;
        export { template_10 as template };
    }
    namespace OrgMode {
        export { ORG_MODE as id };
        const enabled_11: boolean;
        export { enabled_11 as enabled };
        const menu_11: string;
        export { menu_11 as menu };
        const template_11: string;
        export { template_11 as template };
    }
    namespace TextURL {
        export { TEXT_TEXT_URL as id };
        const enabled_12: boolean;
        export { enabled_12 as enabled };
        const menu_12: string;
        export { menu_12 as menu };
        const template_12: string;
        export { template_12 as template };
        const templateAlt_3: string;
        export { templateAlt_3 as templateAlt };
        const title_4: string;
        export { title_4 as title };
    }
    namespace TextOnly {
        export { TEXT_TEXT_ONLY as id };
        const enabled_13: boolean;
        export { enabled_13 as enabled };
        const menu_13: string;
        export { menu_13 as menu };
        const template_13: string;
        export { template_13 as template };
        const title_5: string;
        export { title_5 as title };
    }
    namespace URLOnly {
        export { TEXT_URL_ONLY as id };
        const enabled_14: boolean;
        export { enabled_14 as enabled };
        const menu_14: string;
        export { menu_14 as menu };
        const template_14: string;
        export { template_14 as template };
        const title_6: string;
        export { title_6 as title };
    }
}
export const formats: Map<string, {
    id: string;
    enabled: boolean;
    menu: string;
    template: string;
    templateAlt: string;
    title: string;
} | {
    id: string;
    enabled: boolean;
    menu: string;
    template: string;
    templateAlt: string;
    title: string;
} | {
    id: string;
    enabled: boolean;
    menu: string;
    template: string;
    templateAlt: string;
} | {
    id: string;
    enabled: boolean;
    menu: string;
    template: string;
    title: string;
} | {
    id: string;
    enabled: boolean;
    menu: string;
    template: string;
    title: string;
} | {
    id: string;
    enabled: boolean;
    menu: string;
    template: string;
} | {
    id: string;
    enabled: boolean;
    menu: string;
    template: string;
} | {
    id: string;
    enabled: boolean;
    menu: string;
    template: string;
} | {
    id: string;
    enabled: boolean;
    menu: string;
    template: string;
} | {
    id: string;
    enabled: boolean;
    menu: string;
    template: string;
} | {
    id: string;
    enabled: boolean;
    menu: string;
    template: string;
} | {
    id: string;
    enabled: boolean;
    menu: string;
    template: string;
} | {
    id: string;
    enabled: boolean;
    menu: string;
    template: string;
    templateAlt: string;
    title: string;
} | {
    id: string;
    enabled: boolean;
    menu: string;
    template: string;
    title: string;
} | {
    id: string;
    enabled: boolean;
    menu: string;
    template: string;
    title: string;
}>;
export function getFormats(inArray?: boolean): object | any[];
export function getFormatsKeys(inArray?: boolean): object | any[];
export function getFormatId(id: string): string | null;
export function hasFormat(id: string): boolean;
export function getFormat(id: string): any | null;
export function setFormat(id: string, value: any): void;
export function getFormatTitle(id: string): string | null;
export const enabledFormats: Set<any>;
export function toggleEnabledFormats(id: string, enabled: boolean): Promise<object>;
export function setFormatData(): Promise<any[]>;
export function createTabsLinkText(arr: any[], opt?: {
    mimeType?: string;
    newLine?: boolean;
}): string;
export function createLinkText(data?: object): string;
import { HTML_PLAIN } from "./constant.js";
import { HTML_HYPER } from "./constant.js";
import { MARKDOWN } from "./constant.js";
import { BBCODE_TEXT } from "./constant.js";
import { BBCODE_URL } from "./constant.js";
import { TEXTILE } from "./constant.js";
import { ASCIIDOC } from "./constant.js";
import { MEDIAWIKI } from "./constant.js";
import { JIRA } from "./constant.js";
import { REST } from "./constant.js";
import { LATEX } from "./constant.js";
import { ORG_MODE } from "./constant.js";
import { TEXT_TEXT_URL } from "./constant.js";
import { TEXT_TEXT_ONLY } from "./constant.js";
import { TEXT_URL_ONLY } from "./constant.js";
