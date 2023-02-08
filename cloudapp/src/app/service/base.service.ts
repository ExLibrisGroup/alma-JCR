import { HttpClient } from "@angular/common/http";
import { CloudAppEventsService, InitData } from "@exlibris/exl-cloudapp-angular-lib";
import { TranslateService } from "@ngx-translate/core";
import { Observable } from "rxjs/internal/Observable";
import { of } from "rxjs/internal/observable/of";
import jwt_decode from "jwt-decode";
import {JwtPayload} from "jwt-decode";


export abstract class BaseService {
    protected translate: TranslateService
    protected http: HttpClient;
    protected eventsService: CloudAppEventsService;
    protected  _url: string;
    protected _initData: InitData;
    protected _authToken: string;
    protected _exp: number;


    constructor(
        eventsService: CloudAppEventsService,
        http: HttpClient
    ) { 
        this.http = http;
        this.eventsService = eventsService;
    }

    isEmpty(val : any) {
        return (val === undefined || val == null || val.length <= 0) ? true : false;
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


    // Token-based authentication menagment

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


}

