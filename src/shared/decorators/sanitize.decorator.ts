import { Transform } from 'class-transformer';
import sanitizeHtml = require('sanitize-html');

export function SanitizeText(): PropertyDecorator {
  return Transform(({ value }) => {
    if (typeof value !== 'string') {
      return value;
    }

    return sanitizeHtml(value.trim(), {
      allowedTags: [],
      allowedAttributes: {},
    });
  });
}
