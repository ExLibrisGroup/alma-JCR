import { Injectable } from '@angular/core';
import { CloudAppRestService, CloudAppEventsService, InitData } from '@exlibris/exl-cloudapp-angular-lib';
import { TranslateService } from '@ngx-translate/core';
import { from } from 'rxjs/internal/observable/from';
import { mergeMap, catchError, concatMap} from 'rxjs/operators';
import { of } from 'rxjs/internal/observable/of';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs/internal/Observable';
import jwt_decode from "jwt-decode";
import {JwtPayload} from "jwt-decode";
@Injectable({
  providedIn: 'root'
})


export class ClarivateApiService {

    bibRecord: AlmaBibRecord;
    baseURL = "https://api.clarivate.com/apis/wos-journals/v1";
    _authToken = "5b8136cb7c1d1302d82b4f8f37510c4322982667"
    private _initData: InitData;
    private _url: string;


    protected _exp: number;



  constructor(
    private restService: CloudAppRestService,
    private eventsService: CloudAppEventsService,
    private translate: TranslateService,
    private http: HttpClient

  ) {  }


    getJCIInformation (issn : string)  {
        
        let url : string = this.baseURL + "/journals?q=";
        url += issn;


        // return this.getAuthToken().pipe(
           
        //     mergeMap(authToken => {
        //         let headers = this.setAuthHeader(authToken);
        //         return this.http.get<any>(url, { headers })
        //     }),
        //     mergeMap(response => {
        //         return of(response);
        //     })
        // );
       
        return this.http.get<any>(url, {headers :{'X-ApiKey': '5b8136cb7c1d1302d82b4f8f37510c4322982667'}}).pipe(
        //return this.restService.call(url).pipe(
            mergeMap(response1 => {
                if(response1.metadata.total > 0) {
                    console.log("********** metadata.total = " + response1.metadata.total + "*******************");
                    return this.http.get<any>(this.baseURL + response1.hits[0].self, {headers :{'X-ApiKey': '5b8136cb7c1d1302d82b4f8f37510c4322982667'}})
                }
                return of();
            }),
            catchError((err) => {
                console.log("step 1 = " + err);
                return of();
            }),
            mergeMap(response2 => {
                if(response2.journalCitationReports[0] !== null || response2.journalCitationReports[0] !== undefined) {
                    console.log("********** response2.journalCitationReports[0] = " + response2.journalCitationReports[0] + "*******************");
                    return this.http.get<any>(this.baseURL + response2.journalCitationReports[0].url, {headers :{'X-ApiKey': '5b8136cb7c1d1302d82b4f8f37510c4322982667', 'Access-Control-Allow-Origin': 'http://localhost:4200', 'Access-Control-Allow-Methods': 'GET'}})
                }
                return of();
            }),
            catchError((err) => {
                console.log("step 1 = " + err);
                return of();
            }),
        ).subscribe({
            next : (t) => {
                console.log("next");
                return t;
            }
        })

       
        
    }

    // Token-based authentication menagment

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

    getSearchResultsFromClarivate(issn : string) {

        let fullUrl: string;

        return this.getInitData().pipe(
            mergeMap(initData => {
                console.log("********** fullUrl = " + fullUrl + "*******************");
                fullUrl = this.setBaseUrl(initData) + issn;
                return this.getAuthToken()
            }),
            mergeMap(authToken => {
                let headers = this.setAuthHeader(authToken);
                console.log("********** headers = " + headers + "*******************");
                return this.http.get<any>(fullUrl, { headers })
            }),
            mergeMap(response => {
                console.log("********** response *******************");
                return of(response);
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

  export class AlmaBibRecord { //TODO : bib only?
    mmsId: string;
    description: string;
    issn: string;
}
