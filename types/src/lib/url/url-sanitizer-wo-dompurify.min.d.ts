declare var w: {
    "__#2@#e": number;
    "__#2@#t": Set<any>;
    replace(e: any): any;
    purify(e: any): string;
    sanitize(e: any, s: any): string;
    parse(e: any, s: any): {
        [k: string]: any;
    };
    reset(): void;
    "__#1@#e": Set<string>;
    get(): string[];
    has(e: any): boolean;
    add(e: any): string[];
    remove(e: any): boolean;
    verify(e: any): boolean;
};
declare function Ue(t: any): Promise<boolean>;
declare function ve(t: any): boolean;
declare function xe(t: any): Promise<{
    [k: string]: any;
}>;
declare function Re(t: any): {
    [k: string]: any;
};
declare function we(t: any, e?: {
    allow: any[];
    deny: any[];
    only: any[];
}): Promise<string>;
declare function Ee(t: any, e: any): string;
export { w as default, Ue as isURI, ve as isURISync, xe as parseURL, Re as parseURLSync, we as sanitizeURL, Ee as sanitizeURLSync };
