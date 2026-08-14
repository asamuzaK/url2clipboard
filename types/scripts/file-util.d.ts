export declare const getStat: (file: string) => object;
export declare const isDir: (dir: string) => boolean;
export declare const isFile: (file: string) => boolean;
export declare const mkdir: (dir: string, opt?: object) => Promise<string>;
export declare const rm: (dir: string, opt?: object) => Promise<void>;
export declare const removeDir: (dir: string) => void;
export declare const readFile: (file: string, opt?: {
    encoding?: string;
    flag?: string;
}) => Promise<string | Buffer>;
export declare const createFile: (file: string, value: string) => Promise<string>;
