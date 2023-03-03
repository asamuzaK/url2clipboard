export const OPTIONS_OPEN: "openOptions";
export const enabledFormats: Set<any>;
export function toggleEnabledFormats(id: string, enabled?: boolean): void;
export function setFormatData(): Promise<any[]>;
export namespace contextInfo {
    const canonicalUrl: any;
    const content: any;
    const isLink: boolean;
    const selectionText: any;
    const title: any;
    const url: any;
}
export function initContextInfo(): Promise<object>;
export namespace tabInfo {
    const tab: any;
}
export function setTabInfo(tab?: object): Promise<void>;
export function createCopyData(evt?: object): Promise<any> | null;
export function closeWindow(): void;
export function openOptionsOnClick(): Promise<any>;
export function menuOnClick(evt?: object): Promise<any>;
export function addListenerToMenu(): Promise<void>;
export function toggleMenuItem(): Promise<void>;
export function updateMenu(data?: object): Promise<void>;
export function prepareTab(): Promise<any[]>;
export function handleMsg(msg: object): Promise<any[]>;
export function setStorageValue(item: string, obj: object): void;
export function handleStorage(data?: object): Promise<any[]>;
export function startup(): Promise<any>;
