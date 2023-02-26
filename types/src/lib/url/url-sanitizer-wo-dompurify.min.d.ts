declare var y: {
    "__#2@#e": number;
    "__#2@#t": Set<any>;
    replace(e: any): any;
    purify(e: any): string;
    sanitize(e: any, s?: {
        allow: any[];
        deny: any[];
        only: any[];
    }): string;
    parse(e: any, s: any): {
        [k: string]: any;
    };
    "__#1@#e": Set<string>;
    get(): string[];
    has(e: any): boolean;
    add(e: any): string[];
    remove(e: any): boolean;
    verify(e: any): boolean;
};
declare function xe(t: any): Promise<boolean>;
declare function ve(t: any): boolean;
declare function Ee(t: any): Promise<{
    [k: string]: any;
}>;
declare function Re(t: any): {
    [k: string]: any;
};
declare function be(t: any, e?: {
    allow: any[];
    deny: any[];
    only: any[];
}): Promise<string>;
declare function we(t: any, e: any): string;
export { y as default, xe as isURI, ve as isURISync, Ee as parseURL, Re as parseURLSync, be as sanitizeURL, we as sanitizeURLSync };
