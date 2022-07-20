import { Injectable } from '@angular/core';
import { CloudAppEventsService, InitData } from '@exlibris/exl-cloudapp-angular-lib';
import { mergeMap } from 'rxjs/operators';
import { of } from 'rxjs/internal/observable/of';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/internal/Observable';
import jwt_decode from "jwt-decode";
import {JwtPayload} from "jwt-decode";
@Injectable({
  providedIn: 'root'
})


export class ClarivateApiService {

    baseURL = "https://api.clarivate.com/apis/wos-journals/v1";
    _authToken = "5b8136cb7c1d1302d82b4f8f37510c4322982667"
    private _initData: InitData;
    private _url: string;


    protected _exp: number;



    constructor(
        private eventsService: CloudAppEventsService,
        private http: HttpClient

    ) {}


    isEmpty(val : any) {
        return (val === undefined || val == null || val.length <= 0) ? true : false;
    }

    getAuthToken(): Observable<string> {
        const now = Date.now(); // Unix timestamp in milliseconds
        if (this.isEmpty(this._exp) || now >= this._exp) {
            return this.eventsService.getAuthToken();
        }
        return of(this._authToken);
    }
    
    setAuthHeader(authToken: string) {
        if(this._authToken !== authToken) {
          console.log("JWT = " + authToken);
          this._authToken = authToken;
          let decoded = jwt_decode(this._authToken) as JwtPayload;
          console.log(decoded);
          this._exp = decoded.exp;
        }
        return { 'Authorization': `Bearer ${this._authToken}` };
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

    getInitData(): Observable<InitData> {
        if(this.isEmpty(this._initData))
            return this.eventsService.getInitData();
        return of(this._initData);
    }

    setBaseUrl(initData: InitData) : string {
        if(this.isEmpty(this._url)) {
          console.log(initData);
          this._initData = initData;
          this._url = this._initData.urls['alma'];
          this._url = this._url + 'view/JCR/';
          console.log(this._url);
        }
        return this._url;
    }
}
