import { Injectable } from '@angular/core';
import { CloudAppEventsService, InitData } from '@exlibris/exl-cloudapp-angular-lib';
import { mergeMap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { BaseService } from './base.service';
@Injectable({
  providedIn: 'root'
})


export class ClarivateApiService extends BaseService{

    baseURL = "https://api.clarivate.com/apis/wos-journals/v1";
    _authToken = "5b8136cb7c1d1302d82b4f8f37510c4322982667"
    protected _exp: number;

    constructor(
        protected eventsService: CloudAppEventsService,
        protected http: HttpClient
    ) {
        super(eventsService, http);
    }

    getSearchResultsFromClarivate(entities: any[]) {
        let fullUrl: string;
        let body = JSON.stringify(entities);
        return this.getInitData().pipe(
            mergeMap(initData => {
                fullUrl = this.setBaseUrl(initData);
                return this.getAuthToken()
            }),
            mergeMap(authToken => {
                let headers = this.setAuthHeader(authToken);
                return this.http.post<any>(fullUrl, body, { headers })
            })
        );
    }

    setBaseUrl(initData: InitData) : string {
        let baseUrl = super.setBaseUrl(initData);
        baseUrl = baseUrl + "jcr?";
        return baseUrl;
      }
}
