import { program as commander } from 'commander';
export declare const createBlinkCompatFiles: (cmdOpts: object) => Promise<any>;
export declare const saveLibraryPackage: (lib: any[], info: boolean) => Promise<string>;
export declare const extractLibraries: (cmdOpts?: object) => Promise<void>;
export declare const includeLibraries: (cmdOpts: object) => Promise<any>;
export declare const cleanDirectory: (cmdOpts?: object) => void;
export declare const parseCommand: (args: any[]) => void;
export { commander };
