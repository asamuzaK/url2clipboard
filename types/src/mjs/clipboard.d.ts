export class Clip {
    constructor(content: string, mime: string);
    set content(arg: string);
    get content(): string;
    set mime(arg: string);
    get mime(): string;
    _copySync(): void;
    copy(): Promise<void>;
    #private;
}
