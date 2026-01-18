declare var he: {
    "__#private@#e": number;
    "__#private@#t": Set<any>;
    replace(e: any): string | String;
    purify(e: any): string;
    sanitize(e: any, s: any): string;
    parse(e: any, s: any): {
        [k: string]: string | String;
    };
    reset(): void;
    "__#private@#e": Set<string>;
    get(): string[];
    has(e: any): boolean;
    add(e: any): string[];
    remove(e: any): boolean;
    verify(e: any): boolean;
};
declare function de(t: any): Promise<boolean>;
declare function fe(t: any): boolean;
declare function le(t: any): Promise<{
    [k: string]: string | String;
}>;
declare function me(t: any): {
    [k: string]: string | String;
};
declare function ce(t: any, e?: {
    allow: any[];
    deny: any[];
    only: any[];
}): Promise<string>;
declare function pe(t: any, e: any): string;
export { he as default, de as isURI, fe as isURISync, le as parseURL, me as parseURLSync, ce as sanitizeURL, pe as sanitizeURLSync };
