export namespace formatData {
    namespace HTMLPlain {
        export { HTML_PLAIN as id };
        export let enabled: boolean;
        export let menu: string;
        export let template: string;
        export let templateAlt: string;
        export let title: string;
    }
    namespace HTMLHyper {
        export { HTML_HYPER as id };
        let enabled_1: boolean;
        export { enabled_1 as enabled };
        let menu_1: string;
        export { menu_1 as menu };
        let template_1: string;
        export { template_1 as template };
        let templateAlt_1: string;
        export { templateAlt_1 as templateAlt };
        let title_1: string;
        export { title_1 as title };
    }
    namespace Markdown {
        export { MARKDOWN as id };
        let enabled_2: boolean;
        export { enabled_2 as enabled };
        let menu_2: string;
        export { menu_2 as menu };
        let template_2: string;
        export { template_2 as template };
        let templateAlt_2: string;
        export { templateAlt_2 as templateAlt };
    }
    namespace BBCode {
        export { BBCODE as id };
        let enabled_3: boolean;
        export { enabled_3 as enabled };
        let menu_3: string;
        export { menu_3 as menu };
        let template_3: string;
        export { template_3 as template };
        let title_2: string;
        export { title_2 as title };
    }
    namespace Textile {
        export { TEXTILE as id };
        let enabled_4: boolean;
        export { enabled_4 as enabled };
        let menu_4: string;
        export { menu_4 as menu };
        let template_4: string;
        export { template_4 as template };
    }
    namespace AsciiDoc {
        export { ASCIIDOC as id };
        let enabled_5: boolean;
        export { enabled_5 as enabled };
        let menu_5: string;
        export { menu_5 as menu };
        let template_5: string;
        export { template_5 as template };
    }
    namespace MediaWiki {
        export { MEDIAWIKI as id };
        let enabled_6: boolean;
        export { enabled_6 as enabled };
        let menu_6: string;
        export { menu_6 as menu };
        let template_6: string;
        export { template_6 as template };
    }
    namespace DokuWiki {
        export { DOKUWIKI as id };
        let enabled_7: boolean;
        export { enabled_7 as enabled };
        let menu_7: string;
        export { menu_7 as menu };
        let template_7: string;
        export { template_7 as template };
    }
    namespace Jira {
        export { JIRA as id };
        let enabled_8: boolean;
        export { enabled_8 as enabled };
        let menu_8: string;
        export { menu_8 as menu };
        let template_8: string;
        export { template_8 as template };
    }
    namespace reStructuredText {
        export { REST as id };
        let enabled_9: boolean;
        export { enabled_9 as enabled };
        let menu_9: string;
        export { menu_9 as menu };
        let template_9: string;
        export { template_9 as template };
    }
    namespace LaTeX {
        export { LATEX as id };
        let enabled_10: boolean;
        export { enabled_10 as enabled };
        let menu_10: string;
        export { menu_10 as menu };
        let template_10: string;
        export { template_10 as template };
    }
    namespace OrgMode {
        export { ORG_MODE as id };
        let enabled_11: boolean;
        export { enabled_11 as enabled };
        let menu_11: string;
        export { menu_11 as menu };
        let template_11: string;
        export { template_11 as template };
    }
    namespace CSV {
        export { CSV as id };
        let enabled_12: boolean;
        export { enabled_12 as enabled };
        let menu_12: string;
        export { menu_12 as menu };
        let template_12: string;
        export { template_12 as template };
        let title_3: string;
        export { title_3 as title };
    }
    namespace TextURL {
        export { TEXT_TEXT_URL as id };
        let enabled_13: boolean;
        export { enabled_13 as enabled };
        let menu_13: string;
        export { menu_13 as menu };
        let template_13: string;
        export { template_13 as template };
        let templateAlt_3: string;
        export { templateAlt_3 as templateAlt };
        let title_4: string;
        export { title_4 as title };
    }
    namespace TextOnly {
        export { TEXT_TEXT_ONLY as id };
        let enabled_14: boolean;
        export { enabled_14 as enabled };
        let menu_14: string;
        export { menu_14 as menu };
        let template_14: string;
        export { template_14 as template };
        let title_5: string;
        export { title_5 as title };
    }
    namespace URLOnly {
        export { TEXT_URL_ONLY as id };
        let enabled_15: boolean;
        export { enabled_15 as enabled };
        let menu_15: string;
        export { menu_15 as menu };
        let template_15: string;
        export { template_15 as template };
        let title_6: string;
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
export function getFormat(id: string): object;
export function setFormat(id: string, value: string | boolean): void;
export function getFormatTitle(id: string): string | null;
export const enabledFormats: Set<any>;
export function toggleEnabledFormats(id: string, enabled?: boolean): Promise<object>;
export function setFormatData(): Promise<any[]>;
export function createTabsLinkText(arr: any[], opt?: {
    mimeType?: string;
    newLine?: boolean;
}): string;
export function createLinkText(data?: object): Promise<string>;
import { HTML_PLAIN } from './constant.js';
import { HTML_HYPER } from './constant.js';
import { MARKDOWN } from './constant.js';
import { BBCODE } from './constant.js';
import { TEXTILE } from './constant.js';
import { ASCIIDOC } from './constant.js';
import { MEDIAWIKI } from './constant.js';
import { DOKUWIKI } from './constant.js';
import { JIRA } from './constant.js';
import { REST } from './constant.js';
import { LATEX } from './constant.js';
import { ORG_MODE } from './constant.js';
import { CSV as CSV_1 } from './constant.js';
import { TEXT_TEXT_URL } from './constant.js';
import { TEXT_TEXT_ONLY } from './constant.js';
import { TEXT_URL_ONLY } from './constant.js';
