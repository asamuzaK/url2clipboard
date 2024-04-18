declare var he: {
    "__#3@#e": number;
    "__#3@#t": Set<any>;
    replace(e: any): any;
    purify(e: any): string;
    sanitize(e: any, s: any): string;
    parse(e: any, s: any): {
        [k: string]: any;
    };
    reset(): void;
    "__#2@#e": Set<string>;
    get(): string[];
    has(e: any): boolean;
    add(e: any): string[];
    remove(e: any): boolean;
    verify(e: any): boolean;
};
declare function de(t: any): Promise<boolean>;
declare function fe(t: any): boolean;
declare function le(t: any): Promise<{
    [k: string]: any;
}>;
declare function me(t: any): {
    [k: string]: any;
};
declare function ce(t: any, e?: {
    allow: any[];
    deny: any[];
    only: any[];
}): Promise<string>;
declare function pe(t: any, e: any): string;
export { he as default, de as isURI, fe as isURISync, le as parseURL, me as parseURLSync, ce as sanitizeURL, pe as sanitizeURLSync };
