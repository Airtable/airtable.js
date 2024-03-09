import { type Thumbnail } from "./thumbnail";

export interface Attachment {
  filename: string;
  id: string;
  size: number;
  thumbnails?: {
    full: Thumbnail;
    large: Thumbnail;
    small: Thumbnail;
  };
  type: string;
  url: string;
}
