import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'removeLdapSuffix',
  standalone: true
})
export class RemoveLdapSuffixPipe implements PipeTransform {
  transform(value: string): string {
    if (!value) return '';
    // Remover el sufijo @mintrabajo.loc si existe
    return value.replace(/@mintrabajo\.loc$/, '');
  }
}
