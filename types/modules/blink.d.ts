export function createManifest(info: boolean): Promise<string>;
export function createPolyfilledJsFile(file: string, info: boolean): Promise<string>;
export function createJsFiles(info: boolean): Promise<any[]>;
export function createBlinkFiles(cmdOpts?: object): Promise<any[]>;
