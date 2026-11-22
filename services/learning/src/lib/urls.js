// Links people type (task answers, class links, company websites): http or https only. zod's plain url() also
// accepts javascript: and data: links, which would run code when staff or interns click them.
import {z} from 'zod';

export const httpUrl = (message = 'Enter a link starting with https://') =>
  z.url({protocol: /^https?$/, message}).max(300);
