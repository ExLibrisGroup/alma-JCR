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
    private _isQueryParamsNeeded : boolean = false;

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
                this._isQueryParamsNeeded = true;
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
                this._isQueryParamsNeeded = false;
                fullUrl = this.setBaseUrl(initData);
                return this.getAuthToken()
            }),
            mergeMap(authToken => {
                let headers = this.setAuthHeader(authToken);
                return this.http.get<any>(fullUrl, { headers })
            })
        );
    }

    setBaseUrl(initData: InitData) : string {
        let baseUrl = super.setBaseUrl(initData);
        baseUrl = baseUrl + "inCites?";
        if(this._isQueryParamsNeeded) {
            baseUrl = baseUrl + this.getQueryParams();
        }
        return baseUrl;
      }

    private getQueryParams() :string{
        let urlParams = "";
        urlParams = urlParams + QueryParams.Optin + "=" + this._toConnect;
        return urlParams;
    }
}

export enum QueryParams {
    Optin = "optin"
  }
