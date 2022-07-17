import { Injectable } from '@angular/core';
import { CloudAppRestService } from '@exlibris/exl-cloudapp-angular-lib';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs/internal/observable/of';
import { from } from 'rxjs/internal/observable/from';
import { mergeMap } from 'rxjs/internal/operators/mergeMap';
import { catchError } from 'rxjs/internal/operators/catchError';

@Injectable({
  providedIn: 'root'
})
export class AlmaApiService {

    bibRecord: AlmaBibRecord;

  constructor(
    private restService: CloudAppRestService,
    private translate: TranslateService,
  ) {  }

    getBibDetailsByMmsId (mmsId : string)  {
        
        let url : string = "/almaws/v1/bibs/";
        url += mmsId;

        this.bibRecord = new AlmaBibRecord();

        return this.restService.call(url);
        
    }



}

  export class AlmaBibRecord { //TODO : bib only?
    mmsId: string;
    description: string;
    issn: string;
}
