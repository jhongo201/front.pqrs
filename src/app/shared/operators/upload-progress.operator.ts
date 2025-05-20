// src/app/shared/operators/upload-progress.operator.ts

import { HttpEvent, HttpEventType, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export function uploadProgress<T>(cb: (progress: number) => void) {
  return (source: Observable<HttpEvent<T>>) =>
    source.pipe(
      map(event => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          const progress = Math.round((100 * event.loaded) / event.total);
          cb(progress);
        } else if (event instanceof HttpResponse) {
          cb(100);
        }
        return event;
      })
    );
}