export const enabledFormats: Set<any>;
export function toggleEnabledFormats(id: string, enabled?: boolean): void;
export function setFormatData(): Promise<any[]>;
export namespace contextInfo {
    let canonicalUrl: any;
    let content: any;
    let isLink: boolean;
    let selectionText: any;
    let title: any;
    let url: any;
}
export function initContextInfo(): Promise<object>;
export namespace tabInfo {
    let tab: any;
}
export function setTabInfo(tab?: object): Promise<void>;
export function createCopyData(evt?: object): Promise<any>;
export function closeWindow(): void;
export function openOptionsOnClick(): Promise<any>;
export function menuOnClick(evt?: object): Promise<any>;
export function addListenerToMenu(): Promise<void>;
export function toggleMenuItem(): Promise<void>;
export function updateMenu(data?: object): Promise<void>;
export function prepareTab(): Promise<any>;
export function handleMsg(msg: object): Promise<any[]>;
export function setStorageValue(item: string, obj: object): void;
export function handleStorage(data?: object): Promise<any[]>;
export function startup(): Promise<any>;
