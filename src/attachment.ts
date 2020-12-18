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
