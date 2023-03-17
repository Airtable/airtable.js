import {Thumbnail} from './thumbnail';

export interface Attachment {
    id: string;
    url: string;
    filename: string;
    size: number;
    type: string;
    thumbnails?: {
        small: Thumbnail;
        large: Thumbnail;
        full: Thumbnail;
    };
}

export interface AttachmentReference extends Partial<Attachment> {
    id: Attachment['id'];
}

export interface CreateAttachment {
    url: Attachment['url'];
    filename?: Attachment['filename'];
}
