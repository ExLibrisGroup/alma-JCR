import { Injectable } from '@angular/core';
import { CloudAppRestService } from '@exlibris/exl-cloudapp-angular-lib';
import { TranslateService } from '@ngx-translate/core';
import { forkJoin } from 'rxjs/internal/observable/forkJoin';

@Injectable({
  providedIn: 'root'
})
export class AlmaApiService {


  constructor(
    private restService: CloudAppRestService,
  ) {  }

  getBibsDetailsByMmsId (mmsIds) {
     // forkJoin run the function inside on each entity seperatly
    return forkJoin(mmsIds.map(mmsId => this.getRecord(mmsId)));
  }

  getRecord(mmsId: string) {
    let url : string = "/almaws/v1/bibs/";
    return this.restService.call(url + mmsId)
  }
}