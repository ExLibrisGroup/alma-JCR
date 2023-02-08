import { Injectable } from '@angular/core';
import { CloudAppEventsService, InitData } from '@exlibris/exl-cloudapp-angular-lib';
import { mergeMap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { BaseService } from './base.service';
@Injectable({
  providedIn: 'root'
})


export class InCitesApiService extends BaseService {
    private _toConnect : boolean;

    constructor(
        protected eventsService: CloudAppEventsService,
        protected http: HttpClient
    ) {
        super(eventsService, http);
    }

    connectToInCites(toConnect: any | boolean) {
        let fullUrl: string;
        this._toConnect = toConnect;

        return this.getInitData().pipe(
            mergeMap(initData => {
                console.log("init data = " + initData);
                fullUrl = this.setBaseUrl(initData);

                return this.getAuthToken()
            }),
            mergeMap(authToken => {
                let headers = this.setAuthHeader(authToken);
                return this.http.post<any>(fullUrl, { headers })
            })
        );
    }

    isIncitesFeatureEnable() {
        let fullUrl: string;
        return this.getInitData().pipe(
            mergeMap(initData => {
                console.log("init data = " + initData);
                fullUrl = this.setBaseUrl(initData);
                return this.getAuthToken()
            }),
            mergeMap(authToken => {
                return this.http.get<any>(fullUrl, {  })
            })
        );
    }

    setBaseUrl(initData: InitData) : string {
        let baseUrl = super.setBaseUrl(initData);
        baseUrl = baseUrl + "inCites?";
        baseUrl = baseUrl + this.getQueryParams();
        return baseUrl;
      }

    private getQueryParams() :string{
        let urlParams = "";
        urlParams = urlParams + QueryParams.Option + "=" + this._toConnect;
        return urlParams;
    }
}

export enum QueryParams {
    Option = "option"
  }
