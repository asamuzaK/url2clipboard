export function getStat(file: string): object;
export function isDir(dir: string): boolean;
export function isFile(file: string): boolean;
export function mkdir(dir: string, opt?: object): Promise<string>;
export function rm(dir: string, opt?: object): Promise<void>;
export function removeDir(dir: string): void;
export function readFile(file: string, opt?: {
    encoding?: string;
    flag?: string;
}): Promise<string | Buffer>;
export function createFile(file: string, value: string): Promise<string>;
