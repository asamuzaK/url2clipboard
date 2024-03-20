declare var ye: {
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
declare function ue(t: any): Promise<boolean>;
declare function ge(t: any): boolean;
declare function fe(t: any): Promise<{
    [k: string]: any;
}>;
declare function he(t: any): {
    [k: string]: any;
};
declare function me(t: any, e?: {
    allow: any[];
    deny: any[];
    only: any[];
}): Promise<string>;
declare function de(t: any, e: any): string;
export { ye as default, ue as isURI, ge as isURISync, fe as parseURL, he as parseURLSync, me as sanitizeURL, de as sanitizeURLSync };
