export function createPref(elm?: object): Promise<object>;
export function storePref(evt: object): Promise<any[]>;
export function handleSave(evt: object): Promise<any> | null;
export function addButtonClickListener(): Promise<void>;
export function handleInputChange(evt: object): Promise<any>;
export function addInputChangeListener(): Promise<void>;
export function setHtmlInputValue(data?: object): Promise<void>;
export function setValuesFromStorage(): Promise<any[]>;
