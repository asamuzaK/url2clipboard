export class Clip {
    constructor(content?: string, mime?: string);
    set content(data: string);
    get content(): string;
    set mime(type: string);
    get mime(): string;
    _copySync(): void;
    copy(): Promise<void>;
    #private;
}
