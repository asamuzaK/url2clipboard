declare function _exports(e: any): {
    (e: any): any;
    version: string;
    removed: any[];
    isSupported: boolean;
    sanitize(e: any, ...args: any[]): any;
    setConfig(...args: any[]): void;
    clearConfig(): void;
    isValidAttribute(e: any, t: any, n: any): boolean;
    addHook(e: any, t: any): void;
    removeHook(e: any): any;
    removeHooks(e: any): void;
    removeAllHooks(): void;
};
declare namespace _exports {
    let version: string;
    let removed: any[];
    let isSupported: boolean;
    function sanitize(e: any, ...args: any[]): any;
    function setConfig(...args: any[]): void;
    function clearConfig(): void;
    function isValidAttribute(e: any, t: any, n: any): boolean;
    function addHook(e: any, t: any): void;
    function removeHook(e: any): any;
    function removeHooks(e: any): void;
    function removeAllHooks(): void;
}
export = _exports;
