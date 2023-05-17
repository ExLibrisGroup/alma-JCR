import { Injectable } from '@angular/core';
import { CloudAppRestService } from '@exlibris/exl-cloudapp-angular-lib';
import { TranslateService } from '@ngx-translate/core';
import { forkJoin } from 'rxjs/internal/observable/forkJoin';

@Injectable({
  providedIn: 'root'
})
export class AlmaApiService {

  private baseUrl : string = "/almaws/v1/bibs?";



  constructor(
    private restService: CloudAppRestService,
  ) {  }

  getBibsDetailsByMmsId (mmsIds, scope) {
    let url : string = this.baseUrl + scope + "=";
    return this.restService.call(url + mmsIds)
  }
}