declare var be: {
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
declare function ge(t: any): Promise<boolean>;
declare function ye(t: any): boolean;
declare function he(t: any): Promise<{
    [k: string]: any;
}>;
declare function ue(t: any): {
    [k: string]: any;
};
declare function de(t: any, e?: {
    allow: any[];
    deny: any[];
    only: any[];
}): Promise<string>;
declare function fe(t: any, e: any): string;
export { be as default, ge as isURI, ye as isURISync, he as parseURL, ue as parseURLSync, de as sanitizeURL, fe as sanitizeURLSync };
